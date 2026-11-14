/**
 * Seed data for Rayan Premium Mobility.
 *
 * ---------------------------------------------------------------------------
 * SOURCE OF TRUTH
 * ---------------------------------------------------------------------------
 * The marketing copy below is transcribed from the client's content document:
 * https://docs.google.com/document/d/1KT4YlHqrQXwhZUoYmgo23vxfX-zgcec7e0SxV20bBYM
 *
 * Two edits were made to the supplied wording: an obvious typo in one heading
 * ("Premium Group Travel in across India" -> "across India"), and headings
 * normalised to sentence case to match the site's typography.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE DOCUMENT DOES NOT COVER
 * ---------------------------------------------------------------------------
 * These are therefore NOT published, rather than being invented:
 *
 *  - Vehicle specifications. The document names the Force Urbania DX but gives
 *    no seating count, luggage capacity or feature list, so none is stated.
 *  - Prices. The document says charges depend on distance, duration and
 *    itinerary and asks customers to request a quotation, so price display is
 *    switched off site-wide and no tariff table is published.
 *  - Outstation destinations, tour packages and travel guides. The earlier
 *    placeholder records for these are retired below.
 *  - Phone, WhatsApp, email and postal address. These settings stay empty and
 *    the UI hides the related buttons until the client supplies them.
 *  - Testimonials. One unverified draft remains so the editor can be seen; the
 *    public section stays hidden until a real one is verified and published.
 *
 * See docs/CONTENT.md for the outstanding handover checklist.
 *
 * Re-running is safe: every record is upserted on its natural key.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { createPrismaAdapter, databaseUrl } from "../src/lib/prisma-adapter.js";
import { SERVICE_CONTENT } from "./services-content.js";

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(databaseUrl()),
});

const J = JSON.stringify;
const now = new Date();

/**
 * Placeholder records from the first build that the client's document does not
 * cover. They are unpublished rather than deleted, so nothing is lost if the
 * client later supplies real content for them.
 */
const RETIRED = {
  vehicles: [
    "signature-9-seater",
    "executive-13-seater",
    "grand-tourer-17-seater",
    "lounge-recliner-11-seater",
    "grand-coach-35-seater",
  ],
  services: ["events-and-parties", "educational-trips", "city-sightseeing"],
  destinations: [
    "mahabalipuram",
    "pondicherry",
    "tirupati",
    "vellore",
    "kanchipuram",
    "tiruvannamalai",
    "yercaud",
    "bengaluru",
  ],
  packages: ["coastal-weekend", "temple-circuit", "hill-retreat", "wedding-weekend"],
  articles: [
    "how-to-choose-a-group-travel-vehicle",
    "what-outstation-pricing-actually-includes",
    "planning-a-wedding-transport-schedule",
    "travelling-with-older-passengers",
  ],
  tariffGroups: ["local-packages", "outstation-rates", "airport-transfers"],
  pages: ["packages", "guides", "tariffs"],
};

async function main() {
  console.log("Seeding Rayan Premium Mobility from the client content document…\n");

  await seedAdminUser();
  await seedSettings();
  await retirePlaceholders();
  await seedFleet();
  const serviceIds = await seedServices();
  await seedFaqs();
  await seedServiceFaqs(serviceIds);
  await seedGallery();
  await seedTestimonials();
  await seedNavigation();
  await seedPages();

  console.log("\nSeed complete.");
  console.log(`  Admin: ${process.env.SEED_ADMIN_EMAIL ?? "admin@example.com"}`);
  console.log("\nStill required before launch — see docs/CONTENT.md:");
  console.log("  · SMTP details, so enquiry alerts actually send");
  console.log("  · Luggage capacity (absent from both brochures)");
  console.log("  · Outstation destinations and routes (the page is empty)");
  console.log("  · More of RPM's own photography (some stock detail shots remain)");
  console.log("  · Legal page wording");
  console.log("  · Turn off Settings -> SEO -> Search engine indexing at launch");
}

// ---------------------------------------------------------------------------

async function seedAdminUser() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe12345";
  const name = process.env.SEED_ADMIN_NAME ?? "Site Administrator";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role: "ADMIN", isActive: true },
    // An existing password is never overwritten by a re-seed.
    update: { name, role: "ADMIN", isActive: true },
  });

  console.log("· admin user");
}

/** Settings this document authoritatively owns, overwritten on every re-seed. */
const AUTHORITATIVE_SETTINGS = new Set([
  "brand.name",
  "brand.shortName",
  "brand.logoImage",
  "brand.logoImageLight",
  "brand.footerBlurb",
  "contact.phone",
  "contact.phoneSecondary",
  "contact.email",
  "contact.whatsapp",
  // From the client's Google Business Profile, so the seed stays the record
  // of what that profile said rather than drifting from it.
  "contact.addressLine1",
  "contact.addressLine2",
  "contact.postalCode",
  "contact.hours",
  "contact.mapEmbedUrl",
  "contact.mapLinkUrl",
  "display.showPrices",
  "display.showTariffPage",
  "display.priceDisclaimer",
  "seo.defaultDescription",
  "contact.city",
  "contact.state",
]);

async function seedSettings() {
  const values: Array<[string, string, string]> = [
    ["brand.name", "Rayan Premium Mobility", "brand"],
    ["brand.shortName", "RPM", "brand"],
    ["brand.logoImage", "/brand/rpm-logo-header.png", "brand"],
    ["brand.logoImageLight", "/brand/rpm-logo-light.png", "brand"],
    [
      "brand.footerBlurb",
      "Premium, chauffeur-driven Force Urbania DX rental in Chennai for weddings, corporate travel, airport transfers, family holidays, pilgrimage tours, and film and media requirements.",
      "brand",
    ],
    [
      "contact.whatsappMessage",
      "Hello, I would like to enquire about an Urbania DX rental.",
      "contact",
    ],
    // Supplied by the client.
    ["contact.phone", "+91 76038 39337", "contact"],
    ["contact.phoneSecondary", "+91 96772 70019", "contact"],
    // gmail, not fmail — the client first gave the latter, which is a real
    // mail domain, so a wrong address here would have delivered enquiries
    // to a stranger rather than bouncing visibly.
    ["contact.email", "rayanpmobility@gmail.com", "contact"],
    // RPM's brochure lists both numbers as "Phone / WhatsApp"; the primary
    // one drives the WhatsApp buttons, which stay hidden while this is blank.
    ["contact.whatsapp", "+91 76038 39337", "contact"],
    /**
     * Address, hours and map taken from the client's own Google Business
     * Profile (maps kgmid /g/11zybfkl31), read on 14 November 2026.
     *
     * The embed uses the keyless `output=embed` form so the map works
     * without a Google Maps API key; the link points at the profile itself,
     * where the reviews live.
     */
    ["contact.addressLine1", "Akra Chandini, Plot 4 & 5, 5th Cross Street", "contact"],
    ["contact.addressLine2", "Ambal Nagar, Pallikaranai", "contact"],
    ["contact.city", "Chennai", "contact"],
    ["contact.state", "Tamil Nadu", "contact"],
    ["contact.postalCode", "600100", "contact"],
    ["contact.country", "India", "contact"],
    ["contact.hours", "Open 24 hours", "contact"],
    [
      "contact.mapEmbedUrl",
      "https://maps.google.com/maps?q=Rayan+Premium+Mobility+-+Urbania+Dx,+Pallikaranai,+Chennai&z=15&output=embed",
      "contact",
    ],
    [
      "contact.mapLinkUrl",
      "https://www.google.com/maps/place/Rayan+Premium+Mobility+-+Urbania+Dx/@12.9365712,80.1953468,17z/data=!4m6!3m5!1s0x3a525d4f1372e6db:0x6eb21ba25a86f5!8m2!3d12.9365712!4d80.1953468!16s%2Fg%2F11zybfkl31",
      "contact",
    ],
    ["seo.siteUrl", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000", "seo"],
    ["seo.defaultTitle", "Rayan Premium Mobility", "seo"],
    ["seo.titleTemplate", "%s · Rayan Premium Mobility", "seo"],
    [
      "seo.defaultDescription",
      "Premium chauffeur-driven Force Urbania DX rental in Chennai for weddings, corporate travel, airport transfers, family holidays, pilgrimage tours and film production. Request a quotation.",
      "seo",
    ],
    ["seo.defaultOgImage", "/placeholders/og-default.svg", "seo"],
    // Staging guard: the site stays unindexed until someone turns this off.
    ["seo.robotsPolicy", "true", "seo"],
    ["seo.enableLocalBusiness", "false", "seo"],
    // The document publishes no rates, so no price is shown anywhere.
    ["display.showPrices", "false", "display"],
    ["display.showTariffPage", "false", "display"],
    [
      "display.priceDisclaimer",
      "Rental charges depend on the travel distance, duration, destination, itinerary and other applicable costs. Request a quotation before confirming your booking so you understand the charges involved.",
      "display",
    ],
    ["email.fromName", "Rayan Premium Mobility", "email"],
    ["email.smtpPort", "587", "email"],
  ];

  for (const [key, value, group] of values) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value, group },
      update: AUTHORITATIVE_SETTINGS.has(key) ? { value, group } : {},
    });
  }

  console.log("· settings (prices off — the document publishes no rates)");
}

/** Unpublishes the first-build placeholder records the document does not cover. */
async function retirePlaceholders() {
  const draft = { status: "DRAFT", publishedAt: null, isFeatured: false } as const;

  const [v, s, d, p, a, t, pg] = await Promise.all([
    prisma.vehicle.updateMany({ where: { slug: { in: RETIRED.vehicles } }, data: draft }),
    prisma.service.updateMany({ where: { slug: { in: RETIRED.services } }, data: draft }),
    prisma.destination.updateMany({ where: { slug: { in: RETIRED.destinations } }, data: draft }),
    prisma.package.updateMany({ where: { slug: { in: RETIRED.packages } }, data: draft }),
    prisma.article.updateMany({ where: { slug: { in: RETIRED.articles } }, data: draft }),
    prisma.tariffGroup.updateMany({
      where: { slug: { in: RETIRED.tariffGroups } },
      data: { status: "DRAFT" },
    }),
    prisma.page.updateMany({
      where: { slug: { in: RETIRED.pages } },
      data: { status: "DRAFT", publishedAt: null },
    }),
  ]);

  console.log(
    `· retired placeholders (${v.count} vehicles, ${s.count} services, ${d.count} destinations, ` +
      `${p.count} packages, ${a.count} articles, ${t.count} tariff groups, ${pg.count} pages)`,
  );
}

// ---------------------------------------------------------------------------
// Fleet — one vehicle, with no specification invented.
// ---------------------------------------------------------------------------

async function seedFleet() {
  const category = await prisma.vehicleCategory.upsert({
    where: { slug: "urbania" },
    create: {
      slug: "urbania",
      name: "Force Urbania",
      description: "Chauffeur-driven premium vans.",
      sortOrder: 1,
    },
    update: { name: "Force Urbania", description: "Chauffeur-driven premium vans.", sortOrder: 1 },
  });

  /**
   * Everything the two listed configurations have in common. Each variant
   * below spreads this and overrides only what actually differs — the
   * wheelbase, the seat count and the wording that names it.
   */
  const shared = {
    categoryId: category.id,
    luggage: null,
    body: `<p>We specialise in Force Urbania DX rental in Chennai, offering chauffeur-driven travel arrangements for individuals, families, business teams, tourists and event organisers. Our services are designed around your travel plans, group requirements, pickup locations and destinations.</p>
<p>From local journeys within Chennai to outstation trips across India, we help you plan transportation for different occasions with convenience and care. Our focus is on providing a suitable travel arrangement, clear communication, and a comfortable group travel experience from pickup to destination.</p>
<h2>Planning your booking</h2>
<p>Share your travel date, pickup location, destination, group size and trip duration, and our team will help you enquire about vehicle availability and the rental charges that apply to your journey.</p>`,
    /**
     * Everything below is taken from the Force Motors "Urbania DX" brochure
     * (ref. A-0000-332-21-729 / DX / 22072026) supplied by the client.
     *
     * These are manufacturer specifications for the model, not claims about
     * this operator's own vehicles — which is why `seats` above stays 0 and
     * the wheelbase variants are listed as available configurations. Which
     * variants RPM actually runs is still an open question for the client.
     */
    features: J([
      {
        icon: "Armchair",
        label: "45° reclining leatherette seats",
        detail:
          "Premium leatherette seats recline to 45° with adjustable armrests and three-point seat belts, so long journeys stay comfortable.",
      },
      {
        icon: "Snowflake",
        label: "Advanced triple AC system",
        detail:
          "Three air-conditioning units with individual vents and reading lamps for every row, so the back of the cabin cools as well as the front.",
      },
      {
        icon: "Usb",
        label: "USB charging at every row",
        detail:
          "Illuminated A-type and C-type charging ports at each row, so nobody has to pass a phone forward.",
      },
      {
        icon: "PanelTop",
        label: "Stand-up cabin height",
        detail:
          "Best-in-segment standing height and width, so passengers can move along the aisle without stooping.",
      },
      {
        icon: "Sun",
        label: "Sealed panoramic windows",
        detail:
          "Large sealed windows give every row a clear view out and keep road noise and dust from the cabin.",
      },
      {
        icon: "Music",
        label: "DTS audio system",
        detail:
          "Six or eight high-powered speakers with DTS processing, controlled from the dashboard.",
      },
      {
        icon: "Tv",
        label: "23 cm HD touchscreen",
        detail:
          "Nine-inch HD touchscreen with built-in WiFi, online and offline navigation, and a reverse camera with guidance lines.",
      },
      {
        icon: "Gauge",
        label: "Digital instrument cluster",
        detail:
          "TFT cluster showing tyre-pressure monitoring, door-open alerts, engine temperature and gear position at a glance.",
      },
      {
        icon: "ShieldCheck",
        label: "ABS, EBD, ESP and VDC",
        detail:
          "Advanced braking with anti-lock brakes, electronic brakeforce distribution, electronic stability programme and vehicle dynamic control.",
      },
      {
        icon: "Mountain",
        label: "Hill hold assist",
        detail:
          "Holds the vehicle steady when setting off on an incline — useful on ghat roads to hill stations.",
      },
      {
        icon: "Wind",
        label: "Car-like cabin quiet",
        detail:
          "NVH insulation and a monocoque body keep conversation comfortable at highway speeds.",
      },
      {
        icon: "Luggage",
        label: "Automatic retractable step",
        detail:
          "A powered step folds out at the door, making boarding easier for older passengers and anyone carrying bags.",
      },
    ]),
    specs: J([
      { label: "Engine", value: "FM2.6CR ED, 4-cylinder common rail DI TCIC" },
      { label: "Displacement", value: "2,596 cc" },
      { label: "Maximum power", value: "100 kW (134 hp) @ 2,950 rpm" },
      { label: "Maximum torque", value: "350 Nm @ 1,400–2,200 rpm" },
      { label: "Gearbox", value: "5-speed manual synchromesh, cable shift" },
      { label: "Steering", value: "Power steering, tilt and telescopic" },
      { label: "Front suspension", value: "Transverse leaf spring with independent front suspension" },
      { label: "Rear suspension", value: "Leaf spring, anti-roll bar front and rear" },
      { label: "Brakes", value: "Disc front and rear, vacuum assisted" },
      { label: "Tyres", value: "235/65 R16 C radial tubeless" },
      { label: "Fuel tank", value: "70 litres" },
      { label: "Width", value: "2,095 mm" },
      { label: "Height", value: "2,550 mm" },
      { label: "Ground clearance", value: "170 mm" },
      { label: "Airbags", value: "Driver and co-driver" },
    ]),
    seatLayouts: J([
      {
        label: "Short wheelbase — 9 or 10 seats",
        detail:
          "3,350 mm wheelbase, 5,440 mm long, 3,750 kg gross vehicle weight. Seat counts exclude the driver.",
      },
      {
        label: "Medium wheelbase — 9, 12 or 13 seats",
        detail:
          "3,615 mm wheelbase, 6,225 mm long, 4,260 kg gross vehicle weight. Seat counts exclude the driver.",
      },
      {
        label: "Long wheelbase — 12, 13 or 16 seats",
        detail:
          "4,400 mm wheelbase, 7,010 mm long, 4,685 kg gross vehicle weight. Seat counts exclude the driver.",
      },
    ]),
    useCases: J([
      {
        title: "Wedding transportation",
        detail:
          "Coordinated travel between wedding venues, hotels and family gatherings across Chennai.",
      },
      {
        title: "Corporate travel",
        detail:
          "Group transportation for business meetings, corporate events, conferences and visiting teams.",
      },
      {
        title: "Airport transfers",
        detail: "Chennai airport pickups and drop-offs for families, tourists and business groups.",
      },
      {
        title: "Pilgrimage tours",
        detail:
          "Group temple visits and spiritual journeys planned around your destinations and schedule.",
      },
      {
        title: "Family tours",
        detail: "Holidays, sightseeing trips and outstation journeys suited to your family's plans.",
      },
      {
        title: "Film and media travel",
        detail: "Transportation for production crews, cast members and media teams.",
      },
    ]),
    showPrice: false,
    priceLocalLabel: null,
    priceLocal: null,
    priceOutstationPerKm: null,
    extraKmRate: null,
    extraHourRate: null,
    driverAllowance: null,
    priceNote:
      "Rental charges depend on the travel distance, duration, destination and itinerary. Request a quotation before confirming your booking.",
    status: "PUBLISHED",
    publishedAt: now,
    isFeatured: true,
  };

  /**
   * The two configurations listed on the fleet page.
   *
   * Seat counts come from RPM's own brochure ("More Than a Journey"), which
   * states the fleet is available in 12, 14 and 16-seater configurations —
   * not from the Force Motors wheelbase table, which describes what Force
   * builds rather than what this operator runs. An earlier guess of 13 and
   * 16 taken from that table was wrong.
   *
   * Two entries because the client asked for two; all three configurations
   * are listed under each one's seating options, and a 14-seater page can be
   * added from the dashboard whenever they want it.
   *
   * The 12-seater keeps the original `force-urbania-dx` slug so the existing
   * URL does not break; only the second variant needs a new one.
   */
  const variants = [
    {
      ...shared,
      slug: "force-urbania-dx",
      name: "Force Urbania DX 12 Seater",
      tagline: "Chauffeur-driven group travel for up to 12 passengers.",
      seats: 12,
      summary:
        "Our Force Urbania DX in its 12-seater configuration. Suited to family trips, corporate groups and wedding-party transfers around Chennai and on outstation journeys. Also available as a 14 or 16 seater.",
      heroImage: "/gallery/rpm-side-sunset.jpg",
      heroImageAlt:
        "The RPM Force Urbania DX in its grey and yellow livery, photographed side-on at sunset",
      seatLayouts: J([
        {
          label: "12 seater",
          detail: "Twelve passenger seats. Seat counts are as stated in RPM's own brochure.",
        },
        {
          label: "14 seater",
          detail: "Fourteen passenger seats, available on request.",
        },
        {
          label: "16 seater",
          detail: "Sixteen passenger seats, the largest configuration RPM operates.",
        },
      ]),
      sortOrder: 1,
      metaTitle: "Force Urbania DX 12 seater rental in Chennai with chauffeur",
      metaDescription:
        "Chauffeur-driven 12 seater Force Urbania DX rental in Chennai for weddings, corporate travel, airport transfers, family tours and pilgrimages. Request a quotation.",
    },
    {
      ...shared,
      slug: "force-urbania-dx-16-seater",
      name: "Force Urbania DX 16 Seater",
      tagline: "Our largest Urbania DX, for groups of up to 16.",
      seats: 16,
      summary:
        "Our Force Urbania DX in its 16-seater configuration — the largest we operate. For wedding parties, pilgrimage groups and corporate teams travelling together.",
      heroImage: "/gallery/rpm-side-portico.jpg",
      heroImageAlt:
        "The RPM Urbania DX side profile, showing the running-horse graphic and RPM wordmark",
      seatLayouts: J([
        {
          label: "12 seater",
          detail: "Twelve passenger seats. Seat counts are as stated in RPM's own brochure.",
        },
        {
          label: "14 seater",
          detail: "Fourteen passenger seats, available on request.",
        },
        {
          label: "16 seater",
          detail: "Sixteen passenger seats, the largest configuration RPM operates.",
        },
      ]),
      sortOrder: 2,
      metaTitle: "Force Urbania DX 16 seater rental in Chennai with chauffeur",
      metaDescription:
        "Chauffeur-driven 16 seater Force Urbania DX rental in Chennai for large wedding parties, pilgrimage groups, corporate teams and outstation tours. Request a quotation.",
    },
  ];

  for (const payload of variants) {
    const vehicle = await prisma.vehicle.upsert({
      where: { slug: payload.slug },
      create: payload,
      update: payload,
    });
    await attachVehicleImages(vehicle.id, payload.slug);
  }

  console.log("· fleet (2 vehicles — Urbania DX 13 and 16 seater, from the Force Motors brochure)");
}

/**
 * Manufacturer photography, cropped from the Force Motors Urbania DX
 * brochure at the client's instruction — see docs/CONTENT.md.
 *
 * The alt text describes the Urbania DX as a model, never "our vehicle":
 * these are Force's studio images, and RPM's own vans may differ in colour,
 * trim and wheelbase. Replace each one as real photography arrives; the
 * descriptions can stay as they are.
 *
 * Both configurations share the cabin and amenity shots — same model — but
 * each gets only its own floor plan, so a 13-seater page never shows a
 * 16-seat layout.
 */
async function attachVehicleImages(vehicleId: string, slug: string) {
  const layout =
    slug === "force-urbania-dx-16-seater"
      ? {
          url: "/fleet/layout-long.jpg",
          alt: "Floor plan of the long-wheelbase Urbania DX: 4,400 mm wheelbase, seating 12, 13 or 16 excluding the driver",
        }
      : {
          url: "/fleet/layout-medium.jpg",
          alt: "Floor plan of the medium-wheelbase Urbania DX: 3,615 mm wheelbase, seating 9, 12 or 13 excluding the driver",
        };

  await prisma.vehicleImage.deleteMany({ where: { vehicleId } });
  await prisma.vehicleImage.createMany({
    data: [
      {
        vehicleId,
        url: "/fleet/exterior-side.jpg",
        alt: "A Force Urbania DX seen side-on with its passenger door slid open and the boarding step down",
        kind: "EXTERIOR",
        sortOrder: 0,
      },
      {
        vehicleId,
        url: "/fleet/exterior-front.jpg",
        alt: "Front three-quarter view of a Force Urbania DX, showing the grille, headlamps and alloy wheels",
        kind: "EXTERIOR",
        sortOrder: 1,
      },
      {
        vehicleId,
        url: "/fleet/exterior-dark.jpg",
        alt: "A dark grey Force Urbania DX with passengers boarding through the side door",
        kind: "EXTERIOR",
        sortOrder: 2,
      },
      {
        vehicleId,
        url: "/fleet/rear-luggage.jpg",
        alt: "Rear doors of a Force Urbania DX open, with suitcases being loaded into the luggage area",
        kind: "EXTERIOR",
        sortOrder: 3,
      },
      {
        vehicleId,
        url: "/fleet/cabin-aisle.jpg",
        alt: "The Urbania DX cabin looking down the aisle, with reclining seats either side and wooden-finish flooring",
        kind: "INTERIOR",
        sortOrder: 4,
      },
      {
        vehicleId,
        url: "/fleet/seats-leatherette.jpg",
        alt: "Quilted leatherette passenger seats with three-point seat belts and fold-down armrests",
        kind: "INTERIOR",
        sortOrder: 5,
      },
      {
        vehicleId,
        url: "/fleet/seat-reclining.jpg",
        alt: "A passenger seat reclined to 45 degrees, showing the recline angle and adjustable armrest",
        kind: "INTERIOR",
        sortOrder: 6,
      },
      {
        vehicleId,
        url: "/fleet/cockpit.jpg",
        alt: "The Urbania DX driver cockpit: dashboard, touchscreen, digital cluster and steering wheel",
        kind: "INTERIOR",
        sortOrder: 7,
      },
      {
        vehicleId,
        url: "/fleet/panoramic.jpg",
        alt: "Sealed panoramic side windows running the length of the Urbania DX cabin",
        kind: "INTERIOR",
        sortOrder: 8,
      },
      {
        vehicleId,
        url: "/fleet/infotainment.jpg",
        alt: "The 23 cm HD touchscreen infotainment system set into the Urbania DX dashboard",
        kind: "AMENITY",
        sortOrder: 9,
      },
      {
        vehicleId,
        url: "/fleet/cluster.jpg",
        alt: "The TFT digital instrument cluster, showing speed, gear position and tyre-pressure readouts",
        kind: "AMENITY",
        sortOrder: 10,
      },
      {
        vehicleId,
        url: "/fleet/usb-ports.jpg",
        alt: "A phone charging from the illuminated USB ports fitted beside a passenger seat",
        kind: "AMENITY",
        sortOrder: 11,
      },
      {
        vehicleId,
        url: "/fleet/footstep.jpg",
        alt: "The automatic retractable boarding step extended below the Urbania DX side door",
        kind: "AMENITY",
        sortOrder: 12,
      },
      { vehicleId, url: layout.url, alt: layout.alt, kind: "INTERIOR", sortOrder: 13 },
    ],
  });
}

// ---------------------------------------------------------------------------
// Services — the six named in the document.
// ---------------------------------------------------------------------------

async function seedServices(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};

  for (const [index, service] of SERVICE_CONTENT.entries()) {
    const payload = {
      slug: service.slug,
      name: service.name,
      icon: service.icon,
      tagline: service.tagline,
      summary: service.summary,
      body: service.body,
      heroImage: service.image,
      heroImageAlt: `Placeholder artwork — ${service.name.toLowerCase()} photograph to be supplied`,
      highlights: J(service.highlights),
      checklist: J(service.checklist),
      ctaHeading: service.ctaHeading,
      ctaBody: service.ctaBody,
      status: "PUBLISHED",
      publishedAt: now,
      isFeatured: true,
      sortOrder: index + 1,
      metaTitle: service.metaTitle,
      metaDescription: service.metaDescription,
    };

    const row = await prisma.service.upsert({
      where: { slug: service.slug },
      create: payload,
      update: payload,
    });
    ids[service.slug] = row.id;
  }

  console.log(`· services (${SERVICE_CONTENT.length}, from the services document)`);
  return ids;
}

/**
 * Per-service FAQs. These are scoped to their service and hidden from the FAQ
 * directory, so the directory keeps the short general set from the main
 * content document rather than ballooning to thirty-odd questions.
 */
async function seedServiceFaqs(serviceIds: Record<string, string>) {
  let count = 0;

  for (const service of SERVICE_CONTENT) {
    const serviceId = serviceIds[service.slug];
    if (!serviceId) continue;

    for (const [index, faq] of service.faqs.entries()) {
      const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
      const payload = {
        question: faq.question,
        answer: faq.answer,
        serviceId,
        categoryId: null,
        vehicleId: null,
        destinationId: null,
        packageId: null,
        showInDirectory: false,
        status: "PUBLISHED",
        sortOrder: index + 1,
      };
      if (existing) await prisma.faq.update({ where: { id: existing.id }, data: payload });
      else await prisma.faq.create({ data: payload });
      count += 1;
    }
  }

  console.log(`· service FAQs (${count}, scoped to their service pages)`);
}

// ---------------------------------------------------------------------------
// FAQs — the four in the document.
// ---------------------------------------------------------------------------

async function seedFaqs() {
  // Retire the placeholder FAQ set from the first build.
  await prisma.faq.updateMany({ data: { status: "DRAFT" } });

  const category = await prisma.faqCategory.upsert({
    where: { slug: "booking" },
    create: { slug: "booking", name: "Booking and rentals", sortOrder: 1 },
    update: { name: "Booking and rentals", sortOrder: 1 },
  });

  const faqs = [
    {
      question: "How can I book an Urbania DX rental in Chennai?",
      answer:
        "<p>You can contact Rayan Premium Mobility with your travel date, pickup location, destination, group size and trip duration. Our team can help you enquire about vehicle availability and rental charges.</p>",
    },
    {
      question: "Can I hire a chauffeur-driven Urbania for outstation trips?",
      answer:
        "<p>Yes, you can enquire about chauffeur-driven Urbania rentals for outstation journeys from Chennai to destinations across Tamil Nadu and other parts of India, subject to availability and route requirements.</p>",
    },
    {
      question: "Do you provide vehicle rentals for weddings and corporate events?",
      answer:
        "<p>Yes, you can enquire about group transportation for wedding guests, family functions, corporate meetings, conferences and company events. Share your schedule and transportation requirements to plan your booking.</p>",
    },
    {
      question: "How are Urbania rental charges calculated?",
      answer:
        "<p>Rental charges may depend on the travel distance, duration, destination, itinerary and other applicable costs. Request a quotation before confirming your booking so you understand the charges involved.</p>",
    },
  ];

  for (const [index, faq] of faqs.entries()) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    const payload = {
      question: faq.question,
      answer: faq.answer,
      categoryId: category.id,
      showInDirectory: true,
      status: "PUBLISHED",
      sortOrder: index + 1,
      vehicleId: null,
      serviceId: null,
      destinationId: null,
      packageId: null,
    };
    if (existing) await prisma.faq.update({ where: { id: existing.id }, data: payload });
    else await prisma.faq.create({ data: payload });
  }

  console.log(`· FAQs (${faqs.length}, from the document)`);
}

// ---------------------------------------------------------------------------

async function seedGallery() {
  const categories = [
    { slug: "exteriors", name: "Exteriors", sortOrder: 1 },
    { slug: "interiors", name: "Interiors", sortOrder: 2 },
    { slug: "amenities", name: "Amenities", sortOrder: 3 },
  ];

  const ids: Record<string, string> = {};
  for (const c of categories) {
    const row = await prisma.galleryCategory.upsert({ where: { slug: c.slug }, create: c, update: c });
    ids[c.slug] = row.id;
  }

  // Drop first-build items that are no longer referenced.
  await prisma.galleryItem.updateMany({ data: { status: "DRAFT" } });

  const items = [
    /**
     * RPM's own vehicle, supplied by the client. These lead the gallery:
     * they show the actual van a customer will travel in — RPM livery,
     * curtains, branded headrests, registration TN14AW3567 — which no
     * manufacturer stock photograph can do.
     */
    { url: "/gallery/rpm-side-sunset.jpg", alt: "The RPM Force Urbania DX in its grey and yellow livery, photographed side-on at sunset", category: "exteriors", title: "Our Urbania DX" },
    { url: "/gallery/rpm-side-portico.jpg", alt: "The RPM Urbania DX side profile, showing the running-horse graphic and RPM wordmark", category: "exteriors", title: "Side profile" },
    { url: "/gallery/rpm-rear.jpg", alt: "The rear of the RPM Urbania DX with the Rayan Premium Mobility contact details on the door", category: "exteriors", title: "Rear view" },
    { url: "/gallery/rpm-cabin-aisle.jpg", alt: "Inside the RPM Urbania DX, looking down the aisle past quilted seats with RPM headrest covers", category: "interiors", title: "Our cabin" },
    { url: "/gallery/rpm-seat-detail.jpg", alt: "A single RPM Urbania DX passenger seat with quilted upholstery, armrest and curtained window", category: "interiors", title: "Seat detail" },
    { url: "/gallery/rpm-cabin-ceiling.jpg", alt: "The RPM Urbania DX cabin ceiling with wooden trim, air-conditioning vents and ambient lighting", category: "interiors", title: "Cabin ceiling and lighting" },

    /**
     * Force Motors brochure photography — see the note on
     * attachVehicleImages. Only the detail shots RPM's own photographs do
     * not cover are kept; the stock exteriors and cabin views have been
     * dropped now that there are real ones above.
     */
    { url: "/fleet/infotainment.jpg", alt: "The 23 cm HD touchscreen infotainment system set into the Urbania DX dashboard", category: "amenities", title: "Touchscreen infotainment" },
    { url: "/fleet/cluster.jpg", alt: "The TFT digital instrument cluster, showing speed, gear position and tyre-pressure readouts", category: "amenities", title: "Instrument cluster" },
    { url: "/fleet/usb-ports.jpg", alt: "A phone charging from the illuminated USB ports fitted beside a passenger seat", category: "amenities", title: "USB charging" },
    { url: "/fleet/footstep.jpg", alt: "The automatic retractable boarding step extended below the Urbania DX side door", category: "amenities", title: "Retractable step" },
    { url: "/fleet/rear-luggage.jpg", alt: "Rear doors of a Force Urbania DX open, with suitcases being loaded into the luggage area", category: "amenities", title: "Luggage space" },
  ];

  for (const [index, item] of items.entries()) {
    const existing = await prisma.galleryItem.findFirst({ where: { url: item.url } });
    const payload = {
      url: item.url,
      alt: item.alt,
      title: item.title,
      kind: "IMAGE",
      width: 1400,
      height: 1050,
      categoryId: ids[item.category],
      status: "PUBLISHED",
      sortOrder: index + 1,
    };
    if (existing) await prisma.galleryItem.update({ where: { id: existing.id }, data: payload });
    else await prisma.galleryItem.create({ data: payload });
  }

  console.log(`· gallery (${items.length} images — RPM's own first, then stock detail shots)`);
}

/**
 * The business's Google reviews, transcribed verbatim from its public
 * Business Profile (maps kgmid /g/11zybfkl31) on 14 November 2026.
 *
 * These are the first real testimonials on the site. They are marked
 * verified because each one is a named, publicly checkable review on the
 * client's own profile — not because anyone retyped them here. The quotes
 * are unedited: trimming a customer's words to read better would make them
 * something the customer did not write.
 *
 * `authorRole` is the trip each reviewer describes, taken from their own
 * text. `source` records where it came from so a future editor can check it.
 *
 * All four were 5 stars; the profile showed 5.0 from 4 reviews with nothing
 * at any other rating.
 */
const GOOGLE_REVIEWS = [
  {
    authorName: "Manikandan Arumugam",
    authorRole: "Family trip to Thiruchendur",
    quote:
      "We were the first customers of Rayan Premium Mobility and booked their Urbania DX for our family trip to Thiruchendur. Honestly, we had a really good experience! The vehicle was comfortable, and both pickup and drop-off were on time. The driver was professional, attentive, and drove safely throughout the journey, which gave us peace of mind while travelling with family. Really happy with their service and glad we chose them for our trip. Wishing them all the best for their new venture! Highly recommended for family trips. Would definitely book with them again!",
  },
  {
    authorName: "Harsha Vardhan",
    authorRole: "Madurai – Tiruchendur – Kanyakumari tour",
    quote:
      "Had a wonderful travel experience with Rayan Premium Mobility (RPM) during our Madurai–Tiruchendur–Kanyakumari trip from 28th to 31st October. The Force Urbania was spacious, clean and extremely comfortable, making our long journey a pleasant experience. Special appreciation to the chauffeur for his professional behaviour, safe driving, punctuality and courteous service. Excellent vehicle, reliable service and great customer care throughout the trip. Highly recommended for family tours, pilgrimages and long-distance group travel!",
  },
  {
    authorName: "Sridevi Raju",
    authorRole: "Three-day group trip",
    quote:
      "Had a really good experience with the Urbania van for our 3-day trip. The van was neat, spacious and comfortable, even for the long journey. The driver was friendly and cooperative, and the overall travel was smooth. Everyone enjoyed the trip. Definitely a good choice for family trips and group travel. Would happily recommend!",
  },
  {
    authorName: "Live Life Love Life",
    authorRole: "Group travel",
    quote:
      "Had a wonderful experience with RPM Travels! The journey was smooth, comfortable, and well organised. Their service, punctuality, and customer care truly made a difference. What makes Rayan Premium Mobility Urbania DX van special is not just the travel service, but the care and commitment they show throughout the journey. A great travel experience from start to finish. Highly recommended!",
  },
];

async function seedTestimonials() {
  // Retire the placeholder that shipped before any real review existed.
  await prisma.testimonial.updateMany({
    where: { authorName: "Example reviewer" },
    data: { status: "DRAFT", isVerified: false },
  });

  for (const [index, review] of GOOGLE_REVIEWS.entries()) {
    const payload = {
      ...review,
      rating: 5,
      source: "Google review — Rayan Premium Mobility Business Profile",
      isVerified: true,
      status: "PUBLISHED",
      sortOrder: index + 1,
    };
    const existing = await prisma.testimonial.findFirst({
      where: { authorName: review.authorName },
    });
    if (existing) await prisma.testimonial.update({ where: { id: existing.id }, data: payload });
    else await prisma.testimonial.create({ data: payload });
  }

  console.log(`· testimonials (${GOOGLE_REVIEWS.length} verified Google reviews)`);
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

async function seedNavigation() {
  await prisma.navItem.deleteMany({});

  const header: Array<{
    label: string;
    url: string;
    children?: Array<{ label: string; url: string; description?: string }>;
  }> = [
    // The logo already links home, but not everyone reads a logo as a link —
    // the client asked for an explicit Home item, and the footer menu has had
    // one all along.
    { label: "Home", url: "/" },
    { label: "Fleet", url: "/fleet" },
    {
      label: "Services",
      url: "/services",
      children: [
        { label: "All services", url: "/services", description: "Every way we travel" },
        { label: "Wedding transportation", url: "/services/wedding-transport", description: "Guests, venues and family gatherings" },
        { label: "Corporate travel", url: "/services/corporate-travel", description: "Meetings, conferences and visiting teams" },
        { label: "Airport transfers", url: "/services/airport-transfers", description: "Chennai pickups and drop-offs" },
        { label: "Pilgrimage tours", url: "/services/pilgrimage-tours", description: "Temple visits and spiritual journeys" },
        { label: "Family tours", url: "/services/family-tours", description: "Holidays and sightseeing trips" },
        { label: "Film and media travel", url: "/services/film-and-media", description: "Crews, cast and media teams" },
      ],
    },
    { label: "Outstation", url: "/outstation" },
    { label: "Gallery", url: "/gallery" },
    { label: "About", url: "/about" },
    { label: "FAQ", url: "/faq" },
  ];

  for (const [index, item] of header.entries()) {
    const parent = await prisma.navItem.create({
      data: { menu: "HEADER", label: item.label, url: item.url, sortOrder: index + 1, isVisible: true },
    });
    for (const [childIndex, child] of (item.children ?? []).entries()) {
      await prisma.navItem.create({
        data: {
          menu: "HEADER",
          label: child.label,
          url: child.url,
          description: child.description ?? null,
          parentId: parent.id,
          sortOrder: childIndex + 1,
          isVisible: true,
        },
      });
    }
  }

  const simple: Array<[string, Array<{ label: string; url: string }>]> = [
    ["FOOTER_MENU", [
      { label: "Home", url: "/" },
      { label: "About us", url: "/about" },
      { label: "Our fleet", url: "/fleet" },
      { label: "Outstation travel", url: "/outstation" },
      { label: "Gallery", url: "/gallery" },
      { label: "FAQ", url: "/faq" },
      { label: "Contact", url: "/contact" },
    ]],
    ["FOOTER_SERVICES", [
      { label: "Wedding transportation", url: "/services/wedding-transport" },
      { label: "Corporate travel", url: "/services/corporate-travel" },
      { label: "Airport transfers", url: "/services/airport-transfers" },
      { label: "Pilgrimage tours", url: "/services/pilgrimage-tours" },
      { label: "Family tours", url: "/services/family-tours" },
      { label: "Film and media travel", url: "/services/film-and-media" },
    ]],
    ["LEGAL", [
      { label: "Privacy policy", url: "/privacy-policy" },
      { label: "Terms and conditions", url: "/terms-and-conditions" },
      { label: "Cancellation policy", url: "/cancellation-policy" },
    ]],
  ];

  for (const [menu, items] of simple) {
    for (const [index, item] of items.entries()) {
      await prisma.navItem.create({
        data: { menu, label: item.label, url: item.url, sortOrder: index + 1, isVisible: true },
      });
    }
  }

  console.log("· navigation (header, 2 footer columns, legal)");
}

// ---------------------------------------------------------------------------
// Pages and sections
// ---------------------------------------------------------------------------

type SectionSeed = { type: string; data: Record<string, unknown>; isVisible?: boolean };

async function upsertPage(
  page: {
    slug: string;
    title: string;
    template?: string;
    isSystem?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    sortOrder?: number;
  },
  sections: SectionSeed[],
) {
  const payload = {
    slug: page.slug,
    title: page.title,
    template: page.template ?? "standard",
    isSystem: page.isSystem ?? false,
    status: "PUBLISHED",
    publishedAt: now,
    metaTitle: page.metaTitle ?? null,
    metaDescription: page.metaDescription ?? null,
    ogImage: page.ogImage ?? null,
    sortOrder: page.sortOrder ?? 0,
  };

  const row = await prisma.page.upsert({
    where: { slug: page.slug },
    create: payload,
    update: payload,
  });

  await prisma.section.deleteMany({ where: { pageId: row.id } });
  if (sections.length > 0) {
    await prisma.section.createMany({
      data: sections.map((section, index) => ({
        pageId: row.id,
        type: section.type,
        data: J(section.data),
        sortOrder: index + 1,
        isVisible: section.isVisible ?? true,
      })),
    });
  }
}

async function seedPages() {
  // --- Homepage ------------------------------------------------------------
  await upsertPage(
    {
      slug: "home",
      title: "Home",
      template: "home",
      isSystem: true,
      metaTitle: "Premium Urbania DX rental in Chennai for every journey",
      metaDescription:
        "Chauffeur-driven Force Urbania DX rental in Chennai for weddings, corporate travel, airport transfers, family holidays, pilgrimage tours and film production.",
      ogImage: "/placeholders/og-default.svg",
      sortOrder: 1,
    },
    [
      {
        type: "hero",
        data: {
          eyebrow: "Urbania DX rental in Chennai",
          heading: "Premium Urbania DX rental in Chennai for every journey",
          body: "Travel together in comfort with Rayan Premium Mobility. We provide premium group transportation with professional chauffeurs for weddings, corporate travel, airport transfers, family holidays, pilgrimage tours, and film and media requirements.",
          primaryLabel: "Request a quote",
          primaryUrl: "/contact",
          secondaryLabel: "View the Urbania DX",
          secondaryUrl: "/fleet/force-urbania-dx",
          image: "/fleet/exterior-side.jpg",
          imageAlt: "",
          align: "left",
          stats: [
            { label: "Vehicle", value: "Force Urbania DX" },
            { label: "Chauffeur", value: "Always included" },
            { label: "Based in", value: "Chennai" },
            { label: "Coverage", value: "Across India" },
          ],
        },
      },
      {
        type: "marquee",
        data: {
          tone: "ink",
          speed: 48,
          reverse: false,
          items: [
            { label: "Force Urbania DX" },
            { label: "Chauffeur driven" },
            { label: "Weddings" },
            { label: "Corporate travel" },
            { label: "Airport transfers" },
            { label: "Pilgrimage tours" },
            { label: "Family tours" },
            { label: "Film and media" },
            { label: "Chennai" },
            { label: "Tamil Nadu" },
            { label: "Across India" },
          ],
        },
      },
      {
        type: "imageText",
        data: {
          eyebrow: "Who we are",
          heading: "Your trusted choice for premium group travel across India",
          body: `<p>At Rayan Premium Mobility, we understand that comfortable travel is an important part of every journey. Whether it is a family celebration, a corporate engagement, an airport pickup, or a long-distance holiday, the right vehicle can make group transportation easier to manage.</p>
<p>We specialise in Force Urbania DX rental in Chennai, offering chauffeur-driven travel arrangements for individuals, families, business teams, tourists and event organisers. Our services are designed around your travel plans, group requirements, pickup locations and destinations.</p>
<p>From local journeys within Chennai to outstation trips across India, we help you plan transportation for different occasions with convenience and care.</p>`,
          image: "/fleet/cabin-aisle.jpg",
          imageAlt: "The Urbania DX cabin looking down the aisle, with reclining seats either side",
          mediaSide: "right",
          tone: "ivory",
          ctaLabel: "Read our story",
          ctaUrl: "/about",
          points: [],
        },
      },
      {
        type: "featureGrid",
        data: {
          eyebrow: "Why choose RPM",
          heading: "What makes our Urbania DX rental service different",
          intro:
            "Group travel needs more than a vehicle. From timely pickups to clear rental terms, we help you plan a comfortable and organised travel experience for every occasion.",
          tone: "ink",
          columns: "4",
          items: [
            {
              icon: "Users",
              title: "Chauffeur-driven travel",
              detail:
                "Travel with a chauffeur for your Urbania DX rental in Chennai, whether it is a wedding, corporate event, family tour or outstation journey.",
            },
            {
              icon: "Clock",
              title: "Travel planned around your schedule",
              detail:
                "Plan pickup times and travel arrangements around your itinerary, destination and event schedule for a more organised group journey.",
            },
            {
              icon: "IndianRupee",
              title: "Clear Urbania rental pricing",
              detail:
                "Understand the rental charges and applicable additional costs before confirming your booking, helping you plan your travel budget confidently.",
            },
            {
              icon: "Headphones",
              title: "Personalised booking assistance",
              detail:
                "Get assistance with your rental enquiry, pickup details, destination and travel requirements for local trips and outstation journeys from Chennai.",
            },
          ],
        },
      },
      {
        type: "serviceShowcase",
        data: {
          eyebrow: "Services",
          heading: "Every journey has a plan. We make it easier.",
          intro:
            "From wedding celebrations to business travel and family holidays, discover chauffeur-driven Urbania DX rental services in Chennai designed around your group, destination and occasion.",
          limit: 6,
          ctaLabel: "All services",
          ctaUrl: "/services",
          tone: "ivory",
        },
      },
      {
        type: "fullImage",
        data: {
          image: "/placeholders/band-road.svg",
          imageAlt: "",
          heading: "Travel together. Travel comfortably. Travel with confidence.",
          caption: "Placeholder artwork — replace with the client's own photography.",
          height: "short",
        },
      },
      {
        type: "imageText",
        data: {
          eyebrow: "The vehicle",
          heading: "The Force Urbania DX",
          body: `<p>Whether you are planning a special celebration, arranging transport for business guests, or exploring destinations across India, our Urbania rental service helps make group travel more convenient.</p>
<p>Choose a travel arrangement that suits your group, destination, schedule and occasion.</p>`,
          image: "/fleet/exterior-front.jpg",
          imageAlt: "Front three-quarter view of a Force Urbania DX, showing the grille, headlamps and alloy wheels",
          mediaSide: "left",
          tone: "charcoal",
          ctaLabel: "Vehicle details",
          ctaUrl: "/fleet/force-urbania-dx",
          points: [],
        },
      },
      {
        type: "routeLine",
        data: { tone: "ivory" },
      },
      {
        type: "faq",
        data: {
          eyebrow: "Questions",
          heading: "Frequently asked questions",
          intro: "",
          categorySlug: "booking",
          limit: 4,
          ctaLabel: "All questions",
          ctaUrl: "/faq",
          tone: "ivory",
        },
      },
      {
        // Hidden until a verified testimonial exists.
        type: "testimonials",
        data: {
          eyebrow: "In their words",
          heading: "What our customers say",
          intro: "",
          limit: 6,
          tone: "ivory",
        },
      },
      {
        type: "cta",
        data: {
          eyebrow: "Get started",
          heading: "Your next journey starts here with RPM",
          body: "Planning a wedding, corporate event, airport transfer or family getaway? Enquire about our Premium Urbania DX rental in Chennai. Share your travel dates, group size, pickup location and destination to receive availability details and a rental quotation.",
          primaryLabel: "Request a quote",
          primaryUrl: "/contact",
          // RPM's own brochure, served from public/downloads.
          secondaryLabel: "Download our brochure",
          secondaryUrl: "/downloads/rayan-premium-mobility-brochure.pdf",
          image: "/placeholders/band-cta.svg",
          imageAlt: "",
          showContactButtons: true,
          variant: "band",
        },
      },
    ],
  );

  // --- About ---------------------------------------------------------------
  await upsertPage(
    {
      slug: "about",
      title: "About Rayan Premium Mobility",
      template: "standard",
      isSystem: true,
      metaTitle: "About Rayan Premium Mobility — Urbania DX rental in Chennai",
      metaDescription:
        "Rayan Premium Mobility provides premium, chauffeur-driven Urbania DX rental services from Chennai for families, businesses, tourists and event organisers.",
      sortOrder: 20,
    },
    [
      {
        type: "richText",
        data: {
          eyebrow: "About us",
          heading: "Making every group journey more comfortable",
          body: `<p>Rayan Premium Mobility (RPM) provides premium, chauffeur-driven Urbania DX rental services for individuals, families, businesses, tourists and event organisers. Based in Chennai, we offer group transportation solutions for a wide range of travel needs, from local journeys and special occasions to long-distance trips across Tamil Nadu and other parts of India.</p>
<p>We understand that every journey has a different purpose. Whether it is a wedding celebration, corporate event, airport transfer, family holiday, pilgrimage tour or film production, our goal is to help customers arrange suitable transportation around their travel plans.</p>
<p>With a focus on convenience, thoughtful planning and clear communication, Rayan Premium Mobility aims to make group travel easier to organise. From sharing your itinerary to enquiring about vehicle availability and rental charges, we strive to provide a straightforward booking experience for every customer.</p>
<p>At RPM, we believe that a good journey begins with the right travel arrangements. We are committed to serving customers travelling within Chennai, across Tamil Nadu, and to destinations throughout India.</p>`,
          tone: "ivory",
          width: "prose",
        },
      },
      {
        type: "featureGrid",
        data: {
          eyebrow: "What drives us",
          heading: "Our vision, mission and commitment",
          intro: "",
          tone: "ink",
          columns: "3",
          items: [
            {
              icon: "Compass",
              title: "Our vision",
              detail:
                "To become a trusted name in premium group transportation by making chauffeur-driven travel more accessible, convenient and dependable for customers across Tamil Nadu and India. We aspire to create a travel experience where every journey is planned with care and every customer feels confident about their transportation arrangements.",
            },
            {
              icon: "Navigation",
              title: "Our mission",
              detail:
                "To provide convenient and well-planned Urbania DX rental services for diverse travel needs, including family holidays, corporate journeys, weddings, airport transfers, pilgrimage tours and special events — by understanding each customer's requirements, communicating rental details clearly and coordinating travel arrangements thoughtfully.",
            },
            {
              icon: "ShieldCheck",
              title: "Our commitment",
              detail:
                "To make group travel simpler through personalised assistance, transparent rental information and travel arrangements tailored to each journey. Whether you are planning a short trip within Tamil Nadu or a longer journey across India, we are here to help you plan your next travel experience.",
            },
          ],
        },
      },
      {
        type: "cta",
        data: {
          eyebrow: "",
          heading: "Let's plan your next journey",
          body: "Tell us about your travel plans, and our team will help you explore the right Urbania DX rental options for your journey across Chennai, Tamil Nadu and India.",
          primaryLabel: "Contact us",
          primaryUrl: "/contact",
          secondaryLabel: "",
          secondaryUrl: "",
          image: "",
          imageAlt: "",
          showContactButtons: true,
          variant: "panel",
        },
      },
    ],
  );

  // --- System listing pages -------------------------------------------------
  const systemPages: Array<{
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    sections?: SectionSeed[];
  }> = [
    {
      slug: "fleet",
      title: "Our fleet",
      metaTitle: "Our fleet — Force Urbania DX rental in Chennai",
      metaDescription:
        "Chauffeur-driven Force Urbania DX rental in Chennai for weddings, corporate travel, airport transfers, family tours, pilgrimages and film production.",
    },
    {
      slug: "services",
      title: "Services",
      metaTitle: "Services — Urbania DX rental in Chennai",
      metaDescription:
        "Chauffeur-driven Urbania DX travel for weddings, corporate groups, airport transfers, pilgrimage tours, family holidays, and film and media production.",
    },
    {
      slug: "outstation",
      title: "Outstation travel",
      metaTitle: "Outstation Urbania DX rental from Chennai",
      metaDescription:
        "Chauffeur-driven Urbania rentals for outstation journeys from Chennai to destinations across Tamil Nadu and other parts of India.",
      sections: [
        {
          type: "richText",
          data: {
            eyebrow: "",
            heading: "",
            body: `<p>You can enquire about chauffeur-driven Urbania rentals for outstation journeys from Chennai to destinations across Tamil Nadu and other parts of India, subject to availability and route requirements.</p>
<p>Share your travel date, pickup location, destination, group size and trip duration, and our team will help you enquire about vehicle availability and the rental charges that apply to your route.</p>`,
            tone: "ivory",
            width: "prose",
          },
        },
        {
          type: "cta",
          data: {
            eyebrow: "Plan your route",
            heading: "Tell us where you are going",
            body: "Share your destination and dates to receive availability details and a rental quotation.",
            primaryLabel: "Request a quote",
            primaryUrl: "/contact",
            secondaryLabel: "",
            secondaryUrl: "",
            image: "",
            imageAlt: "",
            showContactButtons: true,
            variant: "panel",
          },
        },
      ],
    },
    {
      slug: "gallery",
      title: "Gallery",
      metaTitle: "Gallery — Force Urbania DX",
      metaDescription:
        "Exterior, interior and onboard amenity photographs of the Force Urbania DX.",
    },
    {
      slug: "faq",
      title: "Frequently asked questions",
      metaTitle: "FAQ — Urbania DX rental in Chennai",
      metaDescription:
        "How to book an Urbania DX rental in Chennai, outstation hire, wedding and corporate bookings, and how rental charges are calculated.",
    },
    {
      slug: "contact",
      title: "Contact",
      metaTitle: "Contact — request an Urbania DX rental quotation",
      metaDescription:
        "Share your travel dates, group size, pickup location and destination to receive availability details and a rental quotation from Rayan Premium Mobility.",
    },
  ];

  for (const [index, page] of systemPages.entries()) {
    await upsertPage(
      {
        slug: page.slug,
        title: page.title,
        template: "listing",
        isSystem: true,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        sortOrder: index + 2,
      },
      page.sections ?? [],
    );
  }

  // --- Legal ----------------------------------------------------------------
  const legalNotice = `<p><strong>This page is a placeholder.</strong> The wording below is a neutral structural outline, not legal advice and not a binding policy. It must be replaced with text approved by the client and, where appropriate, reviewed by a qualified adviser before the site goes live.</p>`;

  const legalPages = [
    {
      slug: "privacy-policy",
      title: "Privacy policy",
      metaTitle: "Privacy policy",
      metaDescription: "How enquiry data is collected, used and retained.",
      body: `${legalNotice}<h2>What this policy should cover</h2><ul><li>The identity and contact details of the data controller</li><li>What personal data the enquiry form collects, and why</li><li>The lawful basis for processing that data</li><li>How long enquiry records are retained</li><li>Who the data is shared with, including any analytics or email providers in use</li><li>How a visitor can request access, correction or deletion</li><li>Cookie and analytics disclosure, matching whatever is actually enabled in the admin</li></ul><h2>What this website currently does</h2><p>The enquiry form stores the name, phone number, optional email address and message you submit, together with the page you submitted it from and a one-way hash of your IP address used only to limit abuse. This record is visible to the site administrators. Analytics tags load only if an administrator has entered a measurement ID.</p>`,
    },
    {
      slug: "terms-and-conditions",
      title: "Terms and conditions",
      metaTitle: "Terms and conditions",
      metaDescription: "The terms on which travel services are provided.",
      body: `${legalNotice}<h2>What these terms should cover</h2><ul><li>Who the contracting entity is, and its registration details</li><li>How a booking is formed, confirmed and varied</li><li>What the quoted price includes, and what is charged at actuals</li><li>Payment terms and accepted methods</li><li>Passenger conduct, luggage limits and vehicle care</li><li>Liability, insurance cover and its limits</li><li>Delays, breakdowns and substitution of vehicles</li><li>Governing law and dispute resolution</li></ul><h2>Note on pricing</h2><p>Rental charges depend on the travel distance, duration, destination, itinerary and other applicable costs. The binding price is the written quotation issued for your specific journey.</p>`,
    },
    {
      slug: "cancellation-policy",
      title: "Cancellation policy",
      metaTitle: "Cancellation policy",
      metaDescription: "How to cancel or amend a confirmed booking.",
      body: `${legalNotice}<h2>What this policy should cover</h2><ul><li>How to cancel, and what counts as notice</li><li>Any cancellation charges, by notice period</li><li>Whether and how a deposit is refundable</li><li>How amendments are handled, and when they count as a cancellation</li><li>No-show terms and waiting-time limits</li><li>What happens if the operator has to cancel</li><li>Refund timescales and method</li></ul><p>The client must supply the actual notice periods and charges. No figures are published here, because publishing an invented cancellation charge would be misleading.</p>`,
    },
  ];

  for (const [index, page] of legalPages.entries()) {
    await upsertPage(
      {
        slug: page.slug,
        title: page.title,
        template: "standard",
        isSystem: false,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        sortOrder: 50 + index,
      },
      [
        {
          type: "richText",
          data: { eyebrow: "Legal", heading: "", body: page.body, tone: "ivory", width: "prose" },
        },
      ],
    );
  }

  console.log(`· pages (home, about, ${systemPages.length} system, ${legalPages.length} legal)`);
}

main()
  .catch((error) => {
    console.error("\nSeed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
