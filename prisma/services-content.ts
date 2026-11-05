/**
 * Service page content.
 *
 * Transcribed from the client's services document:
 * https://docs.google.com/document/d/11AYhHGigI8MEU0Je4ZTzJGtZqitl_DtCc7rA9GnOrXs
 *
 * Kept in its own file because it is long, and because it is *content* rather
 * than seeding logic — editing a paragraph should not mean scrolling through
 * upsert code.
 *
 * How the document's five sections map onto the page template:
 *
 *   Section 1 (hero/intro)        -> `summary` and the opening of `body`
 *   Section 2 (our services)      -> `highlights`, the numbered grid
 *   Section 3 (why choose RPM)    -> `checklist` in the aside, plus body prose
 *   Section 4 (FAQs)              -> `faqs`, scoped to this service
 *   Section 5 (final CTA)         -> `ctaHeading` / `ctaBody`
 *
 * Nothing is invented: every sentence here appears in the document, with only
 * headings normalised to sentence case to match the site's typography.
 */

export type ServiceContent = {
  slug: string;
  /** Short label for cards and navigation. */
  name: string;
  icon: string;
  image: string;
  /** The document's H1, used as the SEO title. */
  metaTitle: string;
  metaDescription: string;
  tagline: string;
  summary: string;
  body: string;
  /** Section 2 — what we provide. */
  highlights: Array<{ title: string; detail: string }>;
  /** Section 3 — why choose RPM, shown in the aside. */
  checklist: string[];
  ctaHeading: string;
  ctaBody: string;
  faqs: Array<{ question: string; answer: string }>;
};

export const SERVICE_CONTENT: ServiceContent[] = [
  // -------------------------------------------------------------------------
  {
    slug: "wedding-transport",
    name: "Wedding transportation",
    icon: "Heart",
    image: "/placeholders/service-1.svg",
    metaTitle: "Wedding transportation in Chennai — comfortable group travel",
    metaDescription:
      "Premium wedding transportation in Chennai with chauffeur-driven Force Urbania vehicles for guests, families and special invitees. Enquire about availability.",
    tagline: "Comfortable group travel for your special day.",
    summary:
      "Premium wedding transportation in Chennai with chauffeur-driven Force Urbania vehicles, making group travel convenient for wedding guests, families and special invitees.",
    body: `<p>Make every wedding journey comfortable and well-coordinated with Rayan Premium Mobility. We provide premium wedding transportation in Chennai with chauffeur-driven Force Urbania vehicles, making group travel convenient for wedding guests, families and special invitees.</p>
<p>Whether you are arranging transportation between hotels, wedding halls, reception venues or family gatherings, our Urbania rental for weddings offers a practical travel solution. With spacious interiors and comfortable seating, our vehicles are suitable for accommodating wedding groups travelling together.</p>
<p>From local wedding functions to celebrations across Tamil Nadu and other destinations, Rayan Premium Mobility helps simplify your wedding travel arrangements with organised transportation services.</p>
<h2>A better way to coordinate wedding travel</h2>
<p>Wedding celebrations involve multiple events, venues and guest movements. From welcoming guests at their accommodation to arranging transfers between wedding functions, having a dedicated group transportation arrangement can make travel planning easier for families and event organisers.</p>
<p>At Rayan Premium Mobility, we focus on comfortable journeys and convenient transportation arrangements for your important celebrations.</p>`,
    highlights: [
      { title: "Wedding guest transfers", detail: "Convenient transportation for guests between hotels, wedding venues and reception halls." },
      { title: "Family transportation", detail: "Comfortable group travel for relatives and family members attending wedding functions." },
      { title: "Hotel to wedding venue transfers", detail: "Organised travel arrangements between guest accommodations and wedding locations." },
      { title: "Reception and event transportation", detail: "Transportation support for engagement ceremonies, receptions and other wedding celebrations." },
      { title: "Outstation wedding travel", detail: "Group transportation for weddings and family celebrations across Tamil Nadu and other destinations." },
    ],
    checklist: [
      "Spacious travel: comfortable seating and interior space for group journeys",
      "Chauffeur-driven service with professional arrangements",
      "Convenient group transfers between hotels, halls and event venues",
      "Local and outstation travel across Chennai, Tamil Nadu and India",
      "Flexible booking arrangements discussed with our team",
    ],
    ctaHeading: "Make every wedding journey comfortable",
    ctaBody:
      "Planning transportation for your wedding guests and family members? Whether it is a wedding ceremony, reception, family gathering or outstation celebration, contact our team to discuss your requirements and enquire about Force Urbania DX rental for your special occasion.",
    faqs: [
      { question: "Do you provide wedding transportation in Chennai?", answer: "<p>Yes. Rayan Premium Mobility provides wedding transportation in Chennai, including group transfers for guests and families between hotels, wedding venues, reception halls and other event locations.</p>" },
      { question: "Can I book a Force Urbania for wedding guest transportation?", answer: "<p>Yes. You can enquire about our Force Urbania rental for wedding guest transportation. Share your group size, travel date and route to discuss suitable vehicle arrangements.</p>" },
      { question: "Is chauffeur-driven Urbania rental available for wedding events?", answer: "<p>Yes. Our wedding transportation service includes chauffeur-driven Urbania arrangements, offering a convenient travel option for guests and family members attending wedding functions.</p>" },
      { question: "Can I book an Urbania for outstation wedding travel?", answer: "<p>Yes. You can enquire about Urbania rental for outstation wedding travel across Tamil Nadu and other destinations. Availability and travel arrangements can be discussed based on your itinerary.</p>" },
      { question: "How can I book a luxury van for wedding transportation?", answer: "<p>You can contact Rayan Premium Mobility with your wedding date, pickup and drop-off locations, estimated passenger count and travel schedule. Our team will help you discuss the booking requirements and suitable arrangements.</p>" },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "corporate-travel",
    name: "Corporate travel",
    icon: "BadgeCheck",
    image: "/placeholders/service-2.svg",
    metaTitle: "Corporate travel services in Chennai — premium business transportation",
    metaDescription:
      "Chauffeur-driven Force Urbania vehicles for business meetings, corporate events, employee group travel and airport transfers in Chennai. Enquire about availability.",
    tagline: "Premium business transportation for teams, clients and events.",
    summary:
      "Premium corporate travel services in Chennai, offering chauffeur-driven Force Urbania vehicles for companies, business professionals, corporate teams and organisations.",
    body: `<p>Make business travel more comfortable and convenient with Rayan Premium Mobility. We provide premium corporate travel services in Chennai, offering chauffeur-driven Force Urbania vehicles for companies, business professionals, corporate teams and organisations.</p>
<p>Whether you need transportation for business meetings, corporate events, airport transfers, employee group travel or outstation business trips, our Urbania rental service offers a spacious and convenient travel option.</p>
<p>With comfortable interiors and organised transportation arrangements, Rayan Premium Mobility helps businesses manage group travel requirements across Chennai, Tamil Nadu and destinations throughout India.</p>
<h2>Transportation that supports your business schedule</h2>
<p>Business travel often involves coordinating transportation for employees, management teams, clients and event participants. Whether you are organising a corporate conference, planning employee travel or arranging transportation for visiting clients, Rayan Premium Mobility helps simplify group transportation with comfortable Urbania rental options.</p>`,
    highlights: [
      { title: "Corporate event transportation", detail: "Arrangements for employees, delegates and guests attending business events, conferences and seminars." },
      { title: "Employee group transportation", detail: "Spacious vehicle arrangements for teams travelling together to meetings, company functions and business locations." },
      { title: "Business meeting transfers", detail: "Convenient transportation for corporate professionals attending meetings, appointments and business gatherings." },
      { title: "Airport transfers for corporate teams", detail: "Group transportation between airports, hotels, offices and business venues." },
      { title: "Outstation corporate travel", detail: "Chauffeur-driven Urbania rental for business trips, company visits and corporate travel across Tamil Nadu and other destinations." },
      { title: "Corporate guest transportation", detail: "Travel arrangements for visiting business associates, clients and special invitees." },
    ],
    checklist: [
      "Spacious interiors with comfortable seating for corporate teams",
      "Chauffeur-driven vehicles for convenient business transportation",
      "A suitable option for corporate guests, associates and employees",
      "Local and outstation coverage across Chennai, Tamil Nadu and India",
      "Transfers between offices, airports, hotels, meeting and event venues",
      "Flexible travel planning around your schedules and routes",
    ],
    ctaHeading: "Make business travel more convenient",
    ctaBody:
      "Looking for comfortable and spacious transportation for your employees, corporate guests or business teams? From business meetings and conferences to airport transfers and outstation corporate trips, contact us to discuss your requirements and enquire about our Urbania rental services.",
    faqs: [
      { question: "Do you provide corporate travel services in Chennai?", answer: "<p>Yes. Rayan Premium Mobility provides corporate transportation in Chennai for business meetings, corporate events, employee group travel, airport transfers and other professional travel requirements.</p>" },
      { question: "Can companies book Force Urbania for employee transportation?", answer: "<p>Yes. Companies can enquire about Force Urbania rental for employee group transportation, corporate events and business travel. Vehicle arrangements can be discussed based on passenger count and travel requirements.</p>" },
      { question: "Do you provide chauffeur-driven Urbania for corporate events?", answer: "<p>Yes. We offer chauffeur-driven Urbania arrangements for corporate events, conferences, seminars, business meetings and professional gatherings.</p>" },
      { question: "Can I book Urbania for outstation corporate travel?", answer: "<p>Yes. You can enquire about outstation Urbania rental for business trips and corporate travel across Tamil Nadu and other destinations in India. Routes and availability can be discussed with our team.</p>" },
      { question: "How can I book corporate transportation for my company?", answer: "<p>Contact Rayan Premium Mobility with your travel dates, passenger count, pickup and drop-off locations, and itinerary. Our team will help you discuss suitable vehicle arrangements and booking details.</p>" },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "airport-transfers",
    name: "Airport transfers",
    icon: "Plane",
    image: "/placeholders/service-3.svg",
    metaTitle: "Airport transfers in Chennai — comfortable and convenient group travel",
    metaDescription:
      "Chauffeur-driven Force Urbania airport pickups and drop-offs in Chennai for families, corporate groups, tourists and business travellers. Enquire about availability.",
    tagline: "Comfortable, convenient group travel to and from the airport.",
    summary:
      "Premium airport transfer services in Chennai, offering chauffeur-driven Force Urbania vehicles for families, corporate groups, tourists and business travellers.",
    body: `<p>Make your airport journeys comfortable and convenient with Rayan Premium Mobility. We provide premium airport transfer services in Chennai, offering chauffeur-driven Force Urbania vehicles for families, corporate groups, tourists and business travellers.</p>
<p>Whether you need an airport pickup, departure drop-off, hotel transfer or transportation for a group arriving in Chennai, our Urbania rental service offers a spacious travel solution.</p>
<p>From Chennai International Airport to hotels, business locations, tourist destinations and residential areas, we help coordinate convenient airport transportation based on your travel schedule.</p>
<h2>Airport transportation made more convenient</h2>
<p>Airport transportation requires proper travel coordination, especially when travelling with family members, corporate teams or larger groups. Airport journeys are easier to coordinate when your group can travel together in one spacious vehicle.</p>
<p>From airport arrivals to departure transfers, our focus is on providing comfortable group travel arrangements that fit your journey requirements.</p>`,
    highlights: [
      { title: "Airport pickup services", detail: "Transportation from Chennai International Airport to hotels, homes, offices and other destinations." },
      { title: "Airport drop-off services", detail: "Convenient transfers from your pickup location to the airport for departure journeys." },
      { title: "Corporate airport transfers", detail: "Group transportation for business professionals, visiting delegates and corporate guests." },
      { title: "Family airport transportation", detail: "Spacious travel arrangements for families travelling together with their luggage." },
      { title: "Tourist airport transfers", detail: "Convenient airport transportation for visitors beginning their Chennai and Tamil Nadu trips." },
      { title: "Outstation airport transfers", detail: "Airport-to-destination group travel for journeys beyond Chennai." },
    ],
    checklist: [
      "Spacious passenger interiors for families, tourists and corporate groups",
      "Chauffeur-driven service for convenient airport transportation",
      "A practical option for coordinating multiple passengers",
      "Luggage requirements discussed alongside passenger count",
      "Local and outstation connectivity across Tamil Nadu and India",
      "Planned around your flight schedule, pickup location and destination",
    ],
    ctaHeading: "Plan your airport transfers with RPM",
    ctaBody:
      "Looking for comfortable airport transportation for your family, corporate team or travel group? Whether you need an airport pickup, departure drop-off, hotel transfer or group transportation for an outstation journey, contact our team with your flight and travel details to enquire about availability.",
    faqs: [
      { question: "Do you provide airport pickup and drop-off services in Chennai?", answer: "<p>Yes. Rayan Premium Mobility provides airport transfer arrangements in Chennai, including pickups and drop-offs between Chennai International Airport, hotels, offices, residences and other destinations.</p>" },
      { question: "Can I book a Force Urbania for airport transfers?", answer: "<p>Yes. You can enquire about Force Urbania rental for airport transportation. It is a suitable group travel option for families, tourists and corporate passengers travelling together.</p>" },
      { question: "Is chauffeur-driven Urbania available for Chennai airport pickup?", answer: "<p>Yes. We offer chauffeur-driven Urbania arrangements for airport pickups and drop-offs. Share your flight schedule and travel details to discuss availability.</p>" },
      { question: "Can I book airport transportation for a large family or corporate group?", answer: "<p>Yes. You can enquire about group airport transportation based on your passenger count and luggage requirements. Our team can help discuss suitable vehicle arrangements.</p>" },
      { question: "How can I book an airport transfer with Rayan Premium Mobility?", answer: "<p>Contact our team with your flight date, arrival or departure time, passenger count, pickup location, destination and luggage requirements. We will help you discuss vehicle availability and booking arrangements.</p>" },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "pilgrimage-tours",
    name: "Pilgrimage tours",
    icon: "Compass",
    image: "/placeholders/destination-2.svg",
    metaTitle: "Pilgrimage tours from Chennai — comfortable temple travel",
    metaDescription:
      "Chauffeur-driven Force Urbania transportation for temple visits and pilgrimage tours from Chennai across Tamil Nadu and India. Enquire about availability.",
    tagline: "Comfortable temple travel for families, devotees and groups.",
    summary:
      "Premium pilgrimage tour transportation with chauffeur-driven Force Urbania vehicles, making temple visits and religious journeys more convenient for families, devotees and groups.",
    body: `<p>Plan your spiritual journeys with comfortable and convenient group transportation from Rayan Premium Mobility. We provide premium pilgrimage tour transportation with chauffeur-driven Force Urbania vehicles, making temple visits and religious journeys more convenient for families, devotees and groups.</p>
<p>Whether you are planning a one-day temple visit, a multi-day pilgrimage or an outstation spiritual tour, our Urbania rental service offers a spacious travel option for travelling together.</p>
<p>From famous temples across Tamil Nadu to important pilgrimage destinations in other parts of India, we help arrange transportation based on your travel itinerary.</p>
<h2>Popular pilgrimage destinations</h2>
<ul>
<li>Tirupati — Sri Venkateswara Temple</li>
<li>Tiruvannamalai — Arunachaleswarar Temple</li>
<li>Madurai — Meenakshi Amman Temple</li>
<li>Rameswaram — Ramanathaswamy Temple</li>
<li>Kanchipuram — famous historic temples</li>
<li>Palani — Dhandayuthapani Swamy Temple</li>
<li>Srirangam — Sri Ranganathaswamy Temple</li>
</ul>
<p>Share your preferred destinations and itinerary with our team to discuss suitable transportation arrangements.</p>
<h2>Plan your spiritual journey with convenient transportation</h2>
<p>Whether you are visiting a single temple or planning a multi-destination pilgrimage, we help you coordinate group transportation according to your travel requirements. From departure in Chennai to your chosen pilgrimage destinations, Rayan Premium Mobility focuses on comfortable and organised travel arrangements.</p>`,
    highlights: [
      { title: "Temple tour transportation", detail: "Comfortable group travel for visiting temples and religious destinations across Tamil Nadu." },
      { title: "Outstation pilgrimage tours", detail: "Chauffeur-driven Urbania rental for spiritual journeys beyond Chennai." },
      { title: "Family pilgrimage travel", detail: "Spacious transportation arrangements for families travelling together for religious visits." },
      { title: "Multi-temple itineraries", detail: "Vehicle arrangements for itineraries covering multiple temples and destinations." },
      { title: "Multi-day spiritual journeys", detail: "Transportation support for extended pilgrimage trips with planned routes and travel schedules." },
      { title: "Group religious travel", detail: "Convenient vehicle arrangements for devotees and groups attending religious visits and spiritual gatherings." },
    ],
    checklist: [
      "Spacious passenger seating for families and devotees",
      "Chauffeur-driven transportation throughout the journey",
      "Suitable for long-distance travel and multiple temple visits",
      "Flexible itineraries around your preferred temples and stops",
      "Local and outstation connectivity across Tamil Nadu and India",
      "Keeps your family or travel group together throughout",
    ],
    ctaHeading: "Begin your spiritual journey with RPM",
    ctaBody:
      "Planning a family temple visit or an outstation pilgrimage tour? Whether it is a one-day temple visit, a multi-day spiritual journey or a family pilgrimage across Tamil Nadu, contact our team with your preferred destinations, travel dates and passenger requirements.",
    faqs: [
      { question: "Do you provide pilgrimage tour transportation from Chennai?", answer: "<p>Yes. Rayan Premium Mobility provides chauffeur-driven Urbania transportation for pilgrimage tours starting from Chennai to various temple destinations across Tamil Nadu and other parts of India.</p>" },
      { question: "Can I book a Force Urbania for family temple tours?", answer: "<p>Yes. You can enquire about Force Urbania rental for family temple visits and group pilgrimage journeys. Vehicle arrangements can be discussed based on your passenger count and travel requirements.</p>" },
      { question: "Do you provide transportation for multiple temple visits in one trip?", answer: "<p>Yes. You can share your preferred temples, destinations and travel schedule with our team. We can discuss transportation arrangements for multi-temple and multi-day pilgrimage itineraries.</p>" },
      { question: "Can I book Urbania for outstation pilgrimage tours?", answer: "<p>Yes. You can enquire about outstation Urbania rental for pilgrimage journeys to destinations such as Tirupati, Rameswaram, Madurai, Palani and other religious locations, subject to availability.</p>" },
      { question: "How can I book a vehicle for a pilgrimage tour?", answer: "<p>Contact Rayan Premium Mobility with your travel dates, passenger count, pickup location, temple destinations and estimated trip duration. Our team will help you discuss vehicle availability and suitable travel arrangements.</p>" },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "family-tours",
    name: "Family tours",
    icon: "Users",
    image: "/placeholders/destination-4.svg",
    metaTitle: "Family tours from Chennai — comfortable travel for every family journey",
    metaDescription:
      "Chauffeur-driven Force Urbania rental for family holidays, weekend getaways and sightseeing tours from Chennai. Enquire about availability and arrangements.",
    tagline: "Comfortable travel for every family journey.",
    summary:
      "Premium family tour transportation with chauffeur-driven Force Urbania vehicles, offering a spacious travel option for families planning holidays, sightseeing trips and outstation journeys.",
    body: `<p>Make every family trip more enjoyable with comfortable and convenient transportation from Rayan Premium Mobility. We provide premium family tour transportation with chauffeur-driven Force Urbania vehicles, offering a spacious travel option for families planning holidays, sightseeing trips and outstation journeys.</p>
<p>Whether you are planning a weekend getaway, a long-distance holiday, a family reunion or a sightseeing tour, our Urbania rental service makes group travel more convenient.</p>
<p>From popular tourist destinations across Tamil Nadu to holiday locations throughout India, we help families arrange transportation based on their preferred destinations and travel schedules.</p>
<h2>Popular family travel destinations</h2>
<ul>
<li>Ooty — hill station holidays and scenic landscapes</li>
<li>Kodaikanal — nature escapes and family sightseeing</li>
<li>Yercaud — relaxing weekend getaways</li>
<li>Coorg — scenic holiday experiences</li>
<li>Pondicherry — beaches, heritage and leisure travel</li>
<li>Mysore — palaces and cultural attractions</li>
<li>Mahabalipuram — heritage sites and coastal experiences</li>
</ul>
<p>Share your preferred destinations and travel itinerary with our team to discuss suitable vehicle arrangements.</p>
<h2>Make every family journey more convenient</h2>
<p>From short weekend getaways to extended holiday trips, having suitable group transportation makes travel planning easier. At Rayan Premium Mobility, we focus on comfortable journeys and transportation arrangements that support your family's travel plans.</p>`,
    highlights: [
      { title: "Family holiday trips", detail: "Comfortable group transportation for family vacations and holiday getaways." },
      { title: "Outstation family tours", detail: "Chauffeur-driven Urbania rental for long-distance family journeys from Chennai." },
      { title: "Weekend getaways", detail: "Convenient travel arrangements for short family holidays and weekend trips." },
      { title: "Family sightseeing tours", detail: "Explore popular tourist attractions, scenic locations and cultural destinations together." },
      { title: "Multi-day family trips", detail: "Vehicle arrangements for extended holidays covering multiple destinations." },
      { title: "Special family occasions", detail: "Group transportation for family gatherings, reunions and celebrations." },
    ],
    checklist: [
      "Spacious passenger interiors for families and groups",
      "Chauffeur-driven service throughout the journey",
      "Suitable for long-distance travel and extended holidays",
      "Keeps family members together throughout the trip",
      "Flexible itineraries around your destinations and sightseeing plans",
      "Local and outstation connectivity across Tamil Nadu and India",
    ],
    ctaHeading: "Plan your next family holiday with RPM",
    ctaBody:
      "Planning a weekend getaway, a family vacation or an extended outstation trip? Whether you are exploring hill stations, visiting tourist attractions or planning a multi-destination holiday, contact our team with your preferred destinations, travel dates and passenger requirements.",
    faqs: [
      { question: "Do you provide family tour transportation from Chennai?", answer: "<p>Yes. Rayan Premium Mobility provides chauffeur-driven Urbania transportation for family tours starting from Chennai to popular holiday and sightseeing destinations across Tamil Nadu and other parts of India.</p>" },
      { question: "Can I book a Force Urbania for an outstation family trip?", answer: "<p>Yes. You can enquire about Force Urbania rental for outstation family holidays, weekend getaways and long-distance journeys. Vehicle arrangements can be discussed based on your passenger count and itinerary.</p>" },
      { question: "Is Urbania suitable for family sightseeing tours?", answer: "<p>Force Urbania offers spacious passenger interiors and is a practical group travel option for family sightseeing trips. You can discuss your travel requirements and seating needs with our team.</p>" },
      { question: "Can I plan a multi-day family tour with Rayan Premium Mobility?", answer: "<p>Yes. You can enquire about transportation for multi-day family holidays covering multiple destinations. Share your preferred locations, travel dates and trip duration to discuss the arrangements.</p>" },
      { question: "How can I book an Urbania for a family holiday?", answer: "<p>Contact Rayan Premium Mobility with your pickup location, travel dates, number of passengers, preferred destinations and trip duration. Our team will help you discuss vehicle availability and booking requirements.</p>" },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "film-and-media",
    name: "Film and media travel",
    icon: "Camera",
    image: "/placeholders/amenity-2.svg",
    metaTitle: "Film crew transportation in Chennai — premium travel for production teams",
    metaDescription:
      "Chauffeur-driven Force Urbania vehicles for film crews, production teams, media professionals and creative agencies in Chennai. Enquire about availability.",
    tagline: "Premium travel for production teams.",
    summary:
      "Premium film and media transportation services in Chennai, offering chauffeur-driven Force Urbania vehicles for film crews, production teams, media professionals and creative agencies.",
    body: `<p>Keep your production travel organised with Rayan Premium Mobility. We provide premium film and media transportation services in Chennai, offering chauffeur-driven Force Urbania vehicles for film crews, production teams, media professionals and creative agencies.</p>
<p>From film shoots and television productions to advertising campaigns, photography projects and media events, our Urbania rental service offers a spacious group transportation option for production-related travel.</p>
<p>Whether your team needs transportation between hotels, studios, shooting locations or event venues, we help arrange convenient travel based on your production schedule.</p>
<h2>Transportation that fits your production schedule</h2>
<p>Film and media projects often involve multiple locations, changing schedules and coordinated team movements. From early-morning shooting schedules to multi-location production travel, organising team transportation is an important part of project planning.</p>
<p>Whether you are managing a short advertising shoot, a television production or an outstation filming project, Rayan Premium Mobility helps coordinate group transportation based on your requirements.</p>
<p><strong>Note:</strong> vehicle arrangements are intended for passenger transportation. Equipment, props and additional luggage requirements should be discussed separately based on available space and vehicle capacity.</p>`,
    highlights: [
      { title: "Film crew transportation", detail: "Group transportation for cast members, production teams and supporting crew travelling to shooting locations." },
      { title: "Shooting location transfers", detail: "Convenient vehicle arrangements between hotels, studios, outdoor locations and production venues." },
      { title: "Television production travel", detail: "Transportation support for television shoots, serial productions and media recording projects." },
      { title: "Advertising and commercial shoots", detail: "Group travel arrangements for advertising agencies, creative teams and commercial production crews." },
      { title: "Photography and video production", detail: "Transportation for photography teams, videographers and creative professionals attending different project locations." },
      { title: "Media event transportation", detail: "Vehicle arrangements for media conferences, entertainment events, launches and professional gatherings." },
      { title: "Outstation production travel", detail: "Chauffeur-driven Urbania rental for production teams travelling to filming locations outside Chennai." },
    ],
    checklist: [
      "Spacious passenger interiors for production teams",
      "Chauffeur-driven vehicles for planned production journeys",
      "Transfers between studios, locations, hotels and event venues",
      "Local and outstation travel across Tamil Nadu and India",
      "Flexible planning around pickup schedules and production dates",
      "Keeps your production team travelling together",
    ],
    ctaHeading: "Plan your production travel with RPM",
    ctaBody:
      "Looking for convenient transportation for your film crew, television production team or media professionals? From studio transfers and outdoor shooting locations to advertising projects and outstation productions, contact our team with your production schedule, passenger count and travel requirements.",
    faqs: [
      { question: "Do you provide film crew transportation in Chennai?", answer: "<p>Yes. Rayan Premium Mobility provides chauffeur-driven Urbania transportation arrangements for film crews, television production teams, media professionals and advertising teams travelling to different locations in Chennai.</p>" },
      { question: "Can I book a Force Urbania for shooting location transportation?", answer: "<p>Yes. You can enquire about Force Urbania rental for transportation between studios, hotels, outdoor shooting locations and production venues. Share your itinerary and passenger requirements to discuss availability.</p>" },
      { question: "Is Urbania rental available for outstation film shoots?", answer: "<p>Yes. You can enquire about outstation Urbania rental for film production and media projects across Tamil Nadu and other destinations in India. Travel routes and schedules can be discussed with our team.</p>" },
      { question: "Can production companies arrange transportation for multiple shooting days?", answer: "<p>Yes. You can discuss transportation requirements for multi-day production schedules, including pickup locations, shooting destinations, travel dates and passenger count. Arrangements are subject to availability.</p>" },
      { question: "How can I book a vehicle for my film or media production team?", answer: "<p>Contact Rayan Premium Mobility with your production dates, team size, pickup locations, shooting destinations and expected travel duration. Our team will help you discuss vehicle availability and booking arrangements.</p>" },
    ],
  },
];
