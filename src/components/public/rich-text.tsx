import { sanitizeRichText } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

/**
 * Renders editor-authored HTML. The markup is sanitised server-side against a
 * tag/attribute allowlist before it reaches the DOM — see lib/sanitize.ts.
 */
export function RichText({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  const clean = sanitizeRichText(html);
  if (!clean) return null;

  return (
    <div
      className={cn("prose-editorial", className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
