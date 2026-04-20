import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <header className="top-nav sticky top-0 z-20 mb-8 flex flex-col gap-5 rounded-xl border border-[var(--border-strong)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--accent)]">VoltIQ</p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Intelligent Energy and Solar Advisor
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Know your bill. Reduce it instantly. Decide if solar is worth it.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 transition ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/solar"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 transition ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              Solar Advisor
            </NavLink>
            <NavLink
              to="/renewable"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 transition ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              Renewable Optimiser
            </NavLink>
            <NavLink
              to="/energy-age"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 transition ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              Energy Age
            </NavLink>
            <NavLink
              to="/what-if"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 transition ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              What-If Chatbot
            </NavLink>
          </nav>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
