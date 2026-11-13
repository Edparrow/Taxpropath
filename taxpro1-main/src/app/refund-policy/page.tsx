import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { loadLegalDoc } from "@/lib/legal-doc";

// Text lives in /documents/Refund Policy.md. Read per render, so edits show up in
// development straight away; in production the page is static, so it's read
// once at build time.
const FILE = "Refund Policy.md";

export function generateMetadata(): Metadata {
  const doc = loadLegalDoc(FILE);
  return { title: doc.title, description: doc.summary };
}

export default function RefundPolicyPage() {
  return <LegalPage doc={loadLegalDoc(FILE)} href="/refund-policy" />;
}
