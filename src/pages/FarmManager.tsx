import { useEffect, useMemo, useState, type ReactNode } from 'react'
import SaveUpload from '../components/SaveUpload'
import { CoinIcon, SiloIcon, TractorIcon, WheatIcon, WrenchIcon } from '../components/icons'
import { DrillRow, InsightList } from '../components/ReportPieces'
import {
  applyChanges,
  canWriteDirectly,
  diffSave,
  downloadFiles,
  writeToDirectory,
  type PendingChange,
} from '../lib/exportSave'
import {
  fieldInsights,
  fieldScales,
  FUEL_TYPES,
  vehicleInsights,
  worstSeverity,
  type LevelKey,
} from '../lib/insights'
import { MOCK_SAVE } from '../lib/mockSave'
import type { SaveDocs } from '../lib/parseSave'
import {
  formatMoney,
  growthLabel,
  type Field,
  type FillSlot,
  type ProductionPoint,
  type SaveData,
  type Severity,
  type Vehicle,
} from '../lib/saveModel'

const HIGHLIGHT_MS = 30_000

const clock = () => Date.now()

const TILE_STYLES: Record<Severity, string> = {
  good: 'bg-status-safe/20 border-status-safe text-status-safe',
  attention: 'bg-status-attention/20 border-status-attention text-status-attention',
  risky: 'bg-status-risky/20 border-status-risky text-status-risky',
}

const GROUND_OPTIONS = ['Cultivated', 'Stubble', 'Grass']

/** Level attributes the editor exposes, in the order they read best. */
const LEVEL_EDITS: { key: LevelKey; label: string }[] = [
  { key: 'weedState', label: 'Weeds' },
  { key: 'sprayLevel', label: 'Fertiliser' },
  { key: 'limeLevel', label: 'Lime' },
  { key: 'plowLevel', label: 'Plough' },
  { key: 'stoneLevel', label: 'Stones' },
  { key: 'waterLevel', label: 'Water' },
]

type Tab = 'farm' | 'fields' | 'fleet' | 'production' | 'export'

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-field border border-tan bg-white px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-forest/60 hover:text-forest"
    >
      {label}
    </button>
  )
}

function Slider({
  label,
  value,
  max,
  step,
  caption,
  onChange,
}: {
  label: string
  value: number
  max: number
  step: number
  caption: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs text-ink/60">
        <span>{label}</span>
        <span className="tabular-nums">{caption}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-forest"
      />
    </label>
  )
}

function FillSliders({
  slots,
  onChange,
  emptyText,
}: {
  slots: FillSlot[]
  onChange: (index: number, fillLevel: number) => void
  emptyText: string
}) {
  if (slots.length === 0) return <p className="text-sm text-ink/50">{emptyText}</p>
  return (
    <div className="space-y-3">
      {slots.map((slot, i) => (
        <Slider
          key={`${slot.fillType}-${i}`}
          label={slot.fillType}
          value={slot.fillLevel}
          max={slot.capacity > 0 ? slot.capacity : Math.max(slot.fillLevel, 1)}
          step={1}
          caption={
            slot.capacity > 0
              ? `${Math.round(slot.fillLevel).toLocaleString()} / ${Math.round(slot.capacity).toLocaleString()}`
              : Math.round(slot.fillLevel).toLocaleString()
          }
          onChange={(value) => onChange(i, value)}
        />
      ))}
    </div>
  )
}

function RiskBadge({ risk }: { risk: 'safe' | 'risky' }) {
  return (
    <span
      className={`rounded-field px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        risk === 'safe'
          ? 'bg-status-safe/15 text-status-safe'
          : 'bg-status-risky/15 text-status-risky'
      }`}
    >
      {risk === 'safe' ? 'Safe edit' : 'Risky edit'}
    </span>
  )
}

function Section({
  icon,
  title,
  badge,
  children,
}: {
  icon: ReactNode
  title: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-field border border-tan bg-white/60 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <span className="text-forest">{icon}</span>
          {title}
        </h2>
        {badge}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function XmlPreview({ highlighted, lines }: { highlighted: boolean; lines: string[] }) {
  return (
    <div
      className={`rounded-field border p-5 font-mono text-xs leading-relaxed text-ink/70 transition-colors ${
        highlighted ? 'border-status-safe bg-status-safe/10' : 'border-tan bg-ink/5'
      }`}
    >
      <p className="text-ink/40">{'// live XML preview'}</p>
      {lines.map((line, i) => (
        <p key={i} className={`break-all ${i === 0 ? 'mt-2' : ''}`}>
          {line}
        </p>
      ))}
    </div>
  )
}

export default function FarmManager() {
  const [original, setOriginal] = useState<SaveData | null>(null)
  const [edited, setEdited] = useState<SaveData | null>(null)
  const [docs, setDocs] = useState<SaveDocs | null>(null)
  const [farmId, setFarmId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('farm')
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null)
  const [allowRisky, setAllowRisky] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [lastEdited, setLastEdited] = useState<Record<string, number>>({})
  const [now, setNow] = useState(0)

  useEffect(() => {
    const hasActive = Object.values(lastEdited).some((t) => t > now - HIGHLIGHT_MS)
    if (!hasActive) return
    const interval = setInterval(() => setNow(clock()), 1000)
    return () => clearInterval(interval)
  }, [lastEdited, now])

  const markEdited = (key: string) => {
    const stamp = clock()
    setNow(stamp)
    setLastEdited((prev) => ({ ...prev, [key]: stamp }))
  }
  const isHighlighted = (key: string) => {
    const stamp = lastEdited[key]
    return stamp !== undefined && stamp > now - HIGHLIGHT_MS
  }

  const loadSave = (save: SaveData, nextDocs: SaveDocs | null) => {
    setOriginal(save)
    setEdited(save)
    setDocs(nextDocs)
    setFarmId(save.farms[0]?.id ?? null)
    setSelectedFieldId(save.fields[0]?.id ?? null)
    setLastEdited({})
    setExportStatus(null)
    setTab('farm')
  }

  const activeFarmId = farmId ?? edited?.farms[0]?.id ?? null
  const farm = edited?.farms.find((f) => f.id === activeFarmId) ?? null

  const changes = useMemo(
    () =>
      original && edited && activeFarmId !== null
        ? diffSave(original, edited, activeFarmId)
        : [],
    [original, edited, activeFarmId],
  )

  const scales = useMemo(() => fieldScales(original?.fields ?? []), [original])
  // growthState has no fixed maximum — it varies by crop and mod set.
  const growthMax = useMemo(
    () => Math.max(1, ...(original?.fields ?? []).map((f) => f.growthState)),
    [original],
  )

  const cropOptions = useMemo(() => {
    const found = new Set(
      (original?.fields ?? []).map((f) => f.fruitType).filter((c) => c !== ''),
    )
    return Array.from(found).sort()
  }, [original])

  const selected = edited?.fields.find((f) => f.id === selectedFieldId) ?? null
  const vehicles = edited?.vehicles.filter((v) => v.farmId === activeFarmId) ?? []
  const production = edited?.production.filter((p) => p.farmId === activeFarmId) ?? []

  const updateFarm = (patch: { money?: number; loan?: number; name?: string }) => {
    setEdited((prev) =>
      prev
        ? {
            ...prev,
            farms: prev.farms.map((f) => (f.id === activeFarmId ? { ...f, ...patch } : f)),
          }
        : prev,
    )
    markEdited('farm')
  }

  const updateField = (id: number, patch: Partial<Field>) => {
    setEdited((prev) =>
      prev
        ? { ...prev, fields: prev.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) }
        : prev,
    )
    markEdited(`field-${id}`)
  }

  const updateVehicle = (uniqueId: string, patch: Partial<Vehicle>) => {
    setEdited((prev) =>
      prev
        ? {
            ...prev,
            vehicles: prev.vehicles.map((v) =>
              v.uniqueId === uniqueId ? { ...v, ...patch } : v,
            ),
          }
        : prev,
    )
    markEdited(`vehicle-${uniqueId}`)
  }

  const setSlotLevel = (slots: FillSlot[], index: number, fillLevel: number): FillSlot[] =>
    slots.map((slot, i) =>
      i === index
        ? { ...slot, fillLevel, ratio: slot.capacity > 0 ? fillLevel / slot.capacity : null }
        : slot,
    )

  const updateVehicleFill = (uniqueId: string, index: number, fillLevel: number) => {
    const vehicle = edited?.vehicles.find((v) => v.uniqueId === uniqueId)
    if (!vehicle) return
    updateVehicle(uniqueId, { fillUnits: setSlotLevel(vehicle.fillUnits, index, fillLevel) })
  }

  const updateProduction = (uniqueId: string, patch: Partial<ProductionPoint>) => {
    setEdited((prev) =>
      prev
        ? {
            ...prev,
            production: prev.production.map((p) =>
              p.uniqueId === uniqueId ? { ...p, ...patch } : p,
            ),
          }
        : prev,
    )
    markEdited(`production-${uniqueId}`)
  }

  const applyToAllFields = (patch: (field: Field) => Partial<Field>) => {
    setEdited((prev) =>
      prev ? { ...prev, fields: prev.fields.map((f) => ({ ...f, ...patch(f) })) } : prev,
    )
    markEdited('fields-bulk')
  }

  const applyToAllVehicles = (patch: (vehicle: Vehicle) => Partial<Vehicle>) => {
    setEdited((prev) =>
      prev
        ? {
            ...prev,
            vehicles: prev.vehicles.map((v) =>
              v.farmId === activeFarmId ? { ...v, ...patch(v) } : v,
            ),
          }
        : prev,
    )
    markEdited('fleet-bulk')
  }

  const revertAll = () => {
    if (!original) return
    setEdited(original)
    setLastEdited({})
    setExportStatus(null)
  }

  const buildFiles = () =>
    docs && original && edited && activeFarmId !== null
      ? applyChanges(docs, original, edited, activeFarmId, changes)
      : []

  const handleDownload = () => {
    const files = buildFiles()
    if (files.length === 0) {
      setExportStatus('Nothing to export — this is demo data, or nothing has changed.')
      return
    }
    downloadFiles(files)
    setExportStatus(`Downloaded ${files.map((f) => f.name).join(', ')}.`)
  }

  const handleWriteBack = async () => {
    const files = buildFiles()
    if (files.length === 0) {
      setExportStatus('Nothing to export — this is demo data, or nothing has changed.')
      return
    }
    try {
      await writeToDirectory(files)
      setExportStatus(`Wrote ${files.map((f) => f.name).join(', ')} back to your savegame folder.`)
    } catch (error) {
      setExportStatus(
        error instanceof Error && error.name === 'AbortError'
          ? 'Cancelled — nothing was written.'
          : `Could not write to that folder: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
    }
  }

  const riskyChanges = changes.filter((c) => c.risk === 'risky')
  const uploader = (
    <SaveUpload
      onSaveParsed={(save, nextDocs) => loadSave(save, nextDocs)}
      onMockDemo={() => loadSave(MOCK_SAVE, null)}
    />
  )

  const tabs: { id: Tab; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'farm', label: 'Farm', icon: <CoinIcon /> },
    { id: 'fields', label: 'Fields', icon: <WheatIcon /> },
    { id: 'fleet', label: 'Fleet', icon: <TractorIcon /> },
    { id: 'production', label: 'Production', icon: <SiloIcon /> },
    { id: 'export', label: 'Export', icon: <WrenchIcon />, count: changes.length },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Farm Manager</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
        Edit your farm's money, field state and machine values directly, with a live
        preview of the XML as you go. Changes stay in your browser until you export
        them.
      </p>

      {edited ? (
        <details className="mt-6">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4">
            {edited.savegameName || 'Save loaded'} · {edited.files.length} files — change or
            add files
          </summary>
          <div className="mt-4">{uploader}</div>
        </details>
      ) : (
        <div className="mt-8">{uploader}</div>
      )}

      {edited && !farm && (
        <p className="mt-10 text-sm text-status-attention">
          Those files loaded, but no farm was found in them. Include <code>farms.xml</code>{' '}
          from your savegame folder.
        </p>
      )}

      {edited && farm && (
        <div className="mt-10 space-y-6">
          {edited.farms.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 rounded-field border border-tan bg-white/60 px-4 py-3">
              <span className="mr-2 text-xs uppercase tracking-wide text-ink/50">
                {edited.farms.length} farms in this save
              </span>
              {edited.farms.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setFarmId(entry.id)}
                  className={`rounded-field px-3 py-1.5 text-sm transition-colors ${
                    entry.id === activeFarmId
                      ? 'bg-forest text-white'
                      : 'border border-tan text-ink/70 hover:border-forest/60'
                  }`}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1 rounded-field border border-tan bg-white/60 p-1">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`flex items-center gap-2 rounded-field px-4 py-2 text-sm transition-colors ${
                  tab === entry.id ? 'bg-forest text-white' : 'text-ink/70 hover:bg-forest/[0.06]'
                }`}
              >
                <span className={tab === entry.id ? 'text-white' : 'text-forest'}>
                  {entry.icon}
                </span>
                {entry.label}
                {entry.count ? (
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      tab === entry.id ? 'bg-white/20' : 'bg-status-attention/15 text-status-attention'
                    }`}
                  >
                    {entry.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {!docs && (
            <p className="rounded-field border border-status-attention/40 bg-status-attention/10 px-4 py-3 text-sm text-ink/70">
              Demo data — you can edit freely to try the tool, but there is no real save
              behind it to export.
            </p>
          )}

          {/* ---------- Farm ---------- */}
          {tab === 'farm' && (
            <Section icon={<CoinIcon />} title="Farm" badge={<RiskBadge risk="safe" />}>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <label className="block text-sm">
                    <span className="text-ink/60">Farm name</span>
                    <input
                      type="text"
                      value={farm.name}
                      onChange={(e) => updateFarm({ name: e.target.value })}
                      className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 text-ink focus:border-forest focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-ink/60">Money</span>
                    <input
                      type="number"
                      value={farm.money}
                      onChange={(e) => updateFarm({ money: Number(e.target.value) })}
                      className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 font-display text-lg tabular-nums text-ink focus:border-forest focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-ink/60">Loan</span>
                    <input
                      type="number"
                      value={farm.loan}
                      onChange={(e) => updateFarm({ loan: Number(e.target.value) })}
                      className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 font-display text-lg tabular-nums text-ink focus:border-forest focus:outline-none"
                    />
                  </label>
                  {farm.loanMax > 0 && (
                    <p className="text-xs text-ink/50">
                      Loan ceiling on this save is {formatMoney(farm.loanMax)}.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <QuickAction label="Clear the loan" onClick={() => updateFarm({ loan: 0 })} />
                    <QuickAction
                      label="Pay loan from cash"
                      onClick={() =>
                        updateFarm({
                          money: Math.max(farm.money - farm.loan, 0),
                          loan: Math.max(farm.loan - farm.money, 0),
                        })
                      }
                    />
                  </div>
                </div>
                <XmlPreview
                  highlighted={isHighlighted('farm')}
                  lines={[
                    `<farm farmId="${farm.id}" name="${farm.name}"`,
                    `  money="${farm.money}" loan="${farm.loan}" />`,
                  ]}
                />
              </div>
            </Section>
          )}

          {/* ---------- Fields ---------- */}
          {tab === 'fields' && (
            <Section
              icon={<WheatIcon />}
              title="Fields"
              badge={<RiskBadge risk={allowRisky ? 'risky' : 'safe'} />}
            >
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div>
                  <div className="grid grid-cols-4 gap-3">
                    {edited.fields.map((field) => {
                      const severity = worstSeverity(fieldInsights(field, scales))
                      const highlighted = isHighlighted(`field-${field.id}`)
                      return (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => setSelectedFieldId(field.id)}
                          title={`Field ${field.id} — ${field.fruitType || 'empty'}`}
                          className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-field border-2 text-sm font-medium transition-transform hover:scale-105 ${
                            TILE_STYLES[severity]
                          } ${
                            highlighted
                              ? 'ring-2 ring-status-safe ring-offset-2 ring-offset-paper'
                              : selectedFieldId === field.id
                                ? 'ring-2 ring-forest ring-offset-2 ring-offset-paper'
                                : ''
                          }`}
                        >
                          <span>{field.id}</span>
                          <span className="text-[10px] font-normal uppercase tracking-wide opacity-70">
                            {(field.fruitType || '—').slice(0, 4)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink/60">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-status-safe" /> Healthy
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-status-attention" /> Needs
                      attention
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-status-risky" /> Act now
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-ink/50">
                    Tile colour comes from the same rules the report uses, so both tools
                    always agree.
                  </p>
                  <div className="mt-4 border-t border-tan pt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">
                      Apply to every field
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <QuickAction
                        label="Clear weeds"
                        onClick={() => applyToAllFields(() => ({ weedState: 0 }))}
                      />
                      <QuickAction
                        label="Max lime"
                        onClick={() => applyToAllFields(() => ({ limeLevel: scales.limeLevel }))}
                      />
                      <QuickAction
                        label="Max fertiliser"
                        onClick={() => applyToAllFields(() => ({ sprayLevel: scales.sprayLevel }))}
                      />
                      <QuickAction
                        label="Plough"
                        onClick={() => applyToAllFields(() => ({ plowLevel: scales.plowLevel }))}
                      />
                      <QuickAction
                        label="Clear stones"
                        onClick={() => applyToAllFields(() => ({ stoneLevel: 0 }))}
                      />
                    </div>
                  </div>
                </div>

                {selected ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4 text-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
                        Field {selected.id}
                      </p>

                      <label className="block">
                        <div className="flex justify-between text-ink/60">
                          <span>Growth state</span>
                          <span>{growthLabel(selected)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={growthMax}
                          value={selected.growthState}
                          onChange={(e) =>
                            updateField(selected.id, { growthState: Number(e.target.value) })
                          }
                          className="mt-1 w-full accent-forest"
                        />
                      </label>

                      {LEVEL_EDITS.map((edit) => {
                        const max = scales[edit.key]
                        const value = Number(selected[edit.key])
                        return (
                          <label key={edit.key} className="block">
                            <div className="flex justify-between text-ink/60">
                              <span>{edit.label}</span>
                              <span className="tabular-nums">
                                {value} / {max}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={max}
                              step={1}
                              value={value}
                              onChange={(e) =>
                                updateField(selected.id, {
                                  [edit.key]: Number(e.target.value),
                                } as Partial<Field>)
                              }
                              className="mt-1 w-full accent-forest"
                            />
                          </label>
                        )
                      })}

                      <label className="block">
                        <span className="text-ink/60">Planned next crop</span>
                        <select
                          value={selected.plannedFruit}
                          onChange={(e) =>
                            updateField(selected.id, { plannedFruit: e.target.value })
                          }
                          className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 text-ink focus:border-forest focus:outline-none"
                        >
                          {[selected.plannedFruit, ...cropOptions]
                            .filter((c, i, all) => all.indexOf(c) === i)
                            .map((crop) => (
                              <option key={crop || 'none'} value={crop}>
                                {crop || 'None'}
                              </option>
                            ))}
                        </select>
                      </label>

                      <div className="rounded-field border border-tan bg-white/60 p-4">
                        <label className="flex items-start gap-2 text-xs text-ink/70">
                          <input
                            type="checkbox"
                            checked={allowRisky}
                            onChange={(e) => setAllowRisky(e.target.checked)}
                            className="mt-0.5 accent-status-risky"
                          />
                          <span>
                            Allow risky edits — crop and ground type. These are stored in
                            the terrain density map too, which this tool never touches, so
                            changing them here can leave the field inconsistent until it is
                            cultivated and re-sown.
                          </span>
                        </label>

                        <div className="mt-4 space-y-3">
                          <label className="block">
                            <span className="text-ink/60">Crop</span>
                            <select
                              value={selected.fruitType}
                              disabled={!allowRisky}
                              onChange={(e) =>
                                updateField(selected.id, { fruitType: e.target.value })
                              }
                              className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 text-ink focus:border-forest focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/40"
                            >
                              {[selected.fruitType, ...cropOptions]
                                .filter((c, i, all) => all.indexOf(c) === i)
                                .map((crop) => (
                                  <option key={crop || 'none'} value={crop}>
                                    {crop || 'None'}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-ink/60">Ground</span>
                            <select
                              value={selected.groundType}
                              disabled={!allowRisky}
                              onChange={(e) =>
                                updateField(selected.id, { groundType: e.target.value })
                              }
                              className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 text-ink focus:border-forest focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/40"
                            >
                              {[selected.groundType, ...GROUND_OPTIONS]
                                .filter((g, i, all) => all.indexOf(g) === i)
                                .map((ground) => (
                                  <option key={ground || 'none'} value={ground}>
                                    {ground || '—'}
                                  </option>
                                ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <XmlPreview
                        highlighted={isHighlighted(`field-${selected.id}`)}
                        lines={[
                          `<field id="${selected.id}" fruitType="${selected.fruitType.toUpperCase().replace(/\s+/g, '')}"`,
                          `  growthState="${selected.growthState}" groundType="${selected.groundType}"`,
                          `  weedState="${selected.weedState}" sprayLevel="${selected.sprayLevel}"`,
                          `  limeLevel="${selected.limeLevel}" plowLevel="${selected.plowLevel}"`,
                          `  stoneLevel="${selected.stoneLevel}" waterLevel="${selected.waterLevel}" />`,
                        ]}
                      />
                      <div className="rounded-field border border-tan bg-white/60 p-4">
                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">
                          After your changes
                        </p>
                        <InsightList insights={fieldInsights(selected, scales)} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-ink/50">Select a field to edit it.</p>
                )}
              </div>
            </Section>
          )}

          {/* ---------- Fleet ---------- */}
          {tab === 'fleet' && (
            <Section icon={<TractorIcon />} title="Fleet" badge={<RiskBadge risk="safe" />}>
              <p className="mb-4 text-sm text-ink/60">
                Value, condition, dirt and what is in the tanks are all simple state the
                game re-reads on load. Position, hitches and configuration ids are left
                alone on purpose — those are the ones that break a save.
              </p>

              <div className="mb-5 flex flex-wrap gap-2">
                <QuickAction
                  label="Repair everything"
                  onClick={() => applyToAllVehicles(() => ({ damage: 0 }))}
                />
                <QuickAction
                  label="Clean everything"
                  onClick={() => applyToAllVehicles(() => ({ wear: 0 }))}
                />
                <QuickAction
                  label="Fill every tank"
                  onClick={() =>
                    applyToAllVehicles((v) => ({
                      fillUnits: v.fillUnits.map((slot) =>
                        slot.capacity > 0
                          ? { ...slot, fillLevel: slot.capacity, ratio: 1 }
                          : slot,
                      ),
                    }))
                  }
                />
                <QuickAction
                  label="Empty every trailer"
                  onClick={() =>
                    applyToAllVehicles((v) => ({
                      fillUnits: v.fillUnits.map((slot) =>
                        FUEL_TYPES.includes(slot.fillType)
                          ? slot
                          : { ...slot, fillLevel: 0, ratio: slot.capacity > 0 ? 0 : null },
                      ),
                    }))
                  }
                />
              </div>

              <div>
                {vehicles.map((vehicle) => (
                  <DrillRow
                    key={vehicle.uniqueId}
                    title={vehicle.name}
                    subtitle={`${vehicle.brand} · ${vehicle.category}${vehicle.isMod ? ' · mod' : ''}`}
                    severity={worstSeverity(vehicleInsights(vehicle))}
                    meta={
                      <>
                        <span>{Math.round((1 - vehicle.damage) * 100)}% condition</span>
                        <span className="font-medium text-ink">
                          {formatMoney(vehicle.price)}
                        </span>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <label className="block text-sm">
                        <span className="text-ink/60">Value</span>
                        <input
                          type="number"
                          value={vehicle.price}
                          onChange={(e) =>
                            updateVehicle(vehicle.uniqueId, { price: Number(e.target.value) })
                          }
                          className="mt-1 w-full rounded-field border border-tan bg-white px-3 py-2 text-sm tabular-nums text-ink focus:border-forest focus:outline-none"
                        />
                      </label>
                      <Slider
                        label="Condition"
                        value={Math.round((1 - vehicle.damage) * 100)}
                        max={100}
                        step={1}
                        caption={`${Math.round((1 - vehicle.damage) * 100)}%`}
                        onChange={(value) =>
                          updateVehicle(vehicle.uniqueId, { damage: 1 - value / 100 })
                        }
                      />
                      <Slider
                        label="Dirt"
                        value={Math.round(vehicle.wear * 100)}
                        max={100}
                        step={1}
                        caption={`${Math.round(vehicle.wear * 100)}%`}
                        onChange={(value) =>
                          updateVehicle(vehicle.uniqueId, { wear: value / 100 })
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <QuickAction
                          label="Repair"
                          onClick={() => updateVehicle(vehicle.uniqueId, { damage: 0 })}
                        />
                        <QuickAction
                          label="Clean"
                          onClick={() => updateVehicle(vehicle.uniqueId, { wear: 0 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
                        Tanks & cargo
                      </p>
                      <FillSliders
                        slots={vehicle.fillUnits}
                        emptyText="No tanks on this machine."
                        onChange={(index, value) =>
                          updateVehicleFill(vehicle.uniqueId, index, value)
                        }
                      />
                      <XmlPreview
                        highlighted={isHighlighted(`vehicle-${vehicle.uniqueId}`)}
                        lines={[
                          `<vehicle uniqueId="${vehicle.uniqueId}" price="${vehicle.price}"`,
                          `  damage="${Number(vehicle.damage.toFixed(4))}" dirt="${Number(vehicle.wear.toFixed(4))}" />`,
                        ]}
                      />
                    </div>
                  </DrillRow>
                ))}
              </div>
            </Section>
          )}

          {/* ---------- Production ---------- */}
          {tab === 'production' && (
            <Section icon={<SiloIcon />} title="Production" badge={<RiskBadge risk="safe" />}>
              <p className="mb-4 text-sm text-ink/60">
                Switch lines on or off and set what is in storage. Production speed curves
                are deliberately not exposed — those are the values that misbehave when
                edited by hand.
              </p>

              {production.length === 0 ? (
                <p className="text-sm text-ink/50">
                  No production buildings found for this farm.
                </p>
              ) : (
                <div>
                  {production.map((point) => (
                    <DrillRow
                      key={point.uniqueId}
                      title={point.name}
                      subtitle={`${point.lines.length} line${point.lines.length === 1 ? '' : 's'}${point.isMod ? ' · mod' : ''}`}
                      severity={point.lines.some((l) => l.active) ? 'good' : 'attention'}
                      meta={
                        <>
                          <span>{point.lines.filter((l) => l.active).length} running</span>
                          <span className="font-medium text-ink">
                            {formatMoney(point.price)}
                          </span>
                        </>
                      }
                    >
                      <div className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
                          Lines
                        </p>
                        {point.lines.length === 0 ? (
                          <p className="text-sm text-ink/50">No production lines.</p>
                        ) : (
                          point.lines.map((line, index) => (
                            <label
                              key={line.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="text-ink">{line.name}</span>
                              <span className="flex items-center gap-2 text-xs text-ink/60">
                                {line.active ? 'Running' : 'Stopped'}
                                <input
                                  type="checkbox"
                                  checked={line.active}
                                  onChange={(e) =>
                                    updateProduction(point.uniqueId, {
                                      lines: point.lines.map((l, i) =>
                                        i === index ? { ...l, active: e.target.checked } : l,
                                      ),
                                    })
                                  }
                                  className="h-4 w-4 accent-forest"
                                />
                              </span>
                            </label>
                          ))
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <QuickAction
                            label="Run every line"
                            onClick={() =>
                              updateProduction(point.uniqueId, {
                                lines: point.lines.map((l) => ({ ...l, active: true })),
                              })
                            }
                          />
                          <QuickAction
                            label="Stop every line"
                            onClick={() =>
                              updateProduction(point.uniqueId, {
                                lines: point.lines.map((l) => ({ ...l, active: false })),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
                          Storage
                        </p>
                        <FillSliders
                          slots={point.storage}
                          emptyText="No storage reported."
                          onChange={(index, value) =>
                            updateProduction(point.uniqueId, {
                              storage: setSlotLevel(point.storage, index, value),
                            })
                          }
                        />
                      </div>
                    </DrillRow>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* ---------- Export ---------- */}
          {tab === 'export' && (
            <Section
              icon={<WrenchIcon />}
              title="Export"
              badge={
                changes.length > 0 ? (
                  <RiskBadge risk={riskyChanges.length > 0 ? 'risky' : 'safe'} />
                ) : undefined
              }
            >
              {changes.length === 0 ? (
                <p className="text-sm text-ink/50">
                  Nothing has changed yet. Edit something on the other tabs and it will
                  show up here.
                </p>
              ) : (
                <>
                  <ul className="divide-y divide-tan text-sm">
                    {changes.map((change: PendingChange, i) => (
                      <li
                        key={`${change.file}-${change.target}-${change.label}-${i}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-ink">
                            {change.target} — {change.label}
                          </span>
                          <span className="block truncate text-xs text-ink/50">
                            {change.file}
                          </span>
                        </span>
                        <span className="flex items-center gap-3 text-xs tabular-nums">
                          <span className="text-ink/50 line-through">{change.from}</span>
                          <span className="text-ink">{change.to}</span>
                          <RiskBadge risk={change.risk} />
                        </span>
                      </li>
                    ))}
                  </ul>

                  {riskyChanges.length > 0 && (
                    <div className="mt-5 rounded-field border border-status-risky/40 bg-status-risky/10 p-4 text-sm leading-relaxed text-ink/80">
                      <p className="font-medium text-status-risky">
                        {riskyChanges.length} risky change
                        {riskyChanges.length === 1 ? '' : 's'} in this export
                      </p>
                      <p className="mt-1">{riskyChanges[0].warning}</p>
                      <p className="mt-2 text-xs text-ink/60">
                        Back up your savegame folder before writing these back.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={!docs}
                      className="rounded-field bg-forest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Download changed files
                    </button>
                    {canWriteDirectly() && (
                      <button
                        type="button"
                        onClick={() => void handleWriteBack()}
                        disabled={!docs}
                        className="rounded-field border border-forest px-4 py-2 text-sm font-medium text-forest transition-colors hover:bg-forest/5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Write back to savegame folder
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={revertAll}
                      className="text-sm font-medium text-ink/60 underline decoration-ink/20 underline-offset-4 hover:text-ink"
                    >
                      Revert all changes
                    </button>
                  </div>

                  {!canWriteDirectly() && (
                    <p className="mt-3 text-xs text-ink/50">
                      Writing straight back to your savegame folder needs a Chrome-based
                      browser. Downloading works everywhere — drop the files into the
                      folder yourself.
                    </p>
                  )}

                  {exportStatus && (
                    <p className="mt-3 text-sm text-forest">{exportStatus}</p>
                  )}

                  <p className="mt-4 text-xs leading-relaxed text-ink/50">
                    Only the files you actually changed are rewritten
                    {` (${Array.from(new Set(changes.map((c) => c.file))).join(', ')})`}.
                    Everything else in the folder — world state, economy, mod files — is
                    left untouched.
                  </p>
                </>
              )}
            </Section>
          )}
        </div>
      )}

      {!edited && (
        <p className="mt-10 text-sm text-ink/50">Upload a save above to view your fields.</p>
      )}

      <p className="mt-12 border-t border-tan pt-6 text-xs leading-relaxed text-ink/50">
        Privacy note: your save file is processed entirely in your browser. Nothing is
        uploaded to a server or stored anywhere — refreshing the page clears everything.
      </p>
    </div>
  )
}
