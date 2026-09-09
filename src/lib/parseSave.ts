// Savegame XML -> normalized model. Everything runs client-side through
// DOMParser; no file ever leaves the browser.
//
// The parsers are deliberately tolerant: Farming Simulator moves attributes
// between elements and attributes across versions, and mods add their own
// nodes. Anything we don't recognise is tagged, never dropped and never an
// error (see docs/FARMSIM_SAVE_REFERENCE.md).

import {
  titleCase,
  type Farm,
  type Field,
  type FillSlot,
  type FinanceDay,
  type ModEntry,
  type ProductionLine,
  type ProductionPoint,
  type SaveData,
  type SaveFileRecord,
  type SaveFileStatus,
  type Vehicle,
} from './saveModel'

/** Files we open and read. */
const PARSED_FILES = new Set([
  'careersavegame.xml',
  'farms.xml',
  'farmland.xml',
  'fields.xml',
  'vehicles.xml',
  'placeables.xml',
  'environment.xml',
  'economy.xml',
])

/** Files we knowingly carry through untouched — engine/world state. */
const PASSTHROUGH_PATTERNS = [
  /^densitymap/i,
  /^stone_/i,
  /^weed_/i,
  /^snow_/i,
  /^tree(plant|marker)/i,
  /^missions\.xml$/i,
  /^terrain/i,
]

export function classifyFile(name: string): { status: SaveFileStatus; note: string } {
  const lower = name.toLowerCase()
  if (PARSED_FILES.has(lower)) return { status: 'parsed', note: 'Read into your report' }
  if (PASSTHROUGH_PATTERNS.some((p) => p.test(lower)))
    return { status: 'passthrough', note: 'Carried through untouched' }
  return { status: 'unrecognized', note: 'Mod content — kept as-is' }
}

// --- small XML helpers -------------------------------------------------

function num(value: string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/** Reads a value that may live either as an attribute or as a child element. */
function attrOrChild(el: Element, name: string): string | null {
  const attr = el.getAttribute(name)
  if (attr !== null) return attr
  const child = el.querySelector(`:scope > ${name}`)
  return child?.textContent?.trim() ?? null
}

function parseXml(text: string): Document | null {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) return null
  return doc
}

/** Any element carrying a fillType/fillLevel pair, wherever it sits. */
function readFillSlot(el: Element): FillSlot | null {
  const fillType = el.getAttribute('fillType') ?? el.getAttribute('fillTypeName')
  if (!fillType || fillType === 'UNKNOWN') return null
  const fillLevel = num(el.getAttribute('fillLevel'))
  // Capacity lives in the vehicle/placeable definition rather than the save, so
  // it is usually absent — a null ratio means "we only know the level".
  const capacity = num(el.getAttribute('capacity'), 0)
  return {
    fillType: titleCase(fillType),
    fillLevel,
    capacity,
    ratio: capacity > 0 ? Math.min(fillLevel / capacity, 1) : null,
  }
}

/** Where a vehicle's tanks live, and where a production point's storage lives. */
export const VEHICLE_FILL_SELECTOR = 'fillUnit > unit'
export const STORAGE_SELECTOR = 'storage > node'

/** Shared by the reader and the writer so both walk slots in the same order. */
export function fillSlotElements(root: Element, selector: string): Element[] {
  return Array.from(root.querySelectorAll(selector)).filter((el) => {
    const fillType = el.getAttribute('fillType') ?? el.getAttribute('fillTypeName')
    return fillType !== null && fillType !== '' && fillType !== 'UNKNOWN'
  })
}

function readFillSlots(root: Element, selector: string): FillSlot[] {
  return fillSlotElements(root, selector)
    .map(readFillSlot)
    .filter((s): s is FillSlot => s !== null)
}

/** Damage sits on a nested <wearable damage="…"> node. */
export function damageTarget(el: Element): { el: Element; name: string } {
  const wearable = el.querySelector(':scope > wearable')
  if (wearable?.hasAttribute('damage')) return { el: wearable, name: 'damage' }
  return { el, name: 'damage' }
}

/** Dirt is spread across <washable><dirtNode amount="…"> — one per painted part. */
export function dirtNodes(el: Element): Element[] {
  return Array.from(el.querySelectorAll(':scope > washable > dirtNode'))
}

// --- vehicle naming ----------------------------------------------------

const VEHICLE_CATEGORIES: [RegExp, string][] = [
  [/harvest|combine|thresher|cutter|header/i, 'Harvesting'],
  [/tractor/i, 'Tractor'],
  [/trailer|tipper|bigbody|dumper|hooklift/i, 'Trailer'],
  [/plough|plow|subsoil|cultivat|disc|harrow|power[hH]arrow/i, 'Tillage'],
  [/seed|planter|drill|sow/i, 'Seeding'],
  [/spray|sprayer|weeder/i, 'Spraying'],
  [/spread|fertil|lime|manure|slurry/i, 'Fertilising'],
  [/mower|tedder|windrower|rake|baler|wrapper|forage/i, 'Forage'],
  [/loader|telehandler|skidsteer|excavat/i, 'Loading'],
  [/truck|car|pickup|van/i, 'Vehicle'],
  [/forest|chainsaw|woodchipper|chipper/i, 'Forestry'],
  [/animal|husbandry|feed/i, 'Livestock'],
]

function describeVehicle(filename: string): {
  name: string
  brand: string
  category: string
  isMod: boolean
} {
  const isMod = /\$moddir\$/i.test(filename)
  const clean = filename.replace(/\$\w+\$/g, '').replace(/\\/g, '/')
  const parts = clean.split('/').filter(Boolean)
  const base = (parts.at(-1) ?? filename).replace(/\.xml$/i, '')
  const vehiclesAt = parts.findIndex((p) => /^vehicles$/i.test(p))
  // Mod vehicles have no data/vehicles/<brand> path, so fall back to the mod folder.
  const brandPart = (vehiclesAt >= 0 ? parts[vehiclesAt + 1] : parts.at(-2))?.replace(
    /^FS\d+_/i,
    '',
  )
  const category =
    VEHICLE_CATEGORIES.find(([pattern]) => pattern.test(clean))?.[1] ?? 'Other'
  return {
    name: titleCase(base),
    brand: brandPart ? titleCase(brandPart) : 'Unknown',
    category,
    isMod,
  }
}

function describePlaceable(filename: string, fallback: string): { name: string; isMod: boolean } {
  const isMod = /\$moddir\$/i.test(filename)
  const clean = filename.replace(/\$\w+\$/g, '').replace(/\\/g, '/')
  const base = clean.split('/').filter(Boolean).at(-1)?.replace(/\.xml$/i, '')
  return { name: base ? titleCase(base) : fallback, isMod }
}

// --- per-file parsers --------------------------------------------------

function parseFields(doc: Document): Field[] {
  return Array.from(doc.querySelectorAll('field')).map((el) => {
    const area = attrOrChild(el, 'areaHa') ?? attrOrChild(el, 'area')
    // The game writes UNKNOWN for bare ground and FALLOW for "nothing planned".
    const crop = (attrOrChild(el, 'fruitType') ?? attrOrChild(el, 'fruitTypeName') ?? '').trim()
    const planned = (attrOrChild(el, 'plannedFruit') ?? '').trim()
    return {
      id: num(el.getAttribute('id') ?? el.getAttribute('fieldId')),
      fruitType: crop === 'UNKNOWN' ? '' : titleCase(crop),
      plannedFruit: planned === 'FALLOW' || planned === 'UNKNOWN' ? '' : titleCase(planned),
      growthState: num(attrOrChild(el, 'growthState')),
      groundType: titleCase(attrOrChild(el, 'groundType') ?? ''),
      weedState: num(attrOrChild(el, 'weedState')),
      sprayType: titleCase((attrOrChild(el, 'sprayType') ?? '').replace(/^NONE$/, '')),
      sprayLevel: num(attrOrChild(el, 'sprayLevel')),
      limeLevel: num(attrOrChild(el, 'limeLevel')),
      plowLevel: num(attrOrChild(el, 'plowLevel') ?? attrOrChild(el, 'ploughLevel')),
      stoneLevel: num(attrOrChild(el, 'stoneLevel')),
      waterLevel: num(attrOrChild(el, 'waterLevel')),
      areaHa: area === null ? null : num(area),
      ownerFarmId: el.hasAttribute('farmId') ? num(el.getAttribute('farmId')) : null,
    }
  })
}

function parseVehicles(doc: Document): Vehicle[] {
  return Array.from(doc.querySelectorAll('vehicle'))
    .filter((el) => el.getAttribute('filename'))
    .map((el) => {
      const filename = el.getAttribute('filename') ?? ''
      const described = describeVehicle(filename)
      // operatingTime is seconds of in-game time.
      const operatingHours = num(attrOrChild(el, 'operatingTime')) / 3600
      const attacher = el.querySelector('attacherJoints > attacherJoint[attachedVehicleUniqueId]')
      const damage = damageTarget(el)
      const dirt = dirtNodes(el)
      const dirtAmount =
        dirt.length > 0
          ? dirt.reduce((sum, node) => sum + num(node.getAttribute('amount')), 0) / dirt.length
          : 0
      return {
        uniqueId: el.getAttribute('uniqueId') ?? el.getAttribute('id') ?? filename,
        farmId: num(el.getAttribute('farmId')),
        filename,
        ...described,
        price: num(attrOrChild(el, 'price')),
        age: num(attrOrChild(el, 'age')),
        operatingHours,
        damage: Math.min(num(damage.el.getAttribute(damage.name)), 1),
        wear: Math.min(dirtAmount, 1),
        propertyState: el.getAttribute('propertyState') ?? 'OWNED',
        fillUnits: readFillSlots(el, VEHICLE_FILL_SELECTOR),
        attachedTo: attacher?.getAttribute('attachedVehicleUniqueId') ?? null,
      }
    })
}

/** Preplaced buildings have no filename — the uniqueId carries the type name. */
function nameFromUniqueId(uniqueId: string): string {
  const withoutPrefix = uniqueId.replace(/^preplaced_/, '')
  const withoutHash = withoutPrefix.replace(/_[0-9a-f]{16,}$/i, '')
  return titleCase(withoutHash) || 'Production point'
}

function parseProduction(doc: Document): ProductionPoint[] {
  const points: ProductionPoint[] = []
  for (const placeable of Array.from(doc.querySelectorAll('placeable'))) {
    const pp = placeable.querySelector('productionPoint')
    if (!pp) continue
    const filename = placeable.getAttribute('filename') ?? ''
    const uniqueId = placeable.getAttribute('uniqueId') ?? filename
    const described = filename
      ? describePlaceable(filename, 'Production point')
      : { name: nameFromUniqueId(uniqueId), isMod: false }

    const lines: ProductionLine[] = Array.from(pp.querySelectorAll('production')).map((prod) => {
      const id = prod.getAttribute('id') ?? prod.getAttribute('productionId') ?? 'production'
      const enabled = prod.getAttribute('isEnabled') ?? prod.getAttribute('active')
      const status = prod.getAttribute('status')
      return {
        id,
        name: titleCase(id),
        active: enabled !== null ? enabled === 'true' : status !== null && status !== '0',
        cyclesPerHour: prod.hasAttribute('cyclesPerHour')
          ? num(prod.getAttribute('cyclesPerHour'))
          : null,
        inputs: readFillSlots(prod, 'input'),
        outputs: readFillSlots(prod, 'output'),
      }
    })

    // Preplaced points sit on farmId 0; the owning farm is on their storage.
    const storageFarmId = num(pp.querySelector('storage')?.getAttribute('farmId'))
    const placeableFarmId = num(placeable.getAttribute('farmId'))

    points.push({
      uniqueId,
      name: described.name,
      isMod: described.isMod,
      farmId: placeableFarmId || storageFarmId,
      price: num(attrOrChild(placeable, 'price')),
      lines,
      storage: readFillSlots(pp, STORAGE_SELECTOR),
    })
  }
  return points
}

const FINANCE_LABEL_OVERRIDES: Record<string, string> = {
  soldProducts: 'Sold products',
  harvestIncome: 'Harvest income',
  newVehiclesCost: 'Vehicles bought',
  soldVehicles: 'Vehicles sold',
  newAnimalsCost: 'Animals bought',
  soldAnimals: 'Animals sold',
  constructionCost: 'Construction',
  fieldPurchase: 'Land bought',
  fieldSelling: 'Land sold',
  vehicleRunningCost: 'Vehicle running cost',
  vehicleLeasingCost: 'Leasing',
  propertyMaintenance: 'Property upkeep',
  propertyIncome: 'Property income',
  productionCosts: 'Production costs',
  soldWood: 'Wood sold',
  soldBales: 'Bales sold',
  missionIncome: 'Contract income',
  harvesterAndSowing: 'Harvesting & sowing',
  wagePayment: 'Wages',
  loanInterest: 'Loan interest',
  purchaseFuel: 'Fuel',
  purchaseSeeds: 'Seeds',
  purchaseFertilizer: 'Fertiliser',
  purchaseWater: 'Water',
  other: 'Other',
}

function financeLabel(key: string): string {
  return FINANCE_LABEL_OVERRIDES[key] ?? titleCase(key)
}

function parseFarms(doc: Document): { farms: Farm[]; finances: FinanceDay[] } {
  const farms: Farm[] = []
  let finances: FinanceDay[] = []

  for (const farmEl of Array.from(doc.querySelectorAll('farm'))) {
    const id = num(farmEl.getAttribute('farmId') ?? farmEl.getAttribute('id'))
    if (id === 0) continue // farmId 0 is the "unowned/spectator" farm

    const statsEl = farmEl.querySelector(':scope > statistics')
    const statistics = statsEl
      ? Array.from(statsEl.children).map((child) => ({
          key: child.tagName,
          label: financeLabel(child.tagName),
          value: num(child.textContent),
        }))
      : []

    farms.push({
      id,
      name: farmEl.getAttribute('name') ?? `Farm ${id}`,
      money: num(attrOrChild(farmEl, 'money')),
      loan: num(attrOrChild(farmEl, 'loan')),
      loanMax: num(attrOrChild(farmEl, 'loanMax')),
      statistics,
    })

    if (finances.length === 0) {
      finances = Array.from(farmEl.querySelectorAll('finances > stats')).map(
        (statEl, index) => {
          const raw: { key: string; label: string; amount: number }[] = []
          for (const child of Array.from(statEl.children)) {
            const amount = num(child.textContent)
            if (amount !== 0) raw.push({ key: child.tagName, label: financeLabel(child.tagName), amount })
          }
          for (const attr of Array.from(statEl.attributes)) {
            if (attr.name === 'day') continue
            const amount = num(attr.value)
            if (amount !== 0) raw.push({ key: attr.name, label: financeLabel(attr.name), amount })
          }
          const income = raw.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0)
          const expenses = raw.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0)
          return {
            day: num(statEl.getAttribute('day'), index),
            lines: raw.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
            income,
            expenses,
            net: income + expenses,
          }
        },
      )
    }
  }

  return { farms, finances }
}

function parseMods(doc: Document): ModEntry[] {
  return Array.from(doc.querySelectorAll('mod')).map((el) => ({
    modName: el.getAttribute('modName') ?? '',
    title: el.getAttribute('title') ?? el.getAttribute('modName') ?? 'Unknown mod',
    version: el.getAttribute('version') ?? '',
  }))
}

/**
 * economy.xml carries one <fillType> per fill type, each with a <history> of
 * twelve seasonal <period> prices. There is no "current price" — the save
 * doesn't record which period is active — so this averages the year rather
 * than guessing. A few fill types (observed: TEA_WINTERFRUITS) carry a
 * negative glitch value in one or two periods; those are dropped rather than
 * dragging the average down.
 */
function parseEconomy(doc: Document): Record<string, number> {
  const prices: Record<string, number> = {}
  for (const el of Array.from(doc.querySelectorAll('fillTypes > fillType'))) {
    const name = el.getAttribute('fillType')
    if (!name || name === 'UNKNOWN') continue
    const values = Array.from(el.querySelectorAll('history > period'))
      .map((p) => num(p.textContent))
      .filter((v) => v > 0)
    if (values.length === 0) continue
    prices[titleCase(name)] = values.reduce((sum, v) => sum + v, 0) / values.length
  }
  return prices
}

function parseFarmland(doc: Document): Record<number, number> {
  const owned: Record<number, number> = {}
  for (const el of Array.from(doc.querySelectorAll('farmland'))) {
    const farmId = num(el.getAttribute('farmId'))
    if (farmId === 0) continue
    owned[farmId] = (owned[farmId] ?? 0) + 1
  }
  return owned
}

// --- entry point -------------------------------------------------------

/** The only files Farm Manager is allowed to rewrite. */
const EDITABLE_FILES = new Set(['farms.xml', 'fields.xml', 'vehicles.xml', 'placeables.xml'])

/** Parsed documents kept alive so edits can be written back into the original XML. */
export type SaveDocs = Map<string, Document>

export type ParsedUpload = { save: SaveData; docs: SaveDocs }

export async function parseSaveFiles(files: File[]): Promise<ParsedUpload> {
  const docs: SaveDocs = new Map()
  const save: SaveData = {
    mapTitle: '',
    savegameName: '',
    playtimeHours: 0,
    currentDay: 0,
    farms: [],
    fields: [],
    vehicles: [],
    production: [],
    finances: [],
    mods: [],
    files: [],
    ownedFarmlandByFarm: {},
    cropPrices: {},
  }

  for (const file of files) {
    const { status, note } = classifyFile(file.name)
    const record: SaveFileRecord = {
      name: file.name,
      status,
      rootTag: null,
      note,
      bytes: file.size,
    }

    if (status !== 'parsed') {
      // Still peek at the root tag so unrecognized mod content gets a useful badge.
      if (status === 'unrecognized' && file.size < 2_000_000) {
        const doc = parseXml(await file.text())
        record.rootTag = doc?.documentElement?.tagName ?? null
        if (!record.rootTag) record.note = 'Unreadable — kept as-is'
      }
      save.files.push(record)
      continue
    }

    const doc = parseXml(await file.text())
    if (!doc) {
      save.files.push({ ...record, status: 'unrecognized', note: 'Could not be read — kept as-is' })
      continue
    }
    record.rootTag = doc.documentElement.tagName
    if (EDITABLE_FILES.has(file.name.toLowerCase())) docs.set(file.name.toLowerCase(), doc)

    switch (file.name.toLowerCase()) {
      case 'careersavegame.xml': {
        const root = doc.documentElement
        // These live under <settings> in a real save, but tools and older
        // versions hoist them onto the root, so look in both places.
        const deep = (name: string) =>
          attrOrChild(root, name) ?? doc.querySelector(name)?.textContent?.trim() ?? null
        save.savegameName = deep('savegameName') ?? ''
        save.mapTitle = deep('mapTitle') ?? deep('mapId') ?? ''
        const playTime = num(deep('playTime'))
        // Stored as milliseconds in some versions, minutes in others.
        save.playtimeHours = Math.round(
          playTime > 1_000_000 ? playTime / 3_600_000 : playTime / 60,
        )
        save.mods = parseMods(doc)
        break
      }
      case 'farms.xml': {
        const { farms, finances } = parseFarms(doc)
        save.farms = farms
        save.finances = finances
        break
      }
      case 'fields.xml':
        save.fields = parseFields(doc)
        break
      case 'vehicles.xml':
        save.vehicles = parseVehicles(doc)
        break
      case 'placeables.xml':
        save.production = parseProduction(doc)
        break
      case 'farmland.xml':
        save.ownedFarmlandByFarm = parseFarmland(doc)
        break
      case 'environment.xml':
        save.currentDay = num(attrOrChild(doc.documentElement, 'currentDay'))
        break
      case 'economy.xml':
        save.cropPrices = parseEconomy(doc)
        break
    }

    save.files.push(record)
  }

  return { save, docs }
}

/** Narrows a full save to one farm's vehicles, buildings and land. */
export function forFarm(save: SaveData, farmId: number) {
  return {
    vehicles: save.vehicles.filter((v) => v.farmId === farmId),
    production: save.production.filter((p) => p.farmId === farmId),
    fields: save.fields.filter((f) => f.ownerFarmId === null || f.ownerFarmId === farmId),
  }
}

export function buildModsTxt(save: SaveData): string {
  const header = [
    `Mods list — ${save.savegameName || 'FarmSim save'}`,
    save.mapTitle ? `Map: ${save.mapTitle}` : null,
    `${save.mods.length} mod${save.mods.length === 1 ? '' : 's'}`,
    '',
  ].filter(Boolean)
  const body = save.mods.map(
    (mod) => `${mod.title}${mod.version ? ` (v${mod.version})` : ''}\n    ${mod.modName}`,
  )
  return [...header, ...body].join('\n')
}
