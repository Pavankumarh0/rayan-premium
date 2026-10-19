import "server-only";

import nodemailer from "nodemailer";
import { db } from "./db";
import { getSettings, settingBool, settingOrNull, settingText } from "./settings";
import { formatDateTime } from "./utils";

/**
 * Enquiry email notifications.
 *
 * Entirely optional: with no SMTP host configured the function is a no-op and
 * enquiries are simply stored for the admin inbox. Nothing here ever throws
 * into the request path — the caller already persisted the enquiry.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type MailerStatus =
  | { configured: false; reason: string }
  | { configured: true; host: string; port: number; from: string; to: string };

export async function mailerStatus(): Promise<MailerStatus> {
  const settings = await getSettings();
  const host = settingOrNull(settings, "email.smtpHost");
  const to = settingOrNull(settings, "email.notifyTo");
  const from = settingOrNull(settings, "email.fromAddress");

  if (!host) return { configured: false, reason: "No SMTP host set." };
  if (!to) return { configured: false, reason: "No notification recipient set." };
  if (!from) return { configured: false, reason: "No from address set." };

  return {
    configured: true,
    host,
    port: Number(settingText(settings, "email.smtpPort")) || 587,
    from,
    to,
  };
}

async function buildTransport() {
  const settings = await getSettings();
  const host = settingOrNull(settings, "email.smtpHost");
  if (!host) return null;

  const port = Number(settingText(settings, "email.smtpPort")) || 587;
  const user = settingOrNull(settings, "email.smtpUser");
  const pass = settingOrNull(settings, "email.smtpPassword");

  return nodemailer.createTransport({
    host,
    port,
    secure: settingBool(settings, "email.smtpSecure") || port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}

export async function sendEnquiryNotification(enquiryId: string): Promise<boolean> {
  const status = await mailerStatus();
  if (!status.configured) return false;

  const [settings, enquiry] = await Promise.all([
    getSettings(),
    db.enquiry.findUnique({ where: { id: enquiryId } }),
  ]);
  if (!enquiry) return false;

  const transport = await buildTransport();
  if (!transport) return false;

  const siteUrl = settingText(settings, "seo.siteUrl").replace(/\/+$/, "");
  const fromName = settingText(settings, "email.fromName") || settingText(settings, "brand.name");

  const rows: Array<[string, string | null]> = [
    ["Name", enquiry.name],
    ["Phone", enquiry.phone],
    ["Email", enquiry.email],
    ["Enquiry type", enquiry.type],
    ["Subject", enquiry.subject],
    ["Travel date", enquiry.travelDate],
    ["Passengers", enquiry.passengers ? String(enquiry.passengers) : null],
    ["Pick-up", enquiry.pickup],
    ["Drop-off", enquiry.dropoff],
    ["Submitted from", enquiry.sourcePath],
    ["Received", formatDateTime(enquiry.createdAt)],
  ];

  const tableRows = rows
    .filter(([, value]) => value && value.length > 0)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#585e67;font-size:13px;vertical-align:top">${escapeHtml(
          label,
        )}</td><td style="padding:6px 0;font-size:14px;color:#14171b">${escapeHtml(value!)}</td></tr>`,
    )
    .join("");

  const messageBlock = enquiry.message
    ? `<p style="margin:24px 0 8px;font-size:13px;color:#585e67">Message</p>
       <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#14171b">${escapeHtml(
         enquiry.message,
       )}</p>`
    : "";

  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8d7440">New enquiry</p>
  <h1 style="margin:0 0 24px;font-size:22px;font-weight:500;color:#14171b">${escapeHtml(
    enquiry.subject || "General enquiry",
  )}</h1>
  <table style="border-collapse:collapse;width:100%">${tableRows}</table>
  ${messageBlock}
  ${
    siteUrl
      ? `<p style="margin:28px 0 0"><a href="${siteUrl}/admin/enquiries/${enquiry.id}" style="font-size:14px;color:#8d7440">Open in the admin inbox</a></p>`
      : ""
  }
</div>`;

  const text = rows
    .filter(([, value]) => value && value.length > 0)
    .map(([label, value]) => `${label}: ${value}`)
    .concat(enquiry.message ? ["", "Message:", enquiry.message] : [])
    .join("\n");

  await transport.sendMail({
    from: `"${fromName}" <${status.from}>`,
    to: status.to,
    ...(enquiry.email ? { replyTo: enquiry.email } : {}),
    subject: `New enquiry — ${enquiry.subject || "General"} — ${enquiry.name}`,
    text,
    html,
  });

  return true;
}

/** Used by the admin "send test email" action. */
export async function sendTestEmail(): Promise<{ ok: boolean; detail: string }> {
  const status = await mailerStatus();
  if (!status.configured) return { ok: false, detail: status.reason };

  try {
    const transport = await buildTransport();
    if (!transport) return { ok: false, detail: "Could not build the SMTP transport." };

    await transport.verify();
    await transport.sendMail({
      from: status.from,
      to: status.to,
      subject: "Test email from your website",
      text: "SMTP is configured correctly. Enquiry notifications will be delivered to this address.",
    });
    return { ok: true, detail: `Test email sent to ${status.to}.` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "Unknown SMTP error." };
  }
}
