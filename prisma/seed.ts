/**
 * Seed data for Rayan Premium Mobility.
 *
 * ---------------------------------------------------------------------------
 * EVERYTHING HERE IS PLACEHOLDER CONTENT AND MUST BE REVIEWED BEFORE LAUNCH.
 * ---------------------------------------------------------------------------
 *
 * Deliberate choices, which should be preserved when the client's real content
 * is entered (see docs/CONTENT.md for the full handover checklist):
 *
 *  - No phone number, WhatsApp number, email address or postal address is
 *    seeded. Those settings ship empty and the UI hides call/WhatsApp buttons
 *    until they are filled in, so the site can never publish a number that
 *    does not belong to the client.
 *  - Destination distances and journey times are seeded but `factsVerified`
 *    is false, so they are stored for review and hidden from the public page
 *    until someone confirms them.
 *  - Testimonials are seeded as unverified drafts only. The testimonial
 *    section stays hidden until real, verified quotes are published.
 *  - Prices are illustrative round numbers, not quotes.
 *  - Legal pages contain a visible notice instead of invented legal terms.
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

/** Marks copy that the client is expected to replace. */
const PLACEHOLDER_NOTE =
  "Placeholder copy — replace with the client's approved wording before launch.";

async function main() {
  console.log("Seeding Rayan Premium Mobility…\n");

  await seedAdminUser();
  await seedSettings();
  const fleet = await seedFleet();
  const services = await seedServices();
  const destinations = await seedDestinations();
  const packages = await seedPackages();
  await seedArticles();
  await seedFaqs(fleet, services, destinations);
  await seedGallery();
  await seedTestimonials();
  await seedTariffs();
  await seedNavigation();
  await seedPages();

  console.log("\nSeed complete.");
  console.log("Sign in at /admin/login");
  console.log(`  Email:    ${process.env.SEED_ADMIN_EMAIL ?? "admin@example.com"}`);
  console.log(`  Password: ${process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe12345"}`);
  console.log("\nChange this password immediately, and fill in Settings → Contact details.");
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

async function seedSettings() {
  // Only non-empty, non-sensitive defaults. Contact details stay blank on
  // purpose — see the header comment.
  const values: Array<[string, string, string]> = [
    ["brand.name", "Rayan Premium Mobility", "brand"],
    ["brand.shortName", "Rayan", "brand"],
    ["brand.tagline", "Chauffeur-driven group travel", "brand"],
    [
      "brand.footerBlurb",
      "Chauffeur-driven premium vans and coaches for weddings, corporate travel, pilgrimages and long-distance journeys.",
      "brand",
    ],
    ["contact.whatsappMessage", "Hello, I would like a quote for a chauffeur-driven trip.", "contact"],
    ["contact.country", "India", "contact"],
    ["seo.siteUrl", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000", "seo"],
    ["seo.defaultTitle", "Rayan Premium Mobility", "seo"],
    ["seo.titleTemplate", "%s · Rayan Premium Mobility", "seo"],
    [
      "seo.defaultDescription",
      "Chauffeur-driven premium vans and coaches for weddings, corporate travel, pilgrimages, airport transfers and long-distance journeys.",
      "seo",
    ],
    ["seo.defaultOgImage", "/placeholders/og-default.svg", "seo"],
    // Staging guard: the site is noindex until someone deliberately turns this off.
    ["seo.robotsPolicy", "true", "seo"],
    ["seo.enableLocalBusiness", "false", "seo"],
    ["display.showPrices", "true", "display"],
    ["display.showTariffPage", "true", "display"],
    [
      "display.priceDisclaimer",
      "Indicative rates only. Final pricing depends on route, duration, season and vehicle availability, and is confirmed in writing before travel. Tolls, parking, permits and state entry fees are charged at actuals unless stated otherwise.",
      "display",
    ],
    ["email.fromName", "Rayan Premium Mobility", "email"],
    ["email.smtpPort", "587", "email"],
  ];

  for (const [key, value, group] of values) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value, group },
      update: {}, // never clobber a value the client has already edited
    });
  }

  console.log("· settings");
}

// ---------------------------------------------------------------------------
// Fleet
// ---------------------------------------------------------------------------

async function seedFleet() {
  const categories = [
    { slug: "premium-vans", name: "Premium vans", description: "9 to 17 seat chauffeur-driven vans.", sortOrder: 1 },
    { slug: "luxury-coaches", name: "Luxury coaches", description: "Larger groups travelling together.", sortOrder: 2 },
    { slug: "executive-cars", name: "Executive cars", description: "Airport transfers and small-party travel.", sortOrder: 3 },
  ];

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    const row = await prisma.vehicleCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
    categoryIds[category.slug] = row.id;
  }

  const vehicles = [
    {
      slug: "signature-9-seater",
      name: "Signature 9-Seater",
      tagline: "Our most-booked van for small groups and airport runs.",
      categoryId: categoryIds["premium-vans"],
      seats: 9,
      luggage: "6 large cases",
      summary:
        "A compact premium van with individual reclining seats, generous legroom and a separate luggage bay. Suited to airport transfers, day tours and small corporate groups.",
      body: `<p>The Signature 9-Seater is the vehicle most groups start with. It carries nine passengers in individual reclining seats with a dedicated luggage bay behind the rear row, so cases never travel in the cabin.</p><h2>Who it suits</h2><p>Airport transfers for a family or small team, full-day city itineraries, and corporate movements where the group needs to arrive together and on time.</p><h2>On board</h2><p>Climate control throughout the cabin, USB charging at every seat pair, overhead reading lights and a chauffeur partition curtain available on request.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
      heroImage: "/placeholders/vehicle-1.svg",
      heroImageAlt: "Placeholder artwork for the Signature 9-Seater exterior photograph",
      features: J([
        { icon: "Armchair", label: "Individual recliners", detail: "Nine separate reclining seats with armrests." },
        { icon: "Snowflake", label: "Full climate control", detail: "Independent rear cabin air conditioning." },
        { icon: "Usb", label: "Charging at every row", detail: "USB-A and USB-C outlets in each seat pair." },
        { icon: "Luggage", label: "Separate luggage bay", detail: "Cases stay out of the passenger cabin." },
      ]),
      specs: J([
        { label: "Seating", value: "9 passengers" },
        { label: "Luggage", value: "6 large cases" },
        { label: "Doors", value: "Sliding passenger door" },
        { label: "Air conditioning", value: "Dual zone" },
        { label: "Chauffeur", value: "Included" },
      ]),
      seatLayouts: J([
        { label: "2 + 2 + 2 + 3", detail: "Standard configuration with a rear bench." },
        { label: "2 + 2 + 2 + luggage", detail: "Six seats with the rear row folded for extra cases." },
      ]),
      useCases: J([
        { title: "Airport transfers", detail: "Meet-and-greet arrivals with flight tracking." },
        { title: "Day tours", detail: "City sightseeing with a chauffeur who waits between stops." },
        { title: "Corporate travel", detail: "Team movements between offices, venues and hotels." },
      ]),
      showPrice: true,
      priceLocalLabel: "8 hrs / 80 km",
      priceLocal: 4800,
      priceOutstationPerKm: 24,
      extraKmRate: 24,
      extraHourRate: 260,
      driverAllowance: 500,
      isFeatured: true,
      sortOrder: 1,
      metaTitle: "Signature 9-Seater — premium van hire with chauffeur",
      metaDescription:
        "A nine-seat premium van with individual recliners, a separate luggage bay and a professional chauffeur. Request a quote for transfers, day tours or corporate travel.",
    },
    {
      slug: "executive-13-seater",
      name: "Executive 13-Seater",
      tagline: "Reclining captain seats with a centre aisle.",
      categoryId: categoryIds["premium-vans"],
      seats: 13,
      luggage: "8 large cases",
      summary:
        "Thirteen captain seats arranged around a walk-through aisle, with a roof-mounted air conditioning line and ambient cabin lighting. The mainstay for wedding parties and longer tours.",
      body: `<p>The Executive 13-Seater keeps a walk-through aisle between captain seats, so passengers can move around on a long journey without climbing over one another.</p><h2>Who it suits</h2><p>Wedding parties moving between venues, multi-day pilgrimages and corporate offsites.</p><h2>On board</h2><p>Roof-mounted air conditioning, ambient cabin lighting, curtains on every window and a public address handset for tour guides.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
      heroImage: "/placeholders/vehicle-2.svg",
      heroImageAlt: "Placeholder artwork for the Executive 13-Seater exterior photograph",
      features: J([
        { icon: "Armchair", label: "Captain seats", detail: "Individual reclining seats with centre armrests." },
        { icon: "Wind", label: "Roof air line", detail: "Even cooling along the full length of the cabin." },
        { icon: "Lightbulb", label: "Ambient lighting", detail: "Dimmable cabin lighting for night journeys." },
        { icon: "Music", label: "PA handset", detail: "For guided tours and group announcements." },
      ]),
      specs: J([
        { label: "Seating", value: "13 passengers" },
        { label: "Luggage", value: "8 large cases" },
        { label: "Aisle", value: "Walk-through" },
        { label: "Air conditioning", value: "Roof-mounted line" },
        { label: "Chauffeur", value: "Included" },
      ]),
      seatLayouts: J([
        { label: "13 captain seats", detail: "Full capacity with a centre aisle." },
        { label: "10 seats + luggage", detail: "Rear row removed for extended touring luggage." },
      ]),
      useCases: J([
        { title: "Weddings", detail: "Guest shuttles between ceremony, reception and hotels." },
        { title: "Pilgrimage tours", detail: "Multi-day routes with early starts and long days." },
        { title: "Offsites", detail: "Team travel with room to work or rest en route." },
      ]),
      showPrice: true,
      priceLocalLabel: "8 hrs / 80 km",
      priceLocal: 6400,
      priceOutstationPerKm: 30,
      extraKmRate: 30,
      extraHourRate: 320,
      driverAllowance: 600,
      isFeatured: true,
      sortOrder: 2,
      metaTitle: "Executive 13-Seater — chauffeur-driven van with captain seats",
      metaDescription:
        "Thirteen reclining captain seats with a walk-through aisle, roof air conditioning and a professional chauffeur. Built for weddings, tours and corporate groups.",
    },
    {
      slug: "grand-tourer-17-seater",
      name: "Grand Tourer 17-Seater",
      tagline: "Maximum capacity without moving to a full coach.",
      categoryId: categoryIds["premium-vans"],
      seats: 17,
      luggage: "10 large cases",
      summary:
        "Seventeen seats with a high roof line and standing headroom in the aisle. The practical choice when a group is slightly too large for a 13-seater.",
      body: `<p>The Grand Tourer carries seventeen passengers with standing headroom down the aisle, which makes a long day on the road noticeably easier.</p><h2>Who it suits</h2><p>Extended families travelling together, school and college groups, and film units moving crew with equipment.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
      heroImage: "/placeholders/vehicle-3.svg",
      heroImageAlt: "Placeholder artwork for the Grand Tourer 17-Seater exterior photograph",
      features: J([
        { icon: "Users", label: "Seventeen seats", detail: "Forward-facing with three-point belts." },
        { icon: "Wind", label: "High roof line", detail: "Standing headroom along the aisle." },
        { icon: "Luggage", label: "Deep boot", detail: "Ten large cases without using cabin space." },
        { icon: "Headphones", label: "Audio system", detail: "Cabin speakers with a guide microphone." },
      ]),
      specs: J([
        { label: "Seating", value: "17 passengers" },
        { label: "Luggage", value: "10 large cases" },
        { label: "Roof", value: "High roof, standing aisle" },
        { label: "Chauffeur", value: "Included" },
      ]),
      seatLayouts: J([
        { label: "17 forward-facing", detail: "Standard high-capacity layout." },
        { label: "14 seats + cargo", detail: "Rear bench removed for equipment cases." },
      ]),
      useCases: J([
        { title: "Educational trips", detail: "School and college groups with a supervising adult up front." },
        { title: "Film and media", detail: "Crew transport with room for cases and kit." },
        { title: "Family tours", detail: "Three generations travelling in one vehicle." },
      ]),
      showPrice: true,
      priceLocalLabel: "8 hrs / 80 km",
      priceLocal: 7600,
      priceOutstationPerKm: 34,
      extraKmRate: 34,
      extraHourRate: 380,
      driverAllowance: 700,
      isFeatured: true,
      sortOrder: 3,
      metaTitle: "Grand Tourer 17-Seater — high-capacity chauffeur-driven van",
      metaDescription:
        "Seventeen seats, standing headroom and a deep luggage bay, with a professional chauffeur. Suited to educational trips, film units and large families.",
    },
    {
      slug: "lounge-recliner-11-seater",
      name: "Lounge Recliner 11-Seater",
      tagline: "Deep recliners and a lounge cabin for long journeys.",
      categoryId: categoryIds["premium-vans"],
      seats: 11,
      luggage: "7 large cases",
      summary:
        "Eleven deep-recline seats with extended footrests, a centre table and privacy curtains. Specified for overnight and multi-day travel where rest matters more than headcount.",
      body: `<p>The Lounge Recliner trades two seats for comfort: deeper recline, extended footrests and a fold-out centre table.</p><h2>Who it suits</h2><p>Overnight journeys, long outstation routes, and senior travellers who need to rest properly between stops.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
      heroImage: "/placeholders/vehicle-4.svg",
      heroImageAlt: "Placeholder artwork for the Lounge Recliner 11-Seater exterior photograph",
      features: J([
        { icon: "Armchair", label: "Deep recline", detail: "Extended recline with footrests." },
        { icon: "Coffee", label: "Centre table", detail: "Fold-out table between facing seats." },
        { icon: "Tv", label: "Privacy curtains", detail: "Full-length curtains on every window." },
        { icon: "Usb", label: "Power at each seat", detail: "Individual charging points." },
      ]),
      specs: J([
        { label: "Seating", value: "11 passengers" },
        { label: "Luggage", value: "7 large cases" },
        { label: "Recline", value: "Extended with footrest" },
        { label: "Chauffeur", value: "Included" },
      ]),
      seatLayouts: J([
        { label: "11 lounge recliners", detail: "Standard long-journey configuration." },
        { label: "8 seats + facing table", detail: "Two pairs facing a centre table." },
      ]),
      useCases: J([
        { title: "Overnight routes", detail: "Long transfers where passengers need to sleep." },
        { title: "Senior travel", detail: "Easier boarding and proper rest between stops." },
        { title: "Executive travel", detail: "A quiet cabin to work in between cities." },
      ]),
      showPrice: true,
      priceLocalLabel: "8 hrs / 80 km",
      priceLocal: 8200,
      priceOutstationPerKm: 36,
      extraKmRate: 36,
      extraHourRate: 410,
      driverAllowance: 700,
      isFeatured: true,
      sortOrder: 4,
      metaTitle: "Lounge Recliner 11-Seater — long-distance chauffeur travel",
      metaDescription:
        "Eleven deep-recline seats with footrests, a centre table and privacy curtains, with a professional chauffeur. Specified for overnight and multi-day journeys.",
    },
    {
      slug: "grand-coach-35-seater",
      name: "Grand Coach 35-Seater",
      tagline: "A full coach for large parties travelling as one group.",
      categoryId: categoryIds["luxury-coaches"],
      seats: 35,
      luggage: "Under-floor hold",
      summary:
        "A thirty-five seat coach with an under-floor luggage hold, onboard public address and panoramic glazing. For weddings, conferences and institutional travel.",
      body: `<p>When a group outgrows vans, the Grand Coach keeps everyone together in one vehicle with a single chauffeur and one arrival time.</p><h2>Who it suits</h2><p>Wedding guest movements, conference shuttles and institutional travel.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
      heroImage: "/placeholders/vehicle-5.svg",
      heroImageAlt: "Placeholder artwork for the Grand Coach 35-Seater exterior photograph",
      features: J([
        { icon: "Users", label: "Thirty-five seats", detail: "Reclining seats with overhead lockers." },
        { icon: "Luggage", label: "Under-floor hold", detail: "Luggage stored outside the cabin." },
        { icon: "Music", label: "Public address", detail: "Driver and guide microphones." },
        { icon: "Snowflake", label: "Full climate control", detail: "Cooling across the length of the coach." },
      ]),
      specs: J([
        { label: "Seating", value: "35 passengers" },
        { label: "Luggage", value: "Under-floor hold" },
        { label: "Glazing", value: "Panoramic side windows" },
        { label: "Chauffeur", value: "Included" },
      ]),
      seatLayouts: J([{ label: "35 reclining seats", detail: "2 + 2 across a centre aisle." }]),
      useCases: J([
        { title: "Wedding guest shuttles", detail: "Move a whole side of the family at once." },
        { title: "Conferences", detail: "Venue and hotel shuttles on a published timetable." },
        { title: "Institutional travel", detail: "Large groups on a single manifest." },
      ]),
      showPrice: false,
      priceNote: "Coach pricing is quoted per itinerary. Request a quote with your dates and route.",
      sortOrder: 5,
      metaTitle: "Grand Coach 35-Seater — coach hire with chauffeur",
      metaDescription:
        "A thirty-five seat coach with an under-floor luggage hold, public address and full climate control. Request a quote for weddings, conferences and group travel.",
    },
  ];

  const vehicleIds: Record<string, string> = {};

  for (const vehicle of vehicles) {
    const payload = { ...vehicle, status: "PUBLISHED", publishedAt: now };
    const row = await prisma.vehicle.upsert({
      where: { slug: vehicle.slug },
      create: payload,
      update: payload,
    });
    vehicleIds[vehicle.slug] = row.id;

    // Gallery images per vehicle.
    await prisma.vehicleImage.deleteMany({ where: { vehicleId: row.id } });
    await prisma.vehicleImage.createMany({
      data: [
        {
          vehicleId: row.id,
          url: vehicle.heroImage,
          alt: `Placeholder artwork — exterior photograph of the ${vehicle.name}`,
          kind: "EXTERIOR",
          sortOrder: 0,
        },
        {
          vehicleId: row.id,
          url: "/placeholders/interior-1.svg",
          alt: `Placeholder artwork — cabin interior of the ${vehicle.name}`,
          kind: "INTERIOR",
          sortOrder: 1,
        },
        {
          vehicleId: row.id,
          url: "/placeholders/interior-2.svg",
          alt: `Placeholder artwork — seating detail in the ${vehicle.name}`,
          kind: "INTERIOR",
          sortOrder: 2,
        },
        {
          vehicleId: row.id,
          url: "/placeholders/amenity-1.svg",
          alt: `Placeholder artwork — onboard amenities in the ${vehicle.name}`,
          kind: "AMENITY",
          sortOrder: 3,
        },
      ],
    });
  }

  console.log(`· fleet (${vehicles.length} vehicles, ${categories.length} categories)`);
  return vehicleIds;
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

async function seedServices() {
  const services = [
    {
      slug: "wedding-transport",
      name: "Wedding transport",
      icon: "Heart",
      tagline: "Guests, families and the wedding party, moved on schedule.",
      summary:
        "Coordinated vehicle movements across every function, with a named point of contact and chauffeurs briefed on the running order.",
      heroImage: "/placeholders/service-1.svg",
      highlights: [
        { title: "One coordinator", detail: "A single contact for every vehicle across all functions." },
        { title: "Briefed chauffeurs", detail: "Drivers receive the running order and venue access notes in advance." },
        { title: "Standby vehicles", detail: "Reserve capacity can be held for late changes." },
      ],
      checklist: [
        "Guest shuttles between hotels and venues",
        "Dedicated vehicle for the wedding party",
        "Airport pickups for travelling guests",
        "Late-night return runs",
      ],
    },
    {
      slug: "corporate-travel",
      name: "Corporate travel",
      icon: "BadgeCheck",
      tagline: "Reliable movements for teams, clients and visiting executives.",
      summary:
        "Account-based travel with consistent vehicle standards, consolidated monthly billing and chauffeurs briefed on confidentiality.",
      heroImage: "/placeholders/service-2.svg",
      highlights: [
        { title: "Account billing", detail: "Consolidated invoicing against a purchase order." },
        { title: "Consistent standards", detail: "The same vehicle presentation on every booking." },
        { title: "Discretion", detail: "Chauffeurs briefed on confidentiality for client-facing travel." },
      ],
      checklist: [
        "Daily office and site shuttles",
        "Client and visitor transport",
        "Conference and offsite movements",
        "Airport transfers for visiting teams",
      ],
    },
    {
      slug: "airport-transfers",
      name: "Airport transfers",
      icon: "Plane",
      tagline: "Flight-tracked arrivals and departures.",
      summary:
        "Arrivals are tracked against the live flight time, with a meet-and-greet inside the terminal and a published waiting allowance.",
      heroImage: "/placeholders/service-3.svg",
      highlights: [
        { title: "Flight tracking", detail: "Pickup time follows the actual landing time, not the schedule." },
        { title: "Meet and greet", detail: "Your chauffeur waits inside the terminal with a name board." },
        { title: "Clear waiting policy", detail: "A published free waiting allowance, confirmed in your quote." },
      ],
      checklist: [
        "Arrival meet-and-greet",
        "Departure transfers with buffer time",
        "Luggage assistance",
        "Multi-vehicle group arrivals",
      ],
    },
    {
      slug: "pilgrimage-tours",
      name: "Pilgrimage tours",
      icon: "Compass",
      tagline: "Early starts, long days and chauffeurs who know the route.",
      summary:
        "Multi-day temple and pilgrimage circuits planned around darshan timings, with chauffeurs used to early departures and extended waiting.",
      heroImage: "/placeholders/destination-2.svg",
      highlights: [
        { title: "Timed around darshan", detail: "Departures planned around temple opening times." },
        { title: "Extended waiting", detail: "Chauffeurs wait at each stop for as long as the group needs." },
        { title: "Multi-day routing", detail: "Accommodation stops built into the itinerary." },
      ],
      checklist: [
        "Single-day temple visits",
        "Multi-day pilgrimage circuits",
        "Group bookings for extended families",
        "Accessible boarding where required",
      ],
    },
    {
      slug: "family-tours",
      name: "Family tours",
      icon: "Users",
      tagline: "Three generations, one vehicle, no logistics.",
      summary:
        "Unhurried itineraries with flexible stops, booster seats on request and chauffeurs who are patient with children and older travellers.",
      heroImage: "/placeholders/destination-4.svg",
      highlights: [
        { title: "Flexible stops", detail: "Break the journey whenever the group needs to." },
        { title: "Child seats", detail: "Booster and child seats available on request." },
        { title: "Accessible boarding", detail: "Step assistance for older passengers." },
      ],
      checklist: [
        "Day trips and weekend getaways",
        "Multi-day holiday itineraries",
        "Grandparent-friendly pacing",
        "Luggage for a full family",
      ],
    },
    {
      slug: "film-and-media",
      name: "Film and media",
      icon: "Camera",
      tagline: "Crew, cast and kit on a shooting schedule.",
      summary:
        "Unit transport with flexible call times, secure overnight parking for equipment and chauffeurs who understand a shooting day.",
      heroImage: "/placeholders/amenity-2.svg",
      highlights: [
        { title: "Flexible call times", detail: "Vehicles held on standby through the shooting day." },
        { title: "Equipment space", detail: "Seats removable for cases and kit." },
        { title: "Overnight holding", detail: "Secure parking between shooting days." },
      ],
      checklist: [
        "Cast and crew transport",
        "Equipment movement",
        "Location recce vehicles",
        "Extended multi-week bookings",
      ],
    },
    {
      slug: "events-and-parties",
      name: "Events and parties",
      icon: "PartyPopper",
      tagline: "Everyone arrives together and gets home safely.",
      summary:
        "Shuttle loops for parties, launches and private events, with late-night return runs and a coordinator managing pickup points.",
      heroImage: "/placeholders/gallery-3.svg",
      highlights: [
        { title: "Shuttle loops", detail: "Continuous pickups between a venue and set collection points." },
        { title: "Late-night runs", detail: "Return journeys after the event ends." },
        { title: "On-site coordinator", detail: "A contact managing the vehicle rota on the night." },
      ],
      checklist: [
        "Private party shuttles",
        "Product launches and openings",
        "Festival and concert transfers",
        "Guest return runs",
      ],
    },
    {
      slug: "educational-trips",
      name: "Educational trips",
      icon: "Lightbulb",
      tagline: "School and college travel with documented safety standards.",
      summary:
        "Group travel for institutions, with seat belts on every seat, documented chauffeur checks and a supervising adult seated at the front.",
      heroImage: "/placeholders/gallery-5.svg",
      highlights: [
        { title: "Belts on every seat", detail: "Three-point belts throughout the cabin." },
        { title: "Documented checks", detail: "Chauffeur licence and background documentation supplied on request." },
        { title: "Supervisor seating", detail: "A front seat reserved for the accompanying staff member." },
      ],
      checklist: [
        "Day excursions",
        "Residential and multi-day trips",
        "Inter-campus shuttles",
        "Sports and competition travel",
      ],
    },
    {
      slug: "city-sightseeing",
      name: "City sightseeing",
      icon: "Navigation",
      tagline: "A chauffeur who waits while you look around.",
      summary:
        "Half-day and full-day city itineraries with the vehicle held between stops, so there is no re-booking and nothing left in a locker.",
      heroImage: "/placeholders/gallery-1.svg",
      highlights: [
        { title: "Vehicle held between stops", detail: "No re-booking and no waiting for a ride." },
        { title: "Luggage stays aboard", detail: "Useful on an arrival or departure day." },
        { title: "Flexible route", detail: "Change the order of stops as the day goes." },
      ],
      checklist: [
        "Half-day city loops",
        "Full-day sightseeing",
        "Layover tours between flights",
        "Photography and heritage routes",
      ],
    },
  ];

  const serviceIds: Record<string, string> = {};

  for (const [index, service] of services.entries()) {
    const payload = {
      slug: service.slug,
      name: service.name,
      icon: service.icon,
      tagline: service.tagline,
      summary: service.summary,
      body: `<p>${service.summary}</p><h2>How it works</h2><p>Send us your dates, group size and route. We confirm vehicle availability and a written price before anything is booked, and you deal with one named contact from quote to completion.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
      heroImage: service.heroImage,
      heroImageAlt: `Placeholder artwork for the ${service.name.toLowerCase()} photograph`,
      highlights: J(service.highlights),
      checklist: J(service.checklist),
      status: "PUBLISHED",
      publishedAt: now,
      isFeatured: index < 6,
      sortOrder: index + 1,
      metaTitle: `${service.name} — chauffeur-driven vehicles`,
      metaDescription: service.summary.slice(0, 160),
    };

    const row = await prisma.service.upsert({
      where: { slug: service.slug },
      create: payload,
      update: payload,
    });
    serviceIds[service.slug] = row.id;
  }

  console.log(`· services (${services.length})`);
  return serviceIds;
}

// ---------------------------------------------------------------------------
// Destinations
//
// distanceKm / travelTimeText are seeded for the client to check. factsVerified
// stays false, so nothing unverified is published.
// ---------------------------------------------------------------------------

async function seedDestinations() {
  const destinations = [
    { slug: "mahabalipuram", name: "Mahabalipuram", region: "Coastal heritage", distanceKm: 58, travelTimeText: "About 1 hr 30 min", image: "/placeholders/destination-1.svg", bestSeason: "November to February" },
    { slug: "pondicherry", name: "Pondicherry", region: "Coastal town", distanceKm: 155, travelTimeText: "About 3 hr 30 min", image: "/placeholders/destination-2.svg", bestSeason: "October to March" },
    { slug: "tirupati", name: "Tirupati", region: "Pilgrimage", distanceKm: 135, travelTimeText: "About 3 hr", image: "/placeholders/destination-3.svg", bestSeason: "September to February" },
    { slug: "vellore", name: "Vellore", region: "Fort and temple town", distanceKm: 140, travelTimeText: "About 3 hr", image: "/placeholders/destination-4.svg", bestSeason: "November to February" },
    { slug: "kanchipuram", name: "Kanchipuram", region: "Temple city", distanceKm: 72, travelTimeText: "About 2 hr", image: "/placeholders/destination-5.svg", bestSeason: "October to March" },
    { slug: "tiruvannamalai", name: "Tiruvannamalai", region: "Pilgrimage", distanceKm: 185, travelTimeText: "About 4 hr", image: "/placeholders/destination-6.svg", bestSeason: "November to February" },
    { slug: "yercaud", name: "Yercaud", region: "Hill station", distanceKm: 360, travelTimeText: "About 6 hr 30 min", image: "/placeholders/destination-1.svg", bestSeason: "October to May" },
    { slug: "bengaluru", name: "Bengaluru", region: "City", distanceKm: 350, travelTimeText: "About 6 hr", image: "/placeholders/destination-3.svg", bestSeason: "All year" },
  ];

  const destinationIds: Record<string, string> = {};

  for (const [index, destination] of destinations.entries()) {
    const payload = {
      slug: destination.slug,
      name: destination.name,
      region: destination.region,
      tagline: `Chauffeur-driven travel to ${destination.name}.`,
      summary: `A chauffeur-driven journey to ${destination.name} in a vehicle sized to your group, with the car held for you between stops and a written price agreed before you travel.`,
      body: `<p>Travel to ${destination.name} with a chauffeur who knows the route, in a vehicle sized to your group. The vehicle stays with you for the whole trip, so luggage can be left aboard and the itinerary can change as the day goes.</p><h2>Planning your trip</h2><p>Tell us your dates, group size and how long you would like at each stop. We will confirm a vehicle and a written price before anything is booked.</p><p><strong>For client review:</strong> the distance, journey time and suggested itinerary recorded for this destination have not yet been verified and are not shown on the public page. Confirm them in the admin and tick “Facts verified” to publish them.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
      heroImage: destination.image,
      heroImageAlt: `Placeholder artwork for a ${destination.name} photograph`,
      distanceKm: destination.distanceKm,
      travelTimeText: destination.travelTimeText,
      bestSeason: destination.bestSeason,
      // Intentionally false: nothing factual is published until the client checks it.
      factsVerified: false,
      itinerary: J([
        { title: "Morning departure", detail: "Pickup from your address at a time that suits the group." },
        { title: "Journey", detail: "Comfort breaks on request; the chauffeur plans around traffic." },
        { title: "At the destination", detail: "The vehicle is held for you between stops." },
        { title: "Return", detail: "Travel back the same day, or continue to the next stop on a multi-day itinerary." },
      ]),
      highlights: [
        "Chauffeur-driven throughout",
        "Vehicle held between stops",
        "Written price before travel",
        "Flexible departure time",
      ],
      priceNote:
        "Outstation journeys are priced per kilometre with a daily minimum, plus a driver allowance. Tolls, parking and state permits are charged at actuals.",
      status: "PUBLISHED",
      publishedAt: now,
      isFeatured: index < 6,
      sortOrder: index + 1,
      metaTitle: `${destination.name} by chauffeur-driven van or coach`,
      metaDescription: `Chauffeur-driven travel to ${destination.name} in a vehicle sized to your group. Request a written quote with your dates and itinerary.`,
    };

    const row = await prisma.destination.upsert({
      where: { slug: destination.slug },
      create: { ...payload, highlights: J(payload.highlights) },
      update: { ...payload, highlights: J(payload.highlights) },
    });
    destinationIds[destination.slug] = row.id;
  }

  console.log(`· destinations (${destinations.length})`);
  return destinationIds;
}

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

async function seedPackages() {
  const packages = [
    {
      slug: "coastal-weekend",
      name: "Coastal weekend",
      durationText: "2 days / 1 night",
      image: "/placeholders/package-1.svg",
      summary: "A two-day coastal run with unhurried stops, built for families and small groups.",
      inclusions: ["Chauffeur-driven vehicle for both days", "Fuel and driver allowance", "Toll and parking coordination", "Flexible stop timings"],
      exclusions: ["Accommodation", "Meals and entry tickets", "State permits where applicable", "Anything not listed under inclusions"],
    },
    {
      slug: "temple-circuit",
      name: "Temple circuit",
      durationText: "3 days / 2 nights",
      image: "/placeholders/package-2.svg",
      summary: "A three-day pilgrimage circuit planned around darshan timings, with early departures.",
      inclusions: ["Chauffeur-driven vehicle for three days", "Early morning departures", "Extended waiting at each temple", "Fuel and driver allowance"],
      exclusions: ["Accommodation", "Darshan tickets and special entry", "Meals", "Anything not listed under inclusions"],
    },
    {
      slug: "hill-retreat",
      name: "Hill retreat",
      durationText: "3 days / 2 nights",
      image: "/placeholders/package-3.svg",
      summary: "A hill-station itinerary with a chauffeur experienced on ghat roads.",
      inclusions: ["Chauffeur-driven vehicle for three days", "Ghat-road experienced chauffeur", "Fuel and driver allowance", "Flexible viewpoint stops"],
      exclusions: ["Accommodation", "Meals and entry tickets", "Hill permits where applicable", "Anything not listed under inclusions"],
    },
    {
      slug: "wedding-weekend",
      name: "Wedding weekend",
      durationText: "Tailored to your running order",
      image: "/placeholders/package-1.svg",
      summary: "Multi-vehicle coverage across every function, coordinated by one named contact.",
      inclusions: ["Vehicles assigned per function", "A single coordinator across all movements", "Chauffeurs briefed on the running order", "Standby capacity held for changes"],
      exclusions: ["Decoration of vehicles", "Accommodation for guests", "Venue parking charges", "Anything not listed under inclusions"],
    },
  ];

  const packageIds: Record<string, string> = {};

  for (const [index, pkg] of packages.entries()) {
    const payload = {
      slug: pkg.slug,
      name: pkg.name,
      tagline: pkg.durationText,
      summary: pkg.summary,
      body: `<p>${pkg.summary}</p><h2>How it is priced</h2><p>Package pricing depends on the vehicle you choose, the total distance and the number of days. Send us your dates and group size and we will confirm a written price before anything is booked.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
      heroImage: pkg.image,
      heroImageAlt: `Placeholder artwork for the ${pkg.name.toLowerCase()} package photograph`,
      durationText: pkg.durationText,
      // Package prices stay hidden until the client supplies approved figures.
      showPrice: false,
      priceNote: "Priced per itinerary. Request a quote with your dates, group size and preferred vehicle.",
      inclusions: J(pkg.inclusions),
      exclusions: J(pkg.exclusions),
      itinerary: J([
        { title: "Day 1", detail: "Morning pickup, travel and arrival. The vehicle stays with the group." },
        { title: "Day 2", detail: "A full day at the destination with the chauffeur on call." },
        { title: "Final day", detail: "Return journey at a time that suits the group." },
      ]),
      status: "PUBLISHED",
      publishedAt: now,
      isFeatured: index < 3,
      sortOrder: index + 1,
      metaTitle: `${pkg.name} — chauffeur-driven tour package`,
      metaDescription: pkg.summary.slice(0, 160),
    };

    const row = await prisma.package.upsert({
      where: { slug: pkg.slug },
      create: payload,
      update: payload,
    });
    packageIds[pkg.slug] = row.id;
  }

  console.log(`· packages (${packages.length})`);
  return packageIds;
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

async function seedArticles() {
  const categories = [
    { slug: "choosing-a-vehicle", name: "Choosing a vehicle", description: "Which vehicle suits which trip.", sortOrder: 1 },
    { slug: "planning-a-trip", name: "Planning a trip", description: "Practical trip-planning advice.", sortOrder: 2 },
    { slug: "travel-notes", name: "Travel notes", description: "Notes from the road.", sortOrder: 3 },
  ];

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    const row = await prisma.articleCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
    categoryIds[category.slug] = row.id;
  }

  const articles = [
    {
      slug: "how-to-choose-a-group-travel-vehicle",
      title: "How to choose a vehicle for group travel",
      category: "choosing-a-vehicle",
      image: "/placeholders/article-1.svg",
      excerpt: "Headcount is the obvious question, but luggage, journey length and boarding usually decide it.",
      body: `<p>Most groups start by counting people. That is the right first step, but it is rarely what decides the vehicle.</p><h2>Count luggage, not just people</h2><p>A nine-seat van carrying nine passengers and nine large cases is not a nine-seat van any more. If everyone is travelling with a full case, assume you need either a vehicle with a separate luggage bay or one seat row fewer than the headcount suggests.</p><h2>Match recline to journey length</h2><p>Under two hours, standard seating is fine. Over four hours, and especially overnight, deep recline with a footrest changes the experience entirely — and it is worth giving up two seats for.</p><h2>Think about boarding</h2><p>If anyone in the group has limited mobility, a sliding door with a low step matters more than any other feature. Ask about step height before you book.</p><h2>Leave room for the itinerary to change</h2><p>Groups almost always add a stop. A vehicle booked to its absolute capacity leaves no room for a late addition.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
    },
    {
      slug: "what-outstation-pricing-actually-includes",
      title: "What outstation pricing actually includes",
      category: "planning-a-trip",
      image: "/placeholders/article-2.svg",
      excerpt: "Per-kilometre rates, daily minimums, driver allowance and what gets charged at actuals.",
      body: `<p>Outstation quotes look different from operator to operator, which makes them hard to compare. Here is what the components usually mean.</p><h2>Per-kilometre rate</h2><p>The headline number. It is normally charged on the total distance travelled, measured from the garage rather than your door — ask which, because it changes the total.</p><h2>Daily minimum kilometres</h2><p>Most outstation bookings carry a minimum, often around 250 to 300 km per day. If you travel less than that, you are still charged the minimum.</p><h2>Driver allowance</h2><p>A fixed daily amount covering the chauffeur's meals and accommodation on a multi-day trip. It is separate from the kilometre rate.</p><h2>Charged at actuals</h2><p>Tolls, parking, state entry permits and any inter-state taxes are normally billed at cost. Ask for an estimate up front so the final invoice holds no surprises.</p><h2>Get it in writing</h2><p>Whatever the structure, ask for the full breakdown in writing before you travel.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
    },
    {
      slug: "planning-a-wedding-transport-schedule",
      title: "Planning a wedding transport schedule",
      category: "planning-a-trip",
      image: "/placeholders/article-3.svg",
      excerpt: "Build the vehicle plan backwards from the ceremony time, and always hold one vehicle in reserve.",
      body: `<p>Wedding transport fails in predictable ways. Almost all of them come from planning forwards instead of backwards.</p><h2>Start from the ceremony time</h2><p>Fix the moment everyone must be seated, then work backwards: boarding takes longer than you think, and a guest shuttle rarely leaves on the first call.</p><h2>Separate the party from the guests</h2><p>The wedding party needs a dedicated vehicle that is not also running a guest loop. Sharing one vehicle between both jobs is the most common cause of a late start.</p><h2>Hold one vehicle in reserve</h2><p>Someone always misses a shuttle. A single standby vehicle absorbs that without disturbing the schedule.</p><h2>Brief the chauffeurs on venue access</h2><p>Many venues have a separate entrance for vehicles, and some restrict access after a certain time. Share this in advance.</p><h2>Plan the return</h2><p>Return runs are forgotten more often than arrivals. Agree the last departure time before the day.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
    },
    {
      slug: "travelling-with-older-passengers",
      title: "Travelling comfortably with older passengers",
      category: "travel-notes",
      image: "/placeholders/article-4.svg",
      excerpt: "Step height, break frequency and seat position matter more than the vehicle's badge.",
      body: `<p>When a group includes older travellers, a few practical details matter more than the specification sheet.</p><h2>Step height and grab handles</h2><p>A low step with a solid grab handle makes boarding straightforward. Ask specifically about step height rather than assuming a larger vehicle is easier to board.</p><h2>Seat position</h2><p>The front rows ride more smoothly than the rear. Seat anyone prone to travel sickness as far forward as possible.</p><h2>Break frequency</h2><p>Plan a comfort break roughly every ninety minutes rather than every two to three hours, and choose stops with accessible facilities.</p><h2>Temperature</h2><p>Cabin air conditioning is usually set for the middle of the group. Ask the chauffeur to moderate the rear vents, and bring a light layer.</p><p><em>${PLACEHOLDER_NOTE}</em></p>`,
    },
  ];

  for (const [index, article] of articles.entries()) {
    const publishedAt = new Date(now.getTime() - (index + 1) * 7 * 24 * 60 * 60 * 1000);
    const words = article.body.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

    const payload = {
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      heroImage: article.image,
      heroImageAlt: `Placeholder artwork for the article “${article.title}”`,
      categoryId: categoryIds[article.category],
      authorName: "Rayan Premium Mobility",
      authorRole: "Editorial team",
      readMinutes: Math.max(1, Math.round(words / 200)),
      status: "PUBLISHED",
      publishedAt,
      isFeatured: index === 0,
      metaTitle: article.title,
      metaDescription: article.excerpt.slice(0, 160),
    };

    await prisma.article.upsert({
      where: { slug: article.slug },
      create: payload,
      update: payload,
    });
  }

  console.log(`· articles (${articles.length}, ${categories.length} categories)`);
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

async function seedFaqs(
  vehicles: Record<string, string>,
  services: Record<string, string>,
  destinations: Record<string, string>,
) {
  const categories = [
    { slug: "booking", name: "Booking", sortOrder: 1 },
    { slug: "pricing", name: "Pricing", sortOrder: 2 },
    { slug: "vehicles", name: "Vehicles", sortOrder: 3 },
    { slug: "on-the-day", name: "On the day", sortOrder: 4 },
  ];

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    const row = await prisma.faqCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
    categoryIds[category.slug] = row.id;
  }

  const faqs = [
    { category: "booking", question: "How far in advance should I book?", answer: "<p>For a single-day booking, a few days is usually enough. For weddings, multi-vehicle movements and peak travel dates, book as early as you can — those dates fill first.</p>" },
    { category: "booking", question: "How do I confirm a booking?", answer: "<p>Send us your dates, group size and route. We confirm vehicle availability and send a written price. The booking is confirmed once you accept that quote in writing.</p>" },
    { category: "booking", question: "Can I change the itinerary after booking?", answer: "<p>Yes. Minor changes on the day are usually fine and are handled by your chauffeur. Changes that affect the distance or the number of days may change the price, and we will tell you before anything is charged.</p>" },
    { category: "booking", question: "Do you take bookings for a single journey?", answer: "<p>Yes. There is no minimum booking length for local travel. Outstation journeys carry a daily minimum distance, which is stated in your quote.</p>" },
    { category: "pricing", question: "What does the quoted price include?", answer: "<p>The quote covers the vehicle, the chauffeur, and fuel for the distance quoted. Tolls, parking, state entry permits and inter-state taxes are charged at actuals unless your quote says otherwise.</p>" },
    { category: "pricing", question: "Are the published rates final?", answer: "<p>No. Published rates are indicative and help you plan. The final price depends on your route, duration, season and vehicle availability, and is always confirmed in writing before you travel.</p>" },
    { category: "pricing", question: "What is a driver allowance?", answer: "<p>On multi-day journeys, a fixed daily amount covers the chauffeur's meals and accommodation. It is listed separately in your quote.</p>" },
    { category: "pricing", question: "How are extra hours and extra kilometres charged?", answer: "<p>Local packages include a set number of hours and kilometres. Anything beyond that is charged at the per-hour and per-kilometre rates shown on the tariffs page and repeated in your quote.</p>" },
    { category: "vehicles", question: "Can I see the vehicle before booking?", answer: "<p>Where the vehicle is available locally and not out on a booking, yes. Ask your coordinator and we will arrange a time.</p>" },
    { category: "vehicles", question: "Are child seats available?", answer: "<p>Booster and child seats can be fitted on request. Tell us the child's age and we will confirm what is available for your vehicle.</p>" },
    { category: "vehicles", question: "How much luggage can I bring?", answer: "<p>Each vehicle page lists an indicative luggage capacity. If the group is travelling with a full case each, tell us at the quote stage — we may suggest a larger vehicle or a reduced seat configuration.</p>" },
    { category: "on-the-day", question: "What happens if my flight is delayed?", answer: "<p>Airport arrivals are tracked against the live flight time, so the pickup follows the actual landing. The free waiting allowance after landing is stated in your quote.</p>" },
    { category: "on-the-day", question: "Will the same chauffeur stay with us for a multi-day trip?", answer: "<p>Normally yes. On longer itineraries, driving-hour regulations may require a second chauffeur, and we will tell you in advance if that applies.</p>" },
    { category: "on-the-day", question: "Can the chauffeur wait between stops?", answer: "<p>Yes. On a day hire or tour the vehicle stays with you throughout, so luggage can be left aboard and you are not re-booking between stops.</p>" },
  ];

  for (const [index, faq] of faqs.entries()) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    const payload = {
      question: faq.question,
      answer: faq.answer,
      categoryId: categoryIds[faq.category],
      showInDirectory: true,
      status: "PUBLISHED",
      sortOrder: index + 1,
    };
    if (existing) {
      await prisma.faq.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.faq.create({ data: payload });
    }
  }

  // A few FAQs scoped to a specific record, to demonstrate detail-page FAQs.
  const scoped = [
    { question: "Is the rear row removable on the Signature 9-Seater?", answer: "<p>Yes. The rear bench can be folded or removed to create extra luggage space, giving a six-seat configuration with a much deeper boot.</p>", vehicleId: vehicles["signature-9-seater"] },
    { question: "Do you provide a guide microphone on the Executive 13-Seater?", answer: "<p>Yes. A public address handset is fitted for guided tours and group announcements, and can be disabled if you prefer a quiet cabin.</p>", vehicleId: vehicles["executive-13-seater"] },
    { question: "How early can a wedding shuttle start?", answer: "<p>There is no fixed earliest start. Tell us the running order and we will plan departures backwards from the ceremony time.</p>", serviceId: services["wedding-transport"] },
    { question: "Can the chauffeur wait during darshan?", answer: "<p>Yes. On pilgrimage itineraries the vehicle is held at the temple for as long as the group needs.</p>", serviceId: services["pilgrimage-tours"] },
    { question: "Can we add a stop on the way to Pondicherry?", answer: "<p>Yes. Additional stops are usually fine. If a detour adds significant distance, we will confirm any price change before you travel.</p>", destinationId: destinations["pondicherry"] },
  ];

  for (const [index, faq] of scoped.entries()) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    const payload = {
      ...faq,
      // Scoped FAQs render on their detail page, not in the main directory.
      showInDirectory: false,
      status: "PUBLISHED",
      sortOrder: index + 1,
    };
    if (existing) {
      await prisma.faq.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.faq.create({ data: payload });
    }
  }

  console.log(`· FAQs (${faqs.length} directory, ${scoped.length} scoped)`);
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

async function seedGallery() {
  const categories = [
    { slug: "exteriors", name: "Exteriors", sortOrder: 1 },
    { slug: "interiors", name: "Interiors", sortOrder: 2 },
    { slug: "amenities", name: "Amenities", sortOrder: 3 },
    { slug: "on-the-road", name: "On the road", sortOrder: 4 },
  ];

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    const row = await prisma.galleryCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
    categoryIds[category.slug] = row.id;
  }

  const items = [
    { url: "/placeholders/gallery-1.svg", alt: "Placeholder artwork — van exterior at a hotel entrance", category: "exteriors", title: "Arrival" },
    { url: "/placeholders/gallery-2.svg", alt: "Placeholder artwork — cabin interior with reclining seats", category: "interiors", title: "Cabin" },
    { url: "/placeholders/gallery-3.svg", alt: "Placeholder artwork — onboard charging and reading lights", category: "amenities", title: "Seat amenities" },
    { url: "/placeholders/gallery-4.svg", alt: "Placeholder artwork — coastal road at dawn", category: "on-the-road", title: "Coast road" },
    { url: "/placeholders/gallery-5.svg", alt: "Placeholder artwork — seating detail and armrest", category: "interiors", title: "Seating detail" },
    { url: "/placeholders/gallery-6.svg", alt: "Placeholder artwork — luggage bay loaded with cases", category: "amenities", title: "Luggage bay" },
    { url: "/placeholders/gallery-7.svg", alt: "Placeholder artwork — coach on a highway at dusk", category: "on-the-road", title: "Evening transfer" },
    { url: "/placeholders/gallery-8.svg", alt: "Placeholder artwork — van exterior three-quarter view", category: "exteriors", title: "Three-quarter view" },
  ];

  for (const [index, item] of items.entries()) {
    const existing = await prisma.galleryItem.findFirst({ where: { url: item.url, alt: item.alt } });
    const payload = {
      url: item.url,
      alt: item.alt,
      title: item.title,
      kind: "IMAGE",
      width: 1400,
      height: 1050,
      categoryId: categoryIds[item.category],
      status: "PUBLISHED",
      sortOrder: index + 1,
    };
    if (existing) {
      await prisma.galleryItem.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.galleryItem.create({ data: payload });
    }
  }

  console.log(`· gallery (${items.length} items, ${categories.length} categories)`);
}

// ---------------------------------------------------------------------------
// Testimonials — drafts only, deliberately.
// ---------------------------------------------------------------------------

async function seedTestimonials() {
  const drafts = [
    {
      authorName: "Example reviewer",
      authorRole: "Replace with a real customer and role",
      quote:
        "This is an example record showing how a testimonial will look once published. It is unverified and saved as a draft, so it does not appear anywhere on the public site. Replace it with a real, attributable quote before publishing.",
      source: "Placeholder — not a real review",
    },
    {
      authorName: "Example reviewer",
      authorRole: "Replace with a real customer and role",
      quote:
        "A second example draft. The testimonials section on the homepage stays hidden until at least one testimonial is both verified and published, so no fabricated review can ever reach visitors.",
      source: "Placeholder — not a real review",
    },
  ];

  for (const [index, draft] of drafts.entries()) {
    const existing = await prisma.testimonial.findFirst({ where: { quote: draft.quote } });
    const payload = {
      ...draft,
      rating: null,
      // Both flags off: nothing fabricated can reach the public site.
      isVerified: false,
      status: "DRAFT",
      sortOrder: index + 1,
    };
    if (existing) {
      await prisma.testimonial.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.testimonial.create({ data: payload });
    }
  }

  console.log("· testimonials (2 unverified drafts — section stays hidden)");
}

// ---------------------------------------------------------------------------
// Tariffs
// ---------------------------------------------------------------------------

async function seedTariffs() {
  const groups = [
    {
      slug: "local-packages",
      title: "Local packages",
      description: "Within-city hire, charged as a package of hours and kilometres.",
      columns: ["Vehicle", "4 hrs / 40 km", "8 hrs / 80 km", "Extra km", "Extra hour"],
      footnote:
        "Packages start and end at the garage. Tolls, parking and permits are charged at actuals.",
      rows: [
        { cells: ["Signature 9-Seater", "₹2,900", "₹4,800", "₹24", "₹260"], isHighlighted: false },
        { cells: ["Lounge Recliner 11-Seater", "₹4,900", "₹8,200", "₹36", "₹410"], isHighlighted: false },
        { cells: ["Executive 13-Seater", "₹3,900", "₹6,400", "₹30", "₹320"], isHighlighted: true },
        { cells: ["Grand Tourer 17-Seater", "₹4,600", "₹7,600", "₹34", "₹380"], isHighlighted: false },
        { cells: ["Grand Coach 35-Seater", "On request", "On request", "On request", "On request"], isHighlighted: false },
      ],
    },
    {
      slug: "outstation-rates",
      title: "Outstation rates",
      description: "Journeys beyond the city, charged per kilometre with a daily minimum.",
      columns: ["Vehicle", "Per km", "Daily minimum", "Driver allowance"],
      footnote:
        "A daily minimum of 250 km applies to outstation journeys. State entry permits and inter-state taxes are charged at actuals.",
      rows: [
        { cells: ["Signature 9-Seater", "₹24", "250 km", "₹500 / day"], isHighlighted: false },
        { cells: ["Lounge Recliner 11-Seater", "₹36", "250 km", "₹700 / day"], isHighlighted: false },
        { cells: ["Executive 13-Seater", "₹30", "250 km", "₹600 / day"], isHighlighted: true },
        { cells: ["Grand Tourer 17-Seater", "₹34", "250 km", "₹700 / day"], isHighlighted: false },
        { cells: ["Grand Coach 35-Seater", "On request", "250 km", "On request"], isHighlighted: false },
      ],
    },
    {
      slug: "airport-transfers",
      title: "Airport transfers",
      description: "One-way transfers between the airport and a city address.",
      columns: ["Vehicle", "One way", "Free waiting after landing"],
      footnote: "Additional waiting is charged at the extra-hour rate for the vehicle.",
      rows: [
        { cells: ["Signature 9-Seater", "₹2,400", "60 minutes"], isHighlighted: false },
        { cells: ["Executive 13-Seater", "₹3,200", "60 minutes"], isHighlighted: false },
        { cells: ["Grand Tourer 17-Seater", "₹3,900", "60 minutes"], isHighlighted: false },
      ],
    },
  ];

  for (const [index, group] of groups.entries()) {
    const payload = {
      slug: group.slug,
      title: group.title,
      description: group.description,
      columns: J(group.columns),
      footnote: group.footnote,
      status: "PUBLISHED",
      sortOrder: index + 1,
    };

    const row = await prisma.tariffGroup.upsert({
      where: { slug: group.slug },
      create: payload,
      update: payload,
    });

    await prisma.tariffRow.deleteMany({ where: { groupId: row.id } });
    await prisma.tariffRow.createMany({
      data: group.rows.map((r, i) => ({
        groupId: row.id,
        cells: J(r.cells),
        isHighlighted: r.isHighlighted,
        sortOrder: i + 1,
      })),
    });
  }

  console.log(`· tariffs (${groups.length} groups)`);
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

async function seedNavigation() {
  // Rebuilt from scratch each run so the structure always matches this file.
  await prisma.navItem.deleteMany({});

  const header = [
    { label: "Fleet", url: "/fleet", children: [
      { label: "All vehicles", url: "/fleet", description: "Browse the complete fleet" },
      { label: "Signature 9-Seater", url: "/fleet/signature-9-seater", description: "Small groups and airport runs" },
      { label: "Lounge Recliner 11-Seater", url: "/fleet/lounge-recliner-11-seater", description: "Long and overnight journeys" },
      { label: "Executive 13-Seater", url: "/fleet/executive-13-seater", description: "Captain seats with a centre aisle" },
      { label: "Grand Tourer 17-Seater", url: "/fleet/grand-tourer-17-seater", description: "Maximum van capacity" },
      { label: "Grand Coach 35-Seater", url: "/fleet/grand-coach-35-seater", description: "Large parties in one vehicle" },
    ]},
    { label: "Services", url: "/services", children: [
      { label: "All services", url: "/services", description: "Every way we travel" },
      { label: "Weddings", url: "/services/wedding-transport", description: "Guests, families and the party" },
      { label: "Corporate", url: "/services/corporate-travel", description: "Teams, clients and visitors" },
      { label: "Airport transfers", url: "/services/airport-transfers", description: "Flight-tracked arrivals" },
      { label: "Pilgrimage tours", url: "/services/pilgrimage-tours", description: "Planned around darshan timings" },
      { label: "Family tours", url: "/services/family-tours", description: "Unhurried, flexible itineraries" },
      { label: "Film and media", url: "/services/film-and-media", description: "Crew, cast and equipment" },
    ]},
    { label: "Outstation", url: "/outstation", children: [
      { label: "All destinations", url: "/outstation", description: "Every route we cover" },
      { label: "Mahabalipuram", url: "/outstation/mahabalipuram" },
      { label: "Pondicherry", url: "/outstation/pondicherry" },
      { label: "Tirupati", url: "/outstation/tirupati" },
      { label: "Kanchipuram", url: "/outstation/kanchipuram" },
      { label: "Yercaud", url: "/outstation/yercaud" },
      { label: "Bengaluru", url: "/outstation/bengaluru" },
    ]},
    { label: "Packages", url: "/packages" },
    { label: "Tariffs", url: "/tariffs" },
    { label: "More", url: "/about", children: [
      { label: "About us", url: "/about", description: "How we work" },
      { label: "Gallery", url: "/gallery", description: "Vehicles and journeys" },
      { label: "Travel guides", url: "/guides", description: "Planning advice" },
      { label: "FAQ", url: "/faq", description: "Common questions" },
      { label: "Contact", url: "/contact", description: "Get a quote" },
    ]},
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
          description: "description" in child ? child.description : null,
          parentId: parent.id,
          sortOrder: childIndex + 1,
          isVisible: true,
        },
      });
    }
  }

  const simpleMenus: Array<[string, Array<{ label: string; url: string }>]> = [
    ["FOOTER_MENU", [
      { label: "Home", url: "/" },
      { label: "About us", url: "/about" },
      { label: "Our fleet", url: "/fleet" },
      { label: "Tariffs", url: "/tariffs" },
      { label: "Packages", url: "/packages" },
      { label: "Gallery", url: "/gallery" },
      { label: "Travel guides", url: "/guides" },
      { label: "FAQ", url: "/faq" },
      { label: "Contact", url: "/contact" },
    ]],
    ["FOOTER_SERVICES", [
      { label: "Weddings", url: "/services/wedding-transport" },
      { label: "Corporate travel", url: "/services/corporate-travel" },
      { label: "Airport transfers", url: "/services/airport-transfers" },
      { label: "Pilgrimage tours", url: "/services/pilgrimage-tours" },
      { label: "Family tours", url: "/services/family-tours" },
      { label: "Film and media", url: "/services/film-and-media" },
      { label: "Events and parties", url: "/services/events-and-parties" },
      { label: "Educational trips", url: "/services/educational-trips" },
      { label: "City sightseeing", url: "/services/city-sightseeing" },
    ]],
    ["FOOTER_ROUTES", [
      { label: "Mahabalipuram", url: "/outstation/mahabalipuram" },
      { label: "Pondicherry", url: "/outstation/pondicherry" },
      { label: "Tirupati", url: "/outstation/tirupati" },
      { label: "Vellore", url: "/outstation/vellore" },
      { label: "Kanchipuram", url: "/outstation/kanchipuram" },
      { label: "Tiruvannamalai", url: "/outstation/tiruvannamalai" },
      { label: "Yercaud", url: "/outstation/yercaud" },
      { label: "Bengaluru", url: "/outstation/bengaluru" },
      { label: "View all routes", url: "/outstation" },
    ]],
    ["LEGAL", [
      { label: "Privacy policy", url: "/privacy-policy" },
      { label: "Terms and conditions", url: "/terms-and-conditions" },
      { label: "Cancellation policy", url: "/cancellation-policy" },
    ]],
  ];

  for (const [menu, items] of simpleMenus) {
    for (const [index, item] of items.entries()) {
      await prisma.navItem.create({
        data: { menu, label: item.label, url: item.url, sortOrder: index + 1, isVisible: true },
      });
    }
  }

  console.log("· navigation (header, 3 footer columns, legal)");
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
  await prisma.section.createMany({
    data: sections.map((section, index) => ({
      pageId: row.id,
      type: section.type,
      data: J(section.data),
      sortOrder: index + 1,
      isVisible: section.isVisible ?? true,
    })),
  });

  return row;
}

async function seedPages() {
  // --- Homepage ------------------------------------------------------------
  await upsertPage(
    {
      slug: "home",
      title: "Home",
      template: "home",
      isSystem: true,
      metaTitle: "Chauffeur-driven vans and coaches for group travel",
      metaDescription:
        "Premium chauffeur-driven vans and coaches for weddings, corporate travel, pilgrimages, airport transfers and long-distance journeys. Request a written quote.",
      ogImage: "/placeholders/og-default.svg",
      sortOrder: 1,
    },
    [
      {
        type: "hero",
        data: {
          eyebrow: "Chauffeur-driven group travel",
          heading: "Arrive together, unhurried.",
          body: "Premium vans and coaches with professional chauffeurs, for weddings, corporate travel, pilgrimages and long journeys. One vehicle, one contact, one written price.",
          primaryLabel: "Request a quote",
          primaryUrl: "/contact",
          secondaryLabel: "Explore the fleet",
          secondaryUrl: "/fleet",
          image: "/placeholders/hero-home.svg",
          imageAlt: "",
          align: "left",
          stats: [
            { label: "Fleet", value: "9 to 35 seats" },
            { label: "Chauffeur", value: "Always included" },
            { label: "Pricing", value: "Written before travel" },
            { label: "Coverage", value: "Local and outstation" },
          ],
        },
      },
      {
        type: "imageText",
        data: {
          eyebrow: "Who we are",
          heading: "Group travel, handled properly.",
          body: "<p>Moving a group is a logistics problem before it is a transport problem. We take on the whole of it: the right vehicle for the headcount and the luggage, a chauffeur briefed on the itinerary, and a single person you can call.</p><p>Every quote is written down before anything is booked, so the price you agree is the price you pay.</p>",
          image: "/placeholders/editorial-fleet.svg",
          imageAlt: "Placeholder artwork for a brand story photograph",
          mediaSide: "right",
          tone: "ivory",
          ctaLabel: "Read our story",
          ctaUrl: "/about",
          points: [
            { title: "One named contact", detail: "The same coordinator from quote to completion." },
            { title: "Written pricing", detail: "No verbal estimates and no end-of-trip surprises." },
            { title: "Briefed chauffeurs", detail: "Drivers receive the route and running order in advance." },
            { title: "Right-sized vehicles", detail: "Matched to headcount, luggage and journey length." },
          ],
        },
      },
      {
        type: "fleetShowcase",
        data: {
          eyebrow: "The fleet",
          heading: "Five vehicles, sized to the group.",
          intro: "From a nine-seat van for an airport run to a thirty-five seat coach for a wedding party.",
          source: "featured",
          limit: 3,
          layout: "grid",
          ctaLabel: "View the full fleet",
          ctaUrl: "/fleet",
          tone: "ink",
          categorySlug: "",
        },
      },
      {
        type: "featureGrid",
        data: {
          eyebrow: "Why choose us",
          heading: "The things that actually go wrong, handled in advance.",
          intro: "Group travel fails in predictable ways. These are the four we design around.",
          tone: "ivory",
          columns: "4",
          items: [
            { icon: "ShieldCheck", title: "Vetted chauffeurs", detail: "Licence and background documentation available on request for institutional bookings." },
            { icon: "Clock", title: "Realistic scheduling", detail: "Departure times planned backwards from when you need to arrive." },
            { icon: "IndianRupee", title: "Written pricing", detail: "A full breakdown before you travel, including what is charged at actuals." },
            { icon: "Headphones", title: "One point of contact", detail: "A named coordinator rather than a call centre queue." },
          ],
        },
      },
      {
        type: "serviceShowcase",
        data: {
          eyebrow: "Services",
          heading: "How groups travel with us.",
          intro: "Nine ways we are booked most often. Each one has its own planning rhythm.",
          limit: 6,
          ctaLabel: "All services",
          ctaUrl: "/services",
          tone: "charcoal",
        },
      },
      {
        type: "fullImage",
        data: {
          image: "/placeholders/band-road.svg",
          imageAlt: "",
          heading: "Every journey begins before the engine does.",
          caption: "Placeholder artwork — replace with the client's own road or fleet photography.",
          height: "short",
        },
      },
      {
        type: "pricing",
        data: {
          eyebrow: "Tariffs",
          heading: "Indicative rates.",
          intro: "A starting point for planning. Your written quote confirms the final price.",
          groupSlug: "local-packages",
          note: "",
          ctaLabel: "Full tariff card",
          ctaUrl: "/tariffs",
          tone: "ivory",
        },
      },
      {
        type: "process",
        data: {
          eyebrow: "How it works",
          heading: "Three steps, no back and forth.",
          intro: "",
          tone: "ink",
          steps: [
            { title: "Tell us the trip", detail: "Dates, group size, route and anything unusual about the itinerary." },
            { title: "Approve the quote", detail: "We confirm vehicle availability and send a written price with the full breakdown." },
            { title: "Board the vehicle", detail: "Your chauffeur arrives briefed, on time and with the vehicle prepared." },
          ],
        },
      },
      {
        type: "routeShowcase",
        data: {
          eyebrow: "Outstation",
          heading: "Popular routes.",
          intro: "Day trips and multi-day journeys, with the vehicle held for you throughout.",
          limit: 8,
          ctaLabel: "All destinations",
          ctaUrl: "/outstation",
          tone: "ivory",
        },
      },
      {
        type: "gallery",
        data: {
          eyebrow: "Gallery",
          heading: "Vehicles and journeys.",
          intro: "",
          categorySlug: "",
          limit: 6,
          ctaLabel: "Open the gallery",
          ctaUrl: "/gallery",
          tone: "charcoal",
        },
      },
      {
        // Renders nothing until a verified testimonial is published.
        type: "testimonials",
        data: {
          eyebrow: "In their words",
          heading: "What our customers say.",
          intro: "",
          limit: 6,
          tone: "ivory",
        },
      },
      {
        type: "faq",
        data: {
          eyebrow: "Questions",
          heading: "Before you book.",
          intro: "The questions we are asked most often.",
          categorySlug: "booking",
          limit: 4,
          ctaLabel: "All questions",
          ctaUrl: "/faq",
          tone: "ink",
        },
      },
      {
        type: "articleShowcase",
        data: {
          eyebrow: "Travel guides",
          heading: "Planning notes.",
          intro: "Practical advice on choosing a vehicle and planning a journey.",
          limit: 3,
          ctaLabel: "All guides",
          ctaUrl: "/guides",
          tone: "ivory",
        },
      },
      {
        type: "cta",
        data: {
          eyebrow: "Get started",
          heading: "Tell us about your journey.",
          body: "Send your dates, group size and route. We will confirm availability and a written price, usually the same day.",
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

  // --- System pages: hero + SEO for each hard-coded route -------------------
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
      metaTitle: "Our fleet — chauffeur-driven vans and coaches",
      metaDescription:
        "Nine to thirty-five seats, every vehicle chauffeur-driven. Compare seating, luggage capacity and features, and request a written quote.",
    },
    {
      slug: "services",
      title: "Services",
      metaTitle: "Services — weddings, corporate, airport and tour transport",
      metaDescription:
        "Chauffeur-driven travel for weddings, corporate groups, airport transfers, pilgrimages, family tours, film units, events and educational trips.",
    },
    {
      slug: "outstation",
      title: "Outstation routes",
      metaTitle: "Outstation routes — chauffeur-driven long-distance travel",
      metaDescription:
        "Day trips and multi-day journeys with the vehicle held for you throughout. Browse destinations and request a written quote.",
    },
    {
      slug: "packages",
      title: "Tour packages",
      metaTitle: "Tour packages — multi-day chauffeur-driven itineraries",
      metaDescription:
        "Coastal, temple, hill and wedding itineraries with a chauffeur-driven vehicle for the whole trip. Inclusions, exclusions and day-by-day plans.",
    },
    {
      slug: "tariffs",
      title: "Tariffs",
      metaTitle: "Tariffs — local packages and outstation rates",
      metaDescription:
        "Indicative local package rates, outstation per-kilometre pricing, extra-hour and extra-kilometre charges, and what is included.",
    },
    {
      slug: "gallery",
      title: "Gallery",
      metaTitle: "Gallery — vehicles, interiors and journeys",
      metaDescription: "Exteriors, cabin interiors, onboard amenities and journeys from the road.",
    },
    {
      slug: "guides",
      title: "Travel guides",
      metaTitle: "Travel guides — planning a group journey",
      metaDescription:
        "Practical guides on choosing a vehicle, understanding outstation pricing and planning group travel.",
    },
    {
      slug: "faq",
      title: "Frequently asked questions",
      metaTitle: "FAQ — booking, pricing, vehicles and travel day",
      metaDescription:
        "Answers on booking lead times, what a quote includes, driver allowances, luggage capacity and what happens on the day.",
    },
    {
      slug: "contact",
      title: "Contact",
      metaTitle: "Contact — request a quote",
      metaDescription:
        "Send your dates, group size and route for a written quote. Call or message us, or use the enquiry form.",
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

  // --- About ---------------------------------------------------------------
  await upsertPage(
    {
      slug: "about",
      title: "About us",
      template: "standard",
      isSystem: true,
      metaTitle: "About us — how we run group travel",
      metaDescription:
        "How we size vehicles, brief chauffeurs and price journeys, and what we will not claim until it is verified.",
      sortOrder: 20,
    },
    [
      {
        type: "richText",
        data: {
          eyebrow: "Our story",
          heading: "Built around the things that go wrong.",
          body: `<p>Most group transport problems are not driving problems. They are planning problems: a vehicle that fits the people but not the luggage, a departure time set forwards instead of backwards from the ceremony, a quote that grows at the end of the trip.</p><p>We built this business around those failure points. Vehicles are matched to headcount <em>and</em> luggage. Schedules are planned backwards from the moment you need to arrive. Prices are written down before anything is booked.</p><h2>How we work</h2><p>You get one named coordinator from the first enquiry through to the end of the journey. Your chauffeur is briefed on the route, the running order and any venue access notes before the day. If something changes, you call one number.</p><p><em>${PLACEHOLDER_NOTE} Replace this section with the client's real company history, founding date and operating background.</em></p>`,
          tone: "ivory",
          width: "prose",
        },
      },
      {
        type: "imageText",
        data: {
          eyebrow: "Our principles",
          heading: "What we will and will not claim.",
          body: "<p>We would rather publish less and be accurate than publish more and be wrong. Until a fact is verified, it does not go on this website.</p>",
          image: "/placeholders/editorial-care.svg",
          imageAlt: "Placeholder artwork for a chauffeur standards photograph",
          mediaSide: "left",
          tone: "charcoal",
          ctaLabel: "",
          ctaUrl: "",
          points: [
            { title: "No invented statistics", detail: "Figures appear only once the client has supplied and confirmed them." },
            { title: "No fabricated reviews", detail: "The testimonials section stays hidden until real, attributable quotes exist." },
            { title: "Distances marked for review", detail: "Route distances and journey times are hidden until verified." },
            { title: "Pricing always indicative", detail: "Published rates help you plan; the written quote is the commitment." },
          ],
        },
      },
      {
        type: "fleetShowcase",
        data: {
          eyebrow: "The fleet",
          heading: "What we operate.",
          intro: "",
          source: "all",
          limit: 6,
          layout: "grid",
          ctaLabel: "Fleet details",
          ctaUrl: "/fleet",
          tone: "ivory",
          categorySlug: "",
        },
      },
      {
        type: "cta",
        data: {
          eyebrow: "",
          heading: "Talk to a coordinator.",
          body: "Tell us what you are planning and we will tell you honestly whether we are the right fit.",
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

  // --- Legal pages ---------------------------------------------------------
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
      body: `${legalNotice}<h2>What these terms should cover</h2><ul><li>Who the contracting entity is, and its registration details</li><li>How a booking is formed, confirmed and varied</li><li>What the quoted price includes, and what is charged at actuals</li><li>Payment terms and accepted methods</li><li>Passenger conduct, luggage limits and vehicle care</li><li>Liability, insurance cover and its limits</li><li>Delays, breakdowns and substitution of vehicles</li><li>Governing law and dispute resolution</li></ul><h2>Note on pricing</h2><p>Rates published on this website are indicative and provided to help with planning. They are not an offer. The binding price is the written quotation issued for your specific journey.</p>`,
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
          data: {
            eyebrow: "Legal",
            heading: "",
            body: page.body,
            tone: "ivory",
            width: "prose",
          },
        },
      ],
    );
  }

  console.log(`· pages (home, ${systemPages.length} system, about, ${legalPages.length} legal)`);
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
