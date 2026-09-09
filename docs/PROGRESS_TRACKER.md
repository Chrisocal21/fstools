# FarmSim Tools — Progress Tracker

## Planning

| Stage | Status |
|---|---|
| Idea captured | Done |
| Feature map | Done |
| Audience question | Done — could be for others |
| Data handling question | Done — no storage, discard on refresh |
| Download/export question | Done — download or save direct to source file |
| MVP scope question | Done — report + editing are easy, map has an easy and a hard version |
| Map version question | Done — simple grid-map included, focus stays on report + editing |
| Build order question | Done — report + editing day 1, map day 2 or later |
| Layout question | Done — hub with tool tiles, each tool its own page |
| Future wishlist priority | Done — kept as running list, nothing prioritized yet |
| Map/editor merge | Done — merged into one tool, Farm Manager |
| Upload flow, multi-farm, unknown mods, editing UI, privacy, mobile | Done — see Feature Map |
| Site name/branding | Done — FarmSim Tools, domain farmsimtools.com available |
| Layout / plan | Done |
| Tech stack decision | Done — static frontend only, no backend for v1 (see Feature Map) |
| Visual theme decision | Done — deep green + reserved amber accent, Fraunces/Inter, calm/spacious editorial layout, light-first (see Feature Map) |
| Save file reference doc | Done — FARMSIM_SAVE_REFERENCE.md complete against a real save (settings, finances, fields, fleet, buildings, mods, world/terrain, mod-generated files) |
| Build | In progress — Phase 1 scaffolded (Vite + React + TS + Tailwind, routing, theme tokens, hub + tool page stubs) |

## Phase 1 — MVP (complete — upload, report and Farm Manager all running on real save data)

### Scaffold (done this session)
- [x] Vite + React + TypeScript project created
- [x] Tailwind installed and configured with theme tokens (color, Fraunces/Inter, field-tile radius)
- [x] react-router set up — Hub, Report, Farm Manager routes
- [x] Hub page — tool tiles for Report and Farm Manager
- [x] Report page stub — upload area + report layout shell
- [x] Farm Manager page stub — grid + split-view editor shell
- [x] Dev server confirmed running on localhost

### Feature: Save File Upload (4/4)
- [x] Multi-file drag-and-drop / picker, no zip required
- [x] Per-file accepted confirmation as it lands — classified instantly by filename, upgraded to the real result once parsed
- [x] Multi-farm detection + picker (farm buttons appear only when the save has more than one farm)
- [x] Unrecognized mod content tagging — three states: **Accepted** (parsed), **Passed through** (world/terrain/economy), **Mod content** (root tag shown, never an error)

### Feature: Report Generator (4/4)
- [x] Parse uploaded XML into a normalized data model — `src/lib/saveModel.ts` (types) + `src/lib/parseSave.ts` (tolerant DOMParser readers for careerSavegame, farms, farmland, fields, vehicles, placeables, environment)
- [x] Scripted rules engine — `src/lib/insights.ts`, every rule returns a severity, a headline and a plain-English reason
- [x] Report view (read-only) with per-entity drill-down
- [x] Mods list export (.txt) — title, version, internal name per mod

#### Breakdown depth (what the report actually shows)
- [x] **Dashboard layout** — tabbed sections (Overview / Finances / Fleet / Fields / Production / Mods & files) instead of one long scroll; each tab carries a badge counting what needs work
- [x] **Overview** — four clickable KPI cards (cash, fleet value, fields, lines running) over the priorities panel
- [x] **Priorities panel** — the six highest-value actions across the whole farm, worst first
- [x] **Save files hidden by default** — uploader collapses to a one-line summary once a save is loaded; the file list lives behind a disclosure in the Mods & files tab
- [x] **Finances** — money, loan, net worth (cash + fleet − loan), playtime, day, land parcels; totals by category; **expandable day-by-day rows** splitting income vs. costs line by line
- [x] **Per vehicle** — value, age, operating hours, condition, wear, what it is hitched to, every fuel/cargo tank as a meter, plus advice (repair due, low fuel, cargo still aboard, barely used capital, high hours)
- [x] **Per field** — crop, planned next crop, growth stage, ground type, spray type, area; weeds / fertiliser / lime / plough / stones / water as meters; plus advice (withered, ready to harvest, weeds, no fertiliser, lime due, not ploughed, stones, rotation penalty)
- [x] **Per production line** — per building: storage meters, each line's active state with its own input and output meters, plus advice (nothing running, lines idle, output backing up, input starved)
- [x] **Rollups** — fleet value by category, idle capital total, repair backlog, fields needing work, active vs. total lines

#### Next on the report (before the map)
- [x] Profit per field — `economy.xml` is now parsed (average price per fill type across the twelve seasonal periods). Verified against the real sample save that field area is **not** in `fields.xml` at all (it's map-defined, not save data), so the original "area × price" plan was dropped in favor of a "most valuable crops on this farm" ranking in the Fields tab — crops grouped and ranked by season-average price, field count shown per crop, area folded in only when a save happens to carry it. Confirmed end-to-end in a real browser against the sample save (68 fields, 15 distinct crops, all matched to a price).
- [x] ~~Cost per vehicle~~ — checked against the real sample save: `vehicleRunningCost`, fuel and repair spend are only ever farm-wide daily totals in `farms.xml`. No file anywhere (`vehicles.xml` included, checked every nested element) attributes cost, fuel use, or repair spend to an individual `uniqueId` — the game doesn't track it per machine, so there's nothing to attribute back. Dropped rather than faked with a prorated guess.
- [x] Trend lines — new `TrendChart` (`src/components/ReportPieces.tsx`) in the Finances tab: net per day as a bar chart, oldest to newest, bars above/below a zero baseline (position carries the profit/loss signal, color reinforces it), hover for the exact figure. Confirmed in a real browser against the sample save's 5-day window.
- [x] Production chain view — `productionChains`/`productionChainInsights` in `src/lib/insights.ts`, rendered as `ProductionChainView` in the Production tab. Links lines by shared fill type (a line's output feeding another line's input) and flags starved (consumer active, no producer) and backed-up (producer active, no consumer) chains. Verified in a real browser against the sample save: renders cleanly with no console errors, correctly falls back to "No internal chains" because this save's `<production>` elements never carry buffer levels at all (see FARMSIM_SAVE_REFERENCE.md) — same class of save-data gap as field area and vehicle cost, so the feature is built to degrade honestly rather than fake a chain.
- [x] Report export (.txt / print stylesheet) alongside the mods list — `buildReportTxt` in `src/lib/insights.ts` mirrors every tab (priorities, overview, finances, fleet, fields, production, mods) as plain text, downloaded via a new "Download full report (.txt)" link. Print support: the six tab sections now always render in the DOM (visibility toggled with `hidden`/`print:block` instead of unmounting), so a "Print report" button (`window.print()`) or Ctrl+P produces every section on paper regardless of which tab is active on screen; nav, upload UI, tab bar and the privacy footer are `print:hidden`, and `index.css` forces open every `<details>` drill-row and drops the decorative background texture under `@media print`. Verified in a real browser against the sample save: screen-mode tab switching still isolates one section at a time, print-media emulation shows all five titled sections at once with the tab bar/header hidden, and the downloaded .txt matches the report's numbers.
- [x] Verify the tolerant parsers against a second real save (multi-farm, different map, different mods) — two more real saves added at `sample-saves/save-2/` (Idaho Tater Land, 23 fields, 161 mods) and `sample-saves/save-3/` (Hutan Pantai, 45 fields, 170 mods, savegameName with non-ASCII characters, and **no `farmland.xml` at all** — the best real test of the "file might be missing" tolerance). Neither is multi-farm, so that specific angle is still unverified. Both loaded clean through every Report tab with zero console errors; `save.ownedFarmlandByFarm[farmId] ?? '—'` degrades correctly when `farmland.xml` is absent. Found and fixed a real bug this way: a huge one-off `other` expense next to a tiny income window produced a "13528%" biggest-drain insight — mathematically correct but unreadable. `financeRollup` in `src/lib/insights.ts` now switches to an "Nx everything you earned" phrasing above 3x instead of a percentage. Farm Manager verified too: bulk "Max lime" across all 45 fields and a production-line toggle, exported and diffed byte-for-byte against save-3's originals — only `limeLevel` and one `isEnabled` differed, everything else untouched.

### Feature: Farm Manager (5/5)
- [x] Status grid view of fields, color-coded — reuses the report's field severity, so both tools always agree
- [x] Click-tile edit panel
- [x] Split-view editor — inputs left, live XML preview right, 30s change highlight; the panel also shows the report's advice for the field *as edited*
- [x] Safe/risky edit warnings — safe edits are open; crop and ground type are gated behind an explicit "allow risky edits" toggle with the density-map caveat spelled out
- [x] Export — download (universal) + File System Access direct write-back (feature-detected, Chrome-only); only the files you actually changed are rewritten
- [x] Ported onto the normalized model — Farm Manager edits the same data the report reads
- [x] Tabbed dashboard (Farm / Fields / Fleet / Production / Export) with a pending-change count on the Export tab

#### What can be edited
| Area | Editable | Notes |
|---|---|---|
| Farm | name, money, loan | plus "clear the loan" and "pay loan from cash" shortcuts |
| Fields | growth stage, weeds, fertiliser, lime, plough, stones, water, planned crop | sliders run in the save's own level units |
| Fields (risky) | crop, ground type | gated behind the risky-edit toggle |
| Fields (bulk) | clear weeds, max lime, max fertiliser, plough, clear stones | applied across every field at once |
| Fleet | value, condition (repair), dirt (clean), every tank and cargo level | plus repair all / clean all / fill all / empty all trailers |
| Production | each line on or off, storage levels per fill type | production speed curves deliberately not exposed |

#### Export guarantees (verified against a real FS25 save)
- Only `farms.xml`, `fields.xml`, `vehicles.xml` and `placeables.xml` are ever rewritten — and only the ones you actually changed
- Within those, only the attributes you changed are touched. Verified by diffing a 68-field export against the original: **only `limeLevel` differed across the whole file**, with `lastGrowthState`, `rollerLevel`, `stubbleShredLevel` and attribute order all preserved
- Values the tool normalises for display (`fruitType="UNKNOWN"`, `plannedFruit="FALLOW"`) round-trip untouched when unedited
- Fruit-type tokens keep the file's own casing convention
- **Fixed** a real bug caught while verifying production toggles against the real save: the writer only ever set `active` or fell back to inventing a `status` attribute, but real saves store the flag as `isEnabled` (see the Production points note above) — so toggling a line in Farm Manager and exporting silently did nothing, since `isEnabled` itself was never touched. `exportSave.ts` now mirrors the reader's own attribute priority (`isEnabled` → `active` → `status`). Re-verified by diffing a 5,144-line `placeables.xml` export with one line toggled off: **only that line's `isEnabled` differed**, everything else byte-identical.

#### Still to verify in game
- [ ] Load an edited save in FS25 and confirm the safe/risky classification from FARMSIM_SAVE_REFERENCE.md holds
- [ ] Confirm the crop / ground-type density-map caveat behaves the way the warning describes
- [ ] Confirm that clearing every `dirtNode` is how the game expects a washed machine to look
- [ ] Second save (multi-farm, different map) to confirm the level scales and `groundType` tokens are universal

### Feature: Privacy Note (1/1)
- [x] Static privacy disclosure in the UI (Report page footer + site footer)

## Phase 2 — Later
- Real geographic map (upgrades the grid)
- Opt-in hosting layer (accounts, revisit/share reports, progress tracking)
- Dark theme (visual polish pass on top of the confirmed light-first theme)
- Multi-farm save test — save-2 and save-3 confirmed different map/mods/missing-file tolerance (see the report and export items above), but neither has more than one farm, so the multi-farm picker and per-farm filtering are still only verified against mock data

## Phase 3 — Ceiling
- See Future/ceiling ideas in Feature Map (profitability calc, fleet database, contract calc, etc.)
