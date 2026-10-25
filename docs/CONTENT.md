# Content handover

Written for: the person preparing Rayan Premium Mobility's real content.

The site's **words** now come from the client's content document:
<https://docs.google.com/document/d/1KT4YlHqrQXwhZUoYmgo23vxfX-zgcec7e0SxV20bBYM>

The **images** are still placeholder artwork, and several facts the document
does not state are deliberately left unpublished rather than invented. This
page lists what is still outstanding.

## What the content document did not cover

Rather than invent these, they are switched off:

| Area | State |
| --- | --- |
| Vehicle specifications | The document names the Force Urbania DX but gives no seating, luggage or feature list, so none is shown. |
| Prices | The document asks customers to request a quotation, so price display is off site-wide and no tariff table is published. |
| Tariffs page | Unpublished — `/tariffs` returns 404. |
| Outstation destinations | The 8 placeholder destinations are unpublished. `/outstation` is a real page with enquiry-led copy and no destination list. |
| Packages | Unpublished — `/packages` returns 404. |
| Travel guides | Unpublished — `/guides` returns 404. |
| Testimonials | One unverified draft; the public section stays hidden. |

Each is a draft, not a deletion: publish the records in the admin and the page
returns. To bring a module back, publish its page record **and** at least one
item in it.

---

## 1. Settings that block launch

The site is built so it can never publish a contact detail that is not yours.
These ship **empty**, and the related buttons stay hidden until they are set.

| Setting                      | Effect while empty                                      |
| ---------------------------- | ------------------------------------------------------- |
| `Contact → Phone number`     | Every "Call" button is hidden.                           |
| `Contact → WhatsApp number`  | Every WhatsApp button and the floating button are hidden. |
| `Contact → Email address`    | The email line is hidden from the footer and contact page. |
| `SEO → Canonical site URL`   | Canonicals and the sitemap point at `localhost`.         |

Also worth setting: the postal address (the footer address block and the
contact page stay hidden until there is at least a street line or a city),
operating hours, the map embed URL, and the social links.

### Before you go live

1. Change the seeded admin password (`admin@example.com` / `ChangeMe12345`).
2. Fill in the four settings above.
3. Replace the placeholder copy and imagery listed below.
4. Turn **off** `SEO → Search engine indexing` — it ships ON and blocks all
   crawlers. Nothing will be indexed until you do.

---

## 2. Photography

Every image on the site is generated placeholder artwork from
`public/placeholders/`. It is deliberately abstract rather than stock
photography: a stock photo of someone else's van would misrepresent the actual
fleet, and we would rather the gaps be obvious.

Replace by uploading real photographs in the admin and pointing each record's
image field at them, or by overwriting the files in `public/placeholders/`.

| Slot                        | Shots needed                                               | Suggested ratio |
| --------------------------- | ---------------------------------------------------------- | --------------- |
| Homepage hero               | One wide, cinematic shot — a vehicle at dusk or on the road | 16:9, ≥ 2400px wide |
| Section heroes              | One per page: fleet, services, outstation, gallery, about, contact | 21:9 |
| Full-width bands (2)        | Road or fleet photography                                    | 21:9 |
| Brand story portraits (2)   | Chauffeur, interior detail or depot                          | 4:5 |
| Force Urbania DX            | 1 exterior hero + 2 interior + 1 amenity detail              | 4:3 |
| Each service (6)            | Optional — services render icon-led by default               | 3:2 |
| Gallery                     | 6–30 images across exteriors, interiors and amenities         | mixed |
| Default social share image  | Brand lockup over a vehicle                                   | 1200×630 |

**Alt text is mandatory.** Every image field has one and the admin requires it.
Describe what is in the shot, not "image of van".

---

## 3. Copy

The marketing copy on the home page, About page, the six service pages, the
Force Urbania DX page and the FAQ is taken from the content document. Two
edits were made: an obvious typo in one heading ("Premium Group Travel in
across India" -> "across India"), and headings normalised to sentence case to
match the site's typography.

Everything is editable in the admin — the document is the starting point, not
a lock.

## 4. Facts still needed

### Force Urbania DX specification

The document names the vehicle but states no seating count, luggage capacity
or feature list, so the site shows none. The vehicle page currently has no
specification panel at all. Supply:

- Seating capacity (and any alternative seat layouts offered)
- Luggage capacity
- Onboard features worth listing (air conditioning, charging, recliners, …)

### Prices

No rate is published anywhere, which matches the document's position that
charges depend on distance, duration, destination and itinerary. If the client
later wants indicative rates:

1. Add a tariff group and rows under Tariffs in the admin.
2. Publish the `tariffs` page record.
3. Switch on `Settings -> Display -> Show prices on fleet pages`.

### Statistics

None are published. The homepage spec strip states only what the document
supports: the vehicle name, that a chauffeur is included, Chennai as the base,
and coverage across India.

## 5. Legal pages

`/privacy-policy`, `/terms-and-conditions` and `/cancellation-policy` each
contain a visible notice and a bulleted outline of what the page should cover.
**No actual policy text has been written**, and no cancellation charges or
notice periods are stated, because inventing them would be misleading and
potentially unenforceable.

These need wording from the client and, where appropriate, review by a
qualified adviser. The privacy policy outline already documents what the site
actually does: the enquiry form stores name, phone, optional email, message,
source page and a one-way hash of the IP address; analytics load only if a
measurement ID has been entered.

---

## 6. Testimonials

The homepage testimonial section **does not render at all** right now, and that
is intentional. Two example records exist as unverified drafts so you can see
the editor; neither reaches the public site.

A testimonial appears only when it is both **Verified** and **Published**. Use
real, attributable quotes with the customer's permission. No aggregate rating
is emitted as structured data — self-published review markup is not eligible
for rich results and Google treats it as a violation.

---

## 7. Navigation

The header, three footer columns and the legal menu are all editable under
`Admin → Navigation`. They currently mirror the seeded content, so if you
rename or remove a vehicle, service or destination, update the matching menu
item too.

---

## 8. Email notifications

Enquiries are always stored and visible in the admin inbox. Email alerts are
optional and off until you fill in `Settings → Email notifications`: SMTP host,
port, username, password, from address and a recipient. A failed send never
loses an enquiry.

---

## Quick checklist

- [ ] Admin password changed
- [ ] Phone, WhatsApp, email, address filled in
- [ ] Canonical site URL set to the real domain
- [ ] Real photography uploaded, every image given alt text
- [x] Home, About, services, vehicle and FAQ copy taken from the content document
- [ ] Force Urbania DX seating, luggage and features supplied
- [ ] Decide whether to publish indicative prices (none are shown today)
- [ ] Legal pages written and reviewed
- [ ] Testimonials collected, verified and published (or left hidden)
- [ ] Navigation menus match the real content
- [ ] SMTP configured (optional)
- [ ] **Search engine indexing switched off** in Settings → SEO
