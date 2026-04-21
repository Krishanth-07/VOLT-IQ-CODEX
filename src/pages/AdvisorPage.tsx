import { useEnergy } from '../context/EnergyContext'
import { formatCurrency, formatUnits } from '../utils/format'
import { formatSlabLabel } from '../utils/tariff'
import { BillBreakdownChart } from '../components/dashboard/BillBreakdownChart'
import { BillInputPanel } from '../components/dashboard/BillInputPanel'
import { SimulationPanel } from '../components/dashboard/SimulationPanel'
import { SuggestionsPanel } from '../components/dashboard/SuggestionsPanel'
import { MetricCard } from '../components/common/MetricCard'

export function AdvisorPage() {
  const { savingsAmount, currentScenario, tariffProfile } = useEnergy()

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="glass-panel p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--accent)]">AI Advisor</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Understand your electricity bill in 3 simple steps.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Step 1: Add your bill and home details. Step 2: Review what uses most electricity. Step 3: Apply suggestions and check savings.
          </p>
          <div className="panel-surface mt-6 px-4 py-4 text-sm leading-6 text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">Tip:</span> You do not need exact values. Even rough appliance hours will still give useful results.
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="Current tariff band"
            value={formatSlabLabel(currentScenario.slabStatus.slab)}
            hint={tariffProfile.provider}
            tone="warning"
          />
          <MetricCard
            label="Estimated monthly savings"
            value={formatCurrency(savingsAmount)}
            hint={`${formatUnits(currentScenario.totalUnits)} after your current changes`}
            tone="positive"
          />
        </div>
      </section>

      <BillInputPanel />
      <BillBreakdownChart />
      <SimulationPanel />
      <SuggestionsPanel />
    </div>
  )
}
