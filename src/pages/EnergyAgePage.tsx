import { useMemo, useState } from 'react'
import { MetricCard } from '../components/common/MetricCard'
import { SectionCard } from '../components/common/SectionCard'
import { useEnergy } from '../context/EnergyContext'
import { formatCompactCurrency, formatCurrency } from '../utils/format'
import {
  calculateEnergyAgeResult,
  ENERGY_AGE_SPECS,
  ENERGY_AGE_TYPE_OPTIONS,
  type EnergyAgeInput,
} from '../utils/energyAge'

const GRADE_THEME: Record<
  'A' | 'B' | 'C' | 'D' | 'F',
  { color: string; border: string; ringTrail: string; badge: string }
> = {
  A: { color: '#22c55e', border: 'border-[var(--success)]/30', ringTrail: '#113126', badge: 'text-[var(--success)]' },
  B: { color: '#14b8a6', border: 'border-teal-400/30', ringTrail: '#112b2a', badge: 'text-teal-300' },
  C: { color: '#f59e0b', border: 'border-amber-400/30', ringTrail: '#2f2411', badge: 'text-amber-300' },
  D: { color: '#f97316', border: 'border-orange-400/30', ringTrail: '#2f1d11', badge: 'text-orange-300' },
  F: { color: '#ef4444', border: 'border-red-400/30', ringTrail: '#2f1111', badge: 'text-red-300' },
}

const TYPE_BADGE: Record<EnergyAgeInput['type'], string> = {
  ac_1_5t: 'AC',
  refrigerator: 'RF',
  washing_machine: 'WM',
  water_heater: 'WH',
  ceiling_fan: 'CF',
  television: 'TV',
}

const PICKER_DEFAULTS: Record<
  EnergyAgeInput['type'],
  { name: string; starRating: number; dailyHours: number; purchaseYearOffset: number }
> = {
  ac_1_5t: { name: 'Living Room AC', starRating: 3, dailyHours: 8, purchaseYearOffset: 6 },
  refrigerator: { name: 'Main Refrigerator', starRating: 4, dailyHours: 10, purchaseYearOffset: 5 },
  washing_machine: { name: 'Washing Machine', starRating: 3, dailyHours: 0.5, purchaseYearOffset: 4 },
  water_heater: { name: 'Bathroom Geyser', starRating: 3, dailyHours: 1, purchaseYearOffset: 5 },
  ceiling_fan: { name: 'Ceiling Fan Cluster', starRating: 4, dailyHours: 10, purchaseYearOffset: 7 },
  television: { name: 'Television', starRating: 4, dailyHours: 4, purchaseYearOffset: 4 },
}

function ScoreRing({ score, grade }: { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' }) {
  const theme = GRADE_THEME[grade]

  return (
    <div
      className="relative grid h-24 w-24 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${theme.color} ${Math.round(score * 3.6)}deg, ${theme.ringTrail} 0deg)`,
      }}
    >
      <div className="panel-elevated grid h-[74px] w-[74px] place-items-center rounded-full">
        <p className="num-mono font-display text-xl font-semibold text-[var(--text-primary)]">{Math.round(score)}</p>
      </div>
    </div>
  )
}

export function EnergyAgePage() {
  const { currentScenario, tariffProfile, energyAgeInputs, setEnergyAgeInputs } = useEnergy()
  const [pickerType, setPickerType] = useState<EnergyAgeInput['type']>('ac_1_5t')
  const currentYear = new Date().getFullYear()
  const appliances = energyAgeInputs
  const selectedAlreadyAdded = appliances.some((item) => item.type === pickerType)

  const tariffRate = currentScenario.slabStatus.slab.rate

  const results = useMemo(
    () => appliances.map((item) => calculateEnergyAgeResult(item, tariffRate, currentYear)),
    [appliances, currentYear, tariffRate],
  )

  const sortedResults = useMemo(
    () => [...results].sort((left, right) => left.energyAgeScore - right.energyAgeScore),
    [results],
  )

  const totalMonthlyOverspend = results.reduce((sum, item) => sum + item.monthlySaving, 0)
  const totalYearlyOverspend = totalMonthlyOverspend * 12
  const urgentReplacementSavings = results
    .filter((item) => item.grade === 'D' || item.grade === 'F')
    .reduce((sum, item) => sum + item.monthlySaving, 0)

  function addAppliance() {
    const template = PICKER_DEFAULTS[pickerType]

    setEnergyAgeInputs((current) => {
      const nextEntry = {
        name: template.name,
        type: pickerType,
        purchaseYear: Math.max(currentYear - template.purchaseYearOffset, 1990),
        starRating: template.starRating,
        dailyHours: template.dailyHours,
      }

      const existingIndex = current.findIndex((item) => item.type === pickerType)
      if (existingIndex >= 0) {
        return current.map((item, index) => (index === existingIndex ? { ...item, ...nextEntry } : item))
      }

      if (current.length >= 8) return current

      return [...current, nextEntry]
    })
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass-panel p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--accent)]">Appliance Health</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Find old appliances that are increasing your bill.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Add your appliances and we will rank them from worst to best based on age and efficiency.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="Tariff context"
            value={`₹${tariffRate.toFixed(2)}/unit`}
            hint={`${tariffProfile.state} current slab rate`}
            tone="warning"
          />
          <MetricCard
            label="Possible monthly savings"
            value={formatCurrency(urgentReplacementSavings)}
            hint="If low-grade appliances are replaced"
            tone="positive"
          />
        </div>
      </section>

      <SectionCard
        eyebrow="Input"
        title="Your Appliances"
        description="Pick one appliance at a time from the dropdown below."
        action={
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3">
            <select
              value={pickerType}
              onChange={(event) => setPickerType(event.target.value as EnergyAgeInput['type'])}
              className="input-base min-w-[220px]"
              aria-label="Choose an appliance to add"
            >
              {ENERGY_AGE_TYPE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addAppliance}
              disabled={appliances.length >= 8}
              className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {selectedAlreadyAdded ? 'Update recommendation' : `Add to recommendations (${appliances.length}/8)`}
            </button>
          </div>
        }
      >
        <div />
      </SectionCard>

      <SectionCard
        eyebrow="Scored"
        title="Replacement Priority"
        description="Cards are sorted from worst to best so you can replace high-impact appliances first."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedResults.map((result) => {
            const theme = GRADE_THEME[result.grade]

            return (
              <article key={`${result.input.name}-${result.input.purchaseYear}-${result.input.type}`} className={`rounded-xl border bg-[var(--bg-surface)] p-5 ${theme.border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="panel-surface rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                        {TYPE_BADGE[result.input.type]}
                      </span>
                      <p className="text-base font-medium text-[var(--text-primary)]">
                        {result.input.name || ENERGY_AGE_SPECS[result.input.type].label}
                      </p>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      {ENERGY_AGE_SPECS[result.input.type].label} · {result.age} years old · {result.input.starRating}★
                    </p>
                  </div>
                  <ScoreRing score={result.energyAgeScore} grade={result.grade} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="panel-elevated rounded-xl p-3">
                    <p className="label-muted">Actual monthly cost</p>
                    <p className="num-mono mt-2 text-xl font-semibold text-[var(--text-primary)]">{formatCurrency(result.actualCost)}</p>
                    <p className="num-mono mt-1 text-xs text-[var(--text-muted)]">{result.unitsPerMonth.toFixed(1)} units/month</p>
                  </div>
                  <div className="panel-elevated rounded-xl p-3">
                    <p className="label-muted">Modern equivalent</p>
                    <p className="num-mono mt-2 text-xl font-semibold text-[var(--text-primary)]">{formatCurrency(result.modernCost)}</p>
                    <p className="num-mono mt-1 text-xs text-[var(--text-muted)]">{result.modernUnitsPerMonth.toFixed(1)} units/month</p>
                  </div>
                  <div className="panel-elevated rounded-xl p-3">
                    <p className="label-muted">Saving potential</p>
                    <p className="num-mono mt-2 text-xl font-semibold text-[var(--accent)]">{formatCurrency(result.monthlySaving)}/month</p>
                    <p className="num-mono mt-1 text-xs text-[var(--text-muted)]">{formatCurrency(result.yearlySaving)} per year</p>
                  </div>
                  <div className="panel-elevated rounded-xl p-3">
                    <p className="label-muted">Replacement payback</p>
                    <p className="num-mono mt-2 text-xl font-semibold text-[var(--text-primary)]">
                      {result.paybackYears === null ? 'No payback' : `${result.paybackYears.toFixed(1)} years`}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Cost {formatCompactCurrency(result.effectiveReplacementCost)} after scheme discount {formatCurrency(result.schemeDiscount)}
                    </p>
                  </div>
                </div>

                <div className="panel-elevated mt-4 flex items-center justify-between rounded-xl px-4 py-3">
                  <p className="text-sm text-[var(--text-secondary)]">Energy Grade</p>
                  <p className={`text-base font-semibold ${theme.badge}`}>{result.grade} · {result.verdict}</p>
                </div>
              </article>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Summary"
        title="Overspend Summary"
        description="One strong number to show the replacement opportunity across your home today."
      >
        <p className="mb-4 rounded-2xl border border-[var(--accent)]/30 bg-[color-mix(in_srgb,var(--accent)_14%,var(--bg-surface))] px-4 py-3 text-sm text-[var(--text-primary)]">
          If you replaced all D and F grade appliances, you would save {formatCurrency(urgentReplacementSavings)}/month.
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          <MetricCard label="Total monthly overspend" value={formatCurrency(totalMonthlyOverspend)} tone="warning" />
          <MetricCard label="Total yearly overspend" value={formatCompactCurrency(totalYearlyOverspend)} tone="warning" />
          <MetricCard
            label="D/F replacement upside"
            value={formatCurrency(urgentReplacementSavings)}
            hint="If all D and F appliances are replaced"
            tone="positive"
          />
        </div>
      </SectionCard>
    </div>
  )
}
