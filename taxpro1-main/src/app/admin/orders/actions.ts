"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/admin/activity";
import { fireOrderDoorbell } from "@/lib/engine";
import { sendOrderConfirmation } from "@/lib/customer-journey";
import { orderItemRow, orderSummaryRow, sendToGoogleSheet } from "@/lib/google-sheets";
import { sanitizeBilling } from "@/lib/cart-pricing";
import { COURSE_CODES } from "@/lib/types";
import {
  ORDER_COLUMNS,
  customerEmail,
  orderTotalCents,
  productsSummary,
  unpaidCutoffIso,
  type OrderRow,
} from "@/lib/admin/orders";

/*
 * Order changes run through the service role (orders have no admin write
 * policies); requireAdmin(section, "edit") in each action is the lock.
 */

export type ActionResult = { ok: boolean; message: string };

// ------------------------------------------------------------ failed orders

/**
 * "Move to confirm": settles an unpaid order the admin knows was paid some
 * other way. The order then reaches the CRM and the engine like any other.
 */
export async function markOrderPaid(form: FormData) {
  const admin = await requireAdmin("failed_orders", "edit");
  const orderId = String(form.get("id") ?? "");
  const reference = String(form.get("reference") ?? "").trim().slice(0, 120);
  if (!orderId) return;

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, status, coupon_code, remarks")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status === "paid") return;

  const { error } = await db
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paypal_capture_id: reference || null,
      remarks: [order.remarks, `Marked paid by ${admin.email}`].filter(Boolean).join(" · "),
    })
    .eq("id", orderId);
  if (error) {
    console.error("[orders] mark paid failed", error);
    return;
  }

  if (order.coupon_code) {
    const { data: coupon } = await db
      .from("coupons")
      .select("id, times_redeemed")
      .eq("code", order.coupon_code)
      .maybeSingle();
    if (coupon) {
      await db.from("coupons").update({ times_redeemed: coupon.times_redeemed + 1 }).eq("id", coupon.id);
    }
  }

  await logActivity(admin, "MARK_PAID", `Marked order ${orderId.slice(0, 8)} as paid${reference ? ` (ref ${reference})` : ""}.`, {
    type: "order",
    id: orderId,
  });
  await fireOrderDoorbell({ order_id: orderId, action: "paid" });
  revalidatePath("/admin/orders", "layout");
}

/** Deletes an unpaid order. Paid orders are financial records and stay. */
export async function deleteUnpaidOrder(form: FormData) {
  const admin = await requireAdmin("failed_orders", "edit");
  const orderId = String(form.get("id") ?? "");
  if (!orderId) return;

  const db = createAdminClient();
  const { data } = await db
    .from("orders")
    .delete()
    .eq("id", orderId)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();

  if (data) {
    await logActivity(admin, "DELETE_ORDER", `Deleted unpaid order ${orderId.slice(0, 8)}.`, {
      type: "order",
      id: orderId,
    });
  }
  revalidatePath("/admin/orders", "layout");
}

// -------------------------------------------------------------- order sheet

const CHECKLIST_FIELDS = ["portal_access_sent", "certificate_sent"] as const;

export async function setChecklist(
  itemId: string,
  field: (typeof CHECKLIST_FIELDS)[number],
  value: boolean,
): Promise<ActionResult> {
  await requireAdmin("order_sheet", "edit");
  if (!CHECKLIST_FIELDS.includes(field)) return { ok: false, message: "Unknown checklist field." };

  const { error } = await createAdminClient()
    .from("order_items")
    .update({ [field]: value })
    .eq("id", itemId);
  if (error) {
    console.error("[orders] checklist update failed", error);
    return { ok: false, message: "Could not save. Please try again." };
  }
  revalidatePath("/admin/orders/sheet");
  return { ok: true, message: "" };
}

async function paidOrders(): Promise<OrderRow[]> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(ORDER_COLUMNS)
    .is("deleted_at", null)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });
  if (error) console.error("[orders] paid orders load failed", error);
  return (data ?? []) as unknown as OrderRow[];
}

/** Sends order sheet rows (all, or only the chosen item ids) to Google Sheets. */
export async function syncOrderSheet(itemIds: string[] | null): Promise<ActionResult> {
  const admin = await requireAdmin("order_sheet", "edit");
  const wanted = itemIds ? new Set(itemIds) : null;

  const rows = (await paidOrders()).flatMap((o) =>
    o.order_items
      .filter((i) => !wanted || wanted.has(i.id))
      .map((i) =>
        orderItemRow({
          orderId: o.id,
          billing: o.billing ?? {},
          fallbackEmail: customerEmail(o),
          couponCode: o.coupon_code,
          discountCents: o.discount_cents ?? 0,
          date: o.paid_at ?? o.created_at,
          title: i.title_snapshot,
          option: i.option_snapshot,
          unitPriceCents: i.unit_price_cents,
          quantity: i.quantity,
        }),
      ),
  );

  const result = await sendToGoogleSheet(rows, "orders");
  if (!result.ok) return { ok: false, message: result.error };
  await logActivity(admin, "SYNC_SHEET", `Synced ${result.count} order sheet row(s) to Google Sheets.`);
  return { ok: true, message: `${result.count} row(s) synced to Google Sheets.` };
}

// ------------------------------------------------------------ abandoned

/** Sends abandoned checkouts (all, or only the chosen order ids) to Google Sheets. */
export async function syncAbandoned(orderIds: string[] | null): Promise<ActionResult> {
  const admin = await requireAdmin("abandoned", "edit");

  let query = createAdminClient()
    .from("orders")
    .select(ORDER_COLUMNS)
    .is("deleted_at", null)
    .neq("status", "paid")
    .lt("created_at", unpaidCutoffIso())
    .order("created_at", { ascending: false });
  if (orderIds) query = query.in("id", orderIds);

  const { data, error } = await query;
  if (error) return { ok: false, message: "Could not load the abandoned orders." };

  const rows = ((data ?? []) as unknown as OrderRow[]).map((o) =>
    orderSummaryRow({
      orderId: o.id,
      billing: o.billing ?? {},
      fallbackEmail: customerEmail(o),
      couponCode: o.coupon_code,
      discountCents: o.discount_cents ?? 0,
      totalCents: orderTotalCents(o),
      date: o.created_at,
      products: productsSummary(o),
    }),
  );

  const result = await sendToGoogleSheet(rows, "abandoned");
  if (!result.ok) return { ok: false, message: result.error };
  await logActivity(admin, "SYNC_SHEET", `Synced ${result.count} abandoned checkout(s) to Google Sheets.`);
  return { ok: true, message: `${result.count} abandoned checkout(s) synced to Google Sheets.` };
}

// ------------------------------------------------------------ manual order

export type ManualOrderState = { error: string | null };

type Db = ReturnType<typeof createAdminClient>;

type ManualInput = {
  billing: Record<string, string>;
  course: { id: string; slug: string; title: string };
  chosen: { id: string; code: string; label: string; price_cents: number }[];
  subtotal: number;
  amount: number;
  paidAt: string;
  reference: string;
  remarks: string;
  couponCode: string;
};

/**
 * Reads and checks the manual-order form. Prices come from the catalog; the
 * admin may charge less (the gap is stored as a discount) but never more.
 */
async function readManualOrder(db: Db, form: FormData): Promise<ManualInput | { error: string }> {
  const billing = sanitizeBilling(Object.fromEntries(form.entries()));
  billing.email = billing.email.toLowerCase();
  if (!billing.first_name) return { error: "First name is required." };
  if (!billing.email.includes("@")) return { error: "A valid email is required." };

  const courseId = String(form.get("course_id") ?? "");
  const addonCodes = form.getAll("addons").map(String);
  if (!courseId) return { error: "Choose a course." };

  const { data: course } = await db
    .from("courses")
    .select("id, slug, title, pricing_options ( id, code, label, price_cents )")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) return { error: "That course no longer exists." };

  const options = course.pricing_options as { id: string; code: string; label: string; price_cents: number }[];
  const base = options.find((o) => o.code === COURSE_CODES.base);
  if (!base) return { error: "That course has no Self-Study price yet." };

  const chosen = [
    base,
    ...COURSE_CODES.addons
      .filter((code) => addonCodes.includes(code))
      .map((code) => options.find((o) => o.code === code))
      .filter((o): o is NonNullable<typeof o> => Boolean(o)),
  ];
  const subtotal = chosen.reduce((sum, o) => sum + o.price_cents, 0);

  const amountRaw = String(form.get("amount") ?? "").trim();
  const amount = amountRaw ? Math.round(Number(amountRaw) * 100) : subtotal;
  if (!Number.isFinite(amount) || amount < 0) return { error: "Enter a valid amount." };
  if (amount > subtotal) return { error: "The amount can't be more than the course price." };

  const dateRaw = String(form.get("order_date") ?? "").trim();
  const paidAt =
    dateRaw && !Number.isNaN(Date.parse(dateRaw)) ? new Date(dateRaw).toISOString() : new Date().toISOString();

  return {
    billing,
    course: { id: course.id, slug: course.slug, title: course.title },
    chosen,
    subtotal,
    amount,
    paidAt,
    reference: String(form.get("trans_id") ?? "").trim().slice(0, 120),
    remarks: String(form.get("remarks") ?? "").trim().slice(0, 1000),
    couponCode: String(form.get("coupon_code") ?? "").trim().toUpperCase().slice(0, 60),
  };
}

const itemRows = (orderId: string, input: ManualInput) =>
  input.chosen.map((o) => ({
    order_id: orderId,
    course_slug: input.course.slug,
    pricing_option_id: o.id,
    option_code: o.code,
    quantity: 1,
    unit_price_cents: o.price_cents,
    title_snapshot: input.course.title,
    option_snapshot: o.label,
  }));

/** Records an order taken outside the website (phone, invoice, bank transfer) as paid. */
export async function createManualOrder(
  _prev: ManualOrderState,
  form: FormData,
): Promise<ManualOrderState> {
  const admin = await requireAdmin("orders", "edit");
  const db = createAdminClient();
  const input = await readManualOrder(db, form);
  if ("error" in input) return input;

  const { data: order, error } = await db
    .from("orders")
    .insert({
      guest_email: input.billing.email,
      status: "paid",
      subtotal_cents: input.subtotal,
      discount_cents: input.subtotal - input.amount,
      coupon_code: input.couponCode || null,
      billing: input.billing,
      payment_method: "manual",
      paypal_capture_id: input.reference || null,
      paid_at: input.paidAt,
      created_at: input.paidAt,
      remarks: input.remarks || null,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !order) {
    console.error("[orders] manual order insert failed", error);
    return { error: "Could not save the order. Please try again." };
  }

  const { error: itemsError } = await db.from("order_items").insert(itemRows(order.id, input));
  if (itemsError) {
    console.error("[orders] manual order items insert failed", itemsError);
    await db.from("orders").delete().eq("id", order.id);
    return { error: "Could not save the order items. Please try again." };
  }

  await logActivity(
    admin,
    "CREATE_ORDER",
    `Created manual order ${order.id.slice(0, 8)} for ${input.billing.email}: ${input.course.title}.`,
    { type: "order", id: order.id },
  );
  await fireOrderDoorbell({ order_id: order.id, action: "paid" });
  if (form.get("send_email")) await sendOrderConfirmation(order.id);
  revalidatePath("/admin/orders", "layout");
  redirect("/admin/orders");
}

/**
 * Edits an order. Customer details and remarks can change on any order; a
 * manual order can also change its course, add-ons, amount, date and
 * reference. PayPal orders keep their items and amount — that money moved.
 */
export async function updateOrder(
  orderId: string,
  _prev: ManualOrderState,
  form: FormData,
): Promise<ManualOrderState> {
  const admin = await requireAdmin("orders", "edit");
  const db = createAdminClient();
  const { data: existing } = await db
    .from("orders")
    .select("id, payment_method, status, deleted_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!existing || existing.deleted_at) return { error: "That order no longer exists." };

  const stamp = { updated_by: admin.id, updated_at: new Date().toISOString() };

  if (existing.payment_method === "manual") {
    const input = await readManualOrder(db, form);
    if ("error" in input) return input;

    const { error } = await db
      .from("orders")
      .update({
        guest_email: input.billing.email,
        subtotal_cents: input.subtotal,
        discount_cents: input.subtotal - input.amount,
        coupon_code: input.couponCode || null,
        billing: input.billing,
        paypal_capture_id: input.reference || null,
        paid_at: input.paidAt,
        created_at: input.paidAt,
        remarks: input.remarks || null,
        ...stamp,
      })
      .eq("id", orderId);
    if (error) {
      console.error("[orders] update failed", error);
      return { error: "Could not save the order. Please try again." };
    }

    // Replace the items only when the course or add-ons changed, so the
    // order sheet checklist survives an edit of just the customer details.
    const { data: items } = await db.from("order_items").select("course_slug, option_code").eq("order_id", orderId);
    const before = (items ?? []).map((i) => `${i.course_slug}:${i.option_code}`).sort().join(",");
    const after = input.chosen.map((o) => `${input.course.slug}:${o.code}`).sort().join(",");
    if (before !== after) {
      await db.from("order_items").delete().eq("order_id", orderId);
      const { error: itemsError } = await db.from("order_items").insert(itemRows(orderId, input));
      if (itemsError) {
        console.error("[orders] item replace failed", itemsError);
        return { error: "The order was saved but its items could not be updated. Please try again." };
      }
    }
  } else {
    const billing = sanitizeBilling(Object.fromEntries(form.entries()));
    if (!billing.first_name) return { error: "First name is required." };
    if (!billing.email.includes("@")) return { error: "A valid email is required." };
    const { error } = await db
      .from("orders")
      .update({
        billing,
        remarks: String(form.get("remarks") ?? "").trim().slice(0, 1000) || null,
        ...stamp,
      })
      .eq("id", orderId);
    if (error) {
      console.error("[orders] update failed", error);
      return { error: "Could not save the order. Please try again." };
    }
  }

  await logActivity(admin, "UPDATE_ORDER", `Edited order ${orderId.slice(0, 8)}.`, { type: "order", id: orderId });
  if (existing.status === "paid") await fireOrderDoorbell({ order_id: orderId, action: "paid" });
  revalidatePath("/admin/orders", "layout");
  redirect("/admin/orders");
}

/**
 * Deletes a completed order. It's a soft delete: the row stays for the
 * records but disappears from every list, export, the customer's account and
 * the get_orders API. The admin confirms by typing their own name, as on
 * SkillSync.
 */
export async function deleteOrder(form: FormData): Promise<ActionResult> {
  const admin = await requireAdmin("orders", "edit");
  const orderId = String(form.get("id") ?? "");
  const typed = String(form.get("confirm_name") ?? "").trim().toLowerCase();
  if (!orderId) return { ok: false, message: "Missing order." };
  if (!typed || typed !== admin.name.trim().toLowerCase()) {
    return { ok: false, message: `Type your name exactly as "${admin.name}" to confirm.` };
  }

  const { data, error } = await createAdminClient()
    .from("orders")
    .update({ deleted_at: new Date().toISOString(), deleted_by: admin.id })
    .eq("id", orderId)
    .is("deleted_at", null)
    .select("id, billing, guest_email")
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[orders] delete failed", error);
    return { ok: false, message: "Could not delete the order. It may already be gone." };
  }

  const email = (data.billing as Record<string, string> | null)?.email || data.guest_email || "";
  await logActivity(
    admin,
    "DELETE_ORDER",
    `${admin.name} deleted order ${orderId.slice(0, 8)}${email ? ` (${email})` : ""}.`,
    { type: "order", id: orderId },
  );
  revalidatePath("/admin/orders", "layout");
  return { ok: true, message: "Order deleted." };
}

/** Sends the order confirmation email again (SkillSync's "resend"). */
export async function resendConfirmation(form: FormData): Promise<ActionResult> {
  const admin = await requireAdmin("orders", "edit");
  const orderId = String(form.get("id") ?? "");
  if (!orderId) return { ok: false, message: "Missing order." };

  const result = await sendOrderConfirmation(orderId, true);
  if (!result.ok) return { ok: false, message: result.error };
  await logActivity(admin, "RESEND_CONFIRMATION", `Re-sent the confirmation email for order ${orderId.slice(0, 8)}.`, {
    type: "order",
    id: orderId,
  });
  return { ok: true, message: "Confirmation email sent." };
}
