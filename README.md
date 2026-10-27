# Compass (first draft PWA)

Route preview that flags ZIP codes / Census tracts along a drive using VVI-style thresholds.
**Scores are DEMO DATA (deterministic mock) unless you load a CSV** with columns `geoid,public_safety,clean_environment,overall` (ZIP = 5-digit ZCTA, tract = 11-digit GEOID).

## Host over HTTPS (needed for Install + "Use my location" on Android)
- **Netlify Drop:** go to https://app.netlify.com/drop and drag the `compass-pwa` folder in. You get an `https://…netlify.app` URL.
- **GitHub Pages:** push the folder to a repo → Settings → Pages → deploy from branch.
- Open the URL in **Chrome on Android** → ⋮ menu → **Add to Home screen / Install app**.
- `index.html` also opens on its own (file or any host). Without HTTPS it still routes, but location and install may not work.

## Use
1. Tap **Use my location** (allow permission) or type a start. Type a destination.
2. Pick **ZIP codes** or **Census tracts**.
3. Set sliders (1–10 → −2…+2; >1.0 = high). Tap **Save thresholds** to keep them.
4. Tap **Calculate route**. Blue = chosen route, grey dashed = alternatives, red/orange = flagged areas, green = OK. Tap an area to see its scores.
5. **Open in Google Maps** to navigate (or Copy link).
6. **Download KML** → **Open My Maps** → Create map → Import → pick the file to get the shaded overlay.

## Limits
- Avoidance is only a preference: least-exposed OSRM alternative, plus up to 2 detour waypoints (max 3) kept only if exposure drops and time stays < 1.5× the fastest route. ZIPs are large, so detours often don't help.
- Uses free public services: OSRM demo server, Nominatim, Census TIGERweb. They have rate limits and no uptime guarantee.
- Google Maps may pick a different path between waypoints. The shading only shows up in My Maps.
