"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2, UserPlus } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useUser } from "@/components/use-user";
import { PageBanner, PillLink } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { lines, subtotalCents, setQuantity, removeLine } = useCart();
  const user = useUser();

  return (
    <>
      <PageBanner
        title="Cart"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/cart", label: "Cart" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {lines.length === 0 ? (
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 px-8 py-16 text-center">
              <ShoppingCart className="mx-auto size-10 text-slate-300" aria-hidden />
              <h2 className="mt-5 text-xl font-extrabold text-navy-950">
                Your cart is empty
              </h2>
              <p className="mt-2 text-[15px] text-ink-muted">
                Browse our upcoming sessions and add one to get started.
              </p>
              <div className="mt-8 flex justify-center">
                <PillLink href="/webinar/upcoming">Browse Webinars</PillLink>
              </div>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      {["Product Name", "Quantity", "Price", "Total", ""].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="pb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.optionId} className="border-b border-slate-100">
                        <td className="py-5 pr-6">
                          <Link
                            href={`/webinar/${line.webinarSlug}`}
                            className="text-[15px] font-bold leading-snug text-navy-950 transition-colors duration-200 hover:text-brand-700"
                          >
                            {line.title}
                          </Link>
                          <p className="mt-1 text-[13px] text-ink-muted">
                            {line.optionLabel}
                          </p>
                        </td>
                        <td className="py-5 pr-6">
                          <div className="inline-flex items-center rounded-full border border-slate-200">
                            <button
                              onClick={() =>
                                setQuantity(line.optionId, line.quantity - 1)
                              }
                              className="flex size-9 cursor-pointer items-center justify-center rounded-l-full text-ink-muted transition-colors duration-200 hover:bg-slate-50"
                              aria-label={`Decrease quantity of ${line.title}`}
                            >
                              <Minus className="size-3.5" aria-hidden />
                            </button>
                            <span className="w-9 text-center text-sm font-bold tabular-nums">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() =>
                                setQuantity(line.optionId, line.quantity + 1)
                              }
                              className="flex size-9 cursor-pointer items-center justify-center rounded-r-full text-ink-muted transition-colors duration-200 hover:bg-slate-50"
                              aria-label={`Increase quantity of ${line.title}`}
                            >
                              <Plus className="size-3.5" aria-hidden />
                            </button>
                          </div>
                        </td>
                        <td className="py-5 pr-6 text-[15px] tabular-nums text-ink-muted">
                          {formatPrice(line.unitPriceCents)}
                        </td>
                        <td className="py-5 pr-6 text-[15px] font-extrabold tabular-nums text-navy-950">
                          {formatPrice(line.unitPriceCents * line.quantity)}
                        </td>
                        <td className="py-5">
                          <button
                            onClick={() => removeLine(line.optionId)}
                            className="cursor-pointer rounded-full p-2 text-slate-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${line.title} from cart`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <aside className="h-fit rounded-3xl bg-cream p-7 lg:sticky lg:top-28">
                <h2 className="text-lg font-extrabold text-navy-950">Order Summary</h2>
                <dl className="mt-6 space-y-3 border-b border-navy-950/10 pb-6">
                  <div className="flex justify-between text-[15px]">
                    <dt className="text-ink-muted">Subtotal</dt>
                    <dd className="font-semibold tabular-nums text-navy-950">
                      {formatPrice(subtotalCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <dt className="text-ink-muted">Tax</dt>
                    <dd className="text-ink-muted">Calculated at checkout</dd>
                  </div>
                </dl>
                <div className="mt-6 flex items-baseline justify-between">
                  <p className="text-base font-bold text-navy-950">Total</p>
                  <p className="text-2xl font-extrabold tabular-nums text-navy-950">
                    {formatPrice(subtotalCents)}
                  </p>
                </div>
                {/* undefined = auth still resolving, so don't flash a prompt. */}
                {user === null ? (
                  <div className="mt-8">
                    <p className="flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3.5 text-[13.5px] leading-relaxed text-ink-muted">
                      <UserPlus
                        className="mt-0.5 size-4 shrink-0 text-brand-600"
                        aria-hidden
                      />
                      An account is required to purchase. Register to continue — your
                      cart is kept.
                    </p>
                    <div className="mt-4">
                      <PillLink
                        href="/register?next=%2Fcheckout"
                        className="w-full justify-between"
                      >
                        Register to Checkout
                      </PillLink>
                    </div>
                    <p className="mt-4 text-center text-[13.5px] text-ink-muted">
                      Already registered?{" "}
                      <Link
                        href="/login?next=%2Fcheckout"
                        className="font-bold text-brand-700 hover:underline"
                      >
                        Login
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="mt-8">
                    <PillLink href="/checkout" className="w-full justify-between">
                      Checkout
                    </PillLink>
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
