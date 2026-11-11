import type { Metadata } from "next";
import { AlarmClock, PhoneCall } from "lucide-react";
import { PageBanner, Prose } from "@/components/ui";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Cancellation and refund terms for Taxpropath courses.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <PageBanner
        title="Refund Policy"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/refund-policy", label: "Refund Policy" },
        ]}
      />

      <Prose>
        <p className="!text-[13.5px] !font-semibold uppercase tracking-wider !text-slate-500">
          Effective for all purchases on taxpropath.com
        </p>

        <p>
          Thank you for purchasing the most excellent online training course from
          taxpropath.com. We strive hard to provide you with the best and most
          rewarding experience while you discover information, assess, and purchase our
          online webinars.
        </p>
        <p>
          Customers are always a priority for taxpropath.com. We wish to serve to the
          best of our capabilities through our webinar programs. Our money refund
          policy is one very important part of the commitment towards our customers.
        </p>
        <p>
          Please browse through our policy here to understand how our refund system
          works before applying for a refund requisition.
        </p>

        <h2>Cancellation</h2>
        <p>
          Cancellations won&rsquo;t be accepted if done less than 24 hours prior to the
          start time of the webinar. Only conference cancellations received 24 hours
          prior to the start time of the webinar are refundable.
        </p>
        <p>
          If you are not able to attend for any reason, please notify us at the
          earliest prior to the event.
        </p>

        <div className="my-8 flex items-start gap-4 rounded-2xl bg-brand-50 px-6 py-5">
          <AlarmClock className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
          <p className="!mb-0 !text-[15px] !text-brand-800">
            Cancellations must be made <strong>at least 24 hours</strong> before the
            webinar start time to be eligible for a refund.
          </p>
        </div>

        <h2>Substitution</h2>
        <p>
          Substitutions are permitted and should be informed prior to 48 hours before
          the start of the registered webinar. Substitutions mean either substituting a
          webinar for another webinar scheduled at a different day or substituting the
          attendee in place of the registered participant.
        </p>
        <p>Substitution / cancellations will NOT be accepted in these cases:</p>
        <ul>
          <li>If the attendee missed the session</li>
          <li>
            If the attendee didn&rsquo;t receive the webinar instructions due to e-mail
            bounce or firewall protection
          </li>
          <li>If there is a system incompatibility issue at the attendee&rsquo;s side</li>
        </ul>

        <div className="my-8 flex items-start gap-4 rounded-2xl bg-cream px-6 py-5">
          <PhoneCall className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
          <p className="!mb-0 !text-[15px] !text-navy-950">
            Please get in touch with our Customer Care for more details on the refund
            process:{" "}
            <a
              href="mailto:support@taxpropath.com"
              className="font-semibold text-brand-700 hover:underline"
            >
              support@taxpropath.com
            </a>
          </p>
        </div>
      </Prose>
    </>
  );
}
