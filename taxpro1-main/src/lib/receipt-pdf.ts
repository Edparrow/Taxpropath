import type { jsPDF as JsPdf } from "jspdf";
import { formatPrice } from "@/lib/utils";
import { orderRef, receiptDate, type ReceiptData } from "@/lib/receipt";

/*
 * Builds the payment receipt as a narrow, till-roll style PDF in the browser
 * and downloads it. jsPDF is loaded only when the customer asks for the file.
 */

const WIDTH = 92; // mm
const PAD = 9;
const INNER = WIDTH - PAD * 2;
const INK: [number, number, number] = [2, 6, 23]; // navy-950
const MUTED: [number, number, number] = [100, 116, 139]; // slate-500
const PAPER: [number, number, number] = [251, 248, 241];
const BRAND: [number, number, number] = [21, 128, 61]; // brand-700

// The built-in Courier font only covers basic Latin; swap typographic marks.
function ascii(text: string) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E]/g, "");
}

async function loadLogo(): Promise<{ data: string; ratio: number } | null> {
  try {
    const blob = await (await fetch("/logo.png")).blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = data;
    });
    // Shrink to print size so the PDF stays small (the source is ~1000px).
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = Math.round((480 * img.naturalHeight) / img.naturalWidth);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return {
      data: canvas.toDataURL("image/png"),
      ratio: img.naturalHeight / img.naturalWidth,
    };
  } catch {
    return null; // the receipt is still complete without the logo
  }
}

/** Lays the receipt out; with `draw` false it only measures the height. */
function layout(
  doc: JsPdf,
  r: ReceiptData,
  logo: { data: string; ratio: number } | null,
  draw: boolean,
) {
  let y = PAD;
  const text = (
    value: string,
    x: number,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; align?: "left" | "right" | "center" } = {},
  ) => {
    doc.setFont("courier", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 9);
    doc.setTextColor(...(opts.color ?? INK));
    if (draw) doc.text(value, x, y, { align: opts.align ?? "left" });
  };
  const dashed = () => {
    y += 2.5;
    if (draw) {
      doc.setDrawColor(...MUTED);
      doc.setLineWidth(0.2);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(PAD, y, WIDTH - PAD, y);
      doc.setLineDashPattern([], 0);
    }
    y += 5;
  };
  const row = (label: string, value: string, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
    doc.setFont("courier", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 9);
    const valueWidth = doc.getTextWidth(value) + 3;
    // A long value (e.g. an email) gets its own line under the label.
    if (valueWidth > INNER * 0.6) {
      text(ascii(label), PAD, { ...opts });
      y += (opts.size ?? 9) * 0.45;
      for (const part of doc.splitTextToSize(value, INNER) as string[]) {
        text(part, WIDTH - PAD, { ...opts, align: "right" });
        y += (opts.size ?? 9) * 0.45;
      }
      y += 1;
      return;
    }
    const wrapped: string[] = doc.splitTextToSize(ascii(label), INNER - valueWidth);
    wrapped.forEach((part, i) => {
      text(part, PAD, { ...opts });
      if (i === 0) text(value, WIDTH - PAD, { ...opts, align: "right" });
      y += (opts.size ?? 9) * 0.45;
    });
    y += 1;
  };

  if (logo) {
    const w = 38;
    if (draw) doc.addImage(logo.data, "PNG", (WIDTH - w) / 2, y, w, w * logo.ratio, undefined, "FAST");
    y += w * logo.ratio + 6;
  } else {
    y += 4;
    text("TAXPROPATH", WIDTH / 2, { size: 13, bold: true, align: "center" });
    y += 6;
  }

  text("PAYMENT SUCCESSFUL", PAD, { size: 8, bold: true, color: BRAND });
  y += 9;
  text(formatPrice(r.totalCents), PAD, { size: 22, bold: true });
  y += 6;
  text(`${receiptDate(r.paidAt)} | PAID`, PAD, { size: 8, color: MUTED });
  dashed();

  for (const line of r.lines) {
    row(`1X ${line.title}`, formatPrice(line.basePriceCents));
    for (const addon of line.addons) {
      row(`   + ${addon.label}`, formatPrice(addon.priceCents), { color: MUTED });
    }
    y += 1;
  }
  dashed();

  row("Subtotal", formatPrice(r.subtotalCents));
  if (r.discountCents > 0) {
    row(`Discount${r.couponCode ? ` (${r.couponCode})` : ""}`, `-${formatPrice(r.discountCents)}`);
  }
  y += 1;
  row("TOTAL", formatPrice(r.totalCents), { bold: true, size: 11 });
  dashed();

  row("Order ref", orderRef(r.orderId), { size: 8, color: MUTED });
  if (r.captureId) row("Payment ref", r.captureId, { size: 8, color: MUTED });
  if (r.name) row("Billed to", ascii(r.name), { size: 8, color: MUTED });
  row("Email", ascii(r.email), { size: 8, color: MUTED });
  dashed();

  y += 2;
  text("THANK YOU FOR LEARNING WITH US!", WIDTH / 2, { size: 9, bold: true, align: "center" });
  y += 5;
  text("support@taxpropath.com", WIDTH / 2, { size: 8, color: MUTED, align: "center" });
  y += PAD;
  return y;
}

export async function downloadReceiptPdf(r: ReceiptData) {
  const { jsPDF } = await import("jspdf");
  const logo = await loadLogo();

  // Measure on a tall scratch page, then draw on a page cut to fit.
  const height = layout(new jsPDF({ unit: "mm", format: [WIDTH, 1000] }), r, logo, false);
  const doc = new jsPDF({ unit: "mm", format: [WIDTH, height] });
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, WIDTH, height, "F");
  // Brand strip across the top: green into blue, like the site's gradient.
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, WIDTH / 2, 2.2, "F");
  doc.setFillColor(0, 85, 170);
  doc.rect(WIDTH / 2, 0, WIDTH / 2, 2.2, "F");
  layout(doc, r, logo, true);

  doc.setProperties({ title: `Taxpropath receipt ${orderRef(r.orderId)}` });
  doc.save(`Taxpropath-receipt-${orderRef(r.orderId)}.pdf`);
}
