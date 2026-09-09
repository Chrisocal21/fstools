# FarmSim Tools — Save File Reference

> Technical reference, not a planning doc. What's actually inside an FS25 save, sourced from real save files Chris uploaded (Courtright Line map, single farm, September 2026) — full set now received. Update this as more save variety gets tested (multi-farm, other maps, more mods).

---

## The Big Picture

An FS25 save is not one file — it's a folder of XML files. Three categories, all confirmed against a real save:

1. **Core game files** — always present, same structure regardless of mods. These are what Report and Farm Manager parse.
2. **World/terrain files** — always present, but not farm-management data (trees, snow, crop density on the ground). Read never, carried through untouched on export.
3. **Mod-generated files** — one per installed mod that saves its own state. Present only if that mod is installed, often just an empty stub when unused, sometimes real data. This is what the "unrecognized mod content" tag handles.

Rule for the parser: if a file's root tag matches the known-core list below, parse it. If it doesn't, tag it as mod content and move on — never error, never drop it silently.

---

## Core Files

| File | Contains | Feeds |
|---|---|---|
| `careerSavegame.xml` | Game settings (map, difficulty, initial money), current money/playtime, and the full installed mod list (`modName`, `title`, `version`, `fileHash` per mod) | Report header/settings context, Mods List Export |
| `farms.xml` | Per farm: `money`, `loan`, lifetime `statistics` (hectares worked, fuel used, etc.), and a `finances/stats` entry per day with ~30 line items (soldProducts, harvestIncome, wagePayment, propertyIncome, etc.) | Report: Finances section |
| `farmland.xml` | Every farmland parcel `id` mapped to the `farmId` that owns it (`farmId="0"` means unowned) | Report: ownership context, Farm Manager: which land is whose |
| `fields.xml` | Per field `id`: `fruitType`, `growthState`, `weedState`, `groundType`, `sprayType`/`sprayLevel`, `limeLevel`, `plowLevel`, `waterLevel`, `stoneLevel`, `plannedFruit` | Report: Fields section, Farm Manager: grid + click-to-edit |
| `vehicles.xml` | Every vehicle/implement: `filename` (identifies make/model), `uniqueId`, `price`, `age`, `farmId` (owner — filter to the farm being reviewed), `operatingTime`, `fillUnit` (current cargo), `configuration` (color/trim options), `attacherJoints` (what's hitched to what) | Report: Fleet section |
| `economy.xml` | Every crop/product's price history across the twelve seasonal periods (large file — thousands of lines, one block per fill type) | Report: Fields section (value ranking) |
| `placeables.xml` | Every building: `uniqueId`, `price`, `farmId` (owner), and nested `productionPoint` (active productions, storage fill levels) or `sellingStation` (price curves) — large file, structure is consistent per placeable | Report: Production section, Farm Manager: building list |
| `missions.xml` | Active contracts (cultivate/harvest/plow/stone-pick), which field, reward, status | Stretch — not core v1, parked as a future report line |
| `environment.xml` | Current day, time, weather forecast | Minor — "Day X" context in the report header, not a core section |

**Not needed for v1:** `sales.xml` (in-game shop listings — not owned vehicles, a different concept entirely), `players.xml` (cosmetic appearance + a hashed player ID — skip, ties into the privacy note), `npc.xml` (static role names, not save data).

Fleet data confirmed — `vehicles.xml` is the file. No further gaps in the core file list.

---

## World/Terrain Files — Pass Through, Never Parse

Confirmed examples from the real save: `densityMap_fruits_growthState.xml`, `densityMapHeight.xml`, `stone_growthState.xml`, `weed_growthState.xml`, `snow_state.xml` (all density-map updaters — compressed blobs or engine state, not human-readable), plus `treePlant.xml` (tree positions/types — readable, but world dressing, not farm-management data) and `treeMarker.xml` (empty unless trees are marked for cutting).

None of these get opened by Report or Farm Manager. On export, they get carried through byte-for-byte, untouched.

---

## Mod-Generated Files — Confirmed Real Examples

Every one of these should hit the "unrecognized mod content" tag, not an error:

**Empty stubs in this save:** `priceAlertConfig.xml`, `shopRefund.xml`, `guidedTour.xml`, `handTools.xml`, `items.xml`, `navigationSystem.xml`, `onCreateObjects.xml`, `FarmerWorkingAssistant.xml` (e.g. `<items/>`).

**Real mod state:** `FS25_ContractBoost.xml`, `FS25_UnloadBalesEarly.xml` (mod settings blocks), `realSiloData.xml` (a list of silos with fill levels), `shopSpecialOffers.xml` (a real list of discounted vehicles for sale, from the Special Offers mod).

Takeaway holds: mod files range from empty stubs to files carrying real, structured data. Tagging logic can't assume "unrecognized = empty."

---

## Safe vs. Risky Edit Classification (First Pass)

This is what Farm Manager's warning system reads from. Marked "first pass" — confirm against actual in-game behavior before shipping the warnings, don't take this as final.

**Safe to edit:**
- `farms.xml` — `money`, `loan` — direct, well-understood values, the most common edit in this genre
- `fields.xml` — per-field attributes (`growthState`, `weedState`, `groundType`, `plowLevel`, `sprayLevel`, `limeLevel`, `waterLevel`) — simple state flags, the game re-reads these fresh each load
- `vehicles.xml` — `price` — same category as farm money, low risk

**Risky — warn before editing:**
- `farmland.xml` — reassigning `farmId` — can desync from fields/placeables tied to that land if not updated together
- `placeables.xml` — `price` and `storage` fill levels are probably fine; the nested production-curve values (`curveBaseCurve`, `plateauTime`, etc.) are not — don't expose those for editing even though they're technically in the same file
- `economy.xml` — editing price history changes market simulation state — don't expose for editing in v1, read-only
- `vehicles.xml` — `component` position/rotation (can place a vehicle inside terrain or off the map), `attacherJoints` (breaks the hitch chain if the referenced `uniqueId` doesn't exist), `configuration` ids (must match a valid option for that specific vehicle or it can break in-game rendering)

**Don't touch at all:**
- Anything in the world/terrain files
- Unrecognized mod files — pass through, never modify

---

## Confirmed Formats (read straight from the sample save, not inferred)

These were verified attribute-by-attribute while wiring up the parser. Several
contradict the earlier assumptions in this doc, so treat this section as the
authority.

**Field levels are small integers, not percentages.** In the sample save:

| Attribute | Values present | Meaning |
|---|---|---|
| `weedState` | 0–1 | 0 = clean |
| `sprayLevel` | 0–2 | fertilisation stages, higher is better |
| `limeLevel` | 0–3 | 0 = lime is due |
| `plowLevel` | 0–1 | 0 = carrying the ploughing penalty |
| `rollerLevel`, `stubbleShredLevel` | 0–1 | not currently surfaced |
| `stoneLevel`, `waterLevel` | 0 | present but unused on this map |
| `growthState` | 0–10 | per-crop stage counter, **no fixed maximum** |

Because the maximum varies by save and mod set, the tool derives each scale from
the highest value the save actually uses rather than assuming a range.

**Readiness comes from `groundType`, not `growthState`.** Values seen:
`NONE`, `CULTIVATED`, `PLOWED`, `SOWN`, `RIDGE_SOWN`, `PLANTED`,
`HARVEST_READY`, `HARVEST_READY_OTHER`. A field is harvestable when
`groundType` starts with `HARVEST_READY`.

**Sentinel values:** `fruitType="UNKNOWN"` means bare ground and
`plannedFruit="FALLOW"` means nothing planned. `sprayType="NONE"` likewise.

**Field area is not in `fields.xml`.** Confirmed against the real sample: no
field element carries `areaHa`, `area`, or anything else area-shaped, and
`farmland.xml` only maps parcel `id` to owning `farmId` — no size there
either. A field's hectare size is fixed by the map, not written into the
save, so it can't be read from save files at all; it would have to come from
the map's own data when that becomes relevant (the Phase 2 real map). The
model's `areaHa: number | null` already treats this as commonly absent.

**Vehicles carry no cost history.** Confirmed against the real sample: no
`<vehicle>` element or nested child (checked every one — `washable`,
`wearable`, `fillUnit`, `drivable`, `aiJobVehicle`, `attacherJoints`, mod
blocks) records fuel spent, repair spent, or running cost for that specific
machine. `farms.xml`'s `vehicleRunningCost` and fuel-purchase line items are
farm-wide daily totals only — there is no way to attribute them back to an
individual `uniqueId` from save data. `drivable` does carry `odometerMilage`
(distance, not cost) alongside `operatingTime`.

**Vehicles:**
- `operatingTime` is **seconds** — divide by 3600 for hours. (Cross-checked: the sample's `operatingTime` of 68,702 s matches its `playTime` of 1,142 minutes.)
- `price` and `age` are on the `<vehicle>` element; there is no `damage` attribute there
- Damage lives on a nested `<wearable damage="0.001577"/>`
- Dirt lives on `<washable><dirtNode amount="…"/></washable>` — **one node per painted part**, so a clean-up has to set them all
- Tanks are `<fillUnit><unit index fillType fillLevel/></fillUnit>` with **no `capacity`** — capacity is in the vehicle's mod/base XML, not the save, so fill percentages can't be computed from a save alone
- `propertyState` is `OWNED` or `LEASED`

**Production points:**
- Lines are `<production id="planks" isEnabled="true"/>` — the attribute is `isEnabled`
- Storage is `<storage farmId="1"><node fillType fillLevel/></storage>`, again with no capacity
- Preplaced buildings have **no `filename`** — the type name has to come from the `uniqueId` (`preplaced_<type>_<hash>`)
- Preplaced buildings sit on `farmId="0"`; the owning farm is on the nested `<storage farmId="…">`

**careerSavegame.xml:** `savegameName`, `mapTitle`, `mapId` and `playTime` are nested under `<settings>`, not on the root. `playTime` is in minutes.

**economy.xml:** `<economy><fillTypes><fillType fillType="WHEAT"><history><period period="EARLY_SPRING">525</period>...</history></fillType></fillTypes></economy>` — one `<fillType>` per fill type (crop and product tokens alike, e.g. `WHEAT`, `MILK`, `PLANKS`), each with exactly twelve `<period>` children (`EARLY_SPRING` through `LATE_WINTER`) giving that season's price. A `fillType="UNKNOWN"` entry exists with no `<history>` — skip it. Some entries carry a `totalAmount` attribute (seen on `CANOLA`, `MAIZE`, `BEETROOT`, `LETTUCE`, `PLANKS`, `BREAD`, `GRASS_WINDROW`) — purpose unconfirmed, not used. There is **no "current price" or current-period marker anywhere in the file** — the save doesn't record which of the twelve periods is active, so the report averages the year rather than guessing a season. A couple of fill types (observed: `TEA_WINTERFRUITS`) carry a negative glitch value in one or two periods — the parser drops non-positive values before averaging. Units are unconfirmed (likely $ per 1000L, matching FS's in-game price display convention) — treated only as a relative ranking signal, never surfaced as a dollar figure.

**farms.xml:** matches the earlier description — `<finances><stats day="N">` with one child element per line item, and `<statistics>` with lifetime totals.

---

## Status

Reference doc complete against this save. Fields, finances, fleet, buildings, and mod list all sourced from real data — nothing left inferred from the feature list alone. Next real test is a second save (ideally multi-farm, different map) to confirm what's universal versus specific to this one save.
