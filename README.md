# Jewish Population Atlas — v0.1

A small interactive prototype for exploring **where the world's Jewish population was concentrated through time**.

## What this version contains

Ten anchor years:

**1170, 1300, 1490, 1700, 1825, 1880, 1939, 1948, 1995, 2024**

The historical backbone is Sergio DellaPergola's published regional series for 1170–1995. The 2024 snapshot uses the modern regional estimates in *World Jewish Population, 2024*.

The browser UI includes:

- an interactive world map;
- proportional population bubbles;
- a draggable year slider;
- autoplay;
- world-population total;
- share of world Jewry for each displayed region;
- a confidence legend;
- short historical annotations;
- direct source links.

## The most important methodological rule

**The map never claims more spatial precision than the source provides.**

For 1170–1995 the source is a macro-regional demographic reconstruction. A bubble is therefore placed at a **schematic centroid** for that macro-region. It must not be interpreted as saying that the population physically lived at that point.

For 2024 the source has much finer modern geography, so the UI can show several regions separately.

This is deliberate. DellaPergola explicitly describes the long-run historical evidence as combining documented scholarship with raw data, inference, literary memory and reconstruction, and notes that medieval evidence is fragmentary and of unequal quality.

## Confidence labels

The `confidence` field is an **editorial visualization aid created for this prototype**, not a confidence interval reported by DellaPergola.

- `low`: medieval reconstructions (1170–1490)
- `medium`: early-modern / early statistical reconstruction (1700–1825)
- `high`: late-19th century onward

A later version should replace these simple labels with source-specific uncertainty metadata and, where scholarship supports it, numeric ranges.

## Data provenance

### 1. Historical regional backbone
Sergio DellaPergola, *Some Fundamentals of Jewish Demographic History* (2001), Table 2.

https://www.bjpa.org/content/upload/bjpa/dell/DellaPergola%20Some%20Fundamentals.pdf

The table reports estimates for total world Jewry and four macro-regions for 1170, 1300, 1490, 1700, 1825, 1880, 1939, 1948 and 1995.

### 2. Current snapshot
Sergio DellaPergola, *World Jewish Population, 2024*, American Jewish Year Book 2024 (published 2025), Table 8.2.

https://www.cbs.gov.il/he/Documents/World%20DellaPergola%202024%20complete.pdf

World core Jewish population at 1 Jan 2024: **15,736,800**.

### 3. Historical uncertainty / interpretation
Sergio DellaPergola, *Notes toward a Demographic History of the Jews* (2024).

https://www.mdpi.com/2313-5778/8/1/2

### 4. Planned city-level European enrichment
International Institute for Jewish Genealogy, *Maps of Jewish Communities and their Populations in Europe: 1750–1950*.

https://iijg.org/tools-and-technologies/maps-of-jewish-communities/

IIJG maps population data for **827 European communities** in one or more of the years 1750, 1800, 1850, 1900, 1930 and 1950. This should become the first high-resolution historical layer.

## Definition warning

Modern DellaPergola estimates use the concept of the **core Jewish population** and apply a consistent methodology across contemporary countries. Historical estimates across many centuries cannot be treated as if they came from one modern census system.

The atlas should therefore remain a visualization of the **best available demographic reconstruction at each period**, with provenance visible to the user.

## Files

- `index.html` — interactive prototype; open in a modern browser
- `population_points.csv` — source-backed population points
- `sources.csv` — bibliography / provenance
- `events.json` — short narrative annotations
- `data_schema.json` — proposed reusable schema

## Next iterations

1. Add IIJG's 1750–1950 European community layer.
2. Add country-level modern data for 1950–2024.
3. Separate Palestine/Israel, Asia, and Africa for more historical anchor years where sources support it.
4. Add migration/event overlays as a separate layer — never as a substitute for population data.
5. Add uncertainty ranges and competing scholarly estimates.
6. Add a toggle between:
   - **population bubbles**
   - **share of world Jewry**
   - **population density**
   - **migration/events**
7. Extend backward before 1170 only with a clearly different “reconstructed ancient presence” mode.

## Status

This is a **research prototype**, not a finished demographic database. The numbers used in v0.1 are traceable to the cited sources; the map coordinates for macro-regions are intentionally schematic.
