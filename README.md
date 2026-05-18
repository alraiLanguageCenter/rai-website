# Rai Language Center — Bilingual website + admin

Bilingual (AR/EN) marketing site with a Supabase-backed admin panel for **announcements / flyers**, **schedule (courses & exams)**, **assessment bookings with email + WhatsApp notifications**, and a **free placement test** with admin-editable questions, levels, and book recommendations.

**Tagline:** Learn. Connect. Succeed. _Since 1995._
**Brand:** RLC green `#0E5132` + gold `#C9A24A` on cream.

## Stack

- **Next.js 16** App Router · React 19 · TypeScript strict
- **Tailwind CSS 4** with CSS-variable design tokens
- **next-intl** (AR/EN, locale routing, RTL/LTR)
- **Framer Motion + Lenis** smooth scroll
- **Supabase** Postgres + Auth (magic link) + Storage
- **Resend** (email) · **WhatsApp Cloud API** (notifications)
- **React Hook Form + Zod** for all forms
- **Embla Carousel** for Wall of Wins

## Public site

| Anchor | Section |
|---|---|
| `#hero` | Hero with kinetic "Learn / Connect / Succeed" + animated RLC logo backdrop |
| — | Brand strip with gold sweep curve (echoes the RLC banner) |
| — | Trust strip — counters |
| `#story` | Founder's story (Nouha Raei + portrait) |
| `#announcements` | Auto-rotating announcements/flyers (Supabase) |
| `#courses` | 4 course cards with modal details |
| `#why` | Why-Us bento grid |
| `#schedule` | Tabs: Courses · Exams (Supabase) |
| `#wins` | Wall of Wins carousel |
| `#testimonials` | Snap-scroll testimonials |
| `#assess` | Free placement-test wizard |
| `#book` | Assessment booking form |
| `#contact` | Contact form + address + 5 social links |

## Admin (`/admin`)

Magic-link login at `/admin/login`. Once signed in, the admin sidebar shows:

- **Announcements** — create / edit / publish / unpublish / upload flyer / set CTA
- **Schedule** — courses & exams CRUD, capacity tracking, status pills
- **Bookings** — pending list, approve with chosen slot + room → triggers email + WhatsApp
- **Quiz CMS** — questions, CEFR levels, book recommendations
- **Leads** — contact form submissions and placement attempts

Allow-list: a user must have a row in `admin_users` to access admin tools. Insert one after their first sign-in:

```sql
insert into admin_users (id, email, role)
values ('<auth-user-uuid>', 'you@email', 'admin');
```

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

### Required env vars

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client (RLS) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin |
| `IP_HASH_PEPPER` | Salt for hashing IPs |
| `RESEND_API_KEY` / `RESEND_FROM` | Email notifications |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` | WhatsApp Cloud API |

### Apply schema

In the Supabase SQL editor, run `supabase/migrations/20260519000000_init.sql`. It creates 9 tables, RLS policies, and seeds CEFR levels + sample questions + starter recommendations.

### Create flyers storage bucket

In Supabase Storage create a **public** bucket called `flyers` (anon read, authenticated write).

## Scripts

```bash
pnpm dev         # local dev
pnpm build       # production build
pnpm typecheck   # tsc --noEmit
pnpm lint        # next lint
pnpm test:e2e    # Playwright
```

## Deploy to Cloudflare

```bash
pnpm exec opennextjs-cloudflare build
pnpm exec opennextjs-cloudflare deploy
```

`wrangler.jsonc` is already included.
