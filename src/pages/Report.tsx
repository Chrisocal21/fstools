import { useMemo, useState, type ReactNode } from 'react'
import SaveUpload from '../components/SaveUpload'
import { CoinIcon, SiloIcon, TractorIcon, WheatIcon, WrenchIcon } from '../components/icons'
import {
  DrillRow,
  FillSlots,
  InsightList,
  MeterBar,
  Panel,
  SeverityTag,
  StatGrid,
  TrendChart,
} from '../components/ReportPieces'
import {
  buildReport,
  fieldInsights,
  productionInsights,
  vehicleInsights,
  worstSeverity,
} from '../lib/insights'
import { MOCK_SAVE } from '../lib/mockSave'
import { buildModsTxt } from '../lib/parseSave'
import {
  formatMoney,
  formatPercent,
  growthLabel,
  type SaveData,
  type SaveFileStatus,
} from '../lib/saveModel'

function Section({
  icon,
  title,
  aside,
  children,
}: {
  icon: ReactNode
  title: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-field border border-tan bg-white/60 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <span className="text-forest">{icon}</span>
          {title}
        </h2>
        {aside && <span className="text-xs text-ink/50">{aside}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function downloadModsTxt(save: SaveData) {
  const blob = new Blob([buildModsTxt(save)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${save.savegameName || 'farmsim'}-mods.txt`
  link.click()
  URL.revokeObjectURL(url)
}

const FILE_STATUS_LABEL: Record<SaveFileStatus, string> = {
  parsed: 'Read',
  passthrough: 'Passed through',
  unrecognized: 'Mod content',
}

const FILE_STATUS_STYLE: Record<SaveFileStatus, string> = {
  parsed: 'text-status-safe',
  passthrough: 'text-ink/40',
  unrecognized: 'text-status-attention',
}

/** Soil meters, and whether a high value is the bad direction. */
const LEVEL_METERS = [
  { key: 'weedState', label: 'Weeds', higherIsWorse: true },
  { key: 'sprayLevel', label: 'Fertiliser', higherIsWorse: false },
  { key: 'limeLevel', label: 'Lime', higherIsWorse: false },
  { key: 'plowLevel', label: 'Plough', higherIsWorse: false },
  { key: 'stoneLevel', label: 'Stones', higherIsWorse: true },
] as const

type Tab = 'overview' | 'finances' | 'fleet' | 'fields' | 'production' | 'mods'

function KpiCard({
  label,
  value,
  note,
  onSelect,
}: {
  label: string
  value: ReactNode
  note: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-field border border-tan bg-white/60 p-5 text-left transition-colors hover:border-forest/60"
    >
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink/50">{note}</p>
    </button>
  )
}

export default function Report() {
  const [save, setSave] = useState<SaveData | null>(null)
  const [farmId, setFarmId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('overview')

  const activeFarmId = farmId ?? save?.farms[0]?.id ?? null
  const report = useMemo(
    () => (save && activeFarmId !== null ? buildReport(save, activeFarmId) : null),
    [save, activeFarmId],
  )

  // Per-tab count of things that need work, shown as a badge on the tab bar.
  const tabCounts = useMemo(() => {
    if (!report) return null
    return {
      finances: report.finance.insights.filter((i) => i.severity !== 'good').length,
      fleet: report.vehicles.filter((v) => worstSeverity(vehicleInsights(v)) !== 'good').length,
      fields: report.fieldStats.needsAttention,
      production: report.production.filter(
        (p) => worstSeverity(productionInsights(p)) !== 'good',
      ).length,
    }
  }, [report])

  const tabs: { id: Tab; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <WrenchIcon /> },
    { id: 'finances', label: 'Finances', icon: <CoinIcon />, count: tabCounts?.finances },
    { id: 'fleet', label: 'Fleet', icon: <TractorIcon />, count: tabCounts?.fleet },
    { id: 'fields', label: 'Fields', icon: <WheatIcon />, count: tabCounts?.fields },
    { id: 'production', label: 'Production', icon: <SiloIcon />, count: tabCounts?.production },
    { id: 'mods', label: 'Mods & files', icon: <WrenchIcon /> },
  ]

  const loadSave = (next: SaveData) => {
    setSave(next)
    setFarmId(next.farms[0]?.id ?? null)
    setTab('overview')
  }

  const uploader = <SaveUpload onSaveParsed={loadSave} onMockDemo={() => loadSave(MOCK_SAVE)} />

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Report</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
        Upload your savegame files to generate a read-only breakdown of your farm's
        finances, fleet, fields and production — with a plain-English note on every
        machine, field and production line telling you what could be better.
      </p>

      {save ? (
        <details className="mt-6">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4">
            {save.savegameName || 'Save loaded'} · {save.files.length} files — change or add files
          </summary>
          <div className="mt-4">{uploader}</div>
        </details>
      ) : (
        <div className="mt-8">{uploader}</div>
      )}

      {save && !report && (
        <p className="mt-10 text-sm text-status-attention">
          Those files loaded, but no farm was found in them. Include{' '}
          <code>farms.xml</code> from your savegame folder.
        </p>
      )}

      {save && report && (
        <div className="mt-10 space-y-6">
          {save.farms.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 rounded-field border border-tan bg-white/60 px-4 py-3">
              <span className="mr-2 text-xs uppercase tracking-wide text-ink/50">
                {save.farms.length} farms in this save
              </span>
              {save.farms.map((farm) => (
                <button
                  key={farm.id}
                  type="button"
                  onClick={() => setFarmId(farm.id)}
                  className={`rounded-field px-3 py-1.5 text-sm transition-colors ${
                    farm.id === activeFarmId
                      ? 'bg-forest text-white'
                      : 'border border-tan text-ink/70 hover:border-forest/60'
                  }`}
                >
                  {farm.name}
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
                  tab === entry.id
                    ? 'bg-forest text-white'
                    : 'text-ink/70 hover:bg-forest/[0.06]'
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

          {tab === 'overview' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label="Cash"
                  value={formatMoney(report.farm.money)}
                  note={
                    report.farm.loan > 0
                      ? `${formatMoney(report.farm.loan)} loan outstanding`
                      : 'No loan outstanding'
                  }
                  onSelect={() => setTab('finances')}
                />
                <KpiCard
                  label="Fleet"
                  value={formatMoney(report.fleet.value)}
                  note={`${report.fleet.count} machines · ${report.fleet.needingRepair.length} need repair`}
                  onSelect={() => setTab('fleet')}
                />
                <KpiCard
                  label="Fields"
                  value={report.fieldStats.count}
                  note={`${report.fieldStats.needsAttention} needing work${
                    report.fieldStats.areaHa ? ` · ${report.fieldStats.areaHa.toFixed(0)} ha` : ''
                  }`}
                  onSelect={() => setTab('fields')}
                />
                <KpiCard
                  label="Production"
                  value={`${report.productionStats.activeLines}/${report.productionStats.totalLines}`}
                  note={`lines running across ${report.productionStats.count} buildings`}
                  onSelect={() => setTab('production')}
                />
              </div>

              {report.priorities.length > 0 && (
                <Section
                  icon={<WrenchIcon />}
                  title="What to do next"
                  aside={`${report.farm.name}${save.mapTitle ? ` · ${save.mapTitle}` : ''}`}
                >
                  <InsightList insights={report.priorities} />
                </Section>
              )}
            </>
          )}

          {tab === 'finances' && (
          <Section
            icon={<CoinIcon />}
            title="Finances"
            aside={`${report.finance.days} day${report.finance.days === 1 ? '' : 's'} of records`}
          >
            <StatGrid
              stats={[
                { label: 'Money', value: formatMoney(report.farm.money) },
                { label: 'Loan', value: formatMoney(report.farm.loan) },
                {
                  label: 'Net worth (cash + fleet)',
                  value: formatMoney(report.farm.money + report.fleet.value - report.farm.loan),
                },
                { label: 'Playtime', value: `${save.playtimeHours}h` },
                { label: 'Day', value: save.currentDay || '—' },
                {
                  label: 'Land parcels',
                  value: save.ownedFarmlandByFarm[report.farm.id] ?? '—',
                },
              ]}
            />

            {save.finances.length > 1 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">
                  Net per day
                </p>
                <TrendChart days={save.finances} />
              </div>
            )}

            {report.finance.byCategory.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">
                  Where the money went
                </p>
                <ul className="divide-y divide-tan text-sm">
                  {report.finance.byCategory.map((line) => (
                    <li key={line.key} className="flex items-center justify-between py-2">
                      <span className="text-ink/70">{line.label}</span>
                      <span
                        className={`tabular-nums ${
                          line.total < 0 ? 'text-status-risky' : 'text-status-safe'
                        }`}
                      >
                        {line.total < 0 ? '' : '+'}
                        {formatMoney(line.total)}
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between py-2 font-medium">
                    <span className="text-ink">Net</span>
                    <span
                      className={`tabular-nums ${
                        report.finance.net < 0 ? 'text-status-risky' : 'text-status-safe'
                      }`}
                    >
                      {formatMoney(report.finance.net)}
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {save.finances.length > 0 && (
              <div className="mt-6">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">
                  Day by day
                </p>
                <div>
                  {save.finances.map((day) => (
                    <DrillRow
                      key={day.day}
                      title={`Day ${day.day}`}
                      subtitle={`${day.lines.length} line items`}
                      severity={day.net < 0 ? 'risky' : 'good'}
                      meta={
                        <>
                          <span className="text-status-safe">+{formatMoney(day.income)}</span>
                          <span className="text-status-risky">{formatMoney(day.expenses)}</span>
                          <span className="font-medium text-ink">{formatMoney(day.net)}</span>
                        </>
                      }
                    >
                      <Panel title="Income">
                        <ul className="divide-y divide-tan/60 text-sm">
                          {day.lines
                            .filter((l) => l.amount > 0)
                            .map((l) => (
                              <li key={l.key} className="flex justify-between py-1.5">
                                <span className="text-ink/70">{l.label}</span>
                                <span className="tabular-nums text-status-safe">
                                  {formatMoney(l.amount)}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </Panel>
                      <Panel title="Costs">
                        <ul className="divide-y divide-tan/60 text-sm">
                          {day.lines
                            .filter((l) => l.amount < 0)
                            .map((l) => (
                              <li key={l.key} className="flex justify-between py-1.5">
                                <span className="text-ink/70">{l.label}</span>
                                <span className="tabular-nums text-status-risky">
                                  {formatMoney(l.amount)}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </Panel>
                    </DrillRow>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-tan pt-5">
              <InsightList insights={report.finance.insights} />
            </div>
          </Section>
          )}

          {tab === 'fleet' && (
          <Section
            icon={<TractorIcon />}
            title="Fleet"
            aside={`${report.fleet.count} machines · ${formatMoney(report.fleet.value)}`}
          >
            {report.fleet.byCategory.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {report.fleet.byCategory.map((cat) => (
                  <span
                    key={cat.category}
                    className="rounded-field border border-tan px-3 py-1 text-xs text-ink/70"
                  >
                    {cat.category} · {cat.count} · {formatMoney(cat.value)}
                  </span>
                ))}
              </div>
            )}

            <div>
              {report.vehicles.map((vehicle) => {
                const insights = vehicleInsights(vehicle)
                return (
                  <DrillRow
                    key={vehicle.uniqueId}
                    title={vehicle.name}
                    subtitle={`${vehicle.brand} · ${vehicle.category}${vehicle.isMod ? ' · mod' : ''}`}
                    severity={worstSeverity(insights)}
                    meta={
                      <>
                        <span>{Math.round(vehicle.operatingHours)}h</span>
                        <span>{Math.round((1 - vehicle.damage) * 100)}% condition</span>
                        <span className="font-medium text-ink">{formatMoney(vehicle.price)}</span>
                      </>
                    }
                  >
                    <Panel title="Machine">
                      <StatGrid
                        stats={[
                          { label: 'Value', value: formatMoney(vehicle.price) },
                          { label: 'Age', value: `${Math.round(vehicle.age)} days` },
                          {
                            label: 'Operating time',
                            value: `${vehicle.operatingHours.toFixed(1)} h`,
                          },
                          {
                            label: 'Condition',
                            value: `${Math.round((1 - vehicle.damage) * 100)}%`,
                          },
                          { label: 'Wear', value: formatPercent(vehicle.wear) },
                          {
                            label: 'Hitched to',
                            value:
                              report.vehicles.find((v) => v.uniqueId === vehicle.attachedTo)
                                ?.name ?? '—',
                          },
                        ]}
                      />
                      <div className="mt-4">
                        <MeterBar
                          label="Condition"
                          ratio={1 - vehicle.damage}
                          tone={
                            vehicle.damage >= 0.6
                              ? 'risky'
                              : vehicle.damage >= 0.3
                                ? 'attention'
                                : 'forest'
                          }
                        />
                      </div>
                    </Panel>
                    <Panel title="Tanks & cargo">
                      <FillSlots slots={vehicle.fillUnits} emptyText="No tanks on this machine." />
                    </Panel>
                    <div className="sm:col-span-2">
                      <Panel title="What could be better">
                        <InsightList insights={insights} />
                      </Panel>
                    </div>
                  </DrillRow>
                )
              })}
            </div>

            <div className="mt-6 border-t border-tan pt-5">
              <InsightList insights={report.fleet.insights} />
            </div>
          </Section>
          )}

          {tab === 'fields' && (
          <Section
            icon={<WheatIcon />}
            title="Fields"
            aside={`${report.fieldStats.count} fields${
              report.fieldStats.areaHa ? ` · ${report.fieldStats.areaHa.toFixed(1)} ha` : ''
            } · ${report.fieldStats.needsAttention} needing work`}
          >
            {report.fieldStats.topValue.length > 0 && (
              <div className="mb-6 border-b border-tan pb-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">
                  Most valuable crops on this farm
                </p>
                <div className="space-y-2.5">
                  {report.fieldStats.topValue.map((entry) => (
                    <MeterBar
                      key={entry.fruitType}
                      label={`${entry.fruitType} — ${entry.fieldIds.length} field${
                        entry.fieldIds.length === 1 ? '' : 's'
                      }${entry.areaHa ? ` · ${entry.areaHa.toFixed(1)} ha` : ''}`}
                      ratio={entry.price / report.fieldStats.topValue[0].price}
                      caption={Math.round(entry.price).toLocaleString()}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink/50">
                  Ranked by each crop's average price across the save's twelve
                  seasonal periods — not the current price, and not adjusted
                  for yield or area, which most saves don't record per field.
                </p>
              </div>
            )}

            <div>
              {report.fields.map((field) => {
                const insights = fieldInsights(field, report.scales, {
                  irrigation: report.irrigation,
                })
                return (
                  <DrillRow
                    key={field.id}
                    title={`Field ${field.id} — ${field.fruitType || 'empty'}`}
                    subtitle={`${growthLabel(field)}${
                      field.areaHa ? ` · ${field.areaHa.toFixed(1)} ha` : ''
                    }`}
                    severity={worstSeverity(insights)}
                    meta={
                      <>
                        <span>{field.groundType || '—'}</span>
                        <span>
                          weeds {field.weedState}/{report.scales.weedState}
                        </span>
                        <span>
                          lime {field.limeLevel}/{report.scales.limeLevel}
                        </span>
                      </>
                    }
                  >
                    <Panel title="Field">
                      <StatGrid
                        stats={[
                          { label: 'Crop', value: field.fruitType || 'None' },
                          { label: 'Planned next', value: field.plannedFruit || '—' },
                          { label: 'Growth', value: growthLabel(field) },
                          { label: 'Ground', value: field.groundType || '—' },
                          { label: 'Spray type', value: field.sprayType || '—' },
                          {
                            label: 'Area',
                            value: field.areaHa ? `${field.areaHa.toFixed(1)} ha` : '—',
                          },
                        ]}
                      />
                    </Panel>
                    <Panel title="Soil & treatment">
                      <div className="space-y-2.5">
                        {LEVEL_METERS.map((meter) => {
                          const value = field[meter.key]
                          const max = report.scales[meter.key]
                          const ratio = max > 0 ? value / max : null
                          const bad = meter.higherIsWorse ? value > 0 : value === 0
                          return (
                            <MeterBar
                              key={meter.key}
                              label={meter.label}
                              ratio={ratio}
                              caption={`${value} / ${max}`}
                              tone={bad ? 'attention' : 'forest'}
                            />
                          )
                        })}
                      </div>
                    </Panel>
                    <div className="sm:col-span-2">
                      <Panel title="What could be better">
                        <InsightList insights={insights} />
                      </Panel>
                    </div>
                  </DrillRow>
                )
              })}
            </div>

            <div className="mt-6 border-t border-tan pt-5">
              <InsightList insights={report.fieldStats.insights} />
            </div>
          </Section>
          )}

          {tab === 'production' && (
          <Section
            icon={<SiloIcon />}
            title="Production"
            aside={`${report.productionStats.activeLines}/${report.productionStats.totalLines} lines running`}
          >
            <div>
              {report.production.map((point) => {
                const insights = productionInsights(point)
                return (
                  <DrillRow
                    key={point.uniqueId}
                    title={point.name}
                    subtitle={`${point.lines.length} line${point.lines.length === 1 ? '' : 's'}${
                      point.isMod ? ' · mod' : ''
                    }`}
                    severity={worstSeverity(insights)}
                    meta={
                      <>
                        <span>{point.lines.filter((l) => l.active).length} running</span>
                        <span className="font-medium text-ink">{formatMoney(point.price)}</span>
                      </>
                    }
                  >
                    <Panel title="Storage">
                      <FillSlots slots={point.storage} emptyText="No storage reported." />
                    </Panel>
                    <Panel title="Lines">
                      {point.lines.length === 0 ? (
                        <p className="text-sm text-ink/50">No production lines.</p>
                      ) : (
                        <ul className="space-y-4">
                          {point.lines.map((line) => (
                            <li key={line.id}>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm text-ink">{line.name}</span>
                                <SeverityTag severity={line.active ? 'good' : 'attention'} />
                              </div>
                              {line.inputs.length > 0 && (
                                <div className="mt-2">
                                  <FillSlots slots={line.inputs} emptyText="" />
                                </div>
                              )}
                              {line.outputs.length > 0 && (
                                <div className="mt-2">
                                  <FillSlots slots={line.outputs} emptyText="" />
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Panel>
                    <div className="sm:col-span-2">
                      <Panel title="What could be better">
                        <InsightList insights={insights} />
                      </Panel>
                    </div>
                  </DrillRow>
                )
              })}
            </div>

            <div className="mt-6 border-t border-tan pt-5">
              <InsightList insights={report.productionStats.insights} />
            </div>
          </Section>
          )}

          {tab === 'mods' && (
          <Section
            icon={<WrenchIcon />}
            title="Mods & files"
            aside={`${save.mods.length} mods · ${save.files.length} files`}
          >
            {save.mods.length > 0 && (
              <>
                <ul className="divide-y divide-tan text-sm">
                  {save.mods.map((mod) => (
                    <li key={mod.modName} className="flex items-center justify-between gap-4 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-ink">{mod.title}</span>
                        <span className="block truncate text-xs text-ink/50">{mod.modName}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-xs text-ink/60">
                        {mod.version}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => downloadModsTxt(save)}
                  className="mt-4 text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:text-forest-light"
                >
                  Download mods list (.txt) &rarr;
                </button>
              </>
            )}

            <details className="mt-6 border-t border-tan pt-4">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-forest">
                Files read from this save ({save.files.length})
              </summary>
              <ul className="mt-3 divide-y divide-tan text-sm">
                {save.files.map((file) => (
                  <li key={file.name} className="flex items-center justify-between gap-4 py-2">
                    <span className="truncate text-ink/70">{file.name}</span>
                    <span className="flex shrink-0 items-center gap-3 text-xs">
                      {file.rootTag && <span className="text-ink/40">&lt;{file.rootTag}&gt;</span>}
                      <span className={`font-medium ${FILE_STATUS_STYLE[file.status]}`}>
                        {FILE_STATUS_LABEL[file.status]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-ink/50">
                Anything tagged as mod content is never an error — it is kept exactly as
                it was and passed straight back out on export.
              </p>
            </details>
          </Section>
          )}
        </div>
      )}

      {!save && (
        <p className="mt-10 text-sm text-ink/50">Upload a save above to see your report.</p>
      )}

      <p className="mt-12 border-t border-tan pt-6 text-xs leading-relaxed text-ink/50">
        Privacy note: your save file is processed entirely in your browser. Nothing
        is uploaded to a server or stored anywhere — refreshing the page clears
        everything.
      </p>
    </div>
  )
}
