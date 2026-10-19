# Content handover

Written for: the person preparing Rayan Premium Mobility's real content.

Everything currently on the site is placeholder material. This document lists
exactly what has to be replaced, what must be verified before it can be
published, and what the site deliberately refuses to show until you supply it.

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
| Section heroes (9 pages)    | One per page: fleet, services, outstation, packages, tariffs, gallery, guides, about, contact | 21:9 |
| Full-width bands (2)        | Road or fleet photography                                    | 21:9 |
| Brand story portraits (2)   | Chauffeur, interior detail or depot                          | 4:5 |
| Each vehicle                | 1 exterior hero + 2 interior + 1 amenity detail              | 4:3 |
| Each destination (8)        | One recognisable location shot                               | 4:3 |
| Each service (9)            | Optional — services render icon-led by default               | 3:2 |
| Each package (4)            | One scene-setting shot                                       | 4:3 |
| Each guide article (4)      | One editorial image                                          | 16:10 |
| Gallery                     | 8–30 images across exteriors, interiors, amenities, on the road | mixed |
| Default social share image  | Brand lockup over a vehicle                                   | 1200×630 |

**Alt text is mandatory.** Every image field has one and the admin requires it.
Describe what is in the shot, not "image of van".

---

## 3. Copy to replace

Search the seed data for `Placeholder copy` — every affected body field carries
that marker.

| Content                 | What is there now                                             |
| ----------------------- | -------------------------------------------------------------- |
| Homepage sections       | Plausible but invented positioning copy.                        |
| 5 vehicles              | Invented names, specs, features and seat layouts.               |
| 9 services              | Generic descriptions of how each service runs.                  |
| 8 destinations          | Generic journey copy. **Facts need verifying — see §4.**         |
| 4 packages              | Generic inclusions, exclusions and day-by-day itineraries.      |
| 4 guide articles        | Genuinely useful but generic advice, not written by the client. |
| 19 FAQs                 | Plausible answers that must be checked against actual policy.   |
| About page              | Invented company story. Replace with real history and background. |
| 3 legal pages           | **Structural outlines only — see §5.**                          |

### Vehicle names

The five vehicles are invented ("Signature 9-Seater", "Executive 13-Seater"…).
Replace with the real fleet. Changing a slug? Add a redirect under
`Admin → Redirects` so existing links keep working.

---

## 4. Facts awaiting verification

### Destination distances and journey times

Each of the eight destinations has a `distanceKm` and `travelTimeText` stored,
but **`Facts verified` is unticked**, so none of it appears on the public site.
The figures are starting estimates, not researched values.

For each destination: confirm the distance and realistic journey time **from
your actual base city**, correct them, then tick `Facts verified`. The route
summary panel and the card facts appear only once you do.

> The seeded destinations assume a Chennai-area base. If the business operates
> from elsewhere, the destination list itself needs rethinking.

### Prices

Every rate in the tariff tables and on the vehicle records is an illustrative
round number. Replace all of them. They are labelled indicative throughout and
the written quote is presented as the binding figure, but they should still be
realistic.

Check too: the 250 km daily minimum, the 60-minute airport waiting allowance,
and the driver allowance amounts.

### Statistics

No statistic is published anywhere. The homepage hero's spec strip states only
things that are structurally true ("9 to 35 seats", "Chauffeur always
included"). If you want figures — years in business, journeys completed, fleet
size — add them through a `Statistics` section, and only use numbers you can
substantiate.

---

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
- [ ] Vehicle, service, destination, package and FAQ copy replaced
- [ ] Destination distances verified and `Facts verified` ticked
- [ ] All prices replaced with real figures
- [ ] Legal pages written and reviewed
- [ ] Testimonials collected, verified and published (or left hidden)
- [ ] Navigation menus match the real content
- [ ] SMTP configured (optional)
- [ ] **Search engine indexing switched off** in Settings → SEO
