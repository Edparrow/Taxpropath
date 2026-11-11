"use client";

import { useState } from "react";
import { Award, ExternalLink, MonitorPlay, PlayCircle, Receipt } from "lucide-react";
import { DarkGlow, PillLink, SectionHeading } from "@/components/ui";
import { PORTAL_URL } from "@/lib/portal";
import { formatPrice } from "@/lib/utils";
import { orderRef, type ReceiptData } from "@/lib/receipt";
import { ReceiptDialog } from "./receipt-dialog";

/**
 * After payment: one card split dark | light, the same contrast as the login
 * page and the homepage CTA. Dark side: the tick, thanks and next actions.
 * Light side: what was bought. The receipt prints over it first.
 */
export function ThankYou({ receipt }: { receipt: ReceiptData }) {
  const [receiptOpen, setReceiptOpen] = useState(true);
  const first = receipt.name.split(" ")[0] ?? "";
  const firstName = first ? first[0].toUpperCase() + first.slice(1) : "";

  const steps = [
    {
      icon: MonitorPlay,
      title: "Open your portal",
      body: `Sign in to your learning portal with ${receipt.email}.`,
    },
    {
      icon: PlayCircle,
      title: "Learn at your own pace",
      body: "Start the course whenever it suits you, on any device.",
    },
    {
      icon: Award,
      title: "Get your certificate",
      body: "Finish the course and your certificate is waiting in the portal.",
    },
  ];

  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid overflow-hidden rounded-[2rem] shadow-2xl shadow-navy-950/15 lg:grid-cols-[1.15fr_1fr]">
            {/* -------------------------------------------- dark side */}
            <div className="relative isolate overflow-hidden bg-navy-950 px-7 py-12 text-center sm:px-12 lg:py-16 lg:text-left">
              <DarkGlow />
              <div className="relative mx-auto flex size-20 items-center justify-center lg:mx-0">
                <span
                  aria-hidden
                  className="absolute inset-0 animate-ping rounded-full bg-brand-500/30 [animation-duration:2.4s] motion-reduce:animate-none"
                />
                <span className="relative flex size-20 items-center justify-center rounded-full bg-brand-gradient shadow-xl shadow-brand-600/40 ring-8 ring-white/5">
                  <svg viewBox="0 0 24 24" className="size-9" aria-hidden>
                    <polyline
                      points="5 12.5 10 17.5 19 7.5"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-check-draw"
                    />
                  </svg>
                </span>
              </div>

              <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-300">
                Payment successful
              </p>
              <SectionHeading
                as="h1"
                onDark
                lead={firstName ? `Thank you, ${firstName}!` : "Thank you!"}
                accent="You're all set."
                className="mt-5 !text-4xl sm:!text-5xl"
              />
              <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-white/70 lg:mx-0 lg:text-left">
                Your order is confirmed and listed under My Orders. Your course is ready
                in your learning portal.
              </p>

              <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a
                  href={PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-navy-950 shadow-lg shadow-black/20 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Open My Portal
                  <ExternalLink className="size-4" aria-hidden />
                </a>
                <button
                  type="button"
                  onClick={() => setReceiptOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/10"
                >
                  <Receipt className="size-4" aria-hidden />
                  View Receipt
                </button>
              </div>
            </div>

            {/* ------------------------------------------- light side */}
            <div className="bg-white px-7 py-10 sm:px-10 lg:py-14">
              <p className="text-[12px] font-bold uppercase tracking-wider text-brand-700">
                Order summary
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-navy-950">
                {formatPrice(receipt.totalCents)}
              </p>
              <p className="mt-1 text-[13.5px] text-slate-500">
                Paid on{" "}
                {new Date(receipt.paidAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>

              <ul className="mt-7 space-y-4 border-y border-slate-100 py-6">
                {receipt.lines.map((line) => (
                  <li key={line.courseSlug} className="text-[14px]">
                    <div className="flex justify-between gap-4">
                      <p className="min-w-0 text-left font-semibold leading-snug text-navy-950">
                        {line.title}
                      </p>
                      <p className="shrink-0 font-semibold tabular-nums text-navy-950">
                        {formatPrice(line.basePriceCents)}
                      </p>
                    </div>
                    {line.addons.map((addon) => (
                      <div
                        key={addon.code}
                        className="mt-1.5 flex justify-between gap-4 pl-3 text-[13px] text-slate-500"
                      >
                        <p className="text-left">+ {addon.label}</p>
                        <p className="shrink-0 tabular-nums">{formatPrice(addon.priceCents)}</p>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>

              <dl className="mt-5 space-y-2.5 text-[14px]">
                <Detail label="Subtotal" value={formatPrice(receipt.subtotalCents)} />
                {receipt.discountCents > 0 && (
                  <Detail
                    label={`Discount${receipt.couponCode ? ` (${receipt.couponCode})` : ""}`}
                    value={`-${formatPrice(receipt.discountCents)}`}
                  />
                )}
                <Detail label="Order ref" value={orderRef(receipt.orderId)} mono />
                {receipt.captureId && (
                  <Detail label="Payment ref" value={receipt.captureId} mono />
                )}
              </dl>
              <div className="mt-6 flex items-center justify-between rounded-xl bg-navy-950 px-5 py-3.5 text-white">
                <span className="text-[14px] font-semibold">Total paid</span>
                <span className="text-lg font-bold tabular-nums">
                  {formatPrice(receipt.totalCents)}
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------- next steps */}
          <SectionHeading lead="What happens" accent="next" className="mt-20 text-center" />
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-slate-200/80 bg-white p-7 transition-shadow duration-300 hover:shadow-xl hover:shadow-navy-950/[0.06]"
              >
                <span className="absolute right-6 top-6 font-display text-4xl font-bold text-slate-100">
                  0{i + 1}
                </span>
                <span className="flex size-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-lg shadow-brand-600/20">
                  <step.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-navy-950">{step.title}</h3>
                <p className="mt-2 text-left text-[14.5px] leading-relaxed text-ink-muted [overflow-wrap:anywhere]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <PillLink href="/account/orders">Go to My Account</PillLink>
            <PillLink href="/courses" variant="outline">
              Browse More Courses
            </PillLink>
          </div>
        </div>
      </section>

      {receiptOpen && (
        <ReceiptDialog receipt={receipt} onClose={() => setReceiptOpen(false)} />
      )}
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`min-w-0 truncate font-semibold text-navy-950 ${mono ? "font-mono text-[13px]" : "tabular-nums"}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
