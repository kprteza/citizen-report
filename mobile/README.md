# Citizen Report — Mobile App

Cross-platform (iOS + Android) civic nuisance reporting app built with Expo /
React Native + TypeScript. Anyone can install it, grant location access, pick an
issue type, optionally attach a photo, and submit a report to the backend service.

## Features

- Requests foreground location permission on launch; a report is gated on having
  a location.
- One-tap issue selection: illegal garbage dumping, loud music / noise, loud
  biker gang, accident, illegal barbecue, bear sighting (bilingual EN + 日本語).
- Optional photo from camera or library.
- Authenticated submission (bearer token + per-install device id) to the service.
- Silently discards duplicate reports from the same device at the same location,
  both client-side (before the network) and server-side.

## Architecture

Framework-agnostic, unit-tested core is separated from the React Native UI:

```
src/
  domain/     issue types, geo distance (pure)
  dedupe/     client-side duplicate detection (pure, tested)
  api/        report API client with injectable fetch (pure, tested)
  hooks/      useLocation, usePhoto, useDeviceId (Expo/RN)
  components/ IssueTypeGrid
  screens/    ReportScreen
```

## Run

```bash
cd mobile
npm install
npm start          # Expo dev server (press i / a / w for iOS / Android / web)
npm run web        # run in a browser
npm run typecheck
npm test           # pure-logic unit tests (dedupe + API client)
```

Point the app at a backend with Expo public env vars (defaults shown):

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000 \
EXPO_PUBLIC_API_TOKEN=dev-mobile-token \
npm start
```

The token must match one configured in the service `API_TOKENS`.
