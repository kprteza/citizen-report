# Citizen Report — Product Requirements

Living document of requirements so nothing is lost between iterations. Status
tags: **DONE**, **IN PROGRESS**, **PLANNED**.

Product: a civic nuisance reporting platform for Japan. Residents install a mobile
app, report local issues (with location and optional photo), and a backend
correlates related reports and alerts local police via social media (X).

---

## Phase 1 — Foundation — **DONE**

### Mobile app (Expo / React Native, iOS + Android)
- Requests location permission on launch; submitting requires a location.
- Report button + selection of issue types:
  `illegal_garbage_dumping`, `noise_nuisance`, `biker_gang`, `accident`,
  `illegal_barbecue`, `bear_sighting`.
- Optional photo (camera or library).
- Authenticated submission (bearer token + per-install device id).
- Silently discards duplicate reports from the same device at the same location
  (client-side, backed by server-side dedupe).

### Backend service (clean architecture — ports & adapters)
- `POST /api/v1/reports` (auth), `GET /api/v1/issue-types`, `GET /health`.
- Persistence port with **RDS/Postgres** (default) and **DynamoDB** adapters;
  switching backends is a composition-root change only.
- Image storage (S3), social poster (X), map renderer, police directory, and
  authenticator are all ports with safe fakes by default.
- Correlation:
  - **Biker gang (movement):** correlate a new sighting with earlier ones within
    a search radius (10–20 km) only when the observation times are consistent
    with a single group physically travelling between the two points. On a match,
    render a route map and post to X tagging local police.
  - **Garbage dumping / other stationary types (colocation):** 2+ same-type
    reports at the same location are correlated and posted to X.
  - **Duplicates:** same device + type + location within a window are discarded.
- Japan-first configuration (units, timezone, prefectural police handles).

---

## Phase 2 — App shell & core screens — **DONE**

1. **Bottom tab bar** with four tabs: **Report**, **History**, **Dashboard**,
   **Donate**. The selected tab's icon + label are highlighted.
2. **Fast report flow (two steps):**
   - Step 1: a list of report types — one tap selects and advances.
   - Step 2: a details page with an **optional photo preview in the top half** and
     an **optional text box in the bottom half**.
   - **Submit** button is **full-width, red, positioned just above the bottom
     tab bar**.
3. **Report history:** locally cached list of the device's reports; each entry
   links to the social media post if one was created for that report.
4. **Dashboard v1:** aggregates reports by type for **all time, month, week, day**.
   > Superseded by the **Map Dashboard** in Phase 2.1 below.

---

## Phase 2.1 — Map Dashboard — **PLANNED** (new)

Redesign the Dashboard into a map-first view styled after the attached mockups
(a weather-app style). Reference mockups (in `docs/mockups/`):

- `dashboard_national_map.png` — National scope: dark map with data overlay,
  scope tabs, info card. ![National](mockups/dashboard_national_map.png)
- `dashboard_local_map.png` — Local scope: zoomed to the user's area with the
  jurisdiction boundary highlighted and a summary card.
  ![Local](mockups/dashboard_local_map.png)
- `dashboard_map_layer_view.png` — Map with a selected layer, a legend/scale row
  under the title, a floating layers button (bottom-right), and a status/clock.
  ![Map layer view](mockups/dashboard_map_layer_view.png)
- `dashboard_layer_selector.png` — The **"Select Layer"** bottom sheet that
  **expands from the bottom**, listing layers with icons; the active layer is
  highlighted. ![Layer selector](mockups/dashboard_layer_selector.png)

### Requirements

1. **Map-first dashboard**: full-screen dark map (Japan) that plots reports as
   markers/overlay, replacing the current list-style dashboard.
2. **Scope tabs** at the top: **National** / **Local** / **[current area]**
   (Local zooms to the user's area and highlights the local jurisdiction, per
   `dashboard_local_map.png`).
3. **Layer selector to choose report type**:
   - A floating **layers button** (bottom-right) opens an **expanding "Select
     Layer" bottom sheet** (per `dashboard_layer_selector.png`).
   - The sheet lists the report types as layers (each with an icon); selecting
     one filters the map to that report type. The **active layer is highlighted**.
   - Include an "All types" option in addition to the six individual types.
   - (This is the "layer dropdown to select report type".)
4. **Legend / scale row** under the layer title (e.g. a color scale or per-type
   legend), per `dashboard_map_layer_view.png`.
5. **Bottom info card** summarizing the current scope/layer (e.g. counts,
   most recent report), per the mockups.
6. **Data rule — biker gang de-duplication of correlations:** when displaying or
   counting **biker gang** reports on the dashboard/map, **use only the first
   (originating) report of each correlated group and ignore the correlated
   follow-on sightings.** A single moving gang must appear as one origin point /
   be counted once, not once per correlated sighting. (Other report types are
   unaffected.)

### Open questions / assumptions (please confirm)
- **Platform:** these mockups are phone screens — assume the **mobile app**
  Dashboard tab (not the web client). Confirm if the web `client/` dashboard
  should also change.
- **Map provider:** Expo/React Native needs a map. Options: `react-native-maps`
  (Google/Apple tiles; limited on Expo web) or a WebView/MapLibre approach.
  Proposed: `react-native-maps` for native + a graceful fallback on web.
  Confirm preference, and whether an API key/tiles provider is available.
- **Data source:** the dashboard currently reads **local history** only. A map of
  all reports across Japan implies a **backend read API** (e.g.
  `GET /api/v1/reports?issueType=...&bbox=...`), which does not exist yet.
  Confirm whether the map shows (a) only this device's reports, or (b) all
  reports from the service (requires a new list endpoint).
- **"First report" for biker gang:** confirm the correlation grouping is computed
  server-side (the service knows the correlated `matchedReportIds`) and exposed
  so the client can collapse a group to its origin; otherwise define the client
  rule.
- **Legend meaning:** the mockup legend is an earthquake intensity scale. For us,
  propose the legend encodes **report type** (color per type) or **severity**.
  Confirm which.

---

## Phase 3 — **PLANNED**

1. **AI image processing:** blur sensitive data (faces, license plates, etc.) in
   attached photos **before** posting to social media.
   - Implement behind a port (e.g. `ImageRedactor`) so the model/provider is
     swappable; runs in the backend processing pipeline before `SocialPoster`.
2. **Authentication / sign-in from the app:**
   - OAuth sign-in.
   - Password sign-in + password reset.
   - OTP sign-in / OTP reset.
   - Behind the existing `Authenticator` port; requires provider decision
     (e.g. AWS Cognito, Auth0, or custom) and secrets.
3. **Local notifications** to users about nearby reports **without being noisy**
   (rate-limited / batched / relevance-filtered; respect quiet hours).

---

## Change log
- Phase 1 and Phase 2 implemented.
- Phase 2.1 (Map Dashboard) and Phase 3 captured from requirements + mockups on
  2026-08-29; pending confirmation of the open questions before implementation.
