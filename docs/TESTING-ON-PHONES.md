# Test the app on iPhone and Android

Everything happens in the browser and on your phones; nothing to install on a computer.

```
Phones (Expo Go)  ←  app published to Expo by GitHub Actions on every push to main
       ↓
API + Postgres on Railway
```

Allow about 20 minutes the first time. Steps 1–3 are once only.

## 1. Host the API on Railway (≈10 min)

1. Go to **railway.com** → *Login* → **Login with GitHub**.
2. **New Project** → **Deploy from GitHub repo** → pick **jessinmacdon/jap.express**. If it isn't listed, click *Configure GitHub App* and give Railway access to the repo.
3. In the project, click **+ Create** (or *New*) → **Database** → **PostgreSQL**. Wait until it is green.
4. Click the **jap.express** service (not Postgres) → **Settings**:
   - **Source → Root Directory:** `/server`
   - **Build → Watch Paths:** `/server/**` (so app-only changes don't redeploy the API)
   - **Deploy → Custom Start Command:** `npm start`
   - **Deploy → Pre-deploy Command:** `npx prisma migrate deploy && npx tsx prisma/seed-if-empty.ts`
   - **Deploy → Healthcheck Path:** `/health`
   - Leave **Config-as-code → Railway Config File** empty (Railway deprecated config files; `server/railway.json` just documents these same values).
   - **Networking → Public Networking → Generate Domain** (accept the port Railway suggests; the server listens on whatever port Railway gives it). Copy the URL, e.g. `https://jap-express-production.up.railway.app`.
5. Same service → **Variables** → **Raw Editor**, paste, then replace the JWT_SECRET value with any 40+ random characters:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=replace-with-a-long-random-string-of-letters-and-digits
   NODE_ENV=production
   OTP_DEV_CODE=482913
   DEMO_AUTOREPLY=true
   UPLOAD_DIR=/data/uploads
   ```
6. Right-click the service (or ⌘K) → **Attach Volume** → mount path **`/data`**. This keeps uploaded photos across deploys.
7. Click **Deploy** (or wait for the automatic deploy). The first deploy creates the tables and loads the demo data.
8. Check it: open `https://<your-domain>/health` in a browser. You should see `{"ok":true}`.

## 2. Connect Expo to GitHub (≈5 min)

1. **expo.dev** → sign in → avatar → **Account settings** → **Access tokens** → **Create token** (name it `github-actions`). Copy it.
2. **github.com/jessinmacdon/jap.express** → **Settings** → **Secrets and variables** → **Actions**:
   - **Secrets** tab → *New repository secret* → name `EXPO_TOKEN`, value: the token.
   - **Variables** tab → *New repository variable* → name `API_URL`, value: your Railway URL from step 1.4 (no trailing slash).
3. **Actions** tab → **App preview (Expo Go)** → **Run workflow** → *Run*. It takes 3–5 minutes. When it's green, open the run: the **Summary** shows the link.

After this, every push to `main` that changes `app/` republishes automatically.

## 3. Open it on your phones

1. Install **Expo Go** (App Store / Play Store) on each phone.
2. Open Expo Go → **Profile** → sign in with the **same Expo account** as the token.
3. **Home** → *Projects* → **japexpress** → branch **main** → tap the latest update.
   Or open the link from the workflow summary on the phone and tap *Preview*.
4. Sign in with **+237 6 77 12 34 56**, code **482913**. Any other number signs up a new account with the same code.

## Good to know

- **Demo code:** with `OTP_DEV_CODE` set, *every* number accepts 482913. Fine for private testing; remove the variable before real users sign up (codes then appear in the Railway logs until an SMS provider is connected).
- **Reset the demo data:** add variable `RESEED_DEMO=true`, redeploy, then delete the variable (otherwise every deploy wipes the data).
- **Maps** need the phone to reach unpkg.com and openstreetmap.org (normal on mobile data or home Wi-Fi).
- **Expo Go shows its own icon and name**, not ours. A real installable build (TestFlight / Play internal testing) comes later and needs an Apple Developer account for iOS.
- **Troubleshooting:** Railway deploy failing → service → *Deployments* → *View logs*. Workflow failing → the red step's log usually says which setting is missing.
