import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

/** Invoice as a downloadable PDF (SkillSync's "Download invoice PDF"). */

type Row = {
  id: string;
  status: string;
  subtotal_cents: number;
  discount_cents: number | null;
  coupon_code: string | null;
  guest_email: string | null;
  paypal_capture_id: string | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  billing: Record<string, string> | null;
  order_items: { title_snapshot: string; option_snapshot: string; quantity: number; unit_price_cents: number }[];
};

const NAVY = rgb(0.043, 0.106, 0.227);
const MUTED = rgb(0.39, 0.45, 0.55);
const LINE = rgb(0.886, 0.91, 0.94);
const GREEN = rgb(0.086, 0.639, 0.29);

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
// The built-in PDF fonts cover Windows-1252 (Latin-1 plus curly quotes,
// dashes, bullet, ellipsis, €, ™); replace anything else.
const safe = (text: string) => text.replace(/[^\x20-\x7E\xA0-\xFF‘’‚“”„–—•…€™]/g, "?");

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = safe(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function right(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = NAVY) {
  const t = safe(text);
  page.drawText(t, { x: x - font.widthOfTextAtSize(t, size), y, size, font, color });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(["orders", "order_sheet", "failed_orders", "abandoned"]);
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal_cents, discount_cents, coupon_code, guest_email, paypal_capture_id,
       payment_method, paid_at, created_at, billing,
       order_items ( title_snapshot, option_snapshot, quantity, unit_price_cents )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const order = data as unknown as Row;
  const billing = order.billing ?? {};

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${order.id.slice(0, 8).toUpperCase()}`);
  pdf.setAuthor("Taxpropath");
  const page = pdf.addPage([595.28, 841.89]); // A4
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const left = 50;
  const edge = 545;
  let y = 790;

  // Header: logo + invoice details.
  try {
    const logo = await pdf.embedPng(await readFile(path.join(process.cwd(), "public", "logo.png")));
    const h = 34;
    page.drawImage(logo, { x: left, y: y - h + 10, width: (logo.width / logo.height) * h, height: h });
  } catch {
    page.drawText("Taxpropath", { x: left, y, size: 20, font: bold, color: NAVY });
  }
  right(page, "INVOICE", edge, y, bold, 18);
  right(page, `#${order.id.slice(0, 8).toUpperCase()}`, edge, y - 18, regular, 10, MUTED);
  right(page, `Date: ${date(order.created_at)}`, edge, y - 32, regular, 10, MUTED);
  y -= 40;
  page.drawText("Accounting & Tax CPE Courses", { x: left, y, size: 9, font: regular, color: MUTED });
  page.drawText("support@taxpropath.com  ·  taxpropath.com", { x: left, y: y - 12, size: 9, font: regular, color: MUTED });
  y -= 30;
  page.drawRectangle({ x: left, y, width: edge - left, height: 3, color: GREEN });
  y -= 30;

  // Billed to / status.
  page.drawText("BILLED TO", { x: left, y, size: 8.5, font: bold, color: MUTED });
  right(page, "STATUS", edge, y, bold, 8.5, MUTED);
  y -= 16;
  const name = [billing.first_name, billing.last_name].filter(Boolean).join(" ") || "-";
  const billedLines = [
    name,
    billing.email || order.guest_email || "",
    billing.company || "",
    [billing.address1, billing.address2].filter(Boolean).join(", "),
    [billing.city, billing.region, billing.zip].filter(Boolean).join(", "),
    billing.country || "",
    billing.ptin ? `PTIN: ${billing.ptin}` : "",
  ].filter(Boolean);
  const statusLines = [
    order.status.charAt(0).toUpperCase() + order.status.slice(1),
    order.paid_at ? `Paid ${date(order.paid_at)}` : "",
    order.payment_method === "manual" ? "Manual payment" : "PayPal",
    order.paypal_capture_id ? `Ref: ${order.paypal_capture_id}` : "",
  ].filter(Boolean);
  for (let i = 0; i < Math.max(billedLines.length, statusLines.length); i++) {
    if (billedLines[i]) {
      page.drawText(safe(billedLines[i]), { x: left, y, size: i === 0 ? 11 : 10, font: i === 0 ? bold : regular, color: i === 0 ? NAVY : MUTED });
    }
    if (statusLines[i]) right(page, statusLines[i], edge, y, i === 0 ? bold : regular, i === 0 ? 11 : 10, i === 0 ? NAVY : MUTED);
    y -= 15;
  }
  y -= 15;

  // Items table.
  const cols = { qty: 380, price: 460, total: edge };
  page.drawLine({ start: { x: left, y: y + 4 }, end: { x: edge, y: y + 4 }, thickness: 1, color: LINE });
  y -= 12;
  page.drawText("ITEM", { x: left, y, size: 8.5, font: bold, color: MUTED });
  right(page, "QTY", cols.qty, y, bold, 8.5, MUTED);
  right(page, "PRICE", cols.price, y, bold, 8.5, MUTED);
  right(page, "TOTAL", cols.total, y, bold, 8.5, MUTED);
  y -= 10;
  page.drawLine({ start: { x: left, y }, end: { x: edge, y }, thickness: 1, color: LINE });
  y -= 18;

  for (const item of order.order_items) {
    const titleLines = wrap(item.title_snapshot, bold, 10.5, 300);
    titleLines.forEach((line, i) => page.drawText(line, { x: left, y: y - i * 13, size: 10.5, font: bold, color: NAVY }));
    page.drawText(safe(item.option_snapshot), { x: left, y: y - titleLines.length * 13, size: 9.5, font: regular, color: MUTED });
    right(page, String(item.quantity), cols.qty, y, regular, 10.5, MUTED);
    right(page, money(item.unit_price_cents), cols.price, y, regular, 10.5, MUTED);
    right(page, money(item.unit_price_cents * item.quantity), cols.total, y, bold, 10.5);
    y -= titleLines.length * 13 + 22;
    page.drawLine({ start: { x: left, y: y + 8 }, end: { x: edge, y: y + 8 }, thickness: 0.5, color: LINE });
    if (y < 150) break; // one-page invoice; orders hold a single course
  }

  // Totals.
  y -= 6;
  const total = order.subtotal_cents - (order.discount_cents ?? 0);
  right(page, "Subtotal", 460, y, regular, 10.5, MUTED);
  right(page, money(order.subtotal_cents), edge, y, regular, 10.5);
  if (order.discount_cents) {
    y -= 18;
    right(page, `Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`, 460, y, regular, 10.5, GREEN);
    right(page, `-${money(order.discount_cents)}`, edge, y, regular, 10.5, GREEN);
  }
  y -= 12;
  page.drawLine({ start: { x: 330, y }, end: { x: edge, y }, thickness: 1, color: LINE });
  y -= 20;
  right(page, "Total", 460, y, bold, 13);
  right(page, money(total), edge, y, bold, 13);

  page.drawText("Thank you for learning with Taxpropath.", { x: left, y: 60, size: 9.5, font: regular, color: MUTED });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="taxpropath-invoice-${order.id.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
