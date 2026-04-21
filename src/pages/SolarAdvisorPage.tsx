import { CITY_OPTIONS, CITY_TO_STATE, STATE_OPTIONS } from '../data/demo'
import { useEnergy } from '../context/EnergyContext'
import { calculateSolarOutcome } from '../utils/solar'
import { formatCompactCurrency, formatCurrency, formatUnits } from '../utils/format'
import { MetricCard } from '../components/common/MetricCard'
import { SectionCard } from '../components/common/SectionCard'

export function SolarAdvisorPage() {
  const { solarInputs, setSolarInputs } = useEnergy()
  const outcome = calculateSolarOutcome(solarInputs)
  const verdictLabel = outcome.verdict === 'GO SOLAR' ? 'GO SOLAR' : 'NOT YET'

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass-panel p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--accent)]">Solar Check</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Check if solar is worth it for your home.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Enter your roof and bill details. We estimate system size, savings, payback, and a clear go/no-go result.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="Recommended system"
            value={`${outcome.systemSizeKw.toFixed(1)} kW`}
            hint={`Roof supports up to ${outcome.roofCapacityKw.toFixed(1)} kW`}
            tone="positive"
          />
          <MetricCard
            label="Payback"
            value={`${outcome.paybackYears.toFixed(1)} years`}
              hint={outcome.scheme}
            tone={outcome.verdict === 'GO SOLAR' ? 'positive' : 'warning'}
          />
        </div>
      </section>

      <SectionCard
        eyebrow="Inputs"
        title="Your Home Details"
        description="Fill these basic details to get a realistic solar estimate."
      >
        <div className="grid gap-4 lg:grid-cols-5">
          <label className="panel-surface p-4">
            <span className="label-muted">Monthly bill</span>
            <input
              type="number"
              min="0"
              value={solarInputs.monthlyBill}
              onChange={(event) =>
                setSolarInputs({
                  ...solarInputs,
                  monthlyBill: Number(event.target.value),
                })
              }
              className="input-base num-mono mt-3 w-full"
            />
          </label>

          <label className="panel-surface p-4">
            <span className="label-muted">Roof size</span>
            <input
              type="number"
              min="0"
              value={solarInputs.roofSize}
              onChange={(event) =>
                setSolarInputs({
                  ...solarInputs,
                  roofSize: Number(event.target.value),
                })
              }
              className="input-base num-mono mt-3 w-full"
            />
          </label>

          <label className="panel-surface p-4">
            <span className="label-muted">State</span>
            <select
              value={solarInputs.state}
              onChange={(event) =>
                setSolarInputs({
                  ...solarInputs,
                  state: event.target.value,
                })
              }
              className="input-base mt-5 w-full"
            >
              {STATE_OPTIONS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label className="panel-surface p-4">
            <span className="label-muted">City</span>
            <select
              value={solarInputs.city}
              onChange={(event) =>
                setSolarInputs({
                  ...solarInputs,
                  city: event.target.value,
                  state: CITY_TO_STATE[event.target.value] ?? solarInputs.state,
                })
              }
              className="input-base mt-5 w-full"
            >
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <div className="panel-surface p-4">
            <span className="label-muted">Ownership</span>
            <div className="panel-elevated mt-5 grid grid-cols-2 gap-2 rounded-lg p-1">
              {(['own', 'rent'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    setSolarInputs({
                      ...solarInputs,
                      ownership: mode,
                    })
                  }
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                    solarInputs.ownership === mode
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--bg-elevated)_65%,white_5%)]'
                  }`}
                >
                  {mode === 'own' ? 'Own' : 'Rent'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Output"
        title="Solar Result"
        description="See expected cost, savings, and whether solar is a good choice for you."
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="System size" value={`${outcome.systemSizeKw.toFixed(1)} kW`} />
          <MetricCard
            label="Cost after subsidy"
            value={formatCompactCurrency(outcome.postSubsidyCost)}
            hint={`Subsidy assumed: ${formatCurrency(outcome.subsidy)}`}
            tone="positive"
          />
          <MetricCard
            label="Monthly savings"
            value={formatCurrency(outcome.monthlySavings)}
            hint={`${formatUnits(outcome.monthlyGeneration)} solar generation`}
            tone="positive"
          />
          <MetricCard
            label="Five-year savings"
            value={formatCompactCurrency(outcome.fiveYearSavings)}
            hint={`${outcome.paybackYears.toFixed(1)} year payback`}
            tone={outcome.verdict === 'GO SOLAR' ? 'positive' : 'warning'}
          />
          <div
            className={`rounded-xl border p-5 ${
              outcome.verdict === 'GO SOLAR'
                ? 'border-[var(--success)]/30 bg-[color-mix(in_srgb,var(--success)_10%,var(--bg-surface))]'
                : 'border-[var(--warning)]/30 bg-[color-mix(in_srgb,var(--warning)_10%,var(--bg-surface))]'
            }`}
          >
            <p className="label-muted">Final verdict</p>
            <p className="mt-4 font-display text-4xl font-semibold text-[var(--text-primary)]">
              {verdictLabel}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{outcome.verdictReason}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Scheme Matcher"
        title="Available Subsidies"
        description="Shows subsidy support and policy notes for your selected state."
      >
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-xl border border-[var(--success)]/30 bg-[color-mix(in_srgb,var(--success)_10%,var(--bg-surface))] p-5">
            {outcome.applicableSchemes.length ? (
              <>
                <p className="label-muted">Estimated subsidy eligibility</p>
                <p className="mt-3 text-lg leading-7 text-[var(--text-primary)]">
                  In {solarInputs.state}, you qualify for <span className="font-semibold text-[var(--accent)]">{formatCurrency(outcome.subsidy)}</span> in subsidies.
                  Effective cost: <span className="font-semibold text-[var(--accent)]">{formatCompactCurrency(outcome.postSubsidyCost)}</span>.
                </p>
                <div className="mt-4 space-y-3">
                  {outcome.applicableSchemes.map((scheme) => (
                    <div key={scheme.id} className="panel-elevated rounded-lg p-4">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{scheme.title}</p>
                      <p className="mt-1 text-sm text-[var(--accent)]">{formatCurrency(scheme.subsidyAmount)}</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{scheme.summary}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{scheme.detail}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="label-muted">Eligibility note</p>
                <p className="mt-3 text-lg leading-7 text-[var(--text-primary)]">
                  No direct residential subsidy is applied for rental ownership mode in this model.
                </p>
              </>
            )}
          </div>

          <div className="panel-surface rounded-xl p-5">
            <p className="label-muted">Net metering policy</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{outcome.netMeteringPolicy}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Carbon Offset"
        title="Environmental Impact"
        description="Shows how much carbon your solar system can avoid each year."
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div className="rounded-xl border border-[var(--success)]/30 bg-[color-mix(in_srgb,var(--success)_10%,var(--bg-surface))] p-5">
            <p className="label-muted">Impact summary</p>
            <p className="mt-3 text-lg leading-7 text-[var(--text-primary)]">
              Your {outcome.systemSizeKw.toFixed(1)} kW solar system can avoid{' '}
              <span className="font-semibold text-[var(--accent)]">{outcome.annualCo2OffsetKg.toLocaleString('en-IN')} kg CO2/year</span>
              {' '}equivalent to planting{' '}
              <span className="font-semibold text-[var(--accent)]">{outcome.treesEquivalent.toLocaleString('en-IN')} trees annually</span>.
            </p>
          </div>

          <MetricCard
            label="Annual CO2 avoided"
            value={`${outcome.annualCo2OffsetKg.toLocaleString('en-IN')} kg`}
            hint="Based on projected annual solar generation"
            tone="positive"
          />

          <MetricCard
            label="Tree equivalent"
            value={`${outcome.treesEquivalent.toLocaleString('en-IN')} trees`}
            hint="Using 20 kg CO2 absorption per tree per year"
            tone="positive"
          />
        </div>
      </SectionCard>
    </div>
  )
}
