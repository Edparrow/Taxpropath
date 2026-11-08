import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Taxpropath course purchase.",
};

export default async function CheckoutPage() {
  // An account is required to buy; come back here once registered.
  const user = await getCurrentUser();
  if (!user) redirect("/register?next=%2Fcheckout");

  // The publishable client id is safe to expose; the secret never leaves the server.
  return (
    <CheckoutClient
      paypalClientId={process.env.PAYPAL_CLIENT_ID ?? ""}
      accountEmail={user.email ?? ""}
    />
  );
}
