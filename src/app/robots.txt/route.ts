import { getSettings, settingBool, settingText } from "@/lib/settings";
import { siteUrlFrom } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

/**
 * robots.txt as a route handler rather than a `robots.ts` metadata file.
 *
 * The metadata API builds the file from a fixed object, which gives no way to
 * append the free-text rules the client can enter under Settings → SEO. Hand
 * assembling the text keeps that setting genuinely functional.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const settings = await getSettings();
  const siteUrl = siteUrlFrom(settings);

  const lines: string[] = [];

  if (settingBool(settings, "seo.robotsPolicy")) {
    // Staging guard: block everything and advertise no sitemap.
    lines.push("# Indexing is disabled in Settings → SEO.", "User-agent: *", "Disallow: /");
  } else {
    lines.push(
      "User-agent: *",
      "Allow: /",
      "",
      "# Private areas",
      "Disallow: /admin",
      "Disallow: /api/",
      "",
      "# Filter and pagination permutations waste crawl budget",
      "Disallow: /*?category=",
      "Disallow: /*?q=",
      "Disallow: /*?page=",
      "",
      `Sitemap: ${absoluteUrl(siteUrl, "/sitemap.xml")}`,
    );
  }

  const extra = settingText(settings, "seo.robotsExtra");
  if (extra) lines.push("", "# Custom rules", extra);

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
