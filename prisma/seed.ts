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
  await seedServices();
  await seedFaqs();
  await seedGallery();
  await seedTestimonials();
  await seedNavigation();
  await seedPages();

  console.log("\nSeed complete.");
  console.log(`  Admin: ${process.env.SEED_ADMIN_EMAIL ?? "admin@example.com"}`);
  console.log("\nStill required before launch — see docs/CONTENT.md:");
  console.log("  · Phone, WhatsApp, email and address (Settings -> Contact details)");
  console.log("  · Force Urbania DX seating, luggage and features");
  console.log("  · Real photography (all images are placeholder artwork)");
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
  "brand.tagline",
  "brand.logoImage",
  "brand.logoImageLight",
  "brand.footerBlurb",
  "contact.phoneSecondary",
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
    // The tagline on the logo artwork.
    ["brand.tagline", "Memories in motion", "brand"],
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
    // Supplied by the client. The primary number is still unset, so call
    // buttons stay hidden until one is added — see docs/CONTENT.md.
    ["contact.phoneSecondary", "+91 96772 70019", "contact"],
    // The only location facts the document states.
    ["contact.city", "Chennai", "contact"],
    ["contact.state", "Tamil Nadu", "contact"],
    ["contact.country", "India", "contact"],
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

  const payload = {
    slug: "force-urbania-dx",
    name: "Force Urbania DX",
    tagline: "Chauffeur-driven premium group travel in Chennai.",
    categoryId: category.id,
    // Left at 0 so the card and hero omit a seating figure entirely: the
    // content document states none, and guessing would be a claim.
    seats: 0,
    luggage: null,
    summary:
      "We specialise in Force Urbania DX rental in Chennai, offering chauffeur-driven travel arrangements for individuals, families, business teams, tourists and event organisers.",
    body: `<p>We specialise in Force Urbania DX rental in Chennai, offering chauffeur-driven travel arrangements for individuals, families, business teams, tourists and event organisers. Our services are designed around your travel plans, group requirements, pickup locations and destinations.</p>
<p>From local journeys within Chennai to outstation trips across India, we help you plan transportation for different occasions with convenience and care. Our focus is on providing a suitable travel arrangement, clear communication, and a comfortable group travel experience from pickup to destination.</p>
<h2>Planning your booking</h2>
<p>Share your travel date, pickup location, destination, group size and trip duration, and our team will help you enquire about vehicle availability and the rental charges that apply to your journey.</p>`,
    heroImage: "/placeholders/vehicle-1.svg",
    heroImageAlt: "Placeholder artwork — photograph of the Force Urbania DX to be supplied",
    // No fabricated feature list, specification table or seat layout.
    features: J([]),
    specs: J([]),
    seatLayouts: J([]),
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
    sortOrder: 1,
    metaTitle: "Force Urbania DX rental in Chennai with chauffeur",
    metaDescription:
      "Chauffeur-driven Force Urbania DX rental in Chennai for weddings, corporate travel, airport transfers, family tours, pilgrimages and film production. Request a quotation.",
  };

  const vehicle = await prisma.vehicle.upsert({
    where: { slug: payload.slug },
    create: payload,
    update: payload,
  });

  await prisma.vehicleImage.deleteMany({ where: { vehicleId: vehicle.id } });
  await prisma.vehicleImage.createMany({
    data: [
      {
        vehicleId: vehicle.id,
        url: "/placeholders/vehicle-1.svg",
        alt: "Placeholder artwork — exterior photograph of the Force Urbania DX to be supplied",
        kind: "EXTERIOR",
        sortOrder: 0,
      },
      {
        vehicleId: vehicle.id,
        url: "/placeholders/interior-1.svg",
        alt: "Placeholder artwork — cabin interior of the Force Urbania DX to be supplied",
        kind: "INTERIOR",
        sortOrder: 1,
      },
      {
        vehicleId: vehicle.id,
        url: "/placeholders/interior-2.svg",
        alt: "Placeholder artwork — seating detail of the Force Urbania DX to be supplied",
        kind: "INTERIOR",
        sortOrder: 2,
      },
      {
        vehicleId: vehicle.id,
        url: "/placeholders/amenity-1.svg",
        alt: "Placeholder artwork — onboard amenities of the Force Urbania DX to be supplied",
        kind: "AMENITY",
        sortOrder: 3,
      },
    ],
  });

  console.log("· fleet (1 vehicle — Force Urbania DX; no specs invented)");
}

// ---------------------------------------------------------------------------
// Services — the six named in the document.
// ---------------------------------------------------------------------------

async function seedServices() {
  const services = [
    {
      slug: "wedding-transport",
      name: "Wedding transportation",
      icon: "Heart",
      image: "/placeholders/service-1.svg",
      summary:
        "Make guest transportation easier with coordinated travel between wedding venues, hotels and family gatherings across Chennai.",
    },
    {
      slug: "corporate-travel",
      name: "Corporate travel",
      icon: "BadgeCheck",
      image: "/placeholders/service-2.svg",
      summary:
        "Arrange professional group transportation for business meetings, corporate events, conferences and visiting teams.",
    },
    {
      slug: "airport-transfers",
      name: "Airport transfers",
      icon: "Plane",
      image: "/placeholders/service-3.svg",
      summary:
        "Plan convenient Chennai airport pickups and drop-offs for families, tourists and business groups travelling together.",
    },
    {
      slug: "pilgrimage-tours",
      name: "Pilgrimage tours",
      icon: "Compass",
      image: "/placeholders/destination-2.svg",
      summary:
        "Organise group temple visits and spiritual journeys with travel arrangements planned around your destinations and schedule.",
    },
    {
      slug: "family-tours",
      name: "Family tours",
      icon: "Users",
      image: "/placeholders/destination-4.svg",
      summary:
        "Travel together on holidays, sightseeing trips and outstation journeys with an itinerary suited to your family's plans.",
    },
    {
      slug: "film-and-media",
      name: "Film and media travel",
      icon: "Camera",
      image: "/placeholders/amenity-2.svg",
      summary:
        "Arrange transportation for production crews, cast members and media teams attending shoots, events and filming locations.",
    },
  ];

  for (const [index, service] of services.entries()) {
    const payload = {
      slug: service.slug,
      name: service.name,
      icon: service.icon,
      tagline: null,
      summary: service.summary,
      body: `<p>${service.summary}</p>
<h2>Planning your booking</h2>
<p>Share your travel date, pickup location, destination, group size and trip duration with our team. We will help you enquire about vehicle availability and the rental charges that apply to your journey.</p>
<p>Rental charges depend on the travel distance, duration, destination, itinerary and other applicable costs. Request a quotation before confirming your booking so you understand the charges involved.</p>`,
      heroImage: service.image,
      heroImageAlt: `Placeholder artwork — ${service.name.toLowerCase()} photograph to be supplied`,
      // No invented highlight list or checklist.
      highlights: J([]),
      checklist: J([]),
      status: "PUBLISHED",
      publishedAt: now,
      isFeatured: true,
      sortOrder: index + 1,
      metaTitle: `${service.name} — Urbania DX rental in Chennai`,
      metaDescription: service.summary.slice(0, 160),
    };

    await prisma.service.upsert({
      where: { slug: service.slug },
      create: payload,
      update: payload,
    });
  }

  console.log(`· services (${services.length}, from the document)`);
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
    { url: "/placeholders/gallery-1.svg", alt: "Placeholder artwork — Urbania DX exterior photograph to be supplied", category: "exteriors", title: "Exterior" },
    { url: "/placeholders/gallery-8.svg", alt: "Placeholder artwork — Urbania DX three-quarter view photograph to be supplied", category: "exteriors", title: "Three-quarter view" },
    { url: "/placeholders/gallery-2.svg", alt: "Placeholder artwork — Urbania DX cabin interior photograph to be supplied", category: "interiors", title: "Cabin" },
    { url: "/placeholders/gallery-5.svg", alt: "Placeholder artwork — Urbania DX seating detail photograph to be supplied", category: "interiors", title: "Seating detail" },
    { url: "/placeholders/gallery-3.svg", alt: "Placeholder artwork — onboard amenities photograph to be supplied", category: "amenities", title: "Onboard amenities" },
    { url: "/placeholders/gallery-6.svg", alt: "Placeholder artwork — luggage space photograph to be supplied", category: "amenities", title: "Luggage space" },
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

  console.log(`· gallery (${items.length} placeholder images)`);
}

async function seedTestimonials() {
  const quote =
    "This is an example record showing how a testimonial will look once published. It is unverified and saved as a draft, so it does not appear anywhere on the public site. Replace it with a real, attributable quote before publishing.";

  const existing = await prisma.testimonial.findFirst({ where: { quote } });
  const payload = {
    authorName: "Example reviewer",
    authorRole: "Replace with a real customer and role",
    quote,
    source: "Placeholder — not a real review",
    rating: null,
    // Both flags off: nothing fabricated can reach the public site.
    isVerified: false,
    status: "DRAFT",
    sortOrder: 1,
  };
  if (existing) await prisma.testimonial.update({ where: { id: existing.id }, data: payload });
  else await prisma.testimonial.create({ data: payload });

  console.log("· testimonials (1 unverified draft — section stays hidden)");
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
          image: "/placeholders/hero-home.svg",
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
          image: "/placeholders/editorial-fleet.svg",
          imageAlt: "Placeholder artwork — brand photograph to be supplied",
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
          image: "/placeholders/vehicle-1.svg",
          imageAlt: "Placeholder artwork — photograph of the Force Urbania DX to be supplied",
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
          secondaryLabel: "",
          secondaryUrl: "",
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
