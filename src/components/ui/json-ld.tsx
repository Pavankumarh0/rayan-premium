/**
 * Emits JSON-LD. The payload is built server-side from database values only
 * (never from user input), and `<` is escaped so a stray value cannot close
 * the script element early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> | null }) {
  if (!data) return null;
  const items = Array.isArray(data) ? data.filter(Boolean) : [data];
  if (items.length === 0) return null;

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
