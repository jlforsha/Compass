# Compass

A free, installable web app (PWA) that plans a driving route and steers around higher-risk areas.

- Scores areas along the route using public data: Vizient Vulnerability Index (US), SESNSP crime data and CONEVAL (Mexico), and UNODC homicide rates plus U.S. State Department advisories (other countries).
- You set thresholds (1–10) for Public Safety, Clean Environment and Overall; areas above them are shaded and avoided where practical.
- Optional hard-avoid using your own free openrouteservice key (stored only on your device).
- Opens the chosen route in Google Maps and exports a shaded KML overlay for Google My Maps.

**Use:** open the site on your phone, tap *Add to Home screen*, enter a start (or use your location) and a destination, then *Calculate route*.

**Limits:** avoidance is best effort, not a guarantee. Data outside the US and Mexico is mostly country-level. Always use your own judgment and check local conditions.

Routing: OSRM / openrouteservice · Search: Photon, Nominatim · Maps: OpenStreetMap · Boundaries: US Census TIGERweb, INEGI/CONABIO, geoBoundaries.
