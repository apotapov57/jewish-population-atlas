# Jewish Population Atlas — v0.5 lineage reconstruction

An interactive historical visualization of **how Jewish community traditions formed, dispersed, migrated and partially reconverged in modern Israel and other contemporary centers**.

Live site: https://apotapov57.github.io/jewish-population-atlas/

## Visual idea

The atlas now uses one visual grammar from antiquity to 2024:

- **1 dot = 1,000 people** throughout the whole timeline.
- Dot color is a persistent historical-community lineage: Judean/Palestinian, Babylonian/Iraqi, Hellenistic/Romaniote, Ashkenazi, Sephardi, Maghrebi/Mizrahi, Persian/Central Asian, Yemenite, and Beta Israel.
- The same color persists after migration. A Moroccan-origin dot that moves to Israel remains Maghrebi/Mizrahi rather than becoming a generic “Israeli” dot.
- Modern Israel therefore appears as a **convergence of multiple historical lineages**, which is the central narrative goal of the project.
- Dot positions are constrained to land. Long-distance migrations crossfade between source and destination positions rather than placing population dots in the sea.
- Playback is intentionally slow and pauses around major events.

## Important methodological choice

This version prioritizes **historically plausible continuity and visual intelligibility** over false precision.

The ancient and medieval layers are explicitly a **visual reconstruction**. They use plausible centers derived from archaeology, historical geography, well-known community centers, and the broad demographic literature. They should not be interpreted as a census or as claims that exact numbers lived at the displayed coordinates.

From the early-modern period onward, the model increasingly follows documented community geography and demographic estimates. The 19th–20th century Eastern European story is informed by IIJG community maps, Pale of Settlement demography, and modern Jewish demographic series.

At every year the lineage populations are normalized to the atlas's world-population series so the global dot count remains consistent with the headline total.

## Why the lineage model exists

Snapshot maps repeatedly created a misleading problem: a community could simply vanish from one source period because the next dataset covered a different geography. The lineage model instead maintains continuity across periods.

Examples:

- **Ashkenazi:** Rhineland / northern France → Central Europe → Poland–Lithuania → Pale of Settlement → United States / USSR / Western Europe / Palestine–Israel.
- **Sephardi:** Iberia → after 1492, North Africa / Salonika / Istanbul / Italy / Amsterdam → Israel / France / Americas.
- **Babylonian / Iraqi:** Mesopotamia → Baghdad / Basra / Mosul → large-scale movement to Israel around 1950–51.
- **Maghrebi / Mizrahi:** long-established North African and eastern Mediterranean centers → Israel / France / North America.
- **Yemenite:** Yemen / Aden → Israel.
- **Persian / Central Asian:** Iran / Bukhara / Caucasus → Israel / US and smaller surviving communities.
- **Beta Israel:** Ethiopian highlands → Israel, especially in the 1980s–1990s.

The classifications are analytical visual categories, not claims of rigid ethnicity or race. Real communities overlap, intermarry and change identity over time.

## Timeline highlights

The narrative layer now emphasizes:

- Assyrian conquest and Babylonian exile;
- Hellenistic diaspora formation;
- destruction of the Second Temple;
- emergence of Ashkenazi and Sephardi centers;
- 1492 expulsion from Spain;
- partitions of Poland;
- formation of the Pale of Settlement;
- 1881 onward mass Eastern European emigration;
- 1897 Russian imperial census geography;
- Holocaust demographic collapse, with the world total falling from about **16.5 million in 1939 to roughly 11 million by 1945**;
- establishment of Israel and the 1948–1950s migration convergence;
- Soviet Jewish emigration;
- Ethiopian aliyah;
- the 1989–1990s former-USSR migration wave.

## Data structure

The active visualization is driven by:

- `data/lineages/meta.json` — world totals and narrative events;
- `data/lineages/*.json` — lineage-specific demographic keyframes and geographical centers;
- `app.js` — deterministic particle engine, interpolation, land masking, camera and timeline;
- `app.css` / `index.html` — presentation.

Older v0.1–v0.4 data files remain in the repository as provenance and experiments but are no longer the primary renderer.

## Sources and provenance

The project uses or is informed by:

- Sergio DellaPergola, long-run Jewish demographic estimates and *World Jewish Population* series;
- IIJG, *Maps of Jewish Communities and their Populations in Europe: 1750–1950*;
- University of Haifa, *Mapping the Ancient Jewish World, 586 BCE–650 CE*;
- Benjamin of Tudela for medieval community geography;
- archaeological demographic work on Iron Age Palestine;
- Russian imperial / Pale of Settlement demographic literature;
- Soviet census and emigration literature.

The ancient and medieval lineage values in v0.5 should be treated as **hypothesis-driven visual weights normalized to broad world totals**, not source quotations.

## Next useful improvements

1. Replace broad Ashkenazi regional centers in 1750–1939 with the full IIJG locality import where licensing/data access permits.
2. Add a dedicated set of Israeli destination subregions so post-1948 convergence is more spatially legible inside Israel.
3. Add optional migration arcs behind the land-constrained population dots.
4. Add a methodology drawer showing the exact source / certainty level for each lineage keyframe.
5. Refine modern metro distributions in the US, Israel, France, Canada, UK and former USSR.
