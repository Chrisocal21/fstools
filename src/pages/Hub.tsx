import FieldCard from '../components/FieldCard'
import { CoinIcon, TractorIcon, WheatIcon } from '../components/icons'

const ReportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
    <path
      d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M15 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8 12h8M8 16h8M8 8h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

export default function Hub() {
  return (
    <div>
      <div
        className="relative overflow-hidden rounded-field"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 92%, 0 100%)' }}
      >
        <img
          src="/images/patchwork-fields.jpg"
          alt="Aerial view of a patchwork of farm fields"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/30" />
        <div className="relative flex min-h-[22rem] flex-col justify-end p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime">
            For Farming Simulator
          </p>
          <h1 className="mt-3 font-brand text-5xl font-semibold uppercase tracking-wide text-paper sm:text-6xl">
            Farm Sim Tools
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-paper/80 sm:text-base">
            Upload a Farming Simulator save to generate a full report, or open Farm
            Manager to review and edit your fields, fleet, and finances directly.
            Nothing is stored — your save is processed in your browser and discarded
            on refresh.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-paper/80">
            <span className="flex items-center gap-1.5">
              <WheatIcon className="h-4 w-4 text-lime" /> Field-aware
            </span>
            <span className="flex items-center gap-1.5">
              <TractorIcon className="h-4 w-4 text-lime" /> Fleet-aware
            </span>
            <span className="flex items-center gap-1.5">
              <CoinIcon className="h-4 w-4 text-lime" /> Finance-aware
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <FieldCard
          to="/report"
          title="Report"
          description="Upload a save and get a full breakdown of finances, fleet, fields, and production — no editing, just the numbers."
          icon={<ReportIcon />}
        />
        <FieldCard
          to="/farm-manager"
          title="Farm Manager"
          description="A grid view of your fields with click-to-edit access to money, fields, and vehicles, plus safe/risky warnings before you save."
          icon={<GridIcon />}
        />
      </div>
    </div>
  )
}
