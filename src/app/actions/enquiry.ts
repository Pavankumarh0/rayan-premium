"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { enquirySchema, parseForm } from "@/lib/validation";
import { clientFingerprint, clientIp, rateLimit } from "@/lib/rate-limit";
import { sendEnquiryNotification } from "@/lib/mailer";
import { hashIp } from "@/lib/password";
import {
  emptyEnquiryValues,
  readEnquiryValues,
  type EnquiryState,
} from "@/lib/enquiry-state";

/** Minimum time a genuine person needs to complete the form. */
const MIN_FILL_MS = 2500;

export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const values = readEnquiryValues(formData);
  const parsed = parseForm(enquirySchema, formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields and try again.",
      errors: parsed.errors,
      values,
    };
  }

  const data = parsed.data;

  // --- Spam protection -----------------------------------------------------
  // Honeypot and a submit-speed check. Both fail silently with a success
  // response so a bot gets no signal about why it was rejected.
  const silentSuccess: EnquiryState = {
    status: "success",
    message: "Thank you — your enquiry has been received.",
    errors: {},
    values: emptyEnquiryValues,
  };
  if (data.company && data.company.trim().length > 0) return silentSuccess;
  if (data.elapsed > 0 && data.elapsed < MIN_FILL_MS) return silentSuccess;

  // --- Rate limiting -------------------------------------------------------
  const ip = await clientIp();
  const limit = await rateLimit(`enquiry:${hashIp(ip)}`, 5, 60 * 15);
  if (!limit.ok) {
    return {
      status: "error",
      message: `Too many enquiries from this connection. Please try again in ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minutes, or call us directly.`,
      errors: {},
      values,
    };
  }

  // --- Resolve related content so the subject line survives a later delete --
  const [vehicle, service, destination, pkg] = await Promise.all([
    data.vehicleId ? db.vehicle.findUnique({ where: { id: data.vehicleId }, select: { id: true, name: true } }) : null,
    data.serviceId ? db.service.findUnique({ where: { id: data.serviceId }, select: { id: true, name: true } }) : null,
    data.destinationId ? db.destination.findUnique({ where: { id: data.destinationId }, select: { id: true, name: true } }) : null,
    data.packageId ? db.package.findUnique({ where: { id: data.packageId }, select: { id: true, name: true } }) : null,
  ]);

  const subject =
    data.subject ||
    vehicle?.name ||
    service?.name ||
    destination?.name ||
    pkg?.name ||
    "General enquiry";

  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  try {
    const enquiry = await db.enquiry.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        travelDate: data.travelDate,
        passengers: data.passengers,
        pickup: data.pickup,
        dropoff: data.dropoff,
        subject,
        // Only link IDs that actually resolved, so a stale hidden field in a
        // cached page cannot produce a foreign-key error.
        vehicleId: vehicle?.id ?? null,
        serviceId: service?.id ?? null,
        destinationId: destination?.id ?? null,
        packageId: pkg?.id ?? null,
        sourcePath: data.sourcePath,
        ipHash: await clientFingerprint(),
        userAgent,
        status: "NEW",
      },
    });

    // Email is best-effort: a failed SMTP call must never lose the enquiry,
    // which is already safely stored above.
    await sendEnquiryNotification(enquiry.id).catch(() => undefined);

    return {
      status: "success",
      message:
        "Thank you — your enquiry has been received. We will be in touch shortly to confirm availability and pricing.",
      errors: {},
      values: emptyEnquiryValues,
    };
  } catch {
    return {
      status: "error",
      message:
        "Something went wrong saving your enquiry. Please try again, or contact us directly by phone.",
      errors: {},
      values,
    };
  }
}
