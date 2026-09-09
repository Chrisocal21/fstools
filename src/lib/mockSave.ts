// Demo save in the normalized model â€” same shapes the real parsers produce, so
// the report renders identically with or without a save on hand. Values are
// deliberately mixed (healthy, needs attention, broken) so every rule in
// insights.ts has something to fire on.

import type { Field, FinanceDay, ProductionPoint, SaveData, Vehicle } from './saveModel'

function fill(fillType: string, fillLevel: number, capacity: number) {
  return { fillType, fillLevel, capacity, ratio: capacity > 0 ? fillLevel / capacity : null }
}

// Levels use the same small-integer scale a real FS25 save writes:
// weeds 0–1, fertiliser 0–2, lime 0–3, plough 0–1.
const fields: Field[] = [
  { id: 1, fruitType: 'Wheat', plannedFruit: '', growthState: 7, groundType: 'Harvest Ready', weedState: 0, sprayType: 'Fertilizer', sprayLevel: 2, limeLevel: 3, plowLevel: 1, stoneLevel: 0, waterLevel: 0, areaHa: 12.4, ownerFarmId: 1 },
  { id: 2, fruitType: 'Canola', plannedFruit: 'Canola', growthState: 3, groundType: 'Sown', weedState: 1, sprayType: 'Fertilizer', sprayLevel: 1, limeLevel: 2, plowLevel: 1, stoneLevel: 0, waterLevel: 0, areaHa: 8.1, ownerFarmId: 1 },
  { id: 3, fruitType: 'Barley', plannedFruit: 'Wheat', growthState: 6, groundType: 'Sown', weedState: 1, sprayType: '', sprayLevel: 0, limeLevel: 0, plowLevel: 1, stoneLevel: 1, waterLevel: 0, areaHa: 15.9, ownerFarmId: 1 },
  { id: 4, fruitType: 'Maize', plannedFruit: '', growthState: 2, groundType: 'Sown', weedState: 0, sprayType: 'Fertilizer', sprayLevel: 2, limeLevel: 3, plowLevel: 1, stoneLevel: 0, waterLevel: 0, areaHa: 20.2, ownerFarmId: 1 },
  { id: 5, fruitType: '', plannedFruit: 'Wheat', growthState: 0, groundType: 'Cultivated', weedState: 0, sprayType: '', sprayLevel: 0, limeLevel: 3, plowLevel: 0, stoneLevel: 0, waterLevel: 0, areaHa: 6.7, ownerFarmId: 1 },
  { id: 6, fruitType: 'Soybean', plannedFruit: '', growthState: 4, groundType: 'Sown', weedState: 0, sprayType: 'Fertilizer', sprayLevel: 2, limeLevel: 2, plowLevel: 1, stoneLevel: 0, waterLevel: 0, areaHa: 11.0, ownerFarmId: 1 },
  { id: 7, fruitType: 'Potato', plannedFruit: '', growthState: 5, groundType: 'Planted', weedState: 1, sprayType: 'Fertilizer', sprayLevel: 2, limeLevel: 3, plowLevel: 1, stoneLevel: 0, waterLevel: 0, areaHa: 5.3, ownerFarmId: 1 },
  { id: 8, fruitType: 'Sugar Beet', plannedFruit: 'Sugar Beet', growthState: 3, groundType: 'Sown', weedState: 1, sprayType: '', sprayLevel: 0, limeLevel: 1, plowLevel: 0, stoneLevel: 0, waterLevel: 0, areaHa: 9.8, ownerFarmId: 1 },
  { id: 9, fruitType: 'Sunflower', plannedFruit: '', growthState: 6, groundType: 'Sown', weedState: 0, sprayType: 'Fertilizer', sprayLevel: 2, limeLevel: 3, plowLevel: 1, stoneLevel: 0, waterLevel: 0, areaHa: 7.4, ownerFarmId: 1 },
  { id: 10, fruitType: '', plannedFruit: '', growthState: 0, groundType: 'Cultivated', weedState: 1, sprayType: '', sprayLevel: 0, limeLevel: 0, plowLevel: 0, stoneLevel: 1, waterLevel: 0, areaHa: 4.2, ownerFarmId: 1 },
  { id: 11, fruitType: 'Grass', plannedFruit: 'Grass', growthState: 4, groundType: 'Planted', weedState: 0, sprayType: 'Fertilizer', sprayLevel: 2, limeLevel: 3, plowLevel: 1, stoneLevel: 0, waterLevel: 0, areaHa: 3.1, ownerFarmId: 1 },
  { id: 12, fruitType: 'Wheat', plannedFruit: '', growthState: 7, groundType: 'Harvest Ready', weedState: 0, sprayType: 'Fertilizer', sprayLevel: 2, limeLevel: 3, plowLevel: 1, stoneLevel: 0, waterLevel: 0, areaHa: 18.6, ownerFarmId: 1 },
]

const vehicles: Vehicle[] = [
  { uniqueId: 'v1', farmId: 1, filename: 'data/vehicles/johnDeere/8RSeries/johnDeere8R410.xml', name: 'John Deere 8R 410', brand: 'John Deere', category: 'Tractor', price: 285_000, age: 150, operatingHours: 240, damage: 0.18, wear: 0.2, fillUnits: [fill('Diesel', 492, 600)], attachedTo: null, propertyState: 'OWNED', isMod: false },
  { uniqueId: 'v2', farmId: 1, filename: 'data/vehicles/caseIH/axialFlow250/caseIHAxialFlow250.xml', name: 'Case IH Axial-Flow 250', brand: 'Case Ih', category: 'Harvesting', price: 410_000, age: 420, operatingHours: 612, damage: 0.72, wear: 0.6, fillUnits: [fill('Diesel', 120, 1000), fill('Wheat', 0, 14_100)], attachedTo: null, propertyState: 'OWNED', isMod: false },
  { uniqueId: 'v3', farmId: 1, filename: 'data/vehicles/kuhn/espro6000R/kuhnEspro6000R.xml', name: 'Kuhn Espro 6000 R', brand: 'Kuhn', category: 'Seeding', price: 96_500, age: 90, operatingHours: 61, damage: 0.05, wear: 0.1, fillUnits: [fill('Seeds', 1800, 4000)], attachedTo: 'v1', propertyState: 'OWNED', isMod: false },
  { uniqueId: 'v4', farmId: 1, filename: 'data/vehicles/krampe/bigBody650/krampeBigBody650.xml', name: 'Krampe Big Body 650', brand: 'Krampe', category: 'Trailer', price: 62_000, age: 210, operatingHours: 133, damage: 0.34, wear: 0.3, fillUnits: [fill('Silage', 17_500, 32_000)], attachedTo: null, propertyState: 'OWNED', isMod: false },
  { uniqueId: 'v5', farmId: 1, filename: '$moddir$FS25_LemkenJuwel/lemkenJuwel8.xml', name: 'Lemken Juwel 8', brand: 'Lemken', category: 'Tillage', price: 44_800, age: 512, operatingHours: 2.4, damage: 0.02, wear: 0.05, fillUnits: [], attachedTo: null, propertyState: 'OWNED', isMod: true },
  { uniqueId: 'v6', farmId: 1, filename: 'data/vehicles/hardi/mega1200/hardiMega1200.xml', name: 'Hardi Mega 1200', brand: 'Hardi', category: 'Spraying', price: 38_200, age: 300, operatingHours: 88, damage: 0.41, wear: 0.4, fillUnits: [fill('Herbicide', 240, 1200)], attachedTo: null, propertyState: 'OWNED', isMod: false },
]

const production: ProductionPoint[] = [
  {
    uniqueId: 'p1', name: 'Sawmill', farmId: 1, price: 65_000, isMod: false,
    lines: [
      { id: 'planks', name: 'Planks', active: true, cyclesPerHour: 120, inputs: [fill('Wood', 4100, 10_000)], outputs: [fill('Planks', 3800, 10_000)] },
      { id: 'woodChips', name: 'Wood Chips', active: false, cyclesPerHour: 200, inputs: [fill('Wood', 4100, 10_000)], outputs: [fill('Wood Chips', 500, 10_000)] },
    ],
    storage: [fill('Wood', 4100, 10_000), fill('Planks', 9600, 10_000)],
  },
  {
    uniqueId: 'p2', name: 'Dairy', farmId: 1, price: 148_000, isMod: false,
    lines: [
      { id: 'butter', name: 'Butter', active: true, cyclesPerHour: 60, inputs: [fill('Milk', 180, 20_000)], outputs: [fill('Butter', 1400, 8000)] },
      { id: 'cheese', name: 'Cheese', active: false, cyclesPerHour: 40, inputs: [fill('Milk', 180, 20_000)], outputs: [fill('Cheese', 0, 8000)] },
    ],
    storage: [fill('Milk', 180, 20_000), fill('Butter', 1400, 8000), fill('Cheese', 0, 8000)],
  },
  {
    uniqueId: 'p3', name: 'Grain Mill', farmId: 1, price: 92_000, isMod: false,
    lines: [{ id: 'flour', name: 'Flour', active: false, cyclesPerHour: 90, inputs: [fill('Wheat', 22_000, 30_000)], outputs: [fill('Flour', 900, 12_000)] }],
    storage: [fill('Wheat', 22_000, 30_000), fill('Flour', 900, 12_000)],
  },
]

const DAY_TEMPLATE: [string, string, number][] = [
  ['soldProducts', 'Sold products', 48_200],
  ['harvestIncome', 'Harvest income', 31_450],
  ['missionIncome', 'Contract income', 7_300],
  ['propertyIncome', 'Property income', 2_100],
  ['wagePayment', 'Wages', -18_800],
  ['purchaseFuel', 'Fuel', -6_940],
  ['vehicleRunningCost', 'Vehicle running cost', -4_180],
  ['purchaseFertilizer', 'Fertiliser', -3_260],
  ['propertyMaintenance', 'Property upkeep', -2_400],
  ['loanInterest', 'Loan interest', -640],
]

const finances: FinanceDay[] = Array.from({ length: 7 }, (_, i) => {
  const swing = 1 + (i % 3) * 0.18 - (i % 2) * 0.22
  const lines = DAY_TEMPLATE.map(([key, label, base]) => ({
    key,
    label,
    amount: Math.round(base * swing),
  }))
  const income = lines.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0)
  const expenses = lines.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0)
  return { day: i, lines, income, expenses, net: income + expenses }
})

export const MOCK_SAVE: SaveData = {
  mapTitle: 'Riverbend Springs',
  savegameName: 'Courtright Line',
  playtimeHours: 96,
  currentDay: 118,
  farms: [
    {
      id: 1,
      name: 'Courtright Line Farm',
      money: 842_310,
      loan: 120_000,
      loanMax: 500_000,
      statistics: [
        { key: 'workedHectares', label: 'Worked Hectares', value: 1_284 },
        { key: 'fuelUsage', label: 'Fuel Usage', value: 18_420 },
        { key: 'seedUsage', label: 'Seed Usage', value: 9_140 },
        { key: 'sprayUsage', label: 'Spray Usage', value: 6_320 },
        { key: 'harvestedHectares', label: 'Harvested Hectares', value: 940 },
      ],
    },
  ],
  fields,
  vehicles,
  production,
  finances,
  mods: [
    { modName: 'FS25_ContractBoost', title: 'Contract Boost', version: '1.3.0.2' },
    { modName: 'FS25_UnloadBalesEarly', title: 'Unload Bales Early', version: '1.0.1.0' },
    { modName: 'FS25_LemkenJuwel', title: 'Lemken Juwel 8 Pack', version: '2.0.0.0' },
    { modName: 'FS25_RealSiloData', title: 'Real Silo Data', version: '1.1.0.0' },
  ],
  files: [
    { name: 'careerSavegame.xml', status: 'parsed', rootTag: 'careerSavegame', note: 'Read into your report', bytes: 21_400 },
    { name: 'farms.xml', status: 'parsed', rootTag: 'farms', note: 'Read into your report', bytes: 84_300 },
    { name: 'fields.xml', status: 'parsed', rootTag: 'fields', note: 'Read into your report', bytes: 12_800 },
    { name: 'vehicles.xml', status: 'parsed', rootTag: 'vehicles', note: 'Read into your report', bytes: 240_100 },
    { name: 'placeables.xml', status: 'parsed', rootTag: 'placeables', note: 'Read into your report', bytes: 512_600 },
    { name: 'farmland.xml', status: 'parsed', rootTag: 'farmlands', note: 'Read into your report', bytes: 9_200 },
    { name: 'economy.xml', status: 'parsed', rootTag: 'economy', note: 'Read into your report', bytes: 1_840_000 },
    { name: 'realSiloData.xml', status: 'unrecognized', rootTag: 'realSiloData', note: 'Mod content â€” kept as-is', bytes: 3_100 },
    { name: 'FS25_ContractBoost.xml', status: 'unrecognized', rootTag: 'contractBoost', note: 'Mod content â€” kept as-is', bytes: 1_450 },
  ],
  ownedFarmlandByFarm: { 1: 14 },
  // Representative of a real economy.xml's yearly average per fill type.
  cropPrices: {
    Wheat: 507,
    Barley: 472,
    Canola: 919,
    Maize: 572,
    Soybean: 1172,
    Potato: 356,
    'Sugar Beet': 255,
    Sunflower: 1015,
    Grass: 44,
  },
}
