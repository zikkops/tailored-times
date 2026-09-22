import "server-only";

// New-order email to the team, sent through Resend's HTTP API (no SDK needed).
// Owner decision (21 Sep 2026): notifications go to contact@tailored-times.com.
// Without RESEND_API_KEY this does nothing, so ordering never depends on email.

const TEAM_EMAIL = process.env.NOTIFY_EMAIL_TO || "contact@tailored-times.com";
// Resend only sends from a verified domain. Until tailored-times.com is
// verified there, its test sender works but only delivers to the Resend
// account's own email address.
const FROM = process.env.NOTIFY_EMAIL_FROM || "Tailored Times <onboarding@resend.dev>";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export type OrderEmail = {
  id: string;
  reference: string;
  templateName: string;
  summary: string;
  price: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  photoCount: number;
};

export async function notifyNewOrder(order: OrderEmail, siteUrl: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const rows: [string, string][] = [
    ["Template", order.templateName],
    ["Paper", order.summary],
    ["Price", `${order.price.toFixed(1)} USD (cash on delivery)`],
    ["Customer", order.customerName],
    ["Phone", order.customerPhone],
    ["Email", order.customerEmail || "—"],
    ["Address", order.address],
    ["Photos", String(order.photoCount)],
  ];
  const html = `
    <h2 style="font-family:Georgia,serif">New order ${esc(order.reference)}</h2>
    <table cellpadding="4" style="font-family:Arial,sans-serif;font-size:14px">
      ${rows.map(([k, v]) => `<tr><td style="color:#7a7a7a">${k}</td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}
    </table>
    <p><a href="${siteUrl}/admin/orders/${order.id}">Open the order in the admin</a></p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TEAM_EMAIL],
        reply_to: order.customerEmail || undefined,
        subject: `New order ${order.reference}: ${order.templateName}, ${order.price.toFixed(1)} USD`,
        html,
      }),
    });
    if (!res.ok) console.error("notifyNewOrder failed", res.status, await res.text());
  } catch (err) {
    console.error("notifyNewOrder failed", err);
  }
}
