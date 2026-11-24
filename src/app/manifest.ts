import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site";
import { settingText } from "@/lib/settings";

/**
 * The web app manifest, so an installed shortcut carries RPM's name and mark
 * rather than the bare URL.
 *
 * Name and description come from Settings, like everything else on the site,
 * so renaming the business does not leave a stale label on someone's home
 * screen after they reinstall.
 */
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const name = settingText(settings, "brand.name") || "Rayan Premium Mobility";
  const short = settingText(settings, "brand.shortName") || "RPM";

  return {
    name,
    short_name: short,
    description:
      settingText(settings, "seo.defaultDescription") ||
      "Chauffeur-driven Force Urbania DX rental in Chennai.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#116b33",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
