import { PORTAL_URL } from "@/lib/portal";

/**
 * Customer emails — plain inline-styled HTML, since mail apps ignore
 * stylesheets — plus a text version of each.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://taxpropath.com").replace(/\/$/, "");
const SUPPORT = process.env.MAIL_BCC || "support@taxpropath.com";

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:#16a34a;background-image:linear-gradient(90deg,#16a34a,#0066cc);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:999px">${esc(label)}</a>`;
}

function layout(title: string, body: string) {
  return `<!doctype html>
<html><body style="margin:0;background:#f7f4ee;font-family:Montserrat,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:28px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="padding:22px 28px;border-bottom:1px solid #e2e8f0">
<img src="${SITE_URL}/logo.png" alt="Taxpropath" height="36" style="height:36px;width:auto;display:block">
</td></tr>
<tr><td style="height:6px;background:#16a34a;background-image:linear-gradient(90deg,#16a34a,#0066cc)"></td></tr>
<tr><td style="padding:30px 28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0b1b3a">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 28px;background:#f8fafc;font-size:12.5px;line-height:1.6;color:#64748b">
Questions? Reply to this email or write to <a href="mailto:${esc(SUPPORT)}" style="color:#15803d">${esc(SUPPORT)}</a>.<br>
Taxpropath · Accounting &amp; Tax CPE Courses · <a href="${SITE_URL}" style="color:#15803d">${SITE_URL.replace(/^https?:\/\//, "")}</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155">${html}</p>`;

// ------------------------------------------------------------- welcome

export function welcomeEmail(name: string) {
  const subject = "Welcome to Taxpropath";
  const html = layout(
    `Welcome, ${name}!`,
    p("Thanks for creating your Taxpropath account. You can now buy self-study CPE courses and follow every order from your account.") +
      p("Once you buy a course, it opens in your learning portal — sign in there with this same email.") +
      `<p style="margin:22px 0">${button(`${SITE_URL}/courses`, "Browse Courses")}</p>` +
      p(`Your account: <a href="${SITE_URL}/account" style="color:#15803d">${SITE_URL.replace(/^https?:\/\//, "")}/account</a>`),
  );
  const text = `Welcome, ${name}!

Thanks for creating your Taxpropath account. You can now buy self-study CPE courses and follow every order from your account.
Once you buy a course, it opens in your learning portal — sign in there with this same email.

Browse courses: ${SITE_URL}/courses
Your account: ${SITE_URL}/account`;
  return { subject, html, text };
}

// ------------------------------------------------------ order confirmation

export type EmailOrderItem = { title: string; option: string; code: string | null; priceCents: number };

const DELIVERY: Record<string, string> = {
  SELF_STUDY:
    "Self-Study: your course is ready in your learning portal. Sign in with this email, study at your own pace, and complete the assessment to earn your certificate.",
  ETRANSCRIPT: "e-Transcript: the course transcript is available alongside the course in your portal.",
  SLIDES: "Slides: the presentation slides are available to download from the course in your portal.",
};

export function orderConfirmationEmail(input: {
  name: string;
  orderRef: string;
  date: string;
  items: EmailOrderItem[];
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  totalCents: number;
  paymentRef: string | null;
}) {
  const subject = `Order Confirmation - #${input.orderRef} - Taxpropath`;
  const rows = input.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px"><strong>${esc(i.title)}</strong><br><span style="color:#64748b">${esc(i.option)}</span></td>
<td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:right;white-space:nowrap">${money(i.priceCents)}</td>
</tr>`,
    )
    .join("");
  const codes = [...new Set(input.items.map((i) => i.code).filter((c): c is string => Boolean(c && DELIVERY[c])))];
  const delivery = codes.map((c) => `<li style="margin:0 0 8px">${esc(DELIVERY[c])}</li>`).join("");

  const html = layout(
    "Thank you — your order is confirmed",
    p(`Hi ${esc(input.name)}, we've received your payment.`) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;font-size:13.5px;color:#475569">
<tr><td>Order number</td><td style="text-align:right;font-weight:700;color:#0b1b3a">#${esc(input.orderRef)}</td></tr>
<tr><td>Date</td><td style="text-align:right">${esc(input.date)}</td></tr>
${input.paymentRef ? `<tr><td>Payment reference</td><td style="text-align:right;font-family:monospace">${esc(input.paymentRef)}</td></tr>` : ""}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
${input.discountCents > 0 ? `<tr><td style="padding:8px 0;font-size:14px;color:#15803d">Discount${input.couponCode ? ` (${esc(input.couponCode)})` : ""}</td><td style="padding:8px 0;font-size:14px;text-align:right;color:#15803d">−${money(input.discountCents)}</td></tr>` : ""}
<tr><td style="padding:12px 0;font-size:16px;font-weight:800">Total paid</td><td style="padding:12px 0;font-size:16px;font-weight:800;text-align:right">${money(input.totalCents)}</td></tr>
</table>` +
      (delivery
        ? `<h2 style="margin:20px 0 10px;font-size:16px;color:#0b1b3a">How to access your purchase</h2><ul style="margin:0 0 14px;padding-left:20px;font-size:14px;line-height:1.6;color:#334155">${delivery}</ul>`
        : "") +
      `<p style="margin:22px 0">${button(PORTAL_URL, "Open My Portal")}</p>` +
      p(`You can also see this order any time under <a href="${SITE_URL}/account/orders" style="color:#15803d">My Orders</a>.`),
  );

  const text = `Thank you — your order is confirmed

Hi ${input.name}, we've received your payment.

Order number: #${input.orderRef}
Date: ${input.date}${input.paymentRef ? `\nPayment reference: ${input.paymentRef}` : ""}

${input.items.map((i) => `- ${i.title} (${i.option}): ${money(i.priceCents)}`).join("\n")}
${input.discountCents > 0 ? `Discount${input.couponCode ? ` (${input.couponCode})` : ""}: -${money(input.discountCents)}\n` : ""}Total paid: ${money(input.totalCents)}

${codes.map((c) => DELIVERY[c]).join("\n")}

Open your portal: ${PORTAL_URL}
My Orders: ${SITE_URL}/account/orders`;
  return { subject, html, text };
}

// ------------------------------------------------- registration incomplete

export function incompleteOrderEmail(input: { name: string; items: { title: string; slug: string }[] }) {
  const subject = "Registration Incomplete - Taxpropath";
  const list = input.items
    .map(
      (i) => `<tr><td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px"><strong>${esc(i.title)}</strong></td>
<td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right">${button(`${SITE_URL}/courses/${encodeURIComponent(i.slug)}`, "Register Again")}</td></tr>`,
    )
    .join("");
  const html = layout(
    "Your registration isn't complete yet",
    p(`Hi ${esc(input.name)}, your payment wasn't completed, so you have <strong>not</strong> been charged and your course isn't active yet.`) +
      p("If you still want it, pick up where you left off:") +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px">${list}</table>` +
      p("Had trouble paying? Just reply to this email and we'll help."),
  );
  const text = `Your registration isn't complete yet

Hi ${input.name}, your payment wasn't completed, so you have not been charged and your course isn't active yet.

${input.items.map((i) => `- ${i.title}: ${SITE_URL}/courses/${encodeURIComponent(i.slug)}`).join("\n")}

Had trouble paying? Just reply to this email and we'll help.`;
  return { subject, html, text };
}
