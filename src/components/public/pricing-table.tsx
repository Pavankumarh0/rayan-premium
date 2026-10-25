import { cn } from "@/lib/utils";
import type { TariffTable } from "@/lib/content";

/**
 * Tariff table.
 *
 * Column headers come from the CMS, so the structure stays editable. The first
 * cell of each row is a row header (`<th scope="row">`), which is what lets a
 * screen reader announce "Premium van, extra kilometre, ₹22" rather than a
 * bare number. On narrow screens the table scrolls horizontally inside a
 * focusable region so it remains reachable by keyboard.
 */
export function PricingTable({
  table,
  tone = "light",
}: {
  table: TariffTable;
  tone?: "light" | "dark";
}) {
  if (table.columns.length === 0 || table.rows.length === 0) return null;

  const captionId = `tariff-${table.id}`;

  return (
    // min-w-0: without it a grid/flex parent sizes to the table's 40rem
    // min-content and the whole page scrolls sideways on a phone, instead of
    // the table scrolling inside its own region.
    <div className="w-full min-w-0">
      <div
        role="region"
        aria-labelledby={captionId}
        tabIndex={0}
        className={cn(
          "min-w-0 overflow-x-auto rounded-md border",
          tone === "light" ? "border-mist-line bg-paper" : "border-charcoal-line bg-ink-raised",
        )}
      >
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption id={captionId} className="sr-only">
            {table.title}
            {table.description ? ` — ${table.description}` : ""}
          </caption>

          <thead>
            <tr
              className={cn(
                "border-b",
                tone === "light" ? "border-mist-line" : "border-charcoal-line",
              )}
            >
              {table.columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    "px-5 py-4 text-micro font-medium tracking-[0.14em] uppercase lg:px-6",
                    tone === "light" ? "text-on-light-faint" : "text-on-dark-faint",
                    index > 0 && "text-right tabular",
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {table.rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b last:border-b-0",
                  tone === "light" ? "border-mist-line/70" : "border-charcoal-line/70",
                  row.isHighlighted && (tone === "light" ? "bg-brand-wash/50" : "bg-charcoal/70"),
                )}
              >
                {table.columns.map((column, index) => {
                  const value = row.cells[index] ?? "";
                  if (index === 0) {
                    return (
                      <th
                        key={column}
                        scope="row"
                        className="font-display px-5 py-5 text-left text-body font-normal lg:px-6"
                      >
                        {value}
                      </th>
                    );
                  }
                  return (
                    <td
                      key={column}
                      className={cn(
                        "tabular px-5 py-5 text-right text-small lg:px-6",
                        tone === "light" ? "text-on-light-muted" : "text-on-dark-muted",
                      )}
                    >
                      {value || "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.footnote ? (
        <p
          className={cn(
            "mt-4 text-micro",
            tone === "light" ? "text-on-light-faint" : "text-on-dark-faint",
          )}
        >
          {table.footnote}
        </p>
      ) : null}
    </div>
  );
}
