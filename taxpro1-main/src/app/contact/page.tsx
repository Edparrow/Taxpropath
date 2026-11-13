"use client";

import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { COMPANY } from "@/lib/company";
import {
  Field,
  FormAlert,
  Input,
  SubmitButton,
  Textarea,
} from "@/components/form";
import { PageBanner, SectionHeading } from "@/components/ui";

export default function ContactPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });

    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "We couldn't send your message. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <>
      <PageBanner
        title="Contact Us"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/contact", label: "Contact Us" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeading lead="Get In" accent="Touch" />
            <p className="mt-6 text-[16.5px] leading-relaxed text-ink-muted">
              Questions about a course, your credits, or a team subscription? Send us
              a message and our team will get back to you.
            </p>

            <ul className="mt-10 space-y-7">
              <li className="flex gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                  <MapPin className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
                    Address
                  </h2>
                  <p className="mt-1 text-left text-[15.5px] leading-relaxed text-navy-950">
                    {COMPANY.addressLines[0]}
                    <br />
                    {COMPANY.addressLines[1]}
                  </p>
                </div>
              </li>
              <li className="flex gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                  <Phone className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
                    Phone
                  </h2>
                  <a
                    href={COMPANY.phoneHref}
                    className="mt-1 block text-[15.5px] font-semibold text-navy-950 transition-colors duration-200 hover:text-brand-700"
                  >
                    {COMPANY.phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                  <Mail className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
                    Email Address
                  </h2>
                  <a
                    href="mailto:support@taxpropath.com"
                    className="mt-1 block text-[15.5px] font-semibold text-navy-950 transition-colors duration-200 hover:text-brand-700"
                  >
                    support@taxpropath.com
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 p-8">
            {sent ? (
              <div className="py-10 text-center">
                <h2 className="text-xl font-extrabold text-navy-950">
                  Message sent
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                  Thanks for reaching out — we&rsquo;ll reply to your email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field label="Name" htmlFor="name" required>
                  <Input id="name" name="name" required autoComplete="name" />
                </Field>
                <Field label="Email" htmlFor="email" required>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                </Field>
                <Field label="Subject" htmlFor="subject">
                  <Input id="subject" name="subject" />
                </Field>
                <Field label="Message" htmlFor="message" required>
                  <Textarea id="message" name="message" rows={6} required />
                </Field>

                {error && <FormAlert tone="error">{error}</FormAlert>}

                <SubmitButton pending={pending}>Submit</SubmitButton>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
