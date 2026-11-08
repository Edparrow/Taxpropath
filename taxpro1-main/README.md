# Taxpropath

taxpropath.com sells self-study CPE/CE courses to accounting, tax, finance and
HR professionals. Next.js (App Router), Tailwind CSS v4, Supabase and PayPal.

A visitor picks a course, can add an e-Transcript and/or Slides, pays with
PayPal (an account is required), and then opens their portal at
portal.taxpropath.com, where the course plays.

## Getting started

```bash
npm install
npm run dev
```

Without Supabase credentials the site still runs and shows the sample courses
in `src/lib/data/sample-courses.ts`. Sign-in, checkout and the admin panel need
a database.

## Database

1. In the Supabase SQL editor, run the files in `supabase/migrations/` in order
   (`0001`, `0002`, `0003`) once on an empty database. Future changes go in new
   numbered files (`0004_...`, and so on). The order pages, Error Monitor and
   saved carts need `0003`.
2. Optional, for development only: load the sample courses with
   `npx tsx scripts/seed-catalog.ts`. The add-on prices in that data are
   placeholders.
3. Put the project values in `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

`supabase/reset_taxpropath.sql` drops every TaxProPath table so the schema can
be re-run from scratch. It deletes all data, so only use it on test databases.
It leaves other sites sharing the database (webtiq_* tables) and auth.users
alone.

## Admin panel

The admin panel is separate from the shop. It lives at `/admin-login`, and
customer accounts can't sign in there. Admin accounts are rows in
`admin_users`. Their passwords are stored by Supabase Auth.

- A **Super Admin** sees everything and manages the other admins on
  **Access Level** (`/admin/access`).
- Every other admin gets one of three levels for each sidebar section: no
  access, **view** (lists, details, downloads), or **edit** (view plus create,
  change, delete, sync). The server checks this on every page and action
  (`requireAdmin(section, level)` in `src/lib/admin-auth.ts`). The section
  list is in `src/lib/admin/permissions.ts`.
- Every admin change is recorded in **Activity Logs**.
- Orders are split into Completed, Order Sheet (with a portal access /
  certificate checklist), Failed, and Abandoned Analysis. You can also enter a
  manual order.
- Google Sheets sync posts rows to an Apps Script web app. Set
  `GOOGLE_SHEETS_URL` (orders and users) and `GOOGLE_SHEETS_ABANDONED_URL`.
- **Completed Orders**: edit an order (a manual order fully; a PayPal order only
  its customer details and remarks), resend the confirmation email, download
  the invoice as a PDF, and delete. Delete is a soft delete confirmed by typing
  your own name; the order then disappears from every list, export, the
  customer's account and `get_orders`.
- **Dashboard**: today / this month / all-time revenue and orders, a 30-day or
  12-month chart, what people buy (Self-Study / e-Transcript / Slides), top
  courses, needs-attention items and quick buttons.
- **Registered Users** shows each customer's current cart (saved while they're
  signed in), their paid orders, and can be searched.
- **Error Monitor** (Super Admin only) lists server crashes, failed server
  actions and API calls, database errors, email failures, browser script
  errors, files that failed to load, failed requests and 404s — with who it
  happened to and the reference shown to the visitor. Entries older than 30
  days are removed automatically.
- Banner images can be uploaded (WebP or PNG, max 5 MB). They go to a public
  Supabase Storage bucket, `site-images`, which the first upload creates on its
  own. The server checks the file's actual bytes, not just its name.

The first Super Admin is created once in the SQL editor, using an existing
login:

```sql
insert into admin_users (id, name, email, is_super)
select id, 'Super Admin', email, true from auth.users
where email = 'you@example.com';
```

## Customer emails and the customer journey

Sent over SMTP once these are set (nothing is sent without them):

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=support@taxpropath.com
SMTP_PASS=...
MAIL_FROM="Taxpropath <support@taxpropath.com>"
MAIL_BCC=support@taxpropath.com     # optional copy of order emails
NEXT_PUBLIC_SITE_URL=https://taxpropath.com
```

| Step | What happens |
|---|---|
| Sign-up confirmed | Welcome email, registered-user row in Google Sheets (once per account) |
| Checkout started | Abandoned row in Google Sheets |
| PayPal window closed without paying | "Registration Incomplete" email with links back to the courses (once per order) |
| Payment captured | Order confirmation email (BCC `MAIL_BCC`), order rows in Google Sheets |
| Manual order | Confirmation email if the box is ticked |

Customers have **My Account** (`/account`): profile (editable), My Orders,
Change Password, and a link to the learning portal. A forgotten password is
reset at `/reset-password` from the emailed link.

## How a purchase works

- Each course has one `SELF_STUDY` price and up to two add-ons
  (`ETRANSCRIPT`, `SLIDES`) in `pricing_options`.
- The cart lives in localStorage and holds one line per course.
- `/api/paypal/create-order` re-prices the cart from the database. Prices sent
  by the browser are ignored. The pending order is recorded through the
  `place_order` RPC.
- `/api/paypal/capture-order` settles it through `mark_order_paid`, which
  refuses to mark an order paid if the captured amount doesn't match.

## Integrations

These do nothing until their keys are set in `.env.local`:

| Route | Used by | Key |
|---|---|---|
| `GET /api/get_orders` | CRM pulls paid orders | `ORDERS_API_KEY` |
| `GET /api/get_registered_users` | CRM pulls customers (no passwords) | `ORDERS_API_KEY` |
| `GET /api/get_failed_orders` | CRM pulls unpaid checkouts | `ORDERS_API_KEY` |
| `GET /api/get_abandoned_analysis` | CRM pulls unpaid checkouts + per-customer summary | `ORDERS_API_KEY` |
| `GET /api/get_services` | Course engine mirrors the catalog | `SERVICES_API_KEY` |
| `POST /api/create_service` | Course engine pushes a course | `SERVICES_API_KEY` |
| doorbell after capture | Course engine | `ENGINE_HOOK_URL`, `ENGINE_HOOK_SECRET` |

## Brand

Colours and type come from the logo (`public/logo.png`): a green (`#16a34a`) to
blue (`#0066cc`) gradient on a warm cream background with a dark navy footer,
set in Montserrat. The tokens live in `src/app/globals.css`.
