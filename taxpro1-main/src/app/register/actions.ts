"use server";

import { getCurrentUser } from "@/lib/auth";
import { welcomeNewCustomer } from "@/lib/customer-journey";

/**
 * When email confirmation is switched off, sign-up signs the customer straight
 * in and /auth/callback never runs — so the register page asks for the welcome
 * step here. Only ever acts on the signed-in user's own account, once.
 */
export async function welcomeAfterSignup() {
  const user = await getCurrentUser();
  if (user) await welcomeNewCustomer(user.id);
}
