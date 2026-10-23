import type { NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";
import { formFor } from "@/lib/data";
import { ADMIN_DEMO } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasPrintLayout } from "@/print/layouts";
import { renderPrintPdf, type PrintField } from "@/print/render";

// The print file for one order, built from what the customer filled in.
// Admins only: the check is repeated here, as proxy.ts only checks for a session.
export async function GET(_req: NextRequest, ctx: RouteContext<"/admin/orders/[id]/print">) {
  if (!(await getAdmin())) return new Response("Please sign in to the admin.", { status: 401 });
  if (ADMIN_DEMO) return new Response("Print files need real orders; demo mode has none.", { status: 404 });
  const { id } = await ctx.params;

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return new Response("Order not found.", { status: 404 });
  const { data: template } = order.template_id
    ? await supabase.from("templates").select("slug").eq("id", order.template_id).maybeSingle()
    : { data: null };
  const slug: string = template?.slug ?? "";
  if (!hasPrintLayout(slug)) return new Response(`No print layout for ${order.template_name} yet.`, { status: 404 });

  const [{ data: answers }, { data: files }] = await Promise.all([
    supabase.from("order_answers").select("field_key, value").eq("order_id", id),
    supabase.from("order_files").select("storage_path").eq("order_id", id).order("id"),
  ]);

  const fields: Record<string, PrintField> = {};
  for (const f of formFor(slug)) fields[f.key] = { label: f.label, value: "" };
  for (const a of answers ?? []) if (fields[a.field_key]) fields[a.field_key].value = a.value ?? "";

  // Uploads are stored as "<order id>/<n>-<field key>.<ext>"; the first photo
  // for each field goes on the page.
  const photos: Record<string, Buffer> = {};
  const storage = createAdminClient().storage.from("order-uploads");
  for (const { storage_path } of files ?? []) {
    const key = storage_path.split("/").pop()?.match(/^\d+-(.+)\.[a-z0-9]+$/)?.[1];
    if (!key || photos[key]) continue;
    const { data } = await storage.download(storage_path);
    if (data) photos[key] = Buffer.from(await data.arrayBuffer());
  }

  const { pdf, warnings } = await renderPrintPdf({
    template: slug,
    size: order.size === "Broadsheet" ? "Broadsheet" : "Tabloid",
    fields,
    photos,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.reference}-print.pdf"`,
      "Cache-Control": "private, no-store",
      // For tools; on the page itself, anything missing or cut is marked in red.
      "X-Print-Warnings": encodeURIComponent(warnings.join(" | ")).slice(0, 4000),
    },
  });
}
