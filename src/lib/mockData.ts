// Demo data for the "Load mock demo" path. Shapes match the real save
// structure documented in docs/FARMSIM_SAVE_REFERENCE.md — not parsed from
// an actual file, just representative values so the UI can be previewed
// without a save on hand.

export type FieldStatus = 'safe' | 'attention' | 'risky'

export type MockField = {
  id: number
  fruitType: string
  growthState: number
  groundType: string
  weedState: number
  plowLevel: number
  limeLevel: number
  status: FieldStatus
}

export const MOCK_FILE_NAMES = [
  'careerSavegame.xml',
  'farms.xml',
  'fields.xml',
  'vehicles.xml',
  'placeables.xml',
]

export const mockFarm = {
  name: 'Courtright Line Farm',
  money: 842_310,
  loan: 120_000,
  playtimeHours: 96,
}

export const mockFinanceLines: { label: string; amount: number }[] = [
  { label: 'Sold products', amount: 48_200 },
  { label: 'Harvest income', amount: 31_450 },
  { label: 'Wage payment', amount: -6_800 },
  { label: 'Property income', amount: 2_100 },
  { label: 'Fuel cost', amount: -1_940 },
  { label: 'Loan interest', amount: -640 },
]

export const mockFleet: { name: string; price: number; fill: string }[] = [
  { name: 'John Deere 8R 410', price: 285_000, fill: '82% diesel' },
  { name: 'Case IH Axial-Flow 250', price: 410_000, fill: '0% grain' },
  { name: 'Kuhn Espro 6000R', price: 96_500, fill: '—' },
  { name: 'Krampe Big Body 650', price: 62_000, fill: '54% silage' },
]

export const mockProduction: { name: string; active: string; fill: string }[] = [
  { name: 'Sawmill', active: 'Planks', fill: '61%' },
  { name: 'Dairy', active: 'Milk', fill: '38%' },
  { name: 'Grain Silo', active: '—', fill: '89%' },
]

export const mockFields: MockField[] = [
  { id: 1, fruitType: 'Wheat', growthState: 5, groundType: 'Cultivated', weedState: 0, plowLevel: 100, limeLevel: 100, status: 'safe' },
  { id: 2, fruitType: 'Canola', growthState: 3, groundType: 'Cultivated', weedState: 10, plowLevel: 100, limeLevel: 80, status: 'safe' },
  { id: 3, fruitType: 'Barley', growthState: 6, groundType: 'Cultivated', weedState: 55, plowLevel: 100, limeLevel: 60, status: 'risky' },
  { id: 4, fruitType: 'Maize', growthState: 2, groundType: 'Cultivated', weedState: 5, plowLevel: 100, limeLevel: 100, status: 'safe' },
  { id: 5, fruitType: 'Fallow', growthState: 0, groundType: 'Stubble', weedState: 20, plowLevel: 40, limeLevel: 100, status: 'attention' },
  { id: 6, fruitType: 'Soybean', growthState: 4, groundType: 'Cultivated', weedState: 8, plowLevel: 100, limeLevel: 90, status: 'safe' },
  { id: 7, fruitType: 'Potato', growthState: 5, groundType: 'Cultivated', weedState: 12, plowLevel: 100, limeLevel: 100, status: 'safe' },
  { id: 8, fruitType: 'Sugar Beet', growthState: 3, groundType: 'Cultivated', weedState: 48, plowLevel: 100, limeLevel: 50, status: 'risky' },
  { id: 9, fruitType: 'Sunflower', growthState: 6, groundType: 'Cultivated', weedState: 6, plowLevel: 100, limeLevel: 100, status: 'safe' },
  { id: 10, fruitType: 'Oat', growthState: 1, groundType: 'Stubble', weedState: 18, plowLevel: 30, limeLevel: 100, status: 'attention' },
  { id: 11, fruitType: 'Grass', growthState: 4, groundType: 'Grass', weedState: 0, plowLevel: 100, limeLevel: 100, status: 'safe' },
  { id: 12, fruitType: 'Wheat', growthState: 7, groundType: 'Cultivated', weedState: 4, plowLevel: 100, limeLevel: 100, status: 'safe' },
]
