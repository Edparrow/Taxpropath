import { PageBanner, Prose } from "@/components/ui";
import type { LegalDoc } from "@/lib/legal-doc";

/** Banner + the document, for the Privacy, Refund and Terms pages. */
export function LegalPage({ doc, href }: { doc: LegalDoc; href: string }) {
  return (
    <>
      <PageBanner
        title={doc.title}
        crumb={[
          { href: "/", label: "Home" },
          { href, label: doc.title },
        ]}
      />
      <Prose>
        {doc.updated && (
          <p className="!text-[13.5px] !font-semibold uppercase tracking-wider !text-slate-500">
            Last updated: {doc.updated}
          </p>
        )}
        {doc.body}
      </Prose>
    </>
  );
}
