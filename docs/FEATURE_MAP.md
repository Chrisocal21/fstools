# FarmSim Tools — Feature Map
name: FarmSim Tools
domain: farmsimtools.com


## Priority
Report and editing are the main focus. Map ships simple at launch, gets real geography later.

## Tech Stack (v1)
No backend. v1 is a static frontend only — no server, no database, no auth, no file storage.

Reasoning: nothing gets stored (processed once per visit, discarded on refresh), and FS25 saves are plain XML files. A browser can parse them (native DOMParser), run the report's scripted rules, and rewrite them for export without ever touching a server. Standing up Workers + D1 for v1 would be infrastructure with nothing for it to do yet.

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind + TypeScript | Default stack, no deviation |
| Save parsing | Native browser DOMParser / XMLSerializer | No library needed to start; revisit only if round-tripping FS25's exact XML structure gets unreliable |
| State | In-memory only (React state) | No persistence by design |
| Export — universal | Blob + download link | Writes to the Downloads folder, works in any browser |
| Export — direct write-back | File System Access API | Chrome-based browsers only, feature-detected, falls back to download |
| Deployment | Vercel | Default frontend deploy target, static build |
| Version control | Git + GitHub | As always |

Backend (Cloudflare Workers + D1) comes back into scope only when the opt-in hosting layer gets built — that's a later/ceiling feature, not v1. AI (OpenAI/Claude APIs) stays out of v1 entirely — the report is scripted rules, not generated.

## Visual Direction (v1)
Direction: calm, spacious, editorial — the deliberate opposite of Satisfactory Calculator's dense, everything-competes-for-attention feel. Hierarchy over density: one dominant color, generous whitespace, one focal element per screen at a time.

**Color**

| Role | Value | Use |
|---|---|---|
| Dominant | Deep forest green — #2F4A3C | Primary actions, header/nav accents — carries 60-70% of the visual weight |
| Background | Warm off-white (paper) — #FAF7F2 | Base surface, light-first theme |
| Text | Warm near-black — #2A2520 | Body copy, data tables |
| Border / neutral | Soft warm tan — #E4DDD1 | Dividers, card edges, quiet structure |
| Accent (reserved) | Amber/gold — #D98E2C | Status callouts and risky-edit warnings only — never used decoratively |
| Grid status: safe | Muted green (dominant, lower saturation) | Farm Manager grid tile |
| Grid status: needs attention | Amber (same as accent) | Farm Manager grid tile |
| Grid status: risky | Muted rust/red — #B5533C | Farm Manager grid tile |

Status colors are desaturated on purpose — they need to read as signal on a grid the user looks at constantly, not add noise.

**Typography**
- Display / headers: Fraunces — a warm, distinctive serif. Avoids the generic system-font look, gives the editorial feel without going precious.
- Body / data: Inter — built-in tabular figures, which matters for a tool that's mostly numbers and tables.

**Layout**
- One focal element per screen — the report, the grid — not nav-plus-sidebar-plus-toolbar all fighting for attention at once
- Generous whitespace over dense stacked panels
- Hub nav stays minimal — icon plus label, shown only where relevant, never a permanent dense sidebar

**Motion**
One deliberate moment: the 30-second edit-highlight already scoped in Farm Manager. Everything else stays static — no scattered hover or micro-interactions layered on top for their own sake.

**Cohesion (repeated motif)**
A soft-cornered "field tile" shape — a rounded rectangle echoing a farm plot boundary — reused across grid tiles, cards, and buttons. One shape, carried everywhere, ties the visual language to the domain without literal or cheesy farm icons.

**Icons**
SVG only, and only where they carry real meaning — status badges, nav. Nothing decorative.

**Parked, not blocking:** dark mode. Light-first fits the calm/editorial direction; a dark theme can come later as Phase 2/3 polish if wanted.

## Layout
Hub/dashboard with tool tiles. Each tool is its own page. Scales as more tools get added — no single stacked page.

## Build phasing
Day 1: report + editing, built together.
Day 2 or later: map.

## Core
- Upload a save file — one at a time or several at once, no zip required, each file confirms as it's accepted
- Multi-farm saves: user picks one farm to review, or runs a full review across all farms
- Auto-generate a report: finances, fleet, fields, production
  - No AI needed — scripted rules, same logic as the manual audits done in chat
- Unrecognized mod content gets a clear tag ("unrecognized mod content"), never errors or silently drops
- Mods list export — a .txt bundled with the report/download, listing every mod's readable title, version, and internal name (all already present in the save file, no extra lookup needed)

## Farm Manager (merged map + editor)
- Grid view of fields, color-coded by status
- Click a tile to edit it directly, no separate editor tool
- Everything is editable, v1 scope
- Editing UI: split view — left side is input fields (e.g. money), right side is a live preview of the actual save file code, changed value highlighted for 30 seconds after edit
- Safe/risky warnings, built from the safe-edits reference
- Export: download to Downloads folder, or save directly back to the original file location
  - Note: direct-write-back needs browser file-system permission (Chrome-based browsers only). Downloads is the fallback that works everywhere.
- Real geographic map version grows into this same tool later

## Mobile
Backseat for v1. Idea: a read-only "companion" version — most features, no editing, no save upload (nobody has a save file on their phone). Desktop stays the full tool.

## Privacy
A privacy note is required — save files carry player names/IDs, even briefly in memory with no storage.

## Reference points
- Satisfactory Calculator — structure and UX inspiration (and a counter-example on visual density, see Visual Direction)
- Developer PowerTools mod — what it replaces, minus needing the game open

## Data handling
No storage by default. Processed once per visit, discarded on refresh. No accounts required for basic use.

Optional layer: opt-in hosting for people who want it, decided as a later/ceiling feature — not part of v1, since focus stays on report + editing first. Requires sign-in (accounts only for this, not for basic use). Unlocks: revisit a report later, share a link to it, track one farm's progress across multiple saves over time. Resolves the earlier shareable-links tension — default stays private/disposable, hosting is opt-in on top, later.

## Audience
Could be for others, not just personal use — build generic, not tied to one farm.

## Status
Tech stack and visual direction both decided. Phase 1 scaffolded in VS Code — hub, Report, and Farm Manager pages running on localhost, already skinned to the confirmed theme.

## Future / ceiling ideas
The website's ceiling maps directly to the tier roadmap — it grows into the front end for all of it, not just save files.

- **Tier 1 (current scope):** upload/analyze/edit save files, offline
- **Tier 2:** connects straight to a live dedicated server — real data, no file upload needed
- **Tier 3:** becomes an actual control panel — buy/sell, toggle production, dispatch helpers, live
- **Tier 4:** mostly stays desktop (GIANTS Editor, 3D work), but could host stat/balance calculators for mods being built
- **Cross-cutting:** optional AI advisor panel built into the site — what Claude does manually in chat, live inside the tool

Standalone ideas, not tied to a specific tier:
- Profitability calculator — best crops/animals per hectare, building ROI
- Fleet database — specs and prices, comparable side by side, no save needed
- Contract value calculator
- Crop rotation / soil planner
- Mod compatibility checker
- Static reference database — browsable vehicles/crops/buildings, no save upload needed
- Community blueprint/layout sharing (would need accounts, later)
- Dark theme (visual polish, Phase 2/3, not blocking)

## What Satisfactory Calculator does that's worth copying
- Map and editor are the same tool, not separate — upload save, click a building on the map, edit it right there
- Nav grouped by category (Planners / Map / Reference / Workbench), not flat

## Other reference site checked: satisfactorytools.com
- Narrow tool — just the production calculator, no map, no editor, no database browsing
- Takeaway: a focused single-purpose tool is a valid way to compete, not just a lesser platform — backs the "launch narrow" plan
- Idea worth flagging (tension, not decided): shareable report links, without accounts. Conflicts with "nothing stored" — needs a real answer later, not now.
