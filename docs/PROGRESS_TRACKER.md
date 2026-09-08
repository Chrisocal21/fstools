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

## Phase 1 — MVP (scaffold done, feature logic 0/14 subtasks)

### Scaffold (done this session)
- [x] Vite + React + TypeScript project created
- [x] Tailwind installed and configured with theme tokens (color, Fraunces/Inter, field-tile radius)
- [x] react-router set up — Hub, Report, Farm Manager routes
- [x] Hub page — tool tiles for Report and Farm Manager
- [x] Report page stub — upload area + report layout shell
- [x] Farm Manager page stub — grid + split-view editor shell
- [x] Dev server confirmed running on localhost

### Feature: Save File Upload (0/4)
- [ ] Multi-file drag-and-drop / picker, no zip required
- [ ] Per-file accepted confirmation as it lands
- [ ] Multi-farm detection + picker (single farm vs. all farms)
- [ ] Unrecognized mod content tagging (badge, never an error) — confirmed against real mod files in FARMSIM_SAVE_REFERENCE.md

### Feature: Report Generator (0/4)
- [ ] Parse uploaded XML into a normalized data model (finances, fleet, fields, production) — all four sourced from real save data, see reference doc
- [ ] Scripted rules engine — ports the manual chat-audit logic
- [ ] Report view (read-only)
- [ ] Mods list export (.txt) — title, version, internal name per mod

### Feature: Farm Manager (0/5)
- [ ] Status grid view of fields, color-coded (green / amber / rust per the theme spec)
- [ ] Click-tile edit panel
- [ ] Split-view editor — inputs left, live XML preview right, 30s change highlight
- [ ] Safe/risky edit warnings — first-pass classification done in FARMSIM_SAVE_REFERENCE.md, needs in-game verification before shipping
- [ ] Export — Downloads-folder download (universal) + File System Access direct write-back (Chrome-only, feature-detected)

### Feature: Privacy Note (0/1)
- [ ] Static privacy disclosure in the UI

## Phase 2 — Later
- Real geographic map (upgrades the grid)
- Opt-in hosting layer (accounts, revisit/share reports, progress tracking)
- Dark theme (visual polish pass on top of the confirmed light-first theme)
- Second save test (multi-farm, different map) to confirm what's universal in the save reference vs. specific to the first save

## Phase 3 — Ceiling
- See Future/ceiling ideas in Feature Map (profitability calc, fleet database, contract calc, etc.)
