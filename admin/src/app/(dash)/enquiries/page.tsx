import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ENQUIRY_STATUSES } from "@/lib/validation";
import { EmptyState, PageHeader } from "@/components/ui";
import { EnquiryStatusBadge, formatEnquiryDate, STATUS_LABELS } from "./status";

export const metadata: Metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function EnquiriesPage({ searchParams }: Props) {
  await requireUser();

  const query = await searchParams;
  const raw = typeof query.status === "string" ? query.status : "";
  const filter = (ENQUIRY_STATUSES as readonly string[]).includes(raw) ? raw : null;

  const [rows, counts] = await Promise.all([
    db.enquiry.findMany({
      where: filter ? { status: filter } : {},
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        type: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    }),
    db.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = (status: string) =>
    counts.find((row) => row.status === status)?._count._all ?? 0;
  const total = counts.reduce((sum, row) => sum + row._count._all, 0);

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Everything submitted through the website. Contact details and messages are records of what the customer sent, so they cannot be edited here."
      />

      <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-1.5">
        <Link
          href="/enquiries"
          aria-current={filter === null ? "page" : undefined}
          className={filter === null ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
        >
          All <span className="tabular-nums opacity-70">{total}</span>
        </Link>
        {ENQUIRY_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/enquiries?status=${status}`}
            aria-current={filter === status ? "page" : undefined}
            className={filter === status ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
          >
            {STATUS_LABELS[status]}{" "}
            <span className="tabular-nums opacity-70">{countFor(status)}</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          title={filter ? `No ${STATUS_LABELS[filter as keyof typeof STATUS_LABELS].toLowerCase()} enquiries` : "No enquiries yet"}
          description={
            filter
              ? "Nothing currently has this status."
              : "Enquiries submitted on the website appear here straight away."
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">From</th>
                <th scope="col">About</th>
                <th scope="col" className="w-36">Received</th>
                <th scope="col" className="w-32">Status</th>
                <th scope="col" className="w-20 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/enquiries/${row.id}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                    <span className="text-ink-faint mt-0.5 block text-xs">
                      {row.phone}
                      {row.email ? ` · ${row.email}` : ""}
                    </span>
                  </td>
                  <td className="text-ink-muted text-sm">
                    {row.subject?.trim() || row.type.toLowerCase().replace(/_/g, " ")}
                  </td>
                  <td className="text-ink-muted text-sm whitespace-nowrap">
                    {formatEnquiryDate(row.createdAt)}
                  </td>
                  <td>
                    <EnquiryStatusBadge status={row.status} />
                  </td>
                  <td className="text-right">
                    <Link href={`/enquiries/${row.id}`} className="btn btn-secondary btn-sm">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length === PAGE_SIZE ? (
        <p className="text-ink-faint mt-3 text-sm">
          Showing the {PAGE_SIZE} most recent. Filter by status to narrow the list.
        </p>
      ) : null}
    </>
  );
}
