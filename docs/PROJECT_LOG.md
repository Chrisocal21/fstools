# The Forge — Project Log

> The living history of every project. Every session gets logged here. Every decision, every learning, every direction change. This is what keeps Chris from ever having to re-explain where things stand, and what keeps the team from ever losing track of what was built and why.

---

## How It Works

Every time a session ends -- either through a shutdown trigger or naturally -- The Forge adds an entry here. The log is append-only. Nothing gets deleted. The history is the point.

When Chris comes back after a gap, this file is what the team reads to get fully caught up instantly.

---

## Log Entry Format

```
---

## [Project Name] -- Session [#] -- [Date]

**Status:** [Exploring / Active / Paused / Archived]

---

### What We Decided

- [Decision 1]
- [Decision 2]
- [Decision 3]

---

### What Was Learned

- [Anything Chris brought to the session that changed or added to the plan]
- [New knowledge, new context, new constraints]

---

### What Changed

- [Direction shifts]
- [Scope changes]
- [Tool changes]
- [Anything that was previously decided and is now different]

---

### Open Questions Added

- [New question 1]
- [New question 2]

---

### Open Questions Closed

- [Question that was answered, and what the answer was]

---

### Progress Updates

- [What moved in the tracker, if anything]

---

### Documents Updated

- [File 1]
- [File 2]

---

### Next Session

[One sentence on what to focus on next time]

---
```

---

## Inbox

Quick thoughts and half-formed ideas captured between or during sessions. Zero structure. Zero judgment. The Forge resurfaces these when relevant.

| Date | Thought | Status |
|---|---|---|
| -- | -- | -- |

---

## Active Projects

A running list of all projects and their current status. Updated every session.

| Project | Status | Last Session | Next Focus |
|---|---|---|---|
| FarmSim Tools | Active | 2026-09-07 | Phase 1 scaffolded in VS Code — hub, Report, and Farm Manager pages running on localhost with the confirmed theme |

---

## Archived Projects

Projects that are finished, abandoned, or on indefinite hold. Kept here so nothing is ever truly lost.

| Project | Archived Date | Why | What Was Useful |
|---|---|---|---|

---

## Session History

All entries go below this line, newest first.

---

## FarmSim Tools -- Session 21 -- 2026-09-07

**Status:** Active

---

### What We Decided

- Scaffolded the Phase 1 project in VS Code: Vite + React + TypeScript + Tailwind, react-router for the hub/tool-page layout.
- All planning docs moved into the repo under `docs/` so they live with the code going forward instead of staying external.
- Theme tokens (color, type, field-tile motif) wired into Tailwind config directly from Feature Map so every page is already skinned, not generic-then-reskinned.
- Hub page built with tool tiles for Report and Farm Manager.
- Report and Farm Manager pages stubbed with real layout structure (upload area, split-view shell) ready for logic in the next pass.

---

### What Was Learned

- Chris wants to move fast through initial scaffolding — "speedrun" to a working localhost with the basics in place, deferring GitHub/Vercel connection to himself and pushing all other integrations out past the speedrun.

---

### What Changed

- Nothing previously decided was reversed. This session executes the build plan that was already locked.

---

### Open Questions Added

- None.

---

### Open Questions Closed

- None new this session — build execution only.

---

### Progress Updates

- Build: moved from Not Started to scaffolded — project structure, routing, and theme in place.

---

### Documents Updated

- Moved PROJECT_LOG.md, FEATURE_MAP.md, FARMSIM_SAVE_REFERENCE.md, PROGRESS_TRACKER.md, OPEN_QUESTIONS.md into `docs/`
- PROGRESS_TRACKER.md — scaffolding subtasks updated

---

### Next Session

Wire real upload + parsing logic into the Report and Farm Manager stubs.

---

## FarmSim Tools -- Session 20 -- 2026-09-08

**Status:** Active

---

### What We Decided

- Built FARMSIM_SAVE_REFERENCE.md from real FS25 save files Chris uploaded — not inferred, not guessed.
- Confirmed the full core file list: careerSavegame.xml, farms.xml, farmland.xml, fields.xml, vehicles.xml, economy.xml, placeables.xml, missions.xml, environment.xml — each mapped to the feature that reads it.
- Confirmed world/terrain files (density maps, tree data, snow state) are read-never, pass-through-only.
- Confirmed real examples of mod-generated files, ranging from empty stubs to files carrying real state (realSiloData.xml, shopSpecialOffers.xml) — the "unrecognized mod content" tag has to handle both.
- First-pass safe/risky edit classification written for every core file, explicitly flagged as needing in-game verification before Farm Manager's warnings ship.

---

### What Was Learned

- Chris had the real save files on hand from the original manual chat audits and uploaded them across three batches (16 files total) rather than needing to dig up old chat history.

---

### What Changed

- Nothing previously decided was reversed. This closes the one gap flagged last session — the tech stack, theme, and build breakdown now have real data to build against instead of assumptions.

---

### Open Questions Added

- None.

---

### Open Questions Closed

- Save-edits reference doesn't exist yet — built, see FARMSIM_SAVE_REFERENCE.md.
- Fleet data — confirmed as vehicles.xml, structure documented.

---

### Progress Updates

- Save file reference doc: moved from missing to Done in Progress Tracker.
- Report Generator and Farm Manager subtasks annotated with where their data now comes from.
- Phase 2 gained one item: test the reference doc against a second save (multi-farm, different map) once one exists.

---

### Documents Updated

- FARMSIM_SAVE_REFERENCE.md — created, then completed once the full file set arrived
- PROGRESS_TRACKER.md — added and completed the save reference row, annotated relevant subtasks
- OPEN_QUESTIONS.md — closed questions 20 and 21, nothing left open
- PROJECT_LOG.md — this entry

---

### Next Session

Scaffold Phase 1 in VS Code. Nothing left blocking — theme, stack, and real save structure are all in hand.

---

## FarmSim Tools -- Session 19 -- 2026-09-08

**Status:** Active

---

### What We Decided

- Visual direction locked: calm, spacious, editorial — deliberately less dense than Satisfactory Calculator.
- Color: deep forest green (#2F4A3C) as the dominant tone, warm off-white background (#FAF7F2), amber accent (#D98E2C) reserved strictly for status callouts and risky-edit warnings — never decorative.
- Grid status colors (safe / needs attention / risky) desaturated on purpose so they read as signal, not noise.
- Typography: Fraunces for display/headers, Inter for body/data (tabular figures matter here — this is a numbers-and-tables tool).
- One repeated motif: a soft-cornered "field tile" shape reused across grid tiles, cards, and buttons.
- One deliberate motion moment (the existing 30-second edit highlight); everything else stays static.
- Light-first theme. Dark mode parked as Phase 2/3 polish, not blocking v1.
- Phase 1 will be built already skinned to this theme rather than generic-then-reskinned.

---

### What Was Learned

- Chris wants the tool to visually differentiate itself from Satisfactory Calculator specifically — density was the thing to avoid, not the feature set.

---

### What Changed

- Nothing previously decided was reversed. This session added the visual layer on top of the already-locked tech stack and Phase 1 breakdown.

---

### Open Questions Added

- None.

---

### Open Questions Closed

- Visual theme/direction? -- See What We Decided above. Full spec now lives in Feature Map.

---

### Progress Updates

- Visual theme decision: added to Progress Tracker, marked Done.
- Farm Manager grid subtask updated to reference the confirmed status colors.

---

### Documents Updated

- FEATURE_MAP.md — added Visual Direction (v1) section, updated Status, added dark theme to future ideas
- PROGRESS_TRACKER.md — added visual theme decision row, updated grid subtask note
- OPEN_QUESTIONS.md — closed the visual theme question
- PROJECT_LOG.md — this entry

---

### Next Session

Scaffold Phase 1 in VS Code with the confirmed theme tokens (color, type, motif) in place from the start.

---

## FarmSim Tools -- Session 18 -- 2026-09-08

**Status:** Active

---

### What We Decided

- No backend for v1. Pure static frontend — parsing, the report's scripted rules, and export all run client-side in the browser, since nothing gets stored and FS25 saves are plain XML a browser can parse natively.
- Tech stack locked: React + Vite + Tailwind + TypeScript, native DOMParser/XMLSerializer for save parsing, Blob-download for the universal export path, File System Access API for Chrome-only direct write-back, Vercel for deployment.
- Backend (Workers + D1) stays parked until the opt-in hosting layer gets built later — not needed for v1.
- Phase 1 (MVP) broken into four features and fourteen subtasks: Save File Upload, Report Generator, Farm Manager, Privacy Note. See PROGRESS_TRACKER.md.

---

### What Was Learned

- Chris asked The Forge to drive planning directly rather than checking in at each step, through to the point of being ready to open VS Code.

---

### What Changed

- Nothing previously decided was reversed. This session filled in the two remaining blanks (tech stack, build breakdown) on top of the already-locked plan.

---

### Open Questions Added

- Safe-edits reference doc for Farm Manager's warning system doesn't exist yet. Needed before that one subtask ships, not before the build starts.

---

### Open Questions Closed

- Backend needed for v1? -- No, static frontend only.

---

### Progress Updates

- Tech stack decision: moved from Not Started to Done.
- Build: moved from Not Started to broken-down-and-ready — Phase 1 hierarchy defined in PROGRESS_TRACKER.md, 0/14 subtasks complete.

---

### Documents Updated

- FEATURE_MAP.md — added Tech Stack (v1) section, updated Status
- PROGRESS_TRACKER.md — added Phase 1 hierarchy, Phase 2/3 placeholders
- OPEN_QUESTIONS.md — closed the backend question, added the safe-edits reference gap
- PROJECT_LOG.md — this entry

---

### Next Session

Scaffold the Phase 1 project structure in VS Code and start on Save File Upload.

---

## Entry 1
- Idea originated from the save-file audits done directly in chat
- Compared to Satisfactory Calculator and the Developer PowerTools mod
- Feature map created: report generation, map viewer, in-browser editing
- First open question logged: who this is for

## Entry 2
- Answered: could be for others, not just a personal tool
- Feature map built generic accordingly
- New question raised: store saves for later, or process and discard

## Entry 3
- Answered: processed once per visit, discarded on refresh — no accounts, no history
- New question raised: after editing, does the site let you download the edited save file back?

## Entry 4
- Answered: yes to both — download to Downloads folder, or write directly back to the source file
- Noted: direct-write-back depends on browser support (Chrome-based), Downloads is the universal fallback
- New question raised: build all three features together, or launch with report only first?

## Entry 5
- Clarified: report needs no AI, it's scripted rules — same logic used manually in chat
- Clarified: map has an easy version (status grid) and a hard version (real geographic overlay)
- Recommended: launch with report + editing, simple grid-map to start, real map later
- New question raised: simple grid-map at launch, or skip the map entirely for v1?

## Entry 6
- Answered: simple grid-map included at launch, main focus stays on report + editing
- New question raised: build report first then add editing, or both together from day one?

## Entry 7
- Answered: build report + editing together on day 1, map added day 2 or whenever
- New question raised: single-page layout, or separate pages for upload/report/editor?

## Entry 8
- Decided: hub/dashboard layout with tool tiles, each tool its own page — modeled on Satisfactory Calculator being several tools, not one
- Ceiling ideas captured: profitability calc, real interactive map, fleet database, contract calc, crop rotation planner, mod compatibility checker, multiplayer dashboard
- New question raised: keep ceiling ideas as a wishlist, or prioritize one right after launch?

## Entry 9
- Researched satisfactorycalculator.com directly
- Key finding: their map and save editor are the same tool, not separate — worth reconsidering our 3-tool split
- Nav is grouped by category, confirms hub layout choice
- Added to ceiling: static reference database (no save needed), community sharing (later, needs accounts)

## Entry 10
- Researched satisfactorytools.com — narrow, single-purpose production calculator, no map or editor
- Takeaway: validates launching narrow instead of building the whole platform at once
- Flagged tension: shareable report links vs the "nothing stored" rule — unresolved, not urgent

## Entry 11
- Confirmed satisfactory-calculator.com was the correct site researched
- Decided: merge map + editor into one tool, "Farm Manager" — two tools total now (Report, Farm Manager)
- Decided: wishlist stays a running list, nothing prioritized until launch ships
- All open questions currently resolved

## Entry 12
- New round of open questions raised: name/branding, file upload flow, multi-farm handling, unknown mod content, editing scope for v1, privacy note, mobile support

## Entry 13
- File upload: one at a time or several at once, no zip, each confirms on arrival
- Multi-farm: user's choice — single farm, or full review across all farms
- Unknown mod content: tagged clearly, never errors or silently drops
- Editing scope: everything editable, v1. New UI concept — split view, input fields on the left, live code preview on the right, edited value highlighted 30 seconds
- Privacy note: confirmed needed
- Mobile: backseat for v1, idea logged for a read-only companion version later
- Only remaining open item: site name/branding

## Entry 14
- Confirmed: the website's ceiling isn't capped at Tier 1 — it grows into the front end for Tier 2 (live server) and Tier 3 (live control panel) too
- Tier 4 stays mostly desktop, but could host mod stat/balance calculators
- Cross-cutting idea: optional AI advisor panel, built into the site
- Ceiling section reorganized around the tier roadmap instead of a flat list

## Entry 15
- Added: opt-in hosting layer for people who want it, sign-in only for this, not required for basic use
- Unlocks: revisit reports later, shareable links, farm progress tracking over multiple saves
- Resolves the Entry 10 tension between "nothing stored" and shareable links — they coexist, one's default, one's opt-in

## Entry 16
- Hosting timing decided: later/ceiling feature, not v1 — stays consistent with "focus on report + editing first"
- New feature added: mods list export (.txt), bundled with the report/download
  - Save files already contain modName, title, and version for every mod — no extra data needed, just formatting what's already there

## Entry 17
- Name decided: FarmSim Tools — franchise-anchored, not FS25-specific, survives the next installment
- Domain confirmed available: farmsimtools.com
- All open planning questions now resolved

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
