import "server-only";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sendMail, type MailResult } from "@/lib/email/send";
import { incompleteOrderEmail, orderConfirmationEmail, welcomeEmail } from "@/lib/email/templates";
import { orderItemRow, orderSummaryRow, sendToGoogleSheet, type SheetRow } from "@/lib/google-sheets";
import { logError } from "@/lib/errors/log";

/**
 * The automatic steps of a customer's journey, as SkillSync does them:
 *   sign-up    -> welcome email + "registered user" row in Google Sheets
 *   checkout   -> "abandoned" row in Google Sheets (until it's paid)
 *   payment    -> order confirmation email + order rows in Google Sheets
 *   cancelled  -> "registration incomplete" email
 * None of these ever throw: a failed email or sheet push must not break the
 * purchase. Failures land in the Error Monitor.
 */

const ready = () => isSupabaseConfigured() && hasServiceRoleKey();

type JourneyOrder = {
  id: string;
  user_id: string | null;
  status: string;
  guest_email: string | null;
  billing: Record<string, string> | null;
  subtotal_cents: number;
  discount_cents: number | null;
  coupon_code: string | null;
  paypal_capture_id: string | null;
  paid_at: string | null;
  created_at: string;
  confirmation_sent_at: string | null;
  incomplete_email_sent_at: string | null;
  order_items: {
    title_snapshot: string;
    option_snapshot: string;
    option_code: string | null;
    course_slug: string;
    quantity: number;
    unit_price_cents: number;
  }[];
};

async function loadOrder(orderId: string): Promise<JourneyOrder | null> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(
      `id, user_id, status, guest_email, billing, subtotal_cents, discount_cents, coupon_code,
       paypal_capture_id, paid_at, created_at, confirmation_sent_at, incomplete_email_sent_at,
       order_items ( title_snapshot, option_snapshot, option_code, course_slug, quantity, unit_price_cents )`,
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error) {
    await logError({ type: "db_error", message: `Loading order ${orderId} for email: ${error.message}` });
    return null;
  }
  return data as JourneyOrder | null;
}

async function recipient(order: JourneyOrder): Promise<string | null> {
  const fromOrder = order.billing?.email || order.guest_email;
  if (fromOrder) return fromOrder;
  if (!order.user_id) return null;
  const { data } = await createAdminClient().auth.admin.getUserById(order.user_id);
  return data.user?.email ?? null;
}

const firstName = (order: JourneyOrder) => order.billing?.first_name?.trim() || "there";
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** Emails the order confirmation. `force` re-sends one that already went out. */
export async function sendOrderConfirmation(orderId: string, force = false): Promise<MailResult> {
  if (!ready()) return { ok: false, error: "Supabase is not configured." };
  const order = await loadOrder(orderId);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status !== "paid") return { ok: false, error: "Only paid orders get a confirmation." };
  if (order.confirmation_sent_at && !force) return { ok: true };

  const to = await recipient(order);
  if (!to) return { ok: false, error: "The order has no email address." };

  const discount = order.discount_cents ?? 0;
  const mail = orderConfirmationEmail({
    name: firstName(order),
    orderRef: order.id.slice(0, 8).toUpperCase(),
    date: longDate(order.paid_at ?? order.created_at),
    items: order.order_items.map((i) => ({
      title: i.title_snapshot,
      option: i.option_snapshot,
      code: i.option_code,
      priceCents: i.unit_price_cents * i.quantity,
    })),
    subtotalCents: order.subtotal_cents,
    discountCents: discount,
    couponCode: order.coupon_code,
    totalCents: order.subtotal_cents - discount,
    paymentRef: order.paypal_capture_id,
  });

  const result = await sendMail({ to, ...mail, bccSupport: true });
  if (result.ok) {
    await createAdminClient()
      .from("orders")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("id", order.id);
  }
  return result;
}

/** "Registration incomplete" email for a checkout the buyer cancelled. Sent once. */
export async function sendIncompleteEmail(orderId: string): Promise<MailResult> {
  if (!ready()) return { ok: false, error: "Supabase is not configured." };
  const order = await loadOrder(orderId);
  if (!order || order.status === "paid" || order.incomplete_email_sent_at) return { ok: true };

  const to = await recipient(order);
  if (!to) return { ok: false, error: "The order has no email address." };

  // Claim it first, so two cancel clicks can't send two emails.
  const { data: claimed } = await createAdminClient()
    .from("orders")
    .update({ incomplete_email_sent_at: new Date().toISOString() })
    .eq("id", order.id)
    .is("incomplete_email_sent_at", null)
    .select("id");
  if (!claimed?.length) return { ok: true };

  const seen = new Set<string>();
  const items = order.order_items
    .filter((i) => (seen.has(i.course_slug) ? false : (seen.add(i.course_slug), true)))
    .map((i) => ({ title: i.title_snapshot, slug: i.course_slug }));

  return sendMail({ to, ...incompleteOrderEmail({ name: firstName(order), items }), bccSupport: true });
}

/**
 * First sign-in of a new TaxProPath customer: welcome email + Google Sheets row.
 * Safe to call on every sign-in; it acts only once per account.
 */
export async function welcomeNewCustomer(userId: string): Promise<void> {
  if (!ready()) return;
  try {
    const db = createAdminClient();
    // Claim the welcome atomically; only the first caller gets a row back.
    const { data: claimed } = await db
      .from("profiles")
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq("id", userId)
      .is("welcome_sent_at", null)
      .select("first_name, last_name, phone, city, zip, ptin, company, address1, created_at");
    const profile = claimed?.[0];
    if (!profile) return;

    const { data } = await db.auth.admin.getUserById(userId);
    const email = data.user?.email;
    if (!email) return;

    const name = profile.first_name?.trim() || email.split("@")[0];
    await sendMail({ to: email, ...welcomeEmail(name) });

    if (process.env.GOOGLE_SHEETS_URL) {
      const row: SheetRow = {
        source: "TaxProPath",
        order_id: `REG-${userId.slice(0, 8)}`,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
        email,
        mobile: profile.phone ?? "",
        city: profile.city ?? "",
        pincode: profile.zip ?? "",
        coupon_code: profile.ptin ?? "",
        coupon_price: profile.company ?? "",
        price: profile.address1 ?? "",
        date: new Date(profile.created_at).toISOString().replace("T", " ").slice(0, 19),
        product_detail: "Registered user",
        live_date: "N/A",
        demand_date: "N/A",
      };
      const result = await sendToGoogleSheet([row], "users");
      if (!result.ok) await logError({ type: "route", message: `Google Sheets (users): ${result.error}` });
    }
  } catch (err) {
    await logError({ type: "route", message: `Welcome step failed: ${err instanceof Error ? err.message : String(err)}` });
  }
}

/** Pushes a just-paid order's items to the orders sheet. */
export async function syncPaidOrderToSheet(orderId: string): Promise<void> {
  if (!ready() || !process.env.GOOGLE_SHEETS_URL) return;
  const order = await loadOrder(orderId);
  if (!order || order.status !== "paid") return;
  const email = (await recipient(order)) ?? "";
  const rows = order.order_items.map((i) =>
    orderItemRow({
      orderId: order.id,
      billing: order.billing ?? {},
      fallbackEmail: email,
      couponCode: order.coupon_code,
      discountCents: order.discount_cents ?? 0,
      date: order.paid_at ?? order.created_at,
      title: i.title_snapshot,
      option: i.option_snapshot,
      unitPriceCents: i.unit_price_cents,
      quantity: i.quantity,
    }),
  );
  const result = await sendToGoogleSheet(rows, "orders");
  if (!result.ok) await logError({ type: "route", message: `Google Sheets (orders): ${result.error}` });
}

/** Pushes a just-started checkout to the abandoned sheet (SkillSync does this at checkout). */
export async function syncCheckoutToAbandonedSheet(paypalOrderId: string): Promise<void> {
  if (!ready() || !process.env.GOOGLE_SHEETS_ABANDONED_URL) return;
  const { data } = await createAdminClient()
    .from("orders")
    .select("id")
    .eq("paypal_order_id", paypalOrderId)
    .maybeSingle();
  if (!data) return;
  const order = await loadOrder(data.id);
  if (!order) return;
  const discount = order.discount_cents ?? 0;
  const row = orderSummaryRow({
    orderId: order.id,
    billing: order.billing ?? {},
    fallbackEmail: (await recipient(order)) ?? "",
    couponCode: order.coupon_code,
    discountCents: discount,
    totalCents: order.subtotal_cents - discount,
    date: order.created_at,
    products: order.order_items.map((i) => `${i.title_snapshot} (${i.option_snapshot})`).join(", "),
  });
  const result = await sendToGoogleSheet([row], "abandoned");
  if (!result.ok) await logError({ type: "route", message: `Google Sheets (abandoned): ${result.error}` });
}
