# JapExpress

**Rent it. Buy it. Drive it.** A car rental and sales marketplace for Cameroon: peer-to-peer rentals (Turo/Airbnb-style, paid per booking through JapExpress) and used-car classifieds (mobile.de-style, paid per listing), in one app with one account, in English and French.

| Folder | What |
| --- | --- |
| [`app/`](app/) | Mobile app: Expo SDK 57, Expo Router, TypeScript (iOS, Android, web) |
| [`server/`](server/) | API: Fastify 5, Prisma 7, PostgreSQL, zod |
| [`project/`](project/) | Claude Design handoff. `JapExpress v3.dc.html` is the source design |
| [`chats/`](chats/) | Design conversation: the product decisions behind v3 |

## Run it locally

Requires Node 22 and PostgreSQL 16 (or Docker).

```bash
# 1. Database
docker compose up -d                      # or point DATABASE_URL at your own Postgres

# 2. API → http://localhost:4000
cd server
cp .env.example .env
npm install                               # also generates the Prisma client
npx prisma migrate deploy
npm run db:seed                           # sample data from the design
npm run dev

# 3. App
cd ../app
npm install
npx expo start                            # i = iOS sim, a = Android emulator, w = web, or Expo Go
```

**Demo login:** `+237 6 77 12 34 56`, code `482913` (the fixed dev OTP, see `OTP_DEV_CODE`). Nadine is a renter with an upcoming trip, a host with two cars and pending requests, and a buyer with an open offer. Any other number signs up a new account with the same code.

Checks: `server`: `npm run typecheck && npm test` (integration tests against the database, reseeds it). `app`: `npx tsc --noEmit && npx expo lint`.

## What's built

All screens from the v3 design, wired to the API:

- **Welcome & onboarding**: Mount Cameroon hero, EN/FR switch, three "travel in style" slides.
- **Sign up / sign in**: phone with diaspora country codes, 6-digit OTP (SMS paste, resend timer), name/email/goals, ID / licence / selfie verification with photo upload.
- **Home hub**: Rent it · Buy it · List your car tiles, airport shortcut, recent searches, featured strip, hosting and selling promos.
- **Search**: one filter sheet for both sides: location search, dates, delivery, sliders, make/model, year, mileage, transmission, fuel, seats, condition, seller type. Rent and Buy results with quick chips, list/grid for Buy, no-results state.
- **Rental listing**: carousel, host and verification badge, specs, translatable description, availability calendar with booked days, pick-up map with Google/Apple Maps directions, "ask for another spot", delivery spot picker.
- **Sale listing**: price and tags, specs table, viewing-location map, seller card, safety note, similar listings, message seller, make an offer.
- **Checkout**: dates, pick-up or delivery spot, price breakdown (rate × days, weekly discount, delivery, 8% fee, deposit), MTN MoMo / Orange Money / card / PayPal, waiting-for-approval state, then confirmed (verified renters) or request sent (others).
- **Saved** (rentals and sales together), **Activity** (Trips, Offers, My listings with earnings, payouts and accept/decline; reopens on the last-used tab), **Inbox** (chat with auto-translation, original on long-press, quick replies, photos; notifications), **Profile** (verification, language, auto-translate, earn card, log out).
- **List your car**: rent it out vs sell it, hosting intro with an earnings estimator, 5-step listing flow with an 8-photo minimum, map pin placement, blocked dates, delivery options, and MoMo payout (rent) or a paid Basic/Featured package (sell).
- Empty states for Saved, Trips (with the host banner), Offers, My listings, Messages, Notifications and search.

## Stubbed, to finish later

Each lives behind one interface on the server, with a `TODO` at the swap point:

| Area | Now | Where |
| --- | --- | --- |
| SMS / WhatsApp OTP | Logged to the console; fixed dev code | `server/src/services/sms.ts` |
| Payments (MoMo, Orange Money, card, PayPal) | Sandbox: "approved" 1.5 s after initiation; webhook endpoint ready | `server/src/services/payments.ts`, `POST /webhooks/payments/:provider` |
| Host payouts | Sandbox, marked sent immediately | same |
| Translation | Seeded translations only; new text shows the original | `server/src/services/translation.ts` (DeepL / Google) |
| ID / licence / selfie checks | Auto-approved after 1.3 s | `server/src/routes/me.ts` (e.g. Smile ID) |
| File storage | Local `server/uploads/` | `server/src/services/storage.ts` (S3 / R2, private bucket for KYC) |
| Real-time chat, push | Polling every 2.5 s; in-app notifications only | `app/src/api/hooks.ts`, `server/src/services/notify.ts` |
| Map tiles | Public OpenStreetMap tiles | `app/src/components/ui/mapHtml.ts` |
| Cancellations and refunds | Status change only | `POST /bookings/:id/cancel` |
| Seller offer replies, edit-profile, help, settings | API exists for offers; screens not built | `server/src/routes/social.ts`, Profile rows |

**Placeholder business numbers**: the 8% renter fee, 15% host fee, 10% weekly discount and 5 000 / 15 000 FCFA listing packages are in `server/src/lib/pricing.ts`. The earnings-estimate rates and the "up to 450 000 FCFA a month" copy also came from the prototype and need your real figures.

## Design notes

The app follows the design's Modernist system as you iterated it: Archivo, navy `#1A3C6E` / orange `#E87722` on `#F8F9FA`, strong 2px rules between sections, flush-left button labels, and the rounded corners you asked for (≤ 15px). All copy, in both languages, was extracted verbatim from the prototype (`app/src/i18n/*.json`). Listings without uploaded photos keep the prototype's striped placeholder.
