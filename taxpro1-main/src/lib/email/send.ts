import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { logError } from "@/lib/errors/log";

/**
 * Outgoing email over SMTP (e.g. Hostinger, as SkillSync uses).
 *
 *   SMTP_HOST, SMTP_PORT (465 = SSL, 587 = STARTTLS), SMTP_USER, SMTP_PASS
 *   MAIL_FROM   e.g. "Taxpropath <support@taxpropath.com>" (defaults to SMTP_USER)
 *   MAIL_BCC    optional copy of every order email, e.g. support@taxpropath.com
 *
 * Without SMTP settings nothing is sent and callers carry on as normal.
 */

let transporter: Transporter | null = null;

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export type MailResult = { ok: true } | { ok: false; error: string };

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Copy the support inbox (MAIL_BCC). */
  bccSupport?: boolean;
}): Promise<MailResult> {
  if (!isEmailConfigured()) {
    console.warn(`[email] SMTP not set up; skipped "${input.subject}" to ${input.to}`);
    return { ok: false, error: "Email is not set up: add the SMTP_* settings to the server env." };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: input.to,
      bcc: input.bccSupport && process.env.MAIL_BCC ? process.env.MAIL_BCC : undefined,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logError({
      type: "email",
      message: `Could not send "${input.subject}" to ${input.to}: ${message}`,
      userEmail: input.to,
      details: { subject: input.subject },
    });
    return { ok: false, error: "The email could not be sent. Check the SMTP settings." };
  }
}
