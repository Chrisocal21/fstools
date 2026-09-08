import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type FieldCardProps = {
  to: string
  title: string
  description: string
  icon: ReactNode
}

export default function FieldCard({ to, title, description, icon }: FieldCardProps) {
  return (
    <Link
      to={to}
      className="group block rounded-field border border-tan bg-white/60 p-8 transition-colors hover:border-lime-dark hover:bg-white"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-field bg-forest text-paper transition-colors group-hover:bg-lime-dark">
        {icon}
      </div>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{description}</p>
    </Link>
  )
}
