// The advice layer. Every rule here answers "what could I be doing better?"
// for one specific thing — a field, a vehicle, a production line, the books.
// Rules are scripted, not AI, and each one states its reasoning in `detail`.

import {
  formatMoney,
  growthLabel,
  isHarvestReady,
  type Farm,
  type Field,
  type FillSlot,
  type FinanceDay,
  type Insight,
  type ProductionPoint,
  type SaveData,
  type Severity,
  type Vehicle,
} from './saveModel'

/**
 * Field state is stored as small integer levels whose maximum varies by save
 * and mod set (lime might top out at 3, plough at 1). Rather than guessing a
 * scale, take the highest value the save actually uses as the top of each one.
 */
export type FieldScales = Record<LevelKey, number>

export type LevelKey =
  | 'weedState'
  | 'sprayLevel'
  | 'limeLevel'
  | 'plowLevel'
  | 'stoneLevel'
  | 'waterLevel'

export const LEVEL_KEYS: LevelKey[] = [
  'weedState',
  'sprayLevel',
  'limeLevel',
  'plowLevel',
  'stoneLevel',
  'waterLevel',
]

export function fieldScales(fields: Field[]): FieldScales {
  const scales = {} as FieldScales
  for (const key of LEVEL_KEYS) {
    scales[key] = Math.max(1, ...fields.map((f) => Number(f[key]) || 0))
  }
  return scales
}

export function worstSeverity(insights: Insight[]): Severity {
  if (insights.some((i) => i.severity === 'risky')) return 'risky'
  if (insights.some((i) => i.severity === 'attention')) return 'attention'
  return 'good'
}

export const FUEL_TYPES = ['Diesel', 'Def', 'Electric Charge', 'Methane']

function isFuel(slot: FillSlot): boolean {
  return FUEL_TYPES.includes(slot.fillType)
}

// --- fields ------------------------------------------------------------

export function fieldInsights(
  field: Field,
  scales: FieldScales,
  opts: { irrigation: boolean } = { irrigation: false },
): Insight[] {
  const out: Insight[] = []
  const hasCrop = field.fruitType !== ''

  if (isHarvestReady(field)) {
    out.push({
      severity: 'good',
      title: 'Ready to harvest',
      detail: 'Harvest before the growth clock rolls over, or the crop withers and the season is wasted.',
    })
  } else if (!hasCrop) {
    out.push({
      severity: 'attention',
      title: 'Nothing planted',
      detail: field.plannedFruit
        ? `Bare ground with ${field.plannedFruit} planned. Get it sown — idle land earns nothing.`
        : 'Idle land earns nothing but still costs you upkeep. Sow it, or put it into grass for bales.',
    })
  }

  if (field.weedState > 0) {
    const heavy = scales.weedState >= 3 && field.weedState >= scales.weedState - 1
    out.push({
      severity: heavy ? 'risky' : 'attention',
      title: heavy ? 'Heavy weeds' : 'Weeds present',
      detail: heavy
        ? 'Weeds this advanced take a serious bite out of yield and can no longer be removed by a weeder — you need a herbicide pass.'
        : 'Early weeds are cheap to fix — a mechanical weeder clears them with no chemical cost. Left alone they keep growing and start costing yield.',
    })
  }

  if (hasCrop && field.sprayLevel === 0) {
    out.push({
      severity: 'attention',
      title: 'No fertiliser applied',
      detail: 'Fertiliser is the single biggest yield lever in the game. Taking this field to full fertilisation is usually the cheapest yield you can buy.',
    })
  } else if (hasCrop && field.sprayLevel < scales.sprayLevel) {
    out.push({
      severity: 'attention',
      title: 'Fertiliser not topped up',
      detail: `At level ${field.sprayLevel} of ${scales.sprayLevel}. One more pass takes this field to full yield.`,
    })
  }

  if (field.limeLevel === 0) {
    out.push({
      severity: 'attention',
      title: 'Lime is due',
      detail: 'Soil pH has run out. Liming is cheap and restores the yield the game quietly takes away when lime hits zero.',
    })
  }

  if (field.plowLevel === 0 && hasCrop) {
    out.push({
      severity: 'attention',
      title: 'Not ploughed',
      detail: 'The field is carrying a ploughing penalty. One pass before the next sowing clears it for several harvests.',
    })
  }

  if (field.stoneLevel > 0) {
    out.push({
      severity: 'attention',
      title: 'Stones in the ground',
      detail: 'Stones damage whatever you drag across them. Run a stone picker before the next tillage pass.',
    })
  }

  if (opts.irrigation && field.waterLevel === 0) {
    out.push({
      severity: 'attention',
      title: 'Water is low',
      detail: 'Irrigation is active on this save and this field is dry — growth stalls until it is watered.',
    })
  }

  if (
    field.plannedFruit &&
    field.plannedFruit === field.fruitType &&
    !['Grass', 'Meadow'].includes(field.fruitType)
  ) {
    out.push({
      severity: 'attention',
      title: 'Same crop planned again',
      detail: `Following ${field.fruitType} with ${field.plannedFruit} triggers the crop-rotation penalty. Break it with a root or legume crop for a free yield bump.`,
    })
  }

  if (out.length === 0) {
    out.push({
      severity: 'good',
      title: `Healthy — ${growthLabel(field)}`,
      detail: 'Soil, weeds and nutrients are all in good shape. Nothing to do here.',
    })
  }

  return out
}

// --- vehicles ----------------------------------------------------------

export function vehicleInsights(vehicle: Vehicle): Insight[] {
  const out: Insight[] = []

  if (vehicle.propertyState === 'LEASED') {
    out.push({
      severity: 'attention',
      title: 'Leased, not owned',
      detail: 'Leasing bills you every day whether you use it or not. If this one earns its keep, buying it out usually pays back fast.',
    })
  }

  if (vehicle.damage >= 0.6) {
    out.push({
      severity: 'risky',
      title: 'Badly damaged',
      detail: `Running at ${Math.round(vehicle.damage * 100)}% damage raises daily upkeep and risks a breakdown mid-job. Repairing now is far cheaper than letting it climb.`,
    })
  } else if (vehicle.damage >= 0.3) {
    out.push({
      severity: 'attention',
      title: 'Repair due',
      detail: 'Repair cost scales with damage, so servicing at a third worn is materially cheaper than waiting.',
    })
  }

  const fuel = vehicle.fillUnits.find(isFuel)
  if (fuel && fuel.ratio !== null && fuel.ratio < 0.15) {
    out.push({
      severity: 'attention',
      title: `Low ${fuel.fillType.toLowerCase()}`,
      detail: `Down to ${Math.round(fuel.ratio * 100)}%. Refill before it strands mid-field.`,
    })
  }

  const cargo = vehicle.fillUnits.filter((s) => !isFuel(s) && s.fillLevel > 0)
  for (const slot of cargo) {
    out.push({
      severity: 'attention',
      title: `Still holding ${slot.fillType.toLowerCase()}`,
      detail: `${Math.round(slot.fillLevel).toLocaleString()} L left aboard. Unsold cargo sitting in a trailer is money you have already grown but not banked.`,
    })
  }

  if (vehicle.age > 365 && vehicle.operatingHours < 5) {
    out.push({
      severity: 'attention',
      title: 'Barely used',
      detail: `${formatMoney(vehicle.price)} tied up in something with ${vehicle.operatingHours.toFixed(1)} hours on it. Sell it or lease this job instead.`,
    })
  }

  if (vehicle.operatingHours > 500) {
    out.push({
      severity: 'attention',
      title: 'High hours',
      detail: `${Math.round(vehicle.operatingHours)} hours. Resale value has mostly gone — plan the replacement while it still fetches something.`,
    })
  }

  if (out.length === 0) {
    out.push({
      severity: 'good',
      title: 'In good order',
      detail: 'Condition, fuel and cargo all look fine.',
    })
  }

  return out
}

// --- production --------------------------------------------------------

export function productionInsights(point: ProductionPoint): Insight[] {
  const out: Insight[] = []

  const idle = point.lines.filter((l) => !l.active)
  if (point.lines.length > 0 && idle.length === point.lines.length) {
    out.push({
      severity: 'risky',
      title: 'Nothing is running',
      detail: `All ${point.lines.length} line${point.lines.length === 1 ? '' : 's'} are switched off. The building still costs upkeep while it earns nothing.`,
    })
  } else if (idle.length > 0) {
    out.push({
      severity: 'attention',
      title: `${idle.length} line${idle.length === 1 ? '' : 's'} idle`,
      detail: `Idle: ${idle.map((l) => l.name).join(', ')}. Switch them on if the inputs are there — spare capacity is free margin.`,
    })
  }

  for (const slot of point.storage) {
    if (slot.ratio === null) continue
    if (slot.ratio >= 0.9) {
      out.push({
        severity: 'risky',
        title: `${slot.fillType} storage nearly full`,
        detail: `At ${Math.round(slot.ratio * 100)}%. Once it fills, production stalls. Sell or haul this out now.`,
      })
    } else if (slot.ratio <= 0.05 && point.lines.some((l) => l.active)) {
      out.push({
        severity: 'attention',
        title: `${slot.fillType} running out`,
        detail: `Only ${Math.round(slot.ratio * 100)}% left with a line still running. Top it up or the line stops on its own.`,
      })
    }
  }

  if (out.length === 0) {
    out.push({
      severity: 'good',
      title: 'Running clean',
      detail: 'Lines are active and storage has headroom on both ends.',
    })
  }

  return out
}

// --- finances ----------------------------------------------------------

function sumByKey(days: FinanceDay[]): Map<string, { label: string; total: number }> {
  const totals = new Map<string, { label: string; total: number }>()
  for (const day of days) {
    for (const line of day.lines) {
      const existing = totals.get(line.key)
      if (existing) existing.total += line.amount
      else totals.set(line.key, { label: line.label, total: line.amount })
    }
  }
  return totals
}

export type FinanceRollup = {
  days: number
  income: number
  expenses: number
  net: number
  averageNet: number
  byCategory: { key: string; label: string; total: number }[]
  insights: Insight[]
}

export function financeRollup(farm: Farm, finances: FinanceDay[]): FinanceRollup {
  const income = finances.reduce((s, d) => s + d.income, 0)
  const expenses = finances.reduce((s, d) => s + d.expenses, 0)
  const net = income + expenses
  const totals = sumByKey(finances)
  const byCategory = Array.from(totals.entries())
    .map(([key, v]) => ({ key, label: v.label, total: v.total }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))

  const insights: Insight[] = []
  const averageNet = finances.length > 0 ? net / finances.length : 0

  if (finances.length > 0) {
    if (averageNet < 0) {
      insights.push({
        severity: 'risky',
        title: 'Losing money day to day',
        detail: `Average of ${formatMoney(averageNet)} per day across the last ${finances.length} days. Costs are outrunning what you sell.`,
      })
    } else {
      insights.push({
        severity: 'good',
        title: 'Profitable day to day',
        detail: `Averaging ${formatMoney(averageNet)} per day across the last ${finances.length} days.`,
      })
    }

    const biggestCost = byCategory.find((c) => c.total < 0)
    if (biggestCost && income > 0 && Math.abs(biggestCost.total) / income > 0.25) {
      insights.push({
        severity: 'attention',
        title: `${biggestCost.label} is your biggest drain`,
        detail: `${formatMoney(Math.abs(biggestCost.total))} — ${Math.round((Math.abs(biggestCost.total) / income) * 100)}% of everything you earned in this window. Worth attacking first.`,
      })
    }
  }

  if (farm.loan > 0 && farm.money > farm.loan) {
    insights.push({
      severity: 'attention',
      title: 'Paying interest while sitting on cash',
      detail: `${formatMoney(farm.money)} in the bank against a ${formatMoney(farm.loan)} loan. Paying it down stops the interest immediately.`,
    })
  }

  if (farm.loan > 0 && farm.money < farm.loan * 0.1) {
    insights.push({
      severity: 'risky',
      title: 'Thin cash against the loan',
      detail: `${formatMoney(farm.money)} on hand against ${formatMoney(farm.loan)} borrowed. One bad repair bill and you are stuck.`,
    })
  }

  const wages = totals.get('wagePayment')
  if (wages && income > 0 && Math.abs(wages.total) / income > 0.2) {
    insights.push({
      severity: 'attention',
      title: 'Heavy spend on hired help',
      detail: `${formatMoney(Math.abs(wages.total))} in wages, ${Math.round((Math.abs(wages.total) / income) * 100)}% of income. Workers are convenient but they are the easiest cost to cut.`,
    })
  }

  return { days: finances.length, income, expenses, net, averageNet, byCategory, insights }
}

// --- rollups -----------------------------------------------------------

export type FleetRollup = {
  count: number
  value: number
  byCategory: { category: string; count: number; value: number }[]
  needingRepair: Vehicle[]
  idleCapital: { vehicles: Vehicle[]; value: number }
  insights: Insight[]
}

export function fleetRollup(vehicles: Vehicle[]): FleetRollup {
  const value = vehicles.reduce((s, v) => s + v.price, 0)
  const categories = new Map<string, { count: number; value: number }>()
  for (const v of vehicles) {
    const entry = categories.get(v.category) ?? { count: 0, value: 0 }
    entry.count += 1
    entry.value += v.price
    categories.set(v.category, entry)
  }

  const needingRepair = vehicles.filter((v) => v.damage >= 0.3)
  const idleVehicles = vehicles.filter((v) => v.age > 365 && v.operatingHours < 5)
  const idleValue = idleVehicles.reduce((s, v) => s + v.price, 0)

  const insights: Insight[] = []
  if (needingRepair.length > 0) {
    insights.push({
      severity: needingRepair.some((v) => v.damage >= 0.6) ? 'risky' : 'attention',
      title: `${needingRepair.length} machine${needingRepair.length === 1 ? '' : 's'} need repair`,
      detail: `${needingRepair.map((v) => v.name).slice(0, 4).join(', ')}${needingRepair.length > 4 ? '…' : ''}. Repair cost climbs with damage, so batching them now is the cheap option.`,
    })
  }
  if (idleValue > 0) {
    insights.push({
      severity: 'attention',
      title: `${formatMoney(idleValue)} sitting idle`,
      detail: `${idleVehicles.length} machine${idleVehicles.length === 1 ? '' : 's'} older than a year with almost no hours. That is capital you could put into land or production instead.`,
    })
  }
  if (insights.length === 0 && vehicles.length > 0) {
    insights.push({
      severity: 'good',
      title: 'Fleet is in shape',
      detail: 'Nothing badly damaged and nothing obviously sitting unused.',
    })
  }

  return {
    count: vehicles.length,
    value,
    byCategory: Array.from(categories.entries())
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.value - a.value),
    needingRepair,
    idleCapital: { vehicles: idleVehicles, value: idleValue },
    insights,
  }
}

export type FieldRollup = {
  count: number
  areaHa: number | null
  readyToHarvest: Field[]
  needsAttention: number
  insights: Insight[]
}

export function fieldRollup(
  fields: Field[],
  scales: FieldScales,
  irrigation: boolean,
): FieldRollup {
  const areaValues = fields.map((f) => f.areaHa).filter((a): a is number => a !== null)
  const readyToHarvest = fields.filter(isHarvestReady)
  const needsAttention = fields.filter(
    (f) => worstSeverity(fieldInsights(f, scales, { irrigation })) !== 'good',
  ).length

  const insights: Insight[] = []
  if (readyToHarvest.length > 0) {
    insights.push({
      severity: 'good',
      title: `${readyToHarvest.length} field${readyToHarvest.length === 1 ? '' : 's'} ready now`,
      detail: `Field${readyToHarvest.length === 1 ? '' : 's'} ${readyToHarvest.map((f) => f.id).join(', ')} ${readyToHarvest.length === 1 ? 'is' : 'are'} at full growth. Get them cut before they turn.`,
    })
  }
  const unlimed = fields.filter((f) => f.limeLevel === 0)
  if (unlimed.length >= 3) {
    insights.push({
      severity: 'attention',
      title: `${unlimed.length} fields need lime`,
      detail: 'Lime is the cheapest yield you can buy. Worth doing as one sweep rather than field by field.',
    })
  }
  const unfertilised = fields.filter((f) => f.fruitType !== '' && f.sprayLevel === 0)
  if (unfertilised.length >= 3) {
    insights.push({
      severity: 'attention',
      title: `${unfertilised.length} growing fields have no fertiliser`,
      detail: `Fields ${unfertilised.slice(0, 6).map((f) => f.id).join(', ')}${unfertilised.length > 6 ? '…' : ''}. This is the single biggest yield gap on the farm.`,
    })
  }
  const idle = fields.filter((f) => f.fruitType === '')
  if (idle.length >= 3) {
    insights.push({
      severity: 'attention',
      title: `${idle.length} fields sitting bare`,
      detail: 'Empty land still costs upkeep. Getting these sown is the fastest way to lift income.',
    })
  }

  return {
    count: fields.length,
    areaHa: areaValues.length > 0 ? areaValues.reduce((s, a) => s + a, 0) : null,
    readyToHarvest,
    needsAttention,
    insights,
  }
}

export type ProductionRollup = {
  count: number
  activeLines: number
  totalLines: number
  insights: Insight[]
}

export function productionRollup(points: ProductionPoint[]): ProductionRollup {
  const totalLines = points.reduce((s, p) => s + p.lines.length, 0)
  const activeLines = points.reduce((s, p) => s + p.lines.filter((l) => l.active).length, 0)

  const insights: Insight[] = []
  if (totalLines > 0 && activeLines === 0) {
    insights.push({
      severity: 'risky',
      title: 'No production running',
      detail: 'You own the buildings but nothing is switched on. Production is the highest-margin part of a farm once it is fed.',
    })
  } else if (totalLines > activeLines) {
    insights.push({
      severity: 'attention',
      title: `${totalLines - activeLines} of ${totalLines} lines idle`,
      detail: 'Unused lines are capacity you have already paid for.',
    })
  } else if (totalLines > 0) {
    insights.push({
      severity: 'good',
      title: 'Everything is running',
      detail: `All ${totalLines} production lines are active.`,
    })
  }

  return { count: points.length, activeLines, totalLines, insights }
}

// --- assembled report --------------------------------------------------

export type Report = {
  farm: Farm
  irrigation: boolean
  scales: FieldScales
  fields: Field[]
  vehicles: Vehicle[]
  production: ProductionPoint[]
  finance: FinanceRollup
  fleet: FleetRollup
  fieldStats: FieldRollup
  productionStats: ProductionRollup
  /** Highest-value actions across every section, worst first. */
  priorities: Insight[]
}

const SEVERITY_ORDER: Record<Severity, number> = { risky: 0, attention: 1, good: 2 }

export function buildReport(save: SaveData, farmId: number): Report | null {
  const farm = save.farms.find((f) => f.id === farmId)
  if (!farm) return null

  const vehicles = save.vehicles.filter((v) => v.farmId === farmId)
  const production = save.production.filter((p) => p.farmId === farmId)
  const fields = save.fields.filter((f) => f.ownerFarmId === null || f.ownerFarmId === farmId)
  const irrigation = save.fields.some((f) => f.waterLevel > 0)
  const scales = fieldScales(save.fields)

  const finance = financeRollup(farm, save.finances)
  const fleet = fleetRollup(vehicles)
  const fieldStats = fieldRollup(fields, scales, irrigation)
  const productionStats = productionRollup(production)

  const priorities = [
    ...finance.insights,
    ...fieldStats.insights,
    ...fleet.insights,
    ...productionStats.insights,
  ]
    .filter((i) => i.severity !== 'good')
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 6)

  return {
    farm,
    irrigation,
    scales,
    fields,
    vehicles,
    production,
    finance,
    fleet,
    fieldStats,
    productionStats,
    priorities,
  }
}
