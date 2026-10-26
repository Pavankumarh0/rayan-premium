# Rayan Premium Mobility

A server-rendered, CMS-backed marketing site for a chauffeur-driven group-travel
operator. Built with Next.js (App Router), Prisma and PostgreSQL.

> **Status:** the public website is complete and working end to end. The
> authenticated admin area is the next phase — see [Roadmap](#roadmap).

---

## Contents

- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Project layout](#project-layout)
- [The content model](#the-content-model)
- [Page sections](#page-sections)
- [SEO](#seo)
- [Security](#security)
- [Switching database engine](#switching-database-engine)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Roadmap](#roadmap)

---

## Quick start

Requires **Node.js 20.9+** (developed on 24.11).

```bash
npm install
cp .env.example .env     # then edit SESSION_SECRET — see below
npm run setup            # migrate + generate + seed
npm run dev
```

Open <http://localhost:3000>.

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Environment variables

| Variable               | Required | Notes                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------- |
| `DATABASE_URL`         | yes      | PostgreSQL connection string. Use `sslmode=verify-full` (see below).    |
| `SESSION_SECRET`       | yes      | ≥ 32 chars. Signs the admin session cookie.                             |
| `NEXT_PUBLIC_SITE_URL` | no       | Fallback canonical base. The admin setting takes precedence.            |
| `SEED_ADMIN_EMAIL`     | no       | Seed account address. Default `admin@example.com`.                      |
| `SEED_ADMIN_PASSWORD`  | no       | Seed account password. **Change before any deployment.**                |

`.env` is git-ignored; `.env.example` is committed.

---

## Architecture

**Next.js 16, App Router, React Server Components.** Every public page is
rendered on the server and ships complete HTML — no client-side data fetching,
no hydration required to read the content.

### Rendering: currently fully dynamic

Next 16 enables `cacheComponents` by default; it is disabled in
`next.config.ts`, so every content route is `ƒ (Dynamic)` and renders at
request time. The original reason was that an editor's publish must appear on
the next request, and reads were against a local SQLite file.

**That trade no longer holds, and this is a known open issue.** The database is
now managed Postgres reached over the network. Measured from a development
machine in India:

| | |
| --- | --- |
| TCP round trip to `db.prisma.io` | 60–100 ms |
| One warm Prisma query | ~290 ms |
| Homepage time to first byte | 1.5–1.7 s |
| Fleet / tariffs / FAQ | 0.8–0.9 s |
| Fleet detail page | 1.6–1.8 s |

On SQLite the same pages served in ~0.2 s. Two things to fix before launch:

1. **Colocate the app with the database.** Most of the above is geography. Host
   the app in the same region as the Prisma Postgres instance and the per-query
   cost should fall to single-digit milliseconds.
2. **Turn caching back on.** With a remote database the original justification
   is gone. Enable `cacheComponents`, wrap the read functions in `src/lib/content.ts`
   with `"use cache"` and a `cacheTag`, and call `revalidateTag` from the admin
   mutations when the admin is built. Public pages then serve from cache and a
   publish still appears immediately.

Do not benchmark against the numbers above without re-measuring from the actual
deployment region — they are a development-machine worst case, not a verdict on
the hosting.

### Database

PostgreSQL 17, hosted on Prisma Postgres. The schema avoids engine-specific
types — enum-like columns are plain strings validated by Zod, and structured
fields are JSON text — so moving to another engine is a provider change, an
adapter swap and a migration (see [below](#switching-database-engine)).

#### A note on `sslmode`

Use `sslmode=verify-full`, not `sslmode=require`. `node-postgres` currently
treats `require` as `verify-full`, but a future major release will adopt libpq
semantics, where `require` encrypts without verifying the server certificate —
silently downgrading the connection. Pinning `verify-full` keeps today's
behaviour explicit.

### Key dependencies

| Package                        | Why                                                                    |
| ------------------------------ | ---------------------------------------------------------------------- |
| `prisma` / `@prisma/client`    | Typed queries and migrations; parameterised by construction.            |
| `@prisma/adapter-pg`           | Prisma 7 requires a driver adapter.                                     |
| `zod`                          | One schema per form, used for both validation and type inference.       |
| `sanitize-html`                | Allowlist sanitiser for editor-authored HTML. Hand-rolling this is a bad idea. |
| `bcryptjs`                     | Password hashing (cost 12).                                             |
| `jose`                         | Signs/verifies the session JWT. Edge-safe, unlike the Prisma client.    |
| `nodemailer`                   | Optional SMTP notifications for enquiries.                              |
| `lucide-react`                 | Icon set. v1 dropped brand glyphs, so social marks are inline SVG.      |

Tailwind v4 provides the utility layer; the design tokens and components live
in `src/app/globals.css` under `@theme` and `@layer components`.

The palette is green and white, sampled from the RPM logo (hue ~146°, from
`#042510` through `#0C5424` to `#309054`, with a chrome bevel). `ink`,
`charcoal` and `mist` are surface *roles* — darkest, dark, light — not literal
colours, so a rebrand only touches the `@theme` block. The CMS stores its own
tone identifiers and maps them to the `.tone-*` classes, so changing the
palette never requires migrating section data.

Two accent variants exist because one green cannot serve both grounds:
`brand-dim` for text on white (~10:1) and `brand-bright` for dark green
surfaces, where the mid green falls to about 1.8:1.

---

## Motion

Built as CSS plus one shared observer, rather than an animation library. The
brief asks for restrained motion and minimal JavaScript, and a Framer-Motion
style approach would mean a client boundary around most of the page.

| Effect | How |
| --- | --- |
| Scroll reveal | `data-reveal` attribute + one `IntersectionObserver` for the whole document |
| Hero entrance | Pure CSS keyframe, no JS |
| Ken Burns on hero photography | CSS keyframe, 24s, alternating |
| Scrolling ticker | Duplicated track translated -50%, CSS only |
| Route divider | SVG `stroke-dashoffset` transition, marker on `offset-path` |
| Card and image hover | CSS transitions already in the component layer |

### Two rules this follows

**Nothing is hidden behind JavaScript.** The reveal system's hidden state is
scoped to `.reveal-ready`, a class an inline script adds to `<html>` before
first paint — and only when JS is running and reduced motion is not requested.
With JS disabled the attribute does nothing and the page renders complete.
(`<html>` carries `suppressHydrationWarning` because that class is a
deliberate server/client difference.)

**Above-the-fold content never waits for hydration.** The hero uses a CSS
entrance rather than scroll reveal: hiding the largest element until an
observer runs can delay Largest Contentful Paint.

Reduced motion resolves every one of the above to its finished state — the
reveal shows, the ticker stops, the route is drawn, the Ken Burns is off.

The ticker and the route divider are CMS section types (`marquee`,
`routeLine`), so an editor can place them and set speed, direction and tone.

## Project layout

```
prisma/
  schema.prisma          data model (see "The content model")
  seed.ts                placeholder content — read the header comment
scripts/
  generate-placeholders.mjs   builds the on-brand SVG artwork
src/
  app/
    (public)/            the public website; one route group, one layout
      page.tsx           homepage, assembled from CMS sections
      fleet/ services/ outstation/ packages/   listing + [slug] detail
      guides/            listing, [slug], category/[slug]
      tariffs/ gallery/ faq/ contact/
      [slug]/            catch-all for editor-created pages
    actions/enquiry.ts   the enquiry server action
    robots.txt/route.ts  robots.txt, driven by admin settings
    sitemap.ts           XML sitemap from published content
    not-found.tsx        404
  components/
    public/              site components (header, cards, sections, forms…)
    ui/                  icon set, JSON-LD helper, social marks
  lib/
    db.ts content.ts     database client and the public read layer
    sections.ts          the page-section registry
    seo.ts               metadata + structured data builders
    validation.ts        every Zod schema
    sanitize.ts auth.ts session.ts password.ts rate-limit.ts mailer.ts
tests/                   87 unit tests, Node's built-in runner
```

---

## The content model

| Model                           | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| `Page` + `Section`              | Editable pages assembled from ordered, toggleable sections. |
| `Vehicle` + `VehicleCategory` + `VehicleImage` | The fleet.                             |
| `Service`                       | Weddings, corporate, airport transfers, …              |
| `Destination`                   | Outstation routes.                                     |
| `Package`                       | Multi-day itineraries.                                 |
| `Article` + `ArticleCategory`   | Travel guides.                                         |
| `Faq` + `FaqCategory`           | Directory FAQs, optionally scoped to one record.       |
| `GalleryItem` + `GalleryCategory` | Images and videos.                                   |
| `Testimonial`                   | Hidden from the site until verified **and** published. |
| `TariffGroup` + `TariffRow`     | Generic tables, so pricing structure stays editable.   |
| `Enquiry`                       | Submissions, with status tracking.                     |
| `NavItem`                       | Header, footer columns and legal menus.                |
| `Setting`                       | Branding, contact, SEO, display and SMTP settings.     |
| `Redirect`                      | Source → destination, for changed slugs.               |
| `User` + `PasswordResetToken`   | Admin accounts.                                        |
| `MediaAsset`                    | Uploaded media.                                        |
| `RateLimit`                     | Throttle buckets for forms and login.                  |

Structured fields (features, itineraries, table cells) are stored as JSON text
and parsed through Zod on read, so a malformed row degrades to a sensible
fallback instead of breaking a page.

---

## Page sections

`src/lib/sections.ts` is the single source of truth. Each type declares its
fields once; the Zod schema, the default payload and (next phase) the admin
form are all derived from that declaration.

Nineteen types ship: `hero`, `richText`, `imageText`, `fullImage`, `gallery`,
`video`, `stats`, `featureGrid`, `process`, `fleetShowcase`, `serviceShowcase`,
`routeShowcase`, `packageShowcase`, `articleShowcase`, `pricing`,
`testimonials`, `faq`, `cta`, `contactDetails`.

Adding one means adding an entry to `SECTION_DEFS` and a case to the switch in
`section-renderer.tsx`. A test asserts the two stay in sync.

Collection sections (`fleetShowcase`, `faq`, …) query live published content
rather than storing copies, so publishing a vehicle updates every page that
shows one.

---

## SEO

- Server-rendered HTML on every route.
- Per-record editable meta title, description, OG image, canonical and noindex.
- `sitemap.xml` generated from published, indexable content (47 URLs seeded).
- `robots.txt` driven by settings, including free-text custom rules.
- Breadcrumbs with matching `BreadcrumbList` JSON-LD.
- `Organization`, `WebSite`, `Service`, `Article` and `FAQPage` structured data.
- `LocalBusiness` only when explicitly enabled **and** name/address/phone are present.
- Responsive images via `next/image`, lazy below the fold, `priority` on each LCP hero.

### The staging switch

`Settings → SEO → Search engine indexing` blocks the whole site: `robots.txt`
disallows everything, the sitemap returns empty, and every page emits
`noindex`. **It ships ON.** Turn it off deliberately at launch.

### What this site will not publish

By design, and enforced by tests:

- No invented phone number, email or postal address — contact settings ship
  empty and the UI hides call/WhatsApp buttons until they are filled in.
- No fabricated testimonials — the section stays hidden until a testimonial is
  both *verified* and *published*.
- No unverified route facts — a destination's distance and journey time are
  stored but hidden until an editor ticks "Facts verified".
- No `Product`/`Offer` markup with prices the business cannot guarantee;
  vehicles are described as a `Service`.
- Published rates are labelled indicative; the written quote is the commitment.

---

## Security

| Concern              | Measure                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| XSS                  | All editor HTML passes an allowlist sanitiser; `javascript:`/`data:` URLs stripped; external links get `rel="noopener noreferrer"`. |
| SQL injection        | Prisma parameterises every query.                                        |
| Passwords            | bcrypt, cost 12. Failed logins compare against a dummy hash so timing cannot enumerate accounts. |
| Sessions             | Signed JWT in an `httpOnly`, `sameSite=lax`, `secure`-in-production cookie. The user is re-read from the database on every request, so deactivating an account revokes access immediately. |
| Form abuse           | Database-backed rate limit (5 enquiries / 15 min / IP), a honeypot field, and a minimum fill time. Bots get a success response so they learn nothing. |
| Privacy              | Client IPs are stored only as a salted SHA-256 hash.                     |
| Headers              | `nosniff`, `SAMEORIGIN`, strict referrer policy, HSTS, restrictive `Permissions-Policy`. |
| SVG                  | The optimiser is allowed to serve SVG because the only SVGs are ours and it runs sandboxed by CSP; the upload validator rejects `image/svg+xml`. |
| Secrets              | Environment variables only. `.env` is git-ignored.                       |

---

## Switching database engine

The schema avoids engine-specific types for exactly this reason, and the engine
is chosen in one file.

1. Install the adapter, e.g. `npm install @prisma/adapter-mariadb`.
2. In `prisma/schema.prisma`, change `provider` on the `datasource` block.
3. In `src/lib/prisma-adapter.ts`, return the new adapter from
   `createPrismaAdapter()`. This is the only place the engine is named — both
   the app and the seed script import it.
4. Point `DATABASE_URL` at the new server, then:
   ```bash
   rm -rf prisma/migrations
   npx prisma migrate dev --name init
   npm run db:seed
   ```

Nothing under `src/app` or `src/components` changes.

## Deployment

A standard Node server. Any host that runs `next start` works — a VPS, a
container, App Platform, Fly, Render, or Vercel.

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start
```

The database is a managed Postgres instance, so there is no volume to attach
and no filesystem constraint — serverless and multi-instance hosting both work.
Set `DATABASE_URL` and `SESSION_SECRET` in the host's environment settings;
never commit them. Run `npx prisma migrate deploy` as part of the release step
so schema changes are applied before the new build serves traffic.

Launch checklist:

1. Set `SESSION_SECRET` to a fresh value.
2. Change the seeded admin password.
3. Fill in `Settings → Contact details` and `Settings → SEO → Canonical site URL`.
4. Replace the placeholder artwork and copy (see `docs/CONTENT.md`).
5. Turn the staging indexing switch **off**.
6. Serve over HTTPS so the `secure` session cookie is honoured.

---

## Scripts

| Script                | Does                                                      |
| --------------------- | --------------------------------------------------------- |
| `npm run dev`         | Dev server.                                                |
| `npm run build`       | `prisma generate` then a production build.                 |
| `npm start`           | Serve the production build.                                |
| `npm run setup`       | Migrate, generate and seed in one step.                    |
| `npm run db:migrate`  | Create and apply a migration.                              |
| `npm run db:deploy`   | Apply migrations without prompting (for CI/production).    |
| `npm run db:seed`     | (Re)seed placeholder content. Idempotent.                  |
| `npm run db:studio`   | Prisma Studio.                                             |
| `npm run typecheck`   | `tsc --noEmit`.                                            |
| `npm test`            | 87 unit tests.                                             |

Regenerate the placeholder artwork with
`node scripts/generate-placeholders.mjs`.

### A note on the test command

Tests run through `tsx` with `--conditions=react-server`, which resolves the
`server-only` package to its empty stub so server modules can be imported
directly, and `--env-file=.env` because the settings module loads the Prisma
client.

---

## Roadmap

The public site is finished. Still to build:

- **Admin area** (`/admin`): authentication, password reset, dashboard, CRUD
  for every content type, the section editor, media library, navigation and
  settings editors, redirect management and the enquiry inbox.

The groundwork is already in place: `src/lib/auth.ts`, `session.ts`,
`password.ts` and `rate-limit.ts` are written and tested, every content type
has a Zod schema in `validation.ts`, and `sections.ts` is designed to generate
the section editor's form from its field declarations.
