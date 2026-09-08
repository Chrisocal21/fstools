type IconProps = { className?: string }

const base = 'h-5 w-5'

export function WheatIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M12 5c-1.5-1.5-3.5-1.5-5 0 1.5 1.5 3.5 1.5 5 0ZM12 5c1.5-1.5 3.5-1.5 5 0-1.5 1.5-3.5 1.5-5 0Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 9c-1.5-1.5-3.5-1.5-5 0 1.5 1.5 3.5 1.5 5 0ZM12 9c1.5-1.5 3.5-1.5 5 0-1.5 1.5-3.5 1.5-5 0Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 13c-1.5-1.5-3.5-1.5-5 0 1.5 1.5 3.5 1.5 5 0ZM12 13c1.5-1.5 3.5-1.5 5 0-1.5 1.5-3.5 1.5-5 0Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 21c0-2.5 1.5-4 3.5-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function TractorIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="7" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="18" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 18h1M9.5 18h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 15V8h5l3 3h2.5a2 2 0 0 1 2 2v2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M6 11h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 8V5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CoinIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 7.5v9M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.7 2.5 1.7-1.1 1.5-2.5 1.8-2.5.9-2.5 1.9 1.1 1.6 2.5 1.6 2.5-.6 2.5-1.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SiloIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 10a4 4 0 0 1 8 0v10H8V10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 3v3M8 10h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 14h8M8 17h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function PlotIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h18M12 4v16" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function WrenchIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14.5 6.5a3.5 3.5 0 0 0-4.6 4.2L4 16.6V20h3.4l5.9-5.9a3.5 3.5 0 0 0 4.2-4.6l-2.4 2.4-2-2 2.4-2.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
