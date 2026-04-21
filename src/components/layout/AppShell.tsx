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
              Easy Electricity Savings Planner
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Understand your bill, cut waste, and decide if solar is worth it.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Start here: Dashboard {'->'} Analyze My Bill {'->'} Apply Suggestions.</p>
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
              Home
            </NavLink>
            <NavLink
              to="/advisor"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 transition ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              AI Advisor
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
              Solar Check
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
              Appliance Health
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
              Ask Assistant
            </NavLink>
          </nav>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
