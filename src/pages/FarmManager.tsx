import { useEffect, useState } from 'react'
import SaveUpload from '../components/SaveUpload'
import { CoinIcon, WheatIcon, WrenchIcon } from '../components/icons'
import { mockFarm, mockFields, type FieldStatus, type MockField } from '../lib/mockData'

const STATUS_STYLES: Record<FieldStatus, string> = {
  safe: 'bg-status-safe/20 border-status-safe text-status-safe',
  attention: 'bg-status-attention/20 border-status-attention text-status-attention',
  risky: 'bg-status-risky/20 border-status-risky text-status-risky',
}

const CROP_OPTIONS = [
  'Wheat',
  'Barley',
  'Canola',
  'Maize',
  'Soybean',
  'Potato',
  'Sugar Beet',
  'Sunflower',
  'Oat',
  'Grass',
  'Fallow',
]

const GROUND_OPTIONS = ['Cultivated', 'Stubble', 'Grass']

const HIGHLIGHT_MS = 30_000

type DataSource = 'none' | 'files' | 'mock'

function SafeBadge() {
  return (
    <span className="rounded-field bg-status-safe/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-status-safe">
      Safe edit
    </span>
  )
}

export default function FarmManager() {
  const [source, setSource] = useState<DataSource>('none')
  const [selectedField, setSelectedField] = useState<number | null>(null)
  const [fields, setFields] = useState<MockField[]>(mockFields)
  const [farm, setFarm] = useState(mockFarm)
  const [lastEdited, setLastEdited] = useState<Record<string, number>>({})
  const [, forceTick] = useState(0)

  const selected = fields.find((f) => f.id === selectedField)

  useEffect(() => {
    const hasActive = Object.values(lastEdited).some((t) => Date.now() - t < HIGHLIGHT_MS)
    if (!hasActive) return
    const interval = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(interval)
  }, [lastEdited])

  const markEdited = (key: string) => setLastEdited((prev) => ({ ...prev, [key]: Date.now() }))
  const isHighlighted = (key: string) => {
    const t = lastEdited[key]
    return t !== undefined && Date.now() - t < HIGHLIGHT_MS
  }

  const updateField = (id: number, patch: Partial<MockField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
    markEdited(`field-${id}`)
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Farm Manager</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
        Upload your savegame files to edit your farm's money, fields, and more
        directly, with a live preview of the underlying save data as you go.
      </p>

      <div className="mt-8">
        <SaveUpload
          onFilesAccepted={(files) => setSource(files.length > 0 ? 'files' : 'none')}
          onMockDemo={() => setSource('mock')}
        />
      </div>

      {(source === 'mock' || source === 'files') && (
        <div className="mt-10">
          <section className="rounded-field border border-tan bg-white/60 p-6">
            <div className="flex items-center gap-2">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <CoinIcon className="h-5 w-5 text-forest" />
                Farm
              </h2>
              <SafeBadge />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <label className="block text-sm">
                  <span className="text-ink/60">Money</span>
                  <input
                    type="number"
                    value={farm.money}
                    onChange={(e) => {
                      setFarm((f) => ({ ...f, money: Number(e.target.value) }))
                      markEdited('farm-money')
                    }}
                    className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 font-display text-lg text-ink focus:border-forest focus:outline-none"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink/60">Loan</span>
                  <input
                    type="number"
                    value={farm.loan}
                    onChange={(e) => {
                      setFarm((f) => ({ ...f, loan: Number(e.target.value) }))
                      markEdited('farm-loan')
                    }}
                    className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 font-display text-lg text-ink focus:border-forest focus:outline-none"
                  />
                </label>
              </div>
              <div
                className={`rounded-field border p-4 font-mono text-xs leading-relaxed text-ink/70 transition-colors ${
                  isHighlighted('farm-money') || isHighlighted('farm-loan')
                    ? 'border-lime bg-lime/10'
                    : 'border-tan bg-ink/5'
                }`}
              >
                <p className="text-ink/40">{'// live XML preview'}</p>
                <p className="mt-2">{`<farm money="${farm.money}" loan="${farm.loan}" />`}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink/40">
              Demo data — changes apply in this session only, nothing is saved.
            </p>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <WheatIcon className="h-5 w-5 text-forest" />
                  Fields
                </h2>
                <SafeBadge />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {fields.map((field) => {
                  const highlighted = isHighlighted(`field-${field.id}`)
                  return (
                    <button
                      key={field.id}
                      onClick={() => setSelectedField(field.id)}
                      title={`${field.fruitType} — field ${field.id}`}
                      className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-field border-2 text-sm font-medium transition-colors hover:scale-105 ${
                        STATUS_STYLES[field.status]
                      } ${
                        highlighted
                          ? 'ring-2 ring-lime ring-offset-2 ring-offset-paper'
                          : selectedField === field.id
                            ? 'ring-2 ring-forest ring-offset-2 ring-offset-paper'
                            : ''
                      }`}
                    >
                      <span>{field.id}</span>
                      <span className="text-[10px] font-normal uppercase tracking-wide opacity-70">
                        {field.fruitType.slice(0, 4)}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex gap-4 text-xs text-ink/60">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-status-safe" /> Safe
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-status-attention" /> Needs
                  attention
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-status-risky" /> Risky
                </span>
              </div>
              {source === 'files' && (
                <p className="mt-4 text-xs text-ink/40">
                  Showing placeholder field data — parsing your uploaded files isn't
                  wired up yet.
                </p>
              )}
            </div>

            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <WrenchIcon className="h-5 w-5 text-forest" />
                Editor
              </h2>
              {selected ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-field border border-tan bg-white/60 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
                      Field {selected.id}
                    </p>
                    <div className="mt-3 space-y-4 text-sm">
                      <label className="block">
                        <span className="text-ink/60">Crop</span>
                        <select
                          value={selected.fruitType}
                          onChange={(e) =>
                            updateField(selected.id, { fruitType: e.target.value })
                          }
                          className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 text-ink focus:border-forest focus:outline-none"
                        >
                          {CROP_OPTIONS.map((crop) => (
                            <option key={crop} value={crop}>
                              {crop}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-ink/60">Ground</span>
                        <select
                          value={selected.groundType}
                          onChange={(e) =>
                            updateField(selected.id, { groundType: e.target.value })
                          }
                          className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 text-ink focus:border-forest focus:outline-none"
                        >
                          {GROUND_OPTIONS.map((ground) => (
                            <option key={ground} value={ground}>
                              {ground}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <div className="flex justify-between text-ink/60">
                          <span>Growth state</span>
                          <span>{selected.growthState}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={7}
                          value={selected.growthState}
                          onChange={(e) =>
                            updateField(selected.id, { growthState: Number(e.target.value) })
                          }
                          className="mt-1 w-full accent-forest"
                        />
                      </label>
                      <label className="block">
                        <div className="flex justify-between text-ink/60">
                          <span>Weed state</span>
                          <span>{selected.weedState}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={selected.weedState}
                          onChange={(e) =>
                            updateField(selected.id, { weedState: Number(e.target.value) })
                          }
                          className="mt-1 w-full accent-forest"
                        />
                      </label>
                      <label className="block">
                        <div className="flex justify-between text-ink/60">
                          <span>Plow level</span>
                          <span>{selected.plowLevel}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={selected.plowLevel}
                          onChange={(e) =>
                            updateField(selected.id, { plowLevel: Number(e.target.value) })
                          }
                          className="mt-1 w-full accent-forest"
                        />
                      </label>
                      <label className="block">
                        <div className="flex justify-between text-ink/60">
                          <span>Lime level</span>
                          <span>{selected.limeLevel}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={selected.limeLevel}
                          onChange={(e) =>
                            updateField(selected.id, { limeLevel: Number(e.target.value) })
                          }
                          className="mt-1 w-full accent-forest"
                        />
                      </label>
                    </div>
                    <p className="mt-4 text-xs text-ink/40">
                      Demo data — changes apply in this session only, nothing is saved.
                    </p>
                  </div>
                  <div
                    className={`rounded-field border p-5 font-mono text-xs leading-relaxed text-ink/70 transition-colors ${
                      isHighlighted(`field-${selected.id}`)
                        ? 'border-lime bg-lime/10'
                        : 'border-tan bg-ink/5'
                    }`}
                  >
                    <p className="text-ink/40">{'// live XML preview'}</p>
                    <p className="mt-2 break-all">
                      {`<field id="${selected.id}" fruitType="${selected.fruitType.toUpperCase()}" `}
                      <br />
                      {`  growthState="${selected.growthState}" groundType="${selected.groundType}"`}
                      <br />
                      {`  weedState="${selected.weedState}" plowLevel="${selected.plowLevel}"`}
                      <br />
                      {`  limeLevel="${selected.limeLevel}" />`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink/50">Select a field to edit it.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {source === 'none' && (
        <p className="mt-10 text-sm text-ink/50">
          Upload a save above to view your fields.
        </p>
      )}
    </div>
  )
}
