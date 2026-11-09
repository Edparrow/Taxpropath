"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setStatus("done");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-6 text-[14px] font-semibold text-brand-400">
        Subscribed — thanks for joining!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-slate-300">
        Get updates in your inbox
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13.5px] text-white placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          aria-label="Subscribe"
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-gradient p-2 text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
        </button>
      </div>
      {message && <p className="mt-2 text-[12.5px] text-red-400">{message}</p>}
    </form>
  );
}
