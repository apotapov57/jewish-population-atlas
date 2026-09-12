# Jewish Population Atlas — v0.4 dot-density prototype

An interactive research prototype for exploring **where Jewish populations lived through time, how demographic centers shifted, and how large historical shocks changed the world Jewish population**.

Live site: https://apotapov57.github.io/jewish-population-atlas/

## Current visual model

The atlas now uses a **dot-density map** rather than bubbles or a heatmap.

- **1 full dot = 1,000 people** whenever the source provides a numeric population estimate.
- A fractional final dot represents the remaining fraction of 1,000.
- **Hollow rings** mark historically documented or reconstructed centers for which we do not have a defensible headcount.
- Dots around cities are tightly packed around the city coordinate.
- Governorate, republic, country and regional estimates are deliberately dispersed around a centroid. They show the source's geographical precision and **must not be read as exact household locations**.
- Color represents **historical community/tradition**, not language and not race.

The interface also reports how much of the source-period world total has actually been numerically localized on the map. A 1939 total of 16.5 million, for example, does not imply that every one of those 16.5 million people has city-level coordinates in the current dataset.

## Historical community categories

The analytical color layer currently includes:

- Israelite / Judahite
- Judean / Palestinian
- Babylonian
- Hellenistic / Romaniote
- Ashkenazi
- Sephardi
- Judeo-Arabic / Maghrebi
- Persian / Central Asian
- Yemenite
- Modern Israeli (mixed)
- Mixed diaspora

These categories change with historical period. The project deliberately does **not** project later categories such as Ashkenazi or Sephardi backward into Iron Age Judea.

## Current anchor layers

The working timeline now includes ancient, medieval, early-modern, modern-European and contemporary layers, including:

- c. 800 BCE — Israel and Judah archaeological demographic reconstruction
- c. 450 BCE — Yehud, Babylonia and Elephantine
- c. 50 CE — Palestine, Alexandria and other major ancient centers
- c. 500 CE — late-antique documented/reconstructed centers
- c. 1170 — Benjamin of Tudela city observations
- c. 1490 — pre-expulsion community geography
- 1750 and 1850 — selected European community estimates
- **1897 — Russian Empire Pale of Settlement census by governorate**
- 1930 — selected major European communities from the IIJG map series
- 1939 — world prewar peak, with 1930 city geography used transparently as a spatial proxy
- **1945 — world population collapse after the Holocaust**
- 1950 — early postwar redistribution
- 1970 — USSR census layer by republic
- **1989 — USSR census by republic immediately before mass emigration**
- **1991 — post-Soviet redistribution layer**
- 1995
- 2024

## Historical event layer

Autoplay is intentionally slower and pauses at important events. Current annotations include:

- Assyrian conquest of Israel
- Babylonian destruction / exile
- destruction of the Second Temple
- Benjamin of Tudela
- 1492 expulsion from Spain
- 1648 wars in the Polish–Lithuanian Commonwealth
- **1772, 1793 and 1795 Partitions of Poland**
- **1791 formation of the legal geography that becomes the Pale of Settlement**
- 1881 migration wave
- 1882 May Laws
- **1897 Pale of Settlement census**
- 1903 Kishinev pogrom
- 1917 abolition of the Pale
- 1939 prewar peak
- 1941 expansion of the Holocaust into the occupied Soviet territories
- **1945 demographic collapse**
- 1948 establishment of Israel
- 1970s Soviet Jewish emigration / refusenik era
- **1989–1991 mass emigration from the USSR / former USSR**

## Population totals

The large population readout and the small population curve in the timeline are intended to make long-run demographic change legible. The current source-backed modern series includes, among other anchors:

- 1939: ~16.5 million
- May 1945: ~11.0 million
- 1950: ~11.297 million
- 1970: ~12.585 million
- 1989: ~12.810 million
- 1995: ~13.059 million
- 2024: ~15.737 million core Jewish population

Transitions between source years are visual interpolations and are explicitly labelled as such; they are **not claims of annual census estimates**.

## Major data sources

### Long-run demography
Sergio DellaPergola, *Some Fundamentals of Jewish Demographic History* and later *World Jewish Population* reports.

### Europe, 1750–1950
International Institute for Jewish Genealogy (IIJG), Laurence Leitenberg & Sandra Crystall, *Maps of Jewish Communities and their Populations in Europe: 1750–1950*.

The underlying IIJG project covers **827 European communities** appearing in one or more of six historical snapshots. The current repository still contains only a subset of those localities; full ingestion remains a major next data task.

### Pale of Settlement, 1897
1897 Russian Empire census data summarized in Irena Grosfeld, Alexander Rodnyansky & Ekaterina Zhuravskaya, including 4,483,300 Jews across the Pale / Congress Poland table used in the current map.

### Soviet period
Soviet census data by republic for 1959, 1970, 1979 and 1989, plus post-Soviet demographic estimates.

### Emigration from the former Soviet Union
Mark Tolts, *A Half Century of Jewish Emigration from the Former Soviet Union* and related demographic sources.

### Ancient layers
Broshi & Finkelstein; University of Haifa *Mapping the Ancient Jewish World*; Cambridge historical demographic work; Persian-period archaeological studies.

### Medieval layer
Benjamin of Tudela, combined with later demographic scholarship.

## Core methodological rules

1. **Never turn presence evidence into a fake population count.** If we know a community existed but do not have a defensible number, show presence/reconstruction rather than invented dots.
2. **Never imply finer geography than the source supports.** A governorate-level census is dispersed within a governorate-scale visual cluster, not placed as if everyone lived in the capital.
3. **Keep world totals separate from mapped coverage.** A world estimate and a city-level database answer different questions.
4. **Show interpolation as interpolation.** Smooth animation is a visual device, not annual historical data.
5. **Keep community categories historically contextual.** Later Jewish traditions are not retrojected unchanged into antiquity.

## Repository structure

- `index.html` — UI shell
- `app.css` — visual design
- `app.js` — map, dot-density engine, interpolation and story timeline
- `data/config.json` — traditions, sources and dot quantum
- `data/ancient.json` — ancient layers
- `data/medieval.json` — medieval / early-modern layers
- `data/europe_v4.json` — Europe, Pale, prewar and immediate postwar layers
- `data/modern_v4.json` — USSR / FSU and modern layers
- older v0.1 files remain temporarily for provenance during migration

## Next data work

The largest remaining improvement is **full community-level ingestion**, especially:

1. IIJG's 827 European communities for 1750 / 1800 / 1850 / 1900 / 1930 / 1950.
2. Better internal geography for the United States, Israel, France, Canada, the UK and Latin America after 1950.
3. More locality-level Soviet census / community geography where defensible.
4. More source-backed ancient and medieval locality estimates without manufacturing precision.

## Status

This remains a **research prototype**, not a finished historical-demographic database. Its primary design goal is to make uncertainty visible while still allowing the viewer to perceive the dramatic relocation and demographic transformation of Jewish populations over roughly three millennia.
