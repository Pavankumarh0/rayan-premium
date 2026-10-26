import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { FloatingWhatsApp } from "@/components/public/contact-buttons";
import { JsonLd } from "@/components/ui/json-ld";
import { getSiteSettings } from "@/lib/site";
import { organizationJsonLd, localBusinessJsonLd, websiteJsonLd } from "@/lib/seo";
import { settingOrNull } from "@/lib/settings";
import { Analytics } from "@/components/public/analytics";
import { RevealInit } from "@/components/public/reveal";
import { RevealObserver } from "@/components/public/reveal-observer";

/**
 * Public site shell. Every route under (public) renders at request time so a
 * CMS publish is live immediately — see the note in next.config.ts.
 */
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  const graph = [
    organizationJsonLd(settings),
    websiteJsonLd(settings),
    localBusinessJsonLd(settings),
  ].filter((item): item is Record<string, unknown> => item !== null);

  return (
    <>
      <RevealInit />

      <a href="#main" className="sr-only-focusable">
        Skip to main content
      </a>

      <JsonLd data={graph} />
      <Analytics
        gaId={settingOrNull(settings, "seo.gaMeasurementId")}
        gtmId={settingOrNull(settings, "seo.gtmId")}
      />

      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
      <RevealObserver />
    </>
  );
}
