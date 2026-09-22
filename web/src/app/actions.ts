"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { getPricing, getTemplate } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { calculatePrice, FORMATS, SIZES, type Format, type Size } from "@/lib/pricing";
import { notifyNewOrder } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true; reference?: string } | { ok: false; error: string };

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

const str = (fd: FormData, key: string, max = 2000) => String(fd.get(key) ?? "").trim().slice(0, max);

const serviceReady = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const NOT_READY: ActionResult = {
  ok: false,
  error: "Ordering isn't connected yet. Please contact us on +961 81 587 957 or contact@tailored-times.com.",
};

// ------------------------------------------------------------------ orders

export async function createOrder(formData: FormData): Promise<ActionResult> {
  if (str(formData, "website")) return { ok: true, reference: "TT-000000" }; // honeypot: pretend success
  if (!serviceReady()) return NOT_READY;

  const template = await getTemplate(str(formData, "template"));
  if (!template?.id) return { ok: false, error: "This template is no longer available." };

  const format = str(formData, "format") as Format;
  const size = str(formData, "size") as Size;
  if (!FORMATS.includes(format) || !SIZES.includes(size)) return { ok: false, error: "Please choose a format and size." };

  const pricing = await getPricing();
  const pages = Number(str(formData, "pages"));
  if (format !== "Cover page" && format !== "Digital copy" && !pricing.pageOptions.includes(pages)) {
    return { ok: false, error: "Please choose a number of pages." };
  }
  const copies = Math.floor(Number(str(formData, "copies")));
  if (!(copies >= 1 && copies <= 500)) return { ok: false, error: "Copies must be between 1 and 500." };

  const input = {
    format,
    size,
    pages: format === "Cover page" ? 1 : format === "Digital copy" ? pages || 4 : pages,
    copies: format === "Digital copy" ? 1 : copies,
    frames: format !== "Digital copy" && str(formData, "frames") === "yes",
    designer: str(formData, "designer") === "yes",
  };
  const price = calculatePrice(input, pricing); // never trust a price from the browser

  const customer = {
    name: str(formData, "customer_name", 200),
    phone: str(formData, "customer_phone", 50),
    email: str(formData, "customer_email", 200),
    address: str(formData, "delivery_address", 1000),
  };
  if (!customer.name || !customer.phone || !customer.address) {
    return { ok: false, error: "Please fill in your name, phone number and delivery address." };
  }
  if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) return { ok: false, error: "Please check your email address." };

  // Step 2 answers, driven by the template's form schema.
  const answers: { field_key: string; label: string; value: string }[] = [];
  for (const field of template.formSchema.filter((f) => f.type !== "file")) {
    const value = str(formData, `answer_${field.key}`, 20000);
    if (field.required && !value) return { ok: false, error: `Please fill in "${field.label}".` };
    answers.push({ field_key: field.key, label: field.label, value });
  }

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_PHOTOS) return { ok: false, error: `Please upload at most ${MAX_PHOTOS} photos.` };
  for (const p of photos) {
    if (p.size > MAX_PHOTO_BYTES) return { ok: false, error: `"${p.name}" is larger than 5 MB.` };
    if (!PHOTO_TYPES.includes(p.type)) return { ok: false, error: `"${p.name}" isn't a JPG, PNG, WEBP or HEIC photo.` };
  }

  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .insert({
      template_id: template.id,
      template_name: template.name,
      ...input,
      price,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email || null,
      delivery_address: customer.address,
      notes: str(formData, "notes", 5000) || null,
    })
    .select("id, reference")
    .single();
  if (error || !order) {
    console.error("createOrder insert failed", error);
    return { ok: false, error: "Something went wrong saving your order. Please try again." };
  }

  if (answers.length) await db.from("order_answers").insert(answers.map((a) => ({ ...a, order_id: order.id })));

  let savedPhotos = 0;
  for (const [i, photo] of photos.entries()) {
    const ext = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${order.id}/${i + 1}.${ext}`;
    const { error: upErr } = await db.storage.from("order-uploads").upload(path, photo, { contentType: photo.type });
    if (upErr) {
      console.error("photo upload failed", upErr);
      continue;
    }
    await db.from("order_files").insert({ order_id: order.id, field_key: "photos", storage_path: path, original_name: photo.name });
    savedPhotos++;
  }

  await db.from("order_events").insert({ order_id: order.id, to_status: "ordered", note: "Order placed on the website" });

  // Email the team after the response is sent: the customer never waits on it,
  // and a failed email can never fail the order.
  const h = await headers();
  const siteUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const summary = [
    input.format,
    input.format !== "Digital copy" && input.size,
    input.format === "Hard copy" && `${input.pages} pages`,
    input.format !== "Digital copy" && `${input.copies} ${input.copies === 1 ? "copy" : "copies"}`,
    input.frames && "framed",
    input.designer && "designer needed",
  ]
    .filter(Boolean)
    .join(" · ");
  after(() =>
    notifyNewOrder(
      {
        id: order.id,
        reference: order.reference,
        templateName: template.name,
        summary,
        price,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        address: customer.address,
        photoCount: savedPhotos,
      },
      siteUrl,
    ),
  );

  return { ok: true, reference: order.reference };
}

// ---------------------------------------------------------------- contact

export async function sendContactMessage(formData: FormData): Promise<ActionResult> {
  if (str(formData, "website")) return { ok: true }; // honeypot
  if (!serviceReady()) return NOT_READY;

  const msg = {
    name: `${str(formData, "first_name", 100)} ${str(formData, "last_name", 100)}`.trim(),
    email: str(formData, "email", 200),
    subject: str(formData, "subject", 200),
    message: str(formData, "message", 5000),
  };
  if (!msg.name || !msg.subject || !msg.message) return { ok: false, error: "Please fill in every field." };
  if (!/^\S+@\S+\.\S+$/.test(msg.email)) return { ok: false, error: "Please check your email address." };

  const { error } = await createAdminClient().from("contact_messages").insert(msg);
  if (error) {
    console.error("contact insert failed", error);
    return { ok: false, error: "Something went wrong. Please try again or email us." };
  }
  return { ok: true };
}
