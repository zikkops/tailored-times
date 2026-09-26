"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { getPricing, getTemplate } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { calculatePrice, DESIGNER_REQUIRED_FROM_PAGES, FORMATS, SIZES, type Format, type Size } from "@/lib/pricing";
import { notifyNewOrder } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true; reference?: string } | { ok: false; error: string };

const MAX_PHOTOS = 60; // templates can have dozens of numbered picture slots
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

const str = (fd: FormData, key: string, max = 2000) => String(fd.get(key) ?? "").trim().slice(0, max);

const serviceReady = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------- spam guard
// Simple per-visitor rate limit (bug list R90). In memory, so it resets when
// the server restarts and counts per server instance: enough to stop a script
// hammering the forms, not a replacement for a real spam service later.
const RATE_LIMIT = { orders: { max: 5, windowMs: 10 * 60_000 }, messages: { max: 3, windowMs: 10 * 60_000 } };
const hits = new Map<string, number[]>();

async function tooManyRequests(kind: keyof typeof RATE_LIMIT): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const key = `${kind}:${ip}`;
  const { max, windowMs } = RATE_LIMIT[kind];
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // keep the map from growing without bound
  return recent.length > max;
}

const TOO_MANY: ActionResult = {
  ok: false,
  error: "That is a lot of requests in a short time. Please wait a few minutes, or contact us on +961 81 587 957.",
};

const NOT_READY: ActionResult = {
  ok: false,
  error: "Ordering isn't connected yet. Please contact us on +961 81 587 957 or contact@tailored-times.com.",
};

// ------------------------------------------------------------------ orders

export async function createOrder(formData: FormData): Promise<ActionResult> {
  if (str(formData, "website")) return { ok: true, reference: "TT-000000" }; // honeypot: pretend success
  if (await tooManyRequests("orders")) return TOO_MANY;
  if (!serviceReady()) return NOT_READY;

  const template = await getTemplate(str(formData, "template"));
  if (!template?.id) return { ok: false, error: "This template is no longer available." };

  // Only the formats the site offers: "Cover page" still exists in the price
  // calculation for old orders, but can no longer be ordered (bug list R5).
  const format = str(formData, "format") as Format;
  const size = str(formData, "size") as Size;
  if (!(FORMATS as readonly string[]).includes(format) || !SIZES.includes(size)) {
    return { ok: false, error: "Please choose a format and size." };
  }

  const pricing = await getPricing();
  const pages = Number(str(formData, "pages"));
  if (format !== "Cover page" && format !== "Digital copy" && !pricing.pageOptions.includes(pages)) {
    return { ok: false, error: "Please choose a number of pages." };
  }
  const copies = Math.floor(Number(str(formData, "copies")));
  if (!(copies >= 1 && copies <= 500)) return { ok: false, error: "Copies must be between 1 and 500." };

  // A designer is required from 5 pages up (bug list R15); the browser locks
  // the choice, and this makes sure an edited request cannot get around it.
  const wantsDesigner = str(formData, "designer") === "yes";
  const needsDesigner = format === "Hard copy" && pages >= DESIGNER_REQUIRED_FROM_PAGES;
  if (needsDesigner && !wantsDesigner) {
    return { ok: false, error: `Papers of ${DESIGNER_REQUIRED_FROM_PAGES} pages or more need a designer.` };
  }

  const input = {
    format,
    size,
    pages: format === "Cover page" ? 1 : format === "Digital copy" ? pages || 4 : pages,
    copies: format === "Digital copy" ? 1 : copies,
    frames: format !== "Digital copy" && str(formData, "frames") === "yes",
    designer: needsDesigner || wantsDesigner,
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

  // Photos, kept with the numbered field they belong to ("6. Photo"), so the
  // team can see which picture goes where on the paper.
  const photos: { field: string; label: string; file: File }[] = [];
  for (const field of template.formSchema.filter((f) => f.type === "file")) {
    const files = formData.getAll(`file_${field.key}`).filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length && field.required) return { ok: false, error: `Please add a photo for "${field.label}".` };
    for (const file of files) photos.push({ field: field.key, label: field.label, file });
  }
  if (photos.length > MAX_PHOTOS) return { ok: false, error: `Please upload at most ${MAX_PHOTOS} photos in total.` };
  for (const { file } of photos) {
    if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: `"${file.name}" is larger than 5 MB.` };
    if (!PHOTO_TYPES.includes(file.type)) return { ok: false, error: `"${file.name}" isn't a JPG, PNG, WEBP or HEIC photo.` };
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
  for (const [i, { field, label, file } ] of photos.entries()) {
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${order.id}/${i + 1}-${field}.${ext}`;
    const { error: upErr } = await db.storage.from("order-uploads").upload(path, file, { contentType: file.type });
    if (upErr) {
      console.error("photo upload failed", upErr);
      continue;
    }
    await db
      .from("order_files")
      .insert({ order_id: order.id, field_key: label, storage_path: path, original_name: file.name });
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
  if (await tooManyRequests("messages")) return TOO_MANY;
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
