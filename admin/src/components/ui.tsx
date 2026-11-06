import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Page title row with optional description and actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl">{title}</h1>
        {description ? <p className="text-ink-muted mt-1 text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const published = status === "PUBLISHED";
  return (
    <span className={cn("badge", published ? "badge-ok" : "badge-muted")}>
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-line text-center rounded-md border border-dashed p-10">
      <p className="font-medium">{title}</p>
      {description ? <p className="text-ink-muted mx-auto mt-1 max-w-md text-sm">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** A labelled count, linking to the list it summarises. */
export function StatCard({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: number | string;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <>
      <p className="text-ink-faint text-xs font-semibold tracking-[0.06em] uppercase">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-ink-faint mt-0.5 text-xs">{hint}</p> : null}
    </>
  );

  if (!href) return <div className="card card-pad">{inner}</div>;

  return (
    <Link href={href} className="card card-pad hover:border-line-strong transition-colors">
      {inner}
    </Link>
  );
}
