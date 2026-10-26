import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./globals.css";

/**
 * Typographic system: a high-contrast editorial serif for display sizes paired
 * with a neutral grotesque for interface and body copy. Both are variable
 * fonts loaded with `display: swap` and preloaded by next/font, so there is no
 * blocking request and no layout shift from a late webfont.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  // Variable font: the full weight range plus the optical-size and soft axes
  // Fraunces uses to stay elegant at display sizes and legible at body sizes.
  axes: ["SOFT", "opsz"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rayan Premium Mobility",
  description:
    "Chauffeur-driven premium vans and coaches for weddings, corporate travel, pilgrimages, airport transfers and outstation journeys.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#061409",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${fraunces.variable} ${instrumentSans.variable}`}
      // RevealInit adds `reveal-ready` here before hydration, so the server
      // and client class lists differ by design.
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
