import { Link, NavLink, Outlet } from 'react-router-dom'
import { WheatIcon } from './icons'

const NAV_LINKS = [
  { to: '/report', label: 'Report' },
  { to: '/farm-manager', label: 'Farm Manager' },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-charcoal print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-brand text-xl font-semibold uppercase tracking-wide text-paper"
          >
            <WheatIcon className="h-5 w-5 text-lime" />
            Farm Sim Tools
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-field px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-lime text-charcoal'
                      : 'text-paper/70 hover:bg-white/10 hover:text-paper'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Outlet />
      </main>
      <footer className="border-t border-tan print:hidden">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-ink/50">
          Built for the fields of Farming Simulator. Nothing leaves your browser.
        </div>
      </footer>
    </div>
  )
}
