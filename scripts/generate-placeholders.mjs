/**
 * Generates the on-brand placeholder artwork in public/placeholders/.
 *
 * Why generated SVG rather than stock photography:
 *   - no licensing question, and nothing to attribute;
 *   - no external host in the critical path of a production page;
 *   - every slot is visibly a placeholder, so the client can see at a glance
 *     which photographs they still owe, instead of shipping a stock image that
 *     quietly misrepresents their actual fleet.
 *
 * Replace these files (or point the CMS image fields at uploaded photography)
 * before launch — see docs/CONTENT.md.
 *
 * Run: node scripts/generate-placeholders.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "placeholders");

const PALETTE = {
  dark: { base: "#0f1216", mid: "#1b2027", edge: "#070809", line: "#2e333b", text: "#6f757e" },
  warm: { base: "#161310", mid: "#241e16", edge: "#0b0908", line: "#39302350", text: "#7a6b52" },
  light: { base: "#efe9dd", mid: "#f8f5ee", edge: "#e2dacb", line: "#d8cfbd", text: "#8b8273" },
};

const GOLD = "#c0a164";

/** Deterministic PRNG so regenerating produces identical files. */
function rng(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * A horizon composition: graded sky, a light band on the horizon line, and
 * layered ridges. Reads as landscape/road photography at thumbnail size
 * without pretending to be a specific place.
 */
function horizonLayers(random, w, h, accent) {
  const horizon = h * (0.52 + random() * 0.14);
  const layers = [];

  for (let i = 0; i < 3; i += 1) {
    const baseY = horizon + i * h * 0.07;
    const points = [`0,${h}`, `0,${baseY.toFixed(1)}`];
    const steps = 6 + Math.floor(random() * 4);
    for (let s = 1; s <= steps; s += 1) {
      const x = (w / steps) * s;
      const y = baseY + (random() - 0.5) * h * (0.11 - i * 0.025);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    points.push(`${w},${h}`);
    layers.push(
      `<polygon points="${points.join(" ")}" fill="${accent}" opacity="${(0.16 + i * 0.13).toFixed(2)}"/>`,
    );
  }

  return { horizon, markup: layers.join("") };
}

/**
 * No text is drawn into the artwork.
 *
 * An earlier version stamped "PLACEHOLDER" into the SVG, but these files are
 * rendered with `object-fit: cover` at wildly different aspect ratios, so the
 * label scaled with the viewBox and ended up either gigantic and cropped or
 * invisible. Which slots still need photography is recorded in docs/CONTENT.md
 * and surfaced in the admin instead, where it can be sized properly.
 */
function buildSvg({ width, height, label, seed, tone = "dark", motif = "horizon" }) {
  const random = rng(hashString(seed));
  const colors = PALETTE[tone];
  const id = seed.replace(/[^a-z0-9]/gi, "");

  const { horizon, markup: ridges } =
    motif === "horizon"
      ? horizonLayers(random, width, height, colors.edge)
      : { horizon: height * 0.6, markup: "" };

  let motifMarkup = ridges;

  // Interior: concentric arcs reading as a cabin curve, kept abstract.
  if (motif === "interior") {
    const cx = width * (0.28 + random() * 0.44);
    const cy = height * (1.02 + random() * 0.1);
    motifMarkup = Array.from({ length: 7 }, (_, i) => {
      const r = height * (0.2 + i * 0.15);
      return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="none" stroke="${colors.line}" stroke-width="${(height * 0.0016).toFixed(1)}" opacity="${(0.55 - i * 0.06).toFixed(2)}"/>`;
    }).join("");
  }

  // Grid: a soft architectural lattice, fading downward.
  if (motif === "grid") {
    const cols = 8;
    const rows = 6;
    const lines = [];
    for (let c = 1; c < cols; c += 1) {
      const x = (width / cols) * c;
      lines.push(
        `<line x1="${x.toFixed(0)}" y1="0" x2="${x.toFixed(0)}" y2="${height}" stroke="${colors.line}" stroke-width="${(height * 0.0014).toFixed(1)}" opacity="0.4"/>`,
      );
    }
    for (let r = 1; r < rows; r += 1) {
      const y = (height / rows) * r;
      lines.push(
        `<line x1="0" y1="${y.toFixed(0)}" x2="${width}" y2="${y.toFixed(0)}" stroke="${colors.line}" stroke-width="${(height * 0.0014).toFixed(1)}" opacity="${(0.45 - r * 0.05).toFixed(2)}"/>`,
      );
    }
    motifMarkup = lines.join("");
  }

  // A wide, very soft gold wash along the horizon, rather than a hard rule —
  // the hard rule read as a rendering artifact when it crossed overlaid text.
  const glowCx = (0.18 + random() * 0.64).toFixed(3);
  const glowCy = (motif === "horizon" ? horizon / height : 0.28 + random() * 0.3).toFixed(3);
  const sweepAngle = (-18 + random() * 36).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="presentation" aria-hidden="true">
  <title>Placeholder artwork — ${label}</title>
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${colors.mid}"/>
      <stop offset="58%" stop-color="${colors.base}"/>
      <stop offset="100%" stop-color="${colors.edge}"/>
    </linearGradient>

    <radialGradient id="glow${id}" cx="${glowCx}" cy="${glowCy}" r="0.62">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="${tone === "light" ? 0.2 : 0.3}"/>
      <stop offset="45%" stop-color="${GOLD}" stop-opacity="${tone === "light" ? 0.07 : 0.1}"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="sweep${id}" x1="0" y1="0" x2="1" y2="0.35">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="48%" stop-color="#ffffff" stop-opacity="${tone === "light" ? 0.1 : 0.05}"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="vignette${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${colors.edge}" stop-opacity="0.45"/>
      <stop offset="40%" stop-color="${colors.edge}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${colors.edge}" stop-opacity="0.6"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg${id})"/>
  ${motifMarkup}
  <rect width="${width}" height="${height}" fill="url(#glow${id})"/>
  <g transform="rotate(${sweepAngle} ${(width / 2).toFixed(0)} ${(height / 2).toFixed(0)})">
    <rect x="${(-width * 0.2).toFixed(0)}" y="${(height * (0.1 + random() * 0.5)).toFixed(0)}" width="${(width * 1.4).toFixed(0)}" height="${(height * 0.16).toFixed(0)}" fill="url(#sweep${id})"/>
  </g>
  <rect width="${width}" height="${height}" fill="url(#vignette${id})"/>
</svg>`;
}

/** Every image slot the seed data fills. */
const ASSETS = [
  { name: "hero-home", width: 2400, height: 1350, label: "Homepage hero", tone: "dark", motif: "horizon" },
  { name: "hero-fleet", width: 2400, height: 1100, label: "Fleet hero", tone: "dark", motif: "interior" },
  { name: "hero-services", width: 2400, height: 1100, label: "Services hero", tone: "warm", motif: "horizon" },
  { name: "hero-outstation", width: 2400, height: 1100, label: "Outstation hero", tone: "dark", motif: "horizon" },
  { name: "hero-packages", width: 2400, height: 1100, label: "Packages hero", tone: "warm", motif: "horizon" },
  { name: "hero-about", width: 2400, height: 1100, label: "About hero", tone: "dark", motif: "interior" },
  { name: "hero-gallery", width: 2400, height: 1100, label: "Gallery hero", tone: "dark", motif: "grid" },
  { name: "hero-guides", width: 2400, height: 1100, label: "Travel guides hero", tone: "warm", motif: "horizon" },
  { name: "hero-contact", width: 2400, height: 1100, label: "Contact hero", tone: "dark", motif: "grid" },
  { name: "hero-tariffs", width: 2400, height: 1100, label: "Tariffs hero", tone: "dark", motif: "grid" },

  { name: "band-road", width: 2400, height: 1000, label: "Full-width road band", tone: "dark", motif: "horizon" },
  { name: "band-cta", width: 2400, height: 1000, label: "Closing CTA band", tone: "warm", motif: "horizon" },
  { name: "editorial-fleet", width: 1200, height: 1500, label: "Brand story portrait", tone: "dark", motif: "interior" },
  { name: "editorial-care", width: 1200, height: 1500, label: "Chauffeur standards", tone: "warm", motif: "interior" },

  { name: "vehicle-1", width: 1440, height: 1080, label: "Vehicle exterior", tone: "dark", motif: "horizon" },
  { name: "vehicle-2", width: 1440, height: 1080, label: "Vehicle exterior", tone: "warm", motif: "horizon" },
  { name: "vehicle-3", width: 1440, height: 1080, label: "Vehicle exterior", tone: "dark", motif: "interior" },
  { name: "vehicle-4", width: 1440, height: 1080, label: "Vehicle exterior", tone: "warm", motif: "interior" },
  { name: "vehicle-5", width: 1440, height: 1080, label: "Vehicle exterior", tone: "dark", motif: "grid" },

  { name: "interior-1", width: 1440, height: 1080, label: "Cabin interior", tone: "warm", motif: "interior" },
  { name: "interior-2", width: 1440, height: 1080, label: "Cabin interior", tone: "dark", motif: "interior" },
  { name: "interior-3", width: 1440, height: 1080, label: "Seating detail", tone: "warm", motif: "grid" },
  { name: "amenity-1", width: 1440, height: 1080, label: "On-board amenity", tone: "dark", motif: "grid" },
  { name: "amenity-2", width: 1440, height: 1080, label: "On-board amenity", tone: "warm", motif: "grid" },

  { name: "destination-1", width: 1440, height: 1080, label: "Destination", tone: "dark", motif: "horizon" },
  { name: "destination-2", width: 1440, height: 1080, label: "Destination", tone: "warm", motif: "horizon" },
  { name: "destination-3", width: 1440, height: 1080, label: "Destination", tone: "dark", motif: "horizon" },
  { name: "destination-4", width: 1440, height: 1080, label: "Destination", tone: "warm", motif: "horizon" },
  { name: "destination-5", width: 1440, height: 1080, label: "Destination", tone: "dark", motif: "horizon" },
  { name: "destination-6", width: 1440, height: 1080, label: "Destination", tone: "warm", motif: "horizon" },

  { name: "service-1", width: 1440, height: 960, label: "Service feature", tone: "warm", motif: "horizon" },
  { name: "service-2", width: 1440, height: 960, label: "Service feature", tone: "dark", motif: "interior" },
  { name: "service-3", width: 1440, height: 960, label: "Service feature", tone: "warm", motif: "grid" },

  { name: "package-1", width: 1440, height: 1080, label: "Tour package", tone: "dark", motif: "horizon" },
  { name: "package-2", width: 1440, height: 1080, label: "Tour package", tone: "warm", motif: "horizon" },
  { name: "package-3", width: 1440, height: 1080, label: "Tour package", tone: "dark", motif: "horizon" },

  { name: "article-1", width: 1600, height: 1000, label: "Guide illustration", tone: "warm", motif: "horizon" },
  { name: "article-2", width: 1600, height: 1000, label: "Guide illustration", tone: "dark", motif: "grid" },
  { name: "article-3", width: 1600, height: 1000, label: "Guide illustration", tone: "warm", motif: "interior" },
  { name: "article-4", width: 1600, height: 1000, label: "Guide illustration", tone: "dark", motif: "horizon" },

  { name: "gallery-1", width: 1400, height: 1050, label: "Gallery image", tone: "dark", motif: "horizon" },
  { name: "gallery-2", width: 1400, height: 1050, label: "Gallery image", tone: "warm", motif: "interior" },
  { name: "gallery-3", width: 1400, height: 1050, label: "Gallery image", tone: "dark", motif: "grid" },
  { name: "gallery-4", width: 1400, height: 1050, label: "Gallery image", tone: "warm", motif: "horizon" },
  { name: "gallery-5", width: 1400, height: 1050, label: "Gallery image", tone: "dark", motif: "interior" },
  { name: "gallery-6", width: 1400, height: 1050, label: "Gallery image", tone: "warm", motif: "grid" },
  { name: "gallery-7", width: 1400, height: 1050, label: "Gallery image", tone: "dark", motif: "horizon" },
  { name: "gallery-8", width: 1400, height: 1050, label: "Gallery image", tone: "warm", motif: "interior" },

  { name: "og-default", width: 1200, height: 630, label: "Default share image", tone: "dark", motif: "horizon" },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  await Promise.all(
    ASSETS.map(async (asset) => {
      const svg = buildSvg({ ...asset, seed: asset.name });
      await writeFile(join(OUT_DIR, `${asset.name}.svg`), svg, "utf8");
    }),
  );

  console.log(`Wrote ${ASSETS.length} placeholder files to public/placeholders/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
