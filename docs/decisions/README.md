# Decision log

Dated record of product and technical decisions, newest first. Add an entry whenever something is decided; link the PR or session when there is one.

## 2026-10-09 — Phone testing via Expo Go + Railway

- **Decision:** test on iOS and Android with Expo Go. The app is published to Expo (EAS Update) by GitHub Actions on every push to `main`; the API and Postgres run on Railway.
- **Why:** the founder's work machine can't install tools or run anything locally, so everything has to happen in the cloud and the browser. Expo Go needs no Apple Developer account.
- **Notes:** Railway has no African region; Western Europe suits the diaspora and is acceptable from Cameroon for testing. Uploads use a Railway volume until object storage (S3/R2) is wired up. The fixed demo OTP is on for testing only.

## 2026-10-09 — Repository layout and branches

- **Decision:** `main` is the default and production branch, with three top-level folders: `server/` (API), `app/` (Expo app), `docs/` (design, chats, decisions, guides). One repository for app and API.
- **Considered:** separate `main` (records) and `master` (code) branches; separate repos. Rejected: `main`/`master` are easily confused, records drift from the code they describe, and one repo keeps API and app changes in the same commit.
- **Branches are kept** until explicitly retired (e.g. `feat/app-and-api-scaffold`).

## 2026-10-09 — Brand name: on hold

- **History:** JapExpress (design) → Jap.Express → Auto.Express → on hold.
- **Why on hold:** "Jap" is an ethnic slur in English-speaking markets (UK/US/AU diaspora, app-store and ad review). "Auto Express" is an established UK car magazine (autoexpress.co.uk): likely trademark and search conflict. A trademark search (OAPI, UK IPO, EUIPO) should precede buying a domain or logo.
- **Until decided:** code keeps "JapExpress" and technical IDs `japexpress` / `com.japexpress.app`. The bundle ID must be final before the first store build.
- **Domain:** `autoexpress.express` advised against (repetitive, obscure TLD). Prefer a `.cm` domain or a `.com` variant once the name is final.
- **Logo:** pending; the two Jap.Express logos supplied were withdrawn.

## 2026-10-08 — Stack

- **App:** Expo SDK 57 + Expo Router + TypeScript (iOS, Android, web). **API:** Fastify 5 + Prisma 7 + PostgreSQL. The app talks to the API (no local mock data).
- Built from the Claude Design handoff `docs/design/JapExpress v3.dc.html`; product decisions behind it are in `docs/chats/`.

## 2026-10-08 — Business model (from the design conversation)

- **Rentals:** peer-to-peer, paid per booking; renters pay through the platform (payment, deposit, renter checks); hosts hand over keys and are paid by Mobile Money.
- **Sales:** classifieds, paid per listing (Basic / Featured, 30 days); buyers and sellers deal directly.
- **Placeholder figures to confirm:** renter fee 8%, host fee 15%, weekly discount 10%, listing packages 5 000 / 15 000 FCFA, earnings estimate rates (`server/src/lib/pricing.ts`).

## Open items

- Final brand name, trademark search, domain, logo.
- Bundle / package IDs (before the first store build).
- Real providers: SMS OTP, MTN MoMo / Orange Money / card / PayPal, translation, KYC, object storage, push notifications.
- Fee figures above.
