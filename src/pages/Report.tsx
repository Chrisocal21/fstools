import { useState, type ReactNode } from 'react'
import SaveUpload from '../components/SaveUpload'
import { CoinIcon, SiloIcon, TractorIcon, WheatIcon } from '../components/icons'
import {
  mockFarm,
  mockFinanceLines,
  mockFields,
  mockFleet,
  mockProduction,
} from '../lib/mockData'

const SECTIONS = [
  { name: 'Finances', icon: CoinIcon },
  { name: 'Fleet', icon: TractorIcon },
  { name: 'Fields', icon: WheatIcon },
  { name: 'Production', icon: SiloIcon },
] as const

type DataSource = 'none' | 'files' | 'mock'

function SectionHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
      <span className="text-forest">{icon}</span>
      {children}
    </h2>
  )
}

export default function Report() {
  const [source, setSource] = useState<DataSource>('none')

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Report</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
        Upload your savegame files to generate a read-only breakdown of your
        farm's finances, fleet, fields, and production.
      </p>

      <div className="mt-8">
        <SaveUpload
          onFilesAccepted={(files) => setSource(files.length > 0 ? 'files' : 'none')}
          onMockDemo={() => setSource('mock')}
        />
      </div>

      {source === 'mock' && (
        <div className="mt-10 space-y-6">
          <section className="rounded-field border border-tan bg-white/60 p-6">
            <div className="flex items-baseline justify-between">
              <SectionHeading icon={<CoinIcon />}>Finances</SectionHeading>
              <span className="text-xs text-ink/40">{mockFarm.name}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink/50">Money</p>
                <p className="mt-1 font-display text-xl font-semibold text-ink">
                  ${mockFarm.money.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink/50">Loan</p>
                <p className="mt-1 font-display text-xl font-semibold text-ink">
                  ${mockFarm.loan.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink/50">Playtime</p>
                <p className="mt-1 font-display text-xl font-semibold text-ink">
                  {mockFarm.playtimeHours}h
                </p>
              </div>
            </div>
            <ul className="mt-5 divide-y divide-tan text-sm">
              {mockFinanceLines.map((line) => (
                <li key={line.label} className="flex items-center justify-between py-2">
                  <span className="text-ink/70">{line.label}</span>
                  <span className={line.amount < 0 ? 'text-status-risky' : 'text-status-safe'}>
                    {line.amount < 0 ? '-' : '+'}${Math.abs(line.amount).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-field border border-tan bg-white/60 p-6">
            <SectionHeading icon={<TractorIcon />}>Fleet</SectionHeading>
            <ul className="mt-4 divide-y divide-tan text-sm">
              {mockFleet.map((vehicle) => (
                <li key={vehicle.name} className="flex items-center justify-between py-2">
                  <span className="text-ink">{vehicle.name}</span>
                  <span className="flex items-center gap-4 text-ink/60">
                    <span>{vehicle.fill}</span>
                    <span className="font-medium text-ink">
                      ${vehicle.price.toLocaleString()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-field border border-tan bg-white/60 p-6">
            <SectionHeading icon={<WheatIcon />}>Fields</SectionHeading>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-ink/50">
                    <th className="pb-2 font-medium">Field</th>
                    <th className="pb-2 font-medium">Crop</th>
                    <th className="pb-2 font-medium">Ground</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tan">
                  {mockFields.map((field) => (
                    <tr key={field.id}>
                      <td className="py-2 text-ink">{field.id}</td>
                      <td className="py-2 text-ink/70">{field.fruitType}</td>
                      <td className="py-2 text-ink/70">{field.groundType}</td>
                      <td
                        className={`py-2 font-medium ${
                          field.status === 'safe'
                            ? 'text-status-safe'
                            : field.status === 'attention'
                              ? 'text-status-attention'
                              : 'text-status-risky'
                        }`}
                      >
                        {field.status === 'safe'
                          ? 'Safe'
                          : field.status === 'attention'
                            ? 'Needs attention'
                            : 'Risky'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-field border border-tan bg-white/60 p-6">
            <SectionHeading icon={<SiloIcon />}>Production</SectionHeading>
            <ul className="mt-4 divide-y divide-tan text-sm">
              {mockProduction.map((building) => (
                <li key={building.name} className="flex items-center justify-between py-2">
                  <span className="text-ink">{building.name}</span>
                  <span className="flex items-center gap-4 text-ink/60">
                    <span>{building.active}</span>
                    <span className="font-medium text-ink">{building.fill}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {source === 'files' && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {SECTIONS.map(({ name, icon: Icon }) => (
            <div key={name} className="rounded-field border border-tan bg-white/60 p-6">
              <SectionHeading icon={<Icon />}>{name}</SectionHeading>
              <p className="mt-2 text-sm text-ink/60">
                Parsing not wired up yet — this section will populate once the
                report engine is built.
              </p>
            </div>
          ))}
        </div>
      )}

      {source === 'none' && (
        <p className="mt-10 text-sm text-ink/50">
          Upload a save above to see your report.
        </p>
      )}

      <p className="mt-12 border-t border-tan pt-6 text-xs leading-relaxed text-ink/50">
        Privacy note: your save file is processed entirely in your browser. Nothing
        is uploaded to a server or stored anywhere — refreshing the page clears
        everything.
      </p>
    </div>
  )
}
