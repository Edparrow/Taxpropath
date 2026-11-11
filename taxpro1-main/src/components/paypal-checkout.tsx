"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import type { CartLine } from "@/lib/types";
import { FormAlert } from "@/components/form";

// Minimal shape of the bits of the PayPal JS SDK this component touches.
type PaypalNamespace = {
  Buttons: (opts: Record<string, unknown>) => {
    render: (el: HTMLElement) => Promise<void>;
  };
  CardFields: (opts: Record<string, unknown>) => {
    isEligible: () => boolean;
    NameField: (o?: Record<string, unknown>) => { render: (s: string) => Promise<void> };
    NumberField: (o?: Record<string, unknown>) => { render: (s: string) => Promise<void> };
    ExpiryField: (o?: Record<string, unknown>) => { render: (s: string) => Promise<void> };
    CVVField: (o?: Record<string, unknown>) => { render: (s: string) => Promise<void> };
    submit: () => Promise<void>;
  };
};

declare global {
  interface Window {
    paypal?: PaypalNamespace;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadPaypalSdk(clientId: string) {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const params = new URLSearchParams({
      "client-id": clientId,
      components: "buttons,card-fields",
      currency: "USD",
      intent: "capture",
    });
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("Failed to load PayPal"));
    };
    document.body.appendChild(script);
  });
  return sdkPromise;
}

/**
 * Card processing has to be probed at runtime: PayPal only enables Advanced
 * Card Processing on approved accounts, and isEligible() reports it.
 */
type CardStatus = "checking" | "eligible" | "ineligible";

type PaypalClickActions = { resolve: () => Promise<void>; reject: () => Promise<void> };

const INCOMPLETE_FORM =
  "Please fill in all required billing fields above before paying.";

export function PaypalCheckout({
  clientId,
  lines,
  couponCode,
  getBilling,
  onPaid,
}: {
  clientId: string;
  lines: CartLine[];
  /** Applied coupon code, if any — sent alongside the cart so the server can re-validate it. */
  couponCode?: string;
  /** Returns the billing form values, or null if the form is invalid. */
  getBilling: () => Record<string, string> | null;
  onPaid: (result: { orderId: string; captureId: string | null; amountCents?: number }) => void;
}) {
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cardStatus, setCardStatus] = useState<CardStatus>("checking");

  // Latest values, so the SDK callbacks never close over stale props. The SDK
  // mounts once and keeps its original callbacks, so they read through this ref.
  const latest = useRef({ lines, couponCode, getBilling, onPaid });
  useEffect(() => {
    latest.current = { lines, couponCode, getBilling, onPaid };
  });

  const cardFieldsRef = useRef<ReturnType<PaypalNamespace["CardFields"]> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createOrder() {
      const billing = latest.current.getBilling();
      if (!billing) throw new Error(INCOMPLETE_FORM);

      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing,
          lines: latest.current.lines,
          couponCode: latest.current.couponCode || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start payment.");
      return body.id as string;
    }

    async function onApprove(data: { orderID: string }) {
      setBusy(true);
      try {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paypalOrderId: data.orderID }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Payment could not be completed.");
        latest.current.onPaid({
          orderId: body.orderId,
          captureId: body.captureId,
          amountCents: body.amountCents,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment failed.");
      } finally {
        setBusy(false);
      }
    }

    loadPaypalSdk(clientId)
      .then(async () => {
        if (cancelled || !window.paypal) return;

        // The container must be laid out (not display:none) before render(),
        // or PayPal measures zero width and draws a malformed button.
        if (buttonsRef.current) {
          buttonsRef.current.innerHTML = "";
          await window.paypal
            .Buttons({
              style: { shape: "pill", height: 48, layout: "vertical" },
              // Validate before PayPal opens its window. Without this the flow
              // aborts inside createOrder and the buyer just sees nothing happen.
              onClick: (_data: unknown, actions: PaypalClickActions) => {
                if (latest.current.getBilling()) {
                  setError(null);
                  return actions.resolve();
                }
                setError(INCOMPLETE_FORM);
                return actions.reject();
              },
              createOrder,
              onApprove,
              onError: (err: unknown) => {
                console.error("[paypal] button error", err);
                // Surface the real reason when we raised it ourselves.
                const message =
                  err instanceof Error && err.message === INCOMPLETE_FORM
                    ? INCOMPLETE_FORM
                    : "Something went wrong with PayPal. Please try again.";
                setError(message);
              },
              onCancel: (data: { orderID?: string }) => {
                setError("Payment cancelled — you have not been charged.");
                // Lets the server send the "registration incomplete" email.
                if (data?.orderID) {
                  void fetch("/api/paypal/cancel-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paypalOrderId: data.orderID }),
                  }).catch(() => {});
                }
              },
            })
            .render(buttonsRef.current);
        }
        if (!cancelled) setReady(true);

        const cardFields = window.paypal.CardFields({ createOrder, onApprove });
        if (!cardFields.isEligible()) {
          if (!cancelled) setCardStatus("ineligible");
          return;
        }

        // The field containers are already mounted (see the JSX below), so
        // these selectors resolve without waiting on a React re-render.
        cardFieldsRef.current = cardFields;
        await cardFields.NameField().render("#pp-card-name");
        await cardFields.NumberField().render("#pp-card-number");
        await cardFields.ExpiryField().render("#pp-card-expiry");
        await cardFields.CVVField().render("#pp-card-cvv");
        if (!cancelled) setCardStatus("eligible");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't load PayPal. Check your connection.");
          setCardStatus("ineligible");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  async function payWithCard() {
    if (!cardFieldsRef.current) return;
    // Same pre-check as the buttons: fail loudly on the page rather than
    // silently inside createOrder.
    if (!getBilling()) {
      setError(INCOMPLETE_FORM);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await cardFieldsRef.current.submit();
    } catch (err) {
      console.error("[paypal] card submit failed", err);
      setError("We couldn't process that card. Check the details and try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-5">
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}

      {!ready && (
        <p className="flex items-center gap-2 pb-3 text-[14px] text-ink-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading payment options…
        </p>
      )}

      {/* Always laid out so PayPal can measure it. */}
      <div ref={buttonsRef} />

      {/*
        Kept mounted while eligibility is still unknown so the field containers
        exist when render() runs; hidden with opacity rather than display so
        PayPal can still measure them. Unmounted once known ineligible.
      */}
      {cardStatus !== "ineligible" && (
        <div
          className={
            cardStatus === "eligible"
              ? "mt-6"
              : "pointer-events-none absolute opacity-0"
          }
          aria-hidden={cardStatus !== "eligible"}
        >
          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
              or pay with card
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mt-4 space-y-3">
            <PaypalField label="Name on card" id="pp-card-name" />
            <PaypalField label="Card number" id="pp-card-number" />
            <div className="grid grid-cols-2 gap-3">
              <PaypalField label="Expiry" id="pp-card-expiry" />
              <PaypalField label="CVV" id="pp-card-cvv" />
            </div>
          </div>

          <button
            type="button"
            onClick={payWithCard}
            disabled={busy || cardStatus !== "eligible"}
            className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-navy-950 py-3.5 text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CreditCard className="size-4" aria-hidden />
            )}
            {busy ? "Processing…" : "Pay with card"}
          </button>
        </div>
      )}

      {busy && (
        <p role="status" aria-live="polite" className="sr-only">
          Processing your payment
        </p>
      )}
    </div>
  );
}

/** PayPal renders its own iframe inside these containers. */
function PaypalField({ label, id }: { label: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-navy-950">
        {label}
      </label>
      <div
        id={id}
        className="h-[46px] rounded-xl border border-slate-300 px-2 transition-colors duration-200 focus-within:border-brand-500"
      />
    </div>
  );
}
