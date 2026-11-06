import Link from "next/link";
import { RESOURCES } from "@/lib/resources";
import { EmptyState } from "@/components/ui";

/**
 * Shown for an address inside the dashboard that does not resolve — a deleted
 * entry reached from a stale link, or a section that does not exist.
 *
 * It lists where an editor can actually go, because a bare "404" inside a
 * signed-in tool gives no way to tell a broken deployment from a dead link.
 */
export default function DashNotFound() {
  return (
    <>
      <EmptyState
        title="Not found"
        description="This address does not exist in the dashboard. It may have been deleted, or the link may be out of date."
        action={
          <Link href="/" className="btn btn-primary">
            Back to the dashboard
          </Link>
        }
      />

      <nav aria-label="Content sections" className="mt-6">
        <p className="text-ink-faint mb-2 text-center text-xs font-semibold tracking-[0.06em] uppercase">
          Content you can edit
        </p>
        <ul className="flex flex-wrap justify-center gap-1.5">
          <li>
            <Link href="/enquiries" className="btn btn-secondary btn-sm">
              Enquiries
            </Link>
          </li>
          {RESOURCES.map((resource) => (
            <li key={resource.slug}>
              <Link href={`/${resource.slug}`} className="btn btn-secondary btn-sm">
                {resource.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/settings" className="btn btn-secondary btn-sm">
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
