# RPM Dashboard

The content management app for the Rayan Premium Mobility website.

It is a **separate application with its own deployment**, pointed at the same
database as the public site. Editing something here changes the website on its
next request — there is no build step and no publish pipeline between them.

---

## Why it is separate

- The two can be deployed, scaled and restarted independently. Taking the
  dashboard down for a deploy never touches the public site.
- The dashboard can live behind a different domain, a VPN or an IP allowlist
  without complicating the public site's hosting.
- If the public site is ever rewritten in another language, the dashboard is
  unaffected — they share a database, not a codebase.

The cost is duplication: the schema and the shared rule modules exist in both
apps. That is managed, not ignored — see [Shared code](#shared-code).

---

## Running it

```bash
cd admin
npm install
cp .env.example .env     # fill in DATABASE_URL and SESSION_SECRET
npm run db:generate
npm run dev              # http://localhost:3001
```

The public site runs on port 3000, so both can run side by side.

### Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | The **same** database as the public site. Use `sslmode=verify-full`. |
| `SESSION_SECRET` | yes | ≥ 32 characters. Only needs to match the public site if you want one shared login. |
| `NEXT_PUBLIC_SITE_URL` | no | Used for the "View site" link. |

### First sign-in

If the database has no accounts, the login page offers to create the first
administrator. Otherwise sign in with an existing account. The seeded account
is `admin@example.com` — change its password immediately.

---

## Shared code

The schema and the modules that define the site's rules are **copied** into
this app, not imported from a shared package. A package would couple the two
deployments; copies keep each app standalone.

Drift is prevented, not hoped away:

```bash
npm run sync:admin      # from the repo root — refreshes every copy
npm test                # tests/admin-sync.test.ts fails if any copy differs
```

Mirrored: `prisma/schema.prisma`, and `src/lib/` — `utils`, `json`,
`validation`, `sections`, `sanitize`, `session`, `password`, `rate-limit`,
`prisma-adapter`, `db`, `settings`.

**Edit the public site's copy, then run `npm run sync:admin`.** Never edit the
copy inside `admin/` directly — the next sync overwrites it.

### Migrations

The public app owns the migration history. This app only ever runs
`prisma generate`, so there is no second history to diverge. After a schema
change: migrate in the public app, then `npm run sync:admin` and
`npm run db:generate` here.

---

## Security

| Concern | Measure |
| --- | --- |
| Access | Every route under `(dash)` is behind `requireUser()`, which re-reads the account from the database on each request — deactivating a user revokes access immediately, not at session expiry. |
| Authorisation | Settings, navigation, redirects, SEO and users require `requireAdmin()`. |
| Sessions | Signed JWT in an `httpOnly`, `sameSite=lax`, `secure`-in-production cookie. |
| Brute force | Two rate-limit buckets per sign-in: per account (8 / 15 min) and per IP (25 / 15 min). One stops an account being ground down, the other stops one client spraying many addresses. |
| Enumeration | Every failed sign-in returns the same message and takes the same time, whether the address exists, the password is wrong, or the account is deactivated. |
| Indexing | `X-Robots-Tag: noindex` on every response plus `robots` metadata. |
| Framing | `X-Frame-Options: DENY` and `frame-ancestors 'none'`. |
| XSS | A Content-Security-Policy on every response. `unsafe-eval` is allowed **in development only**, because React's dev build needs it; production is strict. |
| Secrets | The SMTP password is never rendered back into the form. Submitting the field blank keeps the stored value rather than clearing it. |

---

## Deploying

A standard Node app. Any host that runs `next start` works.

```bash
npm ci
npm run build
npm start          # listens on 3001; set PORT to change it
```

Set `DATABASE_URL` and `SESSION_SECRET` in the host's environment. Never
commit them.

If the host builds from this repository, set the **root directory** to
`admin/`. This app is self-contained — it does not read anything from the
parent folder at build or run time.

**Put it behind something.** It is a login form on the public internet
otherwise. An IP allowlist, a VPN, or your host's access control in front of
it all work, and none of them require changes here.

---

## Status

Built and working:

- Authentication, first-run setup, sign-out, session handling
- Dashboard: live counts, latest enquiries, and a launch checklist that
  reports exactly which settings still block going live
- Settings: every setting in the catalogue, grouped, generated from
  `SETTING_DEFS` so adding one is a single-line change

Still to build:

- Pages and the section editor
- Fleet, services, destinations, packages, articles, FAQs, gallery,
  testimonials, tariffs
- Enquiry inbox and status tracking
- Navigation, redirects, SEO panel, users
- Media uploads
- Password reset
