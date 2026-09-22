# Studio Desk

Bookings, students, enquiries and WhatsApp follow-ups for makeup artists. Each artist signs up and gets
their own private studio.

Built with Next.js 15 (App Router), Supabase (Postgres, Auth, Row Level Security) and, optionally, the
Claude API to read pasted enquiries.

## What it does

- **Accounts.** Email and password sign-up. Every sign-up creates a studio; data is isolated per studio by
  database-level Row Level Security, not just by the app code.
- **Today.** Bookings in the next 7 days, money still to collect, active students, enquiries to confirm,
  double-booking warnings, and a "needs a nudge" list.
- **Bookings.** Bridal, engagement, party and other events, with status, trial date, venue, total and a payment
  history. `paid` is always the sum of the payment rows (a database trigger keeps it correct).
- **Students.** Course, batch, fee, instalments and a fee progress bar.
- **Inbox.** Paste an Instagram or WhatsApp enquiry. With an Anthropic key, Claude reads out the name, date,
  service and venue; either way you convert it to a booking or student in one tap.
- **WhatsApp and Instagram.** One-tap WhatsApp messages (confirmation, reminder, balance, review request) and
  Instagram DM links. Message wording is editable per studio in Settings. You press send yourself.
- **Sources.** Every client records how they arrived, with a "where clients come from" summary.
- **CSV export** of bookings and students.

## Set it up

1. **Create a Supabase project** at https://supabase.com (the free plan is enough to start).
2. **Create the tables.** Open *SQL Editor > New query*, paste the whole of `supabase/schema.sql`, and run it.
3. **Sign-up settings.** In *Authentication > Providers > Email*, decide whether new users must confirm their
   email. Switch confirmation off while you test, and on before you go live.
4. **Add your keys.** Copy `.env.example` to `.env.local` and fill in the project URL and anon key from
   *Project settings > API*. `ANTHROPIC_API_KEY` is optional (see below).
5. **Run it.**

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000, create a studio, and add a booking.

### Reading enquiries with AI (optional)

Set `ANTHROPIC_API_KEY` in `.env.local`. The Inbox then shows a **Read with AI** button. The model defaults
to `claude-opus-5`; set `ANTHROPIC_MODEL` to a smaller model to lower the cost per message. Without a key the
button is hidden and **Save without reading** still works. Pasted messages are sent to Anthropic when this is
on, so mention it in your privacy policy.

## Deploy

Push the folder to GitHub and import it in Vercel. Add the same environment variables in the Vercel project
settings **before the first build** (the `NEXT_PUBLIC_` values are baked in at build time). Then add your
production URL under *Authentication > URL configuration* in Supabase.

## How it is put together

| Path | What lives there |
|---|---|
| `supabase/schema.sql` | Tables, triggers, Row Level Security policies, default message templates |
| `src/middleware.ts`, `src/lib/supabase/` | Session refresh and redirect to sign-in |
| `src/app/(app)/actions.ts` | Every write (server actions). All queries also filter by studio |
| `src/app/(app)/*` | Today, Inbox, Bookings, Students, Settings pages |
| `src/lib/messages.ts` | Message templates, WhatsApp and Instagram links |
| `src/lib/ai.ts` | Enquiry reader (Claude API, structured output) |

## Status

Checked so far: `npm run typecheck` and `npm run build` pass; the sign-in gating and login pages were run
locally; the date, currency, template and link logic has unit checks; `schema.sql` parses as valid PostgreSQL.

**Not yet run end to end against a live Supabase project.** Do a full walkthrough after step 5: sign up two
separate accounts and confirm neither can see the other's data, create a booking with an advance, record a
payment, convert an Inbox message, and edit a template.

## Before you sell it

- **Automatic messaging.** WhatsApp is click-to-send only. Auto-replies, scheduled reminders and reading DMs need
  the WhatsApp Business Platform and the Instagram messaging API (through Meta directly or a provider), with
  approved templates and customer opt-in.
- **Billing.** No subscriptions yet. Razorpay is the usual choice in India.
- **Legal.** Add a privacy policy and terms; you store clients' names and phone numbers.
- **Staff logins.** The schema has a `staff` role and multi-member studios, but no invite screen yet.
- **Dates use India time** (IST) throughout.
- **Dependency note.** `npm audit` reports advisories in PostCSS bundled inside Next.js 15. They affect build-time
  CSS processing of untrusted input, which this app does not do. Upgrading to Next 16 clears them.
