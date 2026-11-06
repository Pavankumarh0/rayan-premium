import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { EnquiryStatusBadge, formatEnquiryDate } from "../status";
import { TriageForm } from "./triage-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const enquiry = await db.enquiry.findUnique({
    where: { id: (await params).id },
    select: { name: true },
  });
  return { title: enquiry ? `Enquiry from ${enquiry.name}` : "Not found" };
}

export const dynamic = "force-dynamic";

/** Only digits survive into a tel: or WhatsApp link. */
function dialable(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  const text = value === null || value === undefined || value === "" ? null : String(value);
  if (!text) return null;
  return (
    <div>
      <dt className="text-ink-faint text-xs font-semibold tracking-[0.06em] uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm">{text}</dd>
    </div>
  );
}

export default async function EnquiryPage({ params }: Props) {
  await requireUser();

  const { id } = await params;
  const enquiry = await db.enquiry.findUnique({
    where: { id },
    include: {
      vehicle: { select: { name: true, slug: true } },
      service: { select: { name: true, slug: true } },
      destination: { select: { name: true, slug: true } },
      package: { select: { name: true, slug: true } },
    },
  });
  if (!enquiry) notFound();

  const related =
    enquiry.vehicle?.name ??
    enquiry.service?.name ??
    enquiry.destination?.name ??
    enquiry.package?.name ??
    null;

  const phone = dialable(enquiry.phone);

  return (
    <>
      <Link href="/enquiries" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        Enquiries
      </Link>

      <PageHeader
        title={enquiry.name}
        description={`Received ${formatEnquiryDate(enquiry.createdAt)} (IST)`}
        actions={<EnquiryStatusBadge status={enquiry.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="grid min-w-0 gap-5">
          <section className="card card-pad">
            <h2 className="border-line mb-4 border-b pb-2 text-base">What they sent</h2>

            <dl className="field-grid">
              <Detail label="Name" value={enquiry.name} />
              <Detail label="Phone" value={enquiry.phone} />
              <Detail label="Email" value={enquiry.email} />
              <Detail label="Enquiry type" value={enquiry.type.toLowerCase().replace(/_/g, " ")} />
              <Detail label="Subject" value={enquiry.subject} />
              <Detail label="About" value={related} />
              <Detail label="Travel date" value={enquiry.travelDate} />
              <Detail label="Passengers" value={enquiry.passengers} />
              <Detail label="Pick-up" value={enquiry.pickup} />
              <Detail label="Drop-off" value={enquiry.dropoff} />
            </dl>

            {enquiry.message ? (
              <div className="border-line mt-4 border-t pt-4">
                <h3 className="text-ink-faint mb-1.5 text-xs font-semibold tracking-[0.06em] uppercase">
                  Message
                </h3>
                {/* Plain text from a form: rendered as text, never as HTML. */}
                <p className="text-sm whitespace-pre-wrap">{enquiry.message}</p>
              </div>
            ) : null}
          </section>

          <section className="card card-pad">
            <h2 className="border-line mb-4 border-b pb-2 text-base">Handling</h2>
            <TriageForm
              id={enquiry.id}
              status={enquiry.status}
              internalNotes={enquiry.internalNotes ?? ""}
            />
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="card card-pad">
            <h2 className="mb-3 text-base">Reply</h2>
            <div className="grid gap-2">
              <a href={`tel:${phone}`} className="btn btn-primary w-full">
                <Phone size={15} aria-hidden="true" />
                Call {enquiry.phone}
              </a>
              <a
                href={`https://wa.me/${phone.replace(/^\+/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary w-full"
              >
                <MessageCircle size={15} aria-hidden="true" />
                WhatsApp
              </a>
              {enquiry.email ? (
                <a
                  href={`mailto:${enquiry.email}?subject=${encodeURIComponent(
                    `Re: your enquiry — Rayan Premium Mobility`,
                  )}`}
                  className="btn btn-secondary w-full"
                >
                  <Mail size={15} aria-hidden="true" />
                  Email
                </a>
              ) : null}
            </div>
          </section>

          {/*
            Technical context, kept separate from what the customer wrote. The
            IP is stored only as a hash, so this is useful for spotting a
            repeated submitter without holding the address itself.
          */}
          <section className="card card-pad">
            <h2 className="mb-3 text-base">Context</h2>
            <dl className="grid gap-3">
              <Detail label="Submitted from" value={enquiry.sourcePath} />
              <Detail label="Last updated" value={formatEnquiryDate(enquiry.updatedAt)} />
              <Detail
                label="Device"
                value={enquiry.userAgent ? enquiry.userAgent.slice(0, 160) : null}
              />
              <Detail
                label="Sender fingerprint"
                value={enquiry.ipHash ? `${enquiry.ipHash.slice(0, 12)}…` : null}
              />
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
