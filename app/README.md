# JapExpress app

Expo (SDK 57) + Expo Router + TypeScript. Runs on iOS, Android and web from one codebase.

```bash
npm install
npx expo start          # press i / a / w, or scan the QR code with Expo Go
npx tsc --noEmit        # typecheck
npx expo lint           # lint (set EXPO_OFFLINE=1 behind a restrictive proxy)
```

The API must be running (see `../server`). Sign in with **+237 6 77 12 34 56** and code **482913**.

## Layout

| Path | What |
| --- | --- |
| `src/app/` | Routes (every file is a screen). `(tabs)/` holds the bottom bar: Home, Saved, Activity, Inbox, Profile, plus the hidden `results` screen |
| `src/app/auth/` | Phone → OTP → details → verification → done (sign-up), phone → OTP (sign-in) |
| `src/components/ui/` | Design-system primitives: `Txt`, `Button`, `Chip`, `Segmented`, `Toggle`, `Field`, `SelectField`, `Sheet`, `Calendar`, `RangeSlider`, `MapView`, `Photo`… |
| `src/components/` | Product components: listing cards, search bar, filter sheet, tab bar, payment rows, carousel |
| `src/api/` | Typed fetch client, response types, React Query hooks |
| `src/state/` | Session (token, profile, language), search (mode, place, dates, filters), UI (toast, filter sheet) |
| `src/i18n/` | `en.json` / `fr.json` extracted verbatim from the design, plus `extra.ts` for strings the prototype didn't need |
| `src/theme/tokens.ts` | Colours, radii, fonts from the design |

## Notes

- Maps are Leaflet + OpenStreetMap inside a WebView (iframe on web). The pin is fixed at the centre; dragging the map moves the spot. Swap the tile URL in `src/components/ui/mapHtml.ts` for a commercial provider before launch.
- Photo uploads go through `src/lib/upload.ts` (presign → PUT). In development the API stores files locally.
