# Taxpropath

Rebuild of taxpropath.com — a CPE/CE webinar platform for accounting, tax, finance,
and HR professionals. Next.js (App Router) + Tailwind CSS v4 + Supabase.

## Getting started

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000 without any configuration. Supabase-backed
features (auth, order persistence, contact form storage) stay inert until you supply
real credentials — forms still submit and validate, they just don't write to a
database.

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the example env file and fill in your project values:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

3. Run the schema in the Supabase SQL editor:

   ```
   supabase/migrations/0001_init.sql
   ```

   It creates the catalog tables (`presenters`, `webinars`, `pricing_options`),
   commerce tables (`orders`, `order_items`), `profiles` wired to `auth.users`, a
   `contact_messages` table, and row-level security policies for all of them.

4. Restart the dev server. Auth, checkout persistence, and the contact form activate
   automatically.

## Content

Webinar copy, presenters, dates, and the 11 pricing tiers per session are transcribed
from the existing site into `src/lib/data/webinars.ts`. Pages read through the
accessors at the bottom of that file (`getWebinars`, `getWebinar`, `getFeatured`,
`getRelated`), so swapping in Supabase queries later means changing only that module.

### Known content gap

**Performance Management – Food for Thought** is intentionally omitted. That page was
already broken on the live site — blank description, no pricing options, and an epoch
fallback date (31 Dec 1969). Only its title, presenter (Peter Walmsley), and date
(08 Jun 2026) exist anywhere in the source. Add the real copy and prices to
`src/lib/data/webinars.ts` to restore it.

## Payments

Checkout is deliberately UI-only. `POST /api/orders` re-resolves every line item
against the catalog and recomputes the total server-side — client-supplied prices are
never trusted — then records the order and returns. No payment processor is wired up
and no card details are collected anywhere in the app.

## Brand

Colors and type are derived from the existing logo (`public/logo.png`): a green
(`#16a34a`) to blue (`#0066cc`) gradient over a warm cream canvas and dark navy
footer, set in Montserrat. Tokens live in `src/app/globals.css`.
