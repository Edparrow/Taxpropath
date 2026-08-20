import type { AuthError } from "@supabase/supabase-js";

/**
 * Supabase surfaces auth failures in API wording ("email rate limit exceeded"),
 * which reads as a bug to anyone registering. Translate the ones users actually
 * hit and pass anything else through unchanged.
 */
export function authErrorMessage(error: AuthError): string {
  if (error.status === 429 || error.code === "over_email_send_rate_limit") {
    return "Too many attempts — please try again in an hour.";
  }
  if (error.code === "email_address_invalid") {
    return "That email address was rejected. Please check it and try again.";
  }
  if (error.code === "over_request_rate_limit") {
    return "Too many requests — please wait a moment and try again.";
  }
  return error.message;
}
