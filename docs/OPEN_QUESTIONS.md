# FarmSim Tools — Open Questions

## Answered
1. Who is this for — just you, or other players too? — Could be for others.
2. Store saves, or process and discard? — Processed once and discarded. Refresh = clean slate, nothing kept.
3. Download edited save? — Yes — download to Downloads folder, or save directly back to the original file location.
4. Launch scope? — Report and editing need no AI, both easy. Map has an easy version (status grid) and a hard version (real geographic overlay).
5. Map for launch? — Simple grid-map included at launch. Main focus stays on report + editing.
6. Build order? — Report + editing together, day 1. Map is day 2 or later.
7. Layout? — Hub/dashboard with tool tiles, each tool its own page — scales as more tools get added, not a single stacked page.
8. Merge map + editor? — Yes. Two tools total: Report (view-only) and Farm Manager (grid + editing, real map grows in later).
9. Wishlist priority? — Kept as a running list. Nothing gets prioritized until Report + Farm Manager actually ship.
10. File upload flow — One at a time or drag several at once, no zip required. Each file shows an accepted confirmation as it lands.
11. Multi-farm saves — User's choice: pick one farm to review, or run a complete review across all farms at once.
12. Unknown mod content — Shows a clear, friendly tag/badge ("unrecognized mod content") instead of erroring or silently dropping it. Confirmed against a real save — mod files range from empty stubs to files with real state, tagging logic needs to handle both.
13. Editing scope for v1 — Everything editable. Split view: left = input fields (e.g. money), right = live code preview of the save file, changed value highlighted for 30 seconds after edit.
14. Privacy note — Yes, needed. Confirmed — players.xml carries a hashed player ID, real save data.
15. Mobile support — Backseat for v1. Idea: read-only "companion" version — most features, no editing, no save upload (nobody has a save file on their phone).
16. Opt-in hosting timing — Later/ceiling feature, not v1. Focus stays on report + editing first.
17. Name/branding — FarmSim Tools. Domain farmsimtools.com confirmed available.
18. Backend needed for v1? — No. Pure static frontend — parsing, rules, and export all run client-side in the browser. Backend only comes back for the later opt-in hosting layer.
19. Visual theme/direction? — Calm, spacious, editorial — deliberately less dense than Satisfactory Calculator. Dominant deep green, amber accent reserved strictly for status/warnings, Fraunces + Inter typography, one repeated rounded "field tile" motif, light-first. Full spec in Feature Map.
20. Save-edits reference — doesn't exist yet? — Built: FARMSIM_SAVE_REFERENCE.md, from real save files Chris uploaded. Covers settings, finances, fields, fleet, buildings, mods, world/terrain files, and mod-generated files, with a first-pass safe/risky classification.
21. Fleet data? — Confirmed: `vehicles.xml`. Structure documented in the reference doc (filename, price, farmId, fillUnit, configuration, attacherJoints).

## Open
(none — all resolved, reference doc complete against the one save tested)
