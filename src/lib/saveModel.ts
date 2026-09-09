// Normalized data model the whole app works against. Parsers convert raw
// savegame XML into these shapes; the report, insights engine and Farm Manager
// only ever see this — never the DOM.
// Attribute sources are documented in docs/FARMSIM_SAVE_REFERENCE.md.

export type Severity = 'good' | 'attention' | 'risky'

export type Insight = {
  severity: Severity
  title: string
  detail: string
}

export type FillSlot = {
  fillType: string
  fillLevel: number
  capacity: number
  /** 0–1, or null when the source gave no capacity to divide by. */
  ratio: number | null
}

export type Field = {
  id: number
  fruitType: string
  plannedFruit: string
  growthState: number
  groundType: string
  weedState: number
  sprayType: string
  sprayLevel: number
  limeLevel: number
  plowLevel: number
  stoneLevel: number
  waterLevel: number
  areaHa: number | null
  ownerFarmId: number | null
}

export type Vehicle = {
  uniqueId: string
  farmId: number
  filename: string
  name: string
  brand: string
  category: string
  price: number
  /** In-game days. */
  age: number
  operatingHours: number
  /** 0–1. */
  damage: number
  /** 0–1. */
  wear: number
  fillUnits: FillSlot[]
  attachedTo: string | null
  /** OWNED or LEASED. */
  propertyState: string
  /** Filename resolved through $moddir$ — flagged, never treated as an error. */
  isMod: boolean
}

export type ProductionLine = {
  id: string
  name: string
  active: boolean
  /** Minutes of in-game time per cycle, when the save exposes it. */
  cyclesPerHour: number | null
  inputs: FillSlot[]
  outputs: FillSlot[]
}

export type ProductionPoint = {
  uniqueId: string
  name: string
  farmId: number
  price: number
  lines: ProductionLine[]
  storage: FillSlot[]
  isMod: boolean
}

export type FinanceDay = {
  /** Index in the save's rolling window — 0 is the most recent day. */
  day: number
  lines: { key: string; label: string; amount: number }[]
  income: number
  expenses: number
  net: number
}

export type Farm = {
  id: number
  name: string
  money: number
  loan: number
  loanMax: number
  statistics: { key: string; label: string; value: number }[]
}

export type ModEntry = {
  modName: string
  title: string
  version: string
}

export type SaveFileStatus = 'parsed' | 'passthrough' | 'unrecognized'

export type SaveFileRecord = {
  name: string
  status: SaveFileStatus
  /** Root element name, used for the unrecognized-content badge copy. */
  rootTag: string | null
  note: string
  bytes: number
}

export type SaveData = {
  mapTitle: string
  savegameName: string
  playtimeHours: number
  currentDay: number
  farms: Farm[]
  fields: Field[]
  vehicles: Vehicle[]
  production: ProductionPoint[]
  finances: FinanceDay[]
  mods: ModEntry[]
  files: SaveFileRecord[]
  ownedFarmlandByFarm: Record<number, number>
  /** Average sell price per 1000L across the save's twelve seasonal periods, keyed by titleCased fillType. */
  cropPrices: Record<string, number>
}

/**
 * The game reports readiness through groundType, not growthState — growthState
 * is a per-crop stage counter with no fixed maximum, so it cannot be labelled
 * on its own.
 */
export function isHarvestReady(field: { groundType: string }): boolean {
  return /harvest ready/i.test(field.groundType)
}

export function growthLabel(field: {
  fruitType: string
  groundType: string
  growthState: number
}): string {
  if (!field.fruitType) return field.groundType ? `Bare — ${field.groundType}` : 'Empty'
  if (isHarvestReady(field)) return 'Ready to harvest'
  return `${field.groundType || 'Growing'} — stage ${field.growthState}`
}

export function titleCase(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/(\d)([a-z])/g, (_, digit, letter) => digit + letter.toUpperCase())
}

export function formatMoney(value: number): string {
  const sign = value < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString()}`
}

export function formatPercent(ratio: number | null): string {
  if (ratio === null || Number.isNaN(ratio)) return '—'
  return `${Math.round(ratio * 100)}%`
}

export type CropValueEntry = {
  fruitType: string
  /** Average price across the save's twelve seasonal periods — see economy.xml notes in FARMSIM_SAVE_REFERENCE.md. */
  price: number
  fieldIds: number[]
  /** Sum of the group's known field areas, or null if fields.xml carried none. Field hectares are map-defined, not save data, so real saves commonly have no area at all — this ranks by price alone rather than area × price. */
  areaHa: number | null
}

/**
 * Groups fields by crop and ranks by that crop's current market price —
 * "which crops on this farm are worth the most", not an earnings forecast.
 * Grouped rather than per-field because most saves have many fields sharing
 * a crop, which would otherwise repeat the same price down a long list.
 */
export function cropValueRanking(
  fields: { id: number; fruitType: string; areaHa: number | null }[],
  cropPrices: Record<string, number>,
): CropValueEntry[] {
  const byCrop = new Map<string, { fieldIds: number[]; areaHa: number | null }>()
  for (const field of fields) {
    if (!field.fruitType || !(field.fruitType in cropPrices)) continue
    const entry = byCrop.get(field.fruitType) ?? { fieldIds: [], areaHa: null }
    entry.fieldIds.push(field.id)
    if (field.areaHa !== null) entry.areaHa = (entry.areaHa ?? 0) + field.areaHa
    byCrop.set(field.fruitType, entry)
  }
  return Array.from(byCrop.entries())
    .map(([fruitType, entry]) => ({ fruitType, price: cropPrices[fruitType], ...entry }))
    .sort((a, b) => b.price - a.price)
}
