// Shared building blocks for the report's drill-down views.
import type { ReactNode } from 'react'
import {
  formatMoney,
  formatPercent,
  type FillSlot,
  type FinanceDay,
  type Insight,
  type Severity,
} from '../lib/saveModel'

const SEVERITY_TEXT: Record<Severity, string> = {
  good: 'text-status-safe',
  attention: 'text-status-attention',
  risky: 'text-status-risky',
}

const SEVERITY_DOT: Record<Severity, string> = {
  good: 'bg-status-safe',
  attention: 'bg-status-attention',
  risky: 'bg-status-risky',
}

const SEVERITY_LABEL: Record<Severity, string> = {
  good: 'Good',
  attention: 'Needs attention',
  risky: 'Act now',
}

export function SeverityDot({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[severity]}`}
      aria-hidden="true"
    />
  )
}

export function SeverityTag({ severity }: { severity: Severity }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${SEVERITY_TEXT[severity]}`}>
      <SeverityDot severity={severity} />
      {SEVERITY_LABEL[severity]}
    </span>
  )
}

export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null
  return (
    <ul className="space-y-3">
      {insights.map((insight, i) => (
        <li key={`${insight.title}-${i}`} className="flex gap-3">
          <span className="mt-1.5">
            <SeverityDot severity={insight.severity} />
          </span>
          <div>
            <p className={`text-sm font-medium ${SEVERITY_TEXT[insight.severity]}`}>
              {insight.title}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink/70">{insight.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Label/value pairs used inside every drill-down panel. */
export function StatGrid({ stats }: { stats: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="text-xs uppercase tracking-wide text-ink/50">{stat.label}</dt>
          <dd className="mt-0.5 text-sm tabular-nums text-ink">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function MeterBar({
  label,
  ratio,
  caption,
  tone = 'forest',
}: {
  label: string
  ratio: number | null
  caption?: string
  tone?: 'forest' | 'attention' | 'risky'
}) {
  const pct = ratio === null ? 0 : Math.round(Math.min(Math.max(ratio, 0), 1) * 100)
  const barColor =
    tone === 'risky' ? 'bg-status-risky' : tone === 'attention' ? 'bg-status-attention' : 'bg-forest'
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-ink/70">{label}</span>
        <span className="tabular-nums text-ink/50">{caption ?? formatPercent(ratio)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-tan">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function FillSlots({ slots, emptyText }: { slots: FillSlot[]; emptyText: string }) {
  if (slots.length === 0) return <p className="text-sm text-ink/50">{emptyText}</p>
  return (
    <div className="space-y-2.5">
      {slots.map((slot, i) => (
        <MeterBar
          key={`${slot.fillType}-${i}`}
          label={slot.fillType}
          ratio={slot.ratio}
          caption={
            slot.capacity > 0
              ? `${Math.round(slot.fillLevel).toLocaleString()} / ${Math.round(slot.capacity).toLocaleString()}`
              : Math.round(slot.fillLevel).toLocaleString()
          }
          tone={slot.ratio !== null && slot.ratio >= 0.9 ? 'attention' : 'forest'}
        />
      ))}
    </div>
  )
}

/**
 * One expandable entity row — collapsed it reads as a scannable list item,
 * expanded it shows the full breakdown plus what to do about it.
 */
export function DrillRow({
  title,
  subtitle,
  severity,
  meta,
  children,
}: {
  title: string
  subtitle?: string
  severity: Severity
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <details className="group border-b border-tan last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-3 transition-colors hover:bg-forest/[0.03]">
        <SeverityDot severity={severity} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">{title}</span>
          {subtitle && <span className="block truncate text-xs text-ink/50">{subtitle}</span>}
        </span>
        {meta && (
          <span className="hidden shrink-0 items-center gap-4 text-xs tabular-nums text-ink/60 sm:flex">
            {meta}
          </span>
        )}
        <span
          className="shrink-0 text-xs text-ink/40 transition-transform group-open:rotate-90"
          aria-hidden="true"
        >
          &#9656;
        </span>
      </summary>
      <div className="grid gap-6 border-t border-tan/60 bg-white/40 px-1 py-5 sm:grid-cols-2">
        {children}
      </div>
    </details>
  )
}

/**
 * Net per day, oldest to newest — the save stores day 0 as most recent, so
 * this reverses that for a left-to-right reading. Bars sit above or below a
 * zero baseline, which carries the profit/loss signal on its own — color
 * only reinforces it, since green/rust alone isn't a safe distinction for
 * every reader.
 */
export function TrendChart({ days }: { days: FinanceDay[] }) {
  if (days.length === 0) return null
  const chronological = [...days].reverse()
  const maxAbs = Math.max(1, ...chronological.map((d) => Math.abs(d.net)))

  const barSlot = 40
  const barWidth = 22
  const height = 140
  const baselineY = height / 2
  const width = chronological.length * barSlot

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="block"
          role="img"
          aria-label="Net income per day, oldest to newest"
        >
          <line x1={0} y1={baselineY} x2={width} y2={baselineY} className="stroke-tan" strokeWidth={1} />
          {chronological.map((d, i) => {
            const barHeight = (Math.abs(d.net) / maxAbs) * (baselineY - 10)
            const x = i * barSlot + (barSlot - barWidth) / 2
            const y = d.net >= 0 ? baselineY - barHeight : baselineY
            return (
              <rect
                key={d.day}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={3}
                className={d.net >= 0 ? 'fill-status-safe' : 'fill-status-risky'}
              >
                <title>{`Day ${d.day}: ${formatMoney(d.net)}`}</title>
              </rect>
            )
          })}
        </svg>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-ink/50">
        <span>Day {chronological[0].day} (oldest)</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-status-safe" aria-hidden="true" />
            Profit day
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-status-risky" aria-hidden="true" />
            Loss day
          </span>
        </span>
        <span>Day {chronological[chronological.length - 1].day} (most recent)</span>
      </div>
    </div>
  )
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">{title}</p>
      {children}
    </div>
  )
}
