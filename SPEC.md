# Compass — specification (v13, 2026-10-27)

## Purpose
Mobile PWA that plans a driving route between a start and destination, scores the areas along it for vulnerability/safety, prefers routes that avoid areas above user-set thresholds, and hands the result to Google Maps (link with waypoints) and Google My Maps (KML overlay). Avoidance is a preference/best effort, not a guarantee.

## UI features
- Start: "Use my location" (GPS, HTTPS only) or typed place; destination typed. Type-ahead autocomplete on both (Photon); start list always offers "📍 Current location".
- Area type: ZIP codes or Census tracts (US). Outside the US the app uses municipalities/admin-1 regardless.
- Sliders 1–10 for Public Safety, Clean Environment, Overall VVI (default 6); saved in localStorage.
- Route preferences: prefer state/federal highways near flagged areas (+ weight), count FM/RM as highways, avoid tolls / highways / ferries, max extra time for avoidance (default +90 min).
- Avoid-highways safety warning: a static note "Not recommended in high-crime areas." always sits under the checkbox. When Avoid highways is checked AND the last result had flagged areas, high-scoring areas (any score ≥ 1.0), Mexico, or a country advisory Level 3+, a red pulsing box appears under the checkbox and a red banner tops the results: "⚠ High-crime area: staying on main/toll highways is usually safer. Avoiding highways can route you onto rural roads with higher risk." plus the reasons. Unchecking hides both. Pulse is CSS-only and disabled under prefers-reduced-motion.
- Hard avoid: toggle, buffer 0–5 mi (default 1), openrouteservice API key field (stored only in this device's localStorage under `compass.orsKey`; never saved with other options, never in code).
- Optional CSV upload (geoid,public_safety,clean_environment,overall) overrides scores.
- Results: map with shaded areas, up to three routes, radio buttons choosing which route the Google link uses, Google Maps link (open/copy), KML download, log with numbers, notes, sources.

## Scoring
- Slider → threshold: `0.5×(n−5)+1.0` (1 = −1.0, 5 = +1.0, 6 = +1.5, 10 = +3.5). Scores are SD-like (VVI: SD from US mean); > 1.0 is "high".
- Area flagged if any domain score > its threshold. Severity `sev` = sum over domains of (score − threshold) for domains over.
- Route exposure = Σ km in flagged areas × (0.1 + sev); highway km discounted by highway weight only when "prefer highways" is on and "avoid highways" is off (avoid-highways always wins). Penalties: freeway km ×0.05 (avoid highways), toll km ×2, ferry km ×5. Tie-break +0.1 per extra minute.
- "Worst areas" = flagged areas with severity in the top quarter on the direct route.

## Data sources per region
| Region | Public Safety | Clean Environment | Overall | Polygons |
|---|---|---|---|---|
| US | Vizient VVI 2026 public file (all 50 states + DC, ZIPs + tracts, per-state files) | VVI | VVI | Census TIGERweb (live) |
| Mexico | max(SESNSP municipal incidence 2025 severity-weighted per 100k, z within Mexico; municipal homicide rate on the world homicide scale) | unavailable | CONEVAL Índice de Rezago Social 2020 | INEGI municipalities via CONABIO 2025 (figshare 31236322), simplified, `mx/mun_XX.json` per state |
| Rest of world | max(UNODC national homicide rate z across countries [via World Bank VC.IHR.PSRC.P5]; State Dept advisory level score L1 −0.5, L2 0.5, L3 1.5, L4 3.0; regions named in Level 3/4 text) | unavailable | unavailable | geoBoundaries ADM1 (fetched at runtime) |
- US = VVI only for every domain (Jeff's decision; local police data was built and then removed). VVI covers all 50 states + DC, split per state and lazy-loaded only for states the route touches.
- Granularity is labelled per area ("country-level only", "region (State Dept named region)"). World data cannot distinguish neighbourhoods (e.g. Hillbrow, Maré, Marseille north are not singled out).
- Mexico shows the State Dept Mexico advisory text (Level 2, 2026-05-28) as a warning; other countries show their advisory title/date.
- No data → grey, never green. km of route with no coverage is reported.
- Precomputed files: `vvi/index.json` (ZIP3 → state FIPS, available states) + `vvi/zip_SS.json` / `vvi/tract_SS.json` (SS = state FIPS, same `{fields,data}` schema; ZIPs assigned to states via the Census 2020 ZCTA–county relationship file, non-ZCTA ZIPs by ZIP3; built by /workspace/vvi/build_states.py), `mx/index.json` + `mx/mun_01..32.json`, `world/countries.json` (homicide + parsed advisories), `world/countries_geo.json` (Natural Earth 50m, simplified; used to pick countries along the route).

## Map colour legend
Dark red / red / orange = over threshold (sev ≥1.5 / ≥0.75 / >0). Yellow = under threshold but high (any score ≥ 1.0 or within 0.5 of threshold). Light green = clearly low. Grey = no data. Routes: black dashed = direct, blue = avoidance, purple = hard-avoid. Markers: green start, red end, yellow waypoints.

## Routing
- OSRM public demo server (no exclusions supported). Direct + alternatives, then soft detours: waypoints offset perpendicular to the start→end axis at 5/10/20/30 km both sides with 1–3 waypoints (long trips > 250 km: 10/30 km, 1 waypoint), fixed DFW corridor waypoints (SH-183, SH-114, I-635/SH-121, I-20, SH-360) when inside the band, then up to 3 greedy refinements via low-score area centroids. Calls spaced ≥ 350 ms with retries.
- Corridor band for boundaries: 32 km (ZIP) / 22 km (tract) around the straight line; long trips: 12 km around the route.
- ORS hard avoid (`POST /v2/directions/driving-car/geojson`, `options.avoid_polygons` MultiPolygon, `options.avoid_features` highways/tollways/ferries, `radiuses` 2000 m). Avoid polygons = flagged areas buffered by X mi, clipped to a band around the route, minus areas containing start/destination and a ≥1.5 km circle at each chunk end; split into ≤19.5 km cells; ranked by severity (on-route first) within the public limit of 200 km² per request (uses 190). Trip split into up to 8 chunks (≤150 km route limit with avoid areas) with break points outside flagged areas; 2 passes per chunk; on "no route" retries with half the blocks, then none. Falls back to OSRM with an explanation if ORS fails or no key. Reports blocked vs unblocked pieces/km².
- Geocoding fallback (when a typed value isn't picked from the list): Nominatim, worldwide, biased to Texas.

## Route selection
- Always computed and selectable: Direct; Avoidance route = candidate (soft or hard) with fewest km in worst areas (tie: lower exposure, then time); if nothing else routed, two 10 km side detours are tried as "best attempt". Hard-avoid shown as a third option when different from the avoidance route.
- Default selection = lowest total exposure (must beat direct by >2%; direct wins ties). Labels: "+X min, avoids N km of worst areas, total flagged exposure Y% higher/lower".

## Outputs
- Google Maps: `https://www.google.com/maps/dir/?api=1&origin=…&destination=…&waypoints=…&avoid=tolls|highways|ferries&travelmode=driving`. Soft routes pass their 1–3 waypoints; hard-avoid passes 9 points sampled along the ORS route (Google max ~9). Google may still re-route between waypoints; avoid= not verified on Android.
- KML for My Maps: all areas in the band, styled by state, plus the selected route.

## Autocomplete
Photon `https://photon.komoot.io/api/?q=…&limit=6&lat=…&lon=…` (Nominatim policy forbids autocomplete). 300 ms debounce, min 3 chars, AbortController cancels stale requests, bias = GPS fix → start point (for destination) → map centre. Picking stores exact lat/lon (no re-geocoding); typing again clears it.

## Service worker
`sw.js`: cache name `compass-vN`; precaches app shell + bundled JSON; network-first with `fetch(…,{cache:'no-store'})` for same-origin, cache fallback offline; cross-origin APIs untouched. **Bump the version on every deployed change** (currently `compass-v15`; per-state `vvi/*_SS.json` are not precached, only cached at runtime when a route loads them).

## Hosting
GitHub Pages, repo `jlforsha/Compass`, branch `main`, site https://jlforsha.github.io/Compass/. Files are uploaded through GitHub's web upload page (no git/gh credentials on the build box). Netlify was abandoned (account suspended).

## Key decisions
- US uses VVI only (Jeff): consistent national methodology; local police data removed.
- Free, keyless services by default (OSRM, Nominatim, Photon, TIGERweb, geoBoundaries); ORS key optional and user-supplied, kept on device.
- Exposure weighted by severity so the worst areas dominate when everything is flagged.
- Always offer an avoidance route even when it is worse overall, with honest labels.
- Grey for missing data; green only for clearly low scores.
- Mexico scores also placed on the world homicide scale because Mexico-relative scores understated risk.

## Known limits
- Avoidance is soft; OSRM ignores exclusions; Google may re-route between waypoints.
- ORS public limits (200 km², 20 km extent, 150 km with avoid areas) mean dense flagged corridors (e.g. FW→Dallas at slider 4, ~1,400 km² flagged) can't be fully blocked; hard-avoid routes are often longer and sometimes worse.
- VVI tract vintage differs from 2020 tracts: split 2020 tracts (…01/…02) fall back to their 2010 parent (…00); other changed tracts stay grey.
- "km with no data source" counts distance outside any polygon AND inside grey (unscored) polygons (fixed in v14; it previously ignored grey polygons).
- World safety is country-level (plus named advisory regions); Mexico CE unavailable; world CE/Overall unavailable.
- Public demo servers have fair-use limits; large calculations take 10–60 s.

## Open items
- ACLED event density: API has no CORS → needs a scheduled GitHub Action (key as repo secret) or small proxy writing JSON into the repo.
- Public sharing (e.g. on X): host from a neutral repo/account without Jeff's personal GitHub or data; no keys in code (verified).
- Finer world sources (e.g. Rio ISP, SAPS station stats).
- Verify Google `avoid=` behaviour on Android.
