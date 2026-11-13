/**
 * TaxProPath's contact details, shown in the footer and on the Contact page.
 * Keep in step with the "Contact us" block of the documents in /documents.
 */
export const COMPANY = {
  addressLines: ["3257 Pennsylvania Ave NW, Suite 1135", "Washington, DC 20006, United States"],
  phone: "+1 (458) 232-1511",
  phoneHref: "tel:+14582321511",
  email: "support@taxpropath.com",
} as const;

/** How long a purchased course stays open in the portal (see Terms, section 5). */
export const COURSE_ACCESS = "12 months from purchase";
