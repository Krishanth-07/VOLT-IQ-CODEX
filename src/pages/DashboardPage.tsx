import { useEnergy } from '../context/EnergyContext'
import { formatCurrency, formatUnits } from '../utils/format'
import { formatSlabLabel } from '../utils/tariff'
import { BillBreakdownChart } from '../components/dashboard/BillBreakdownChart'
import { BillInputPanel } from '../components/dashboard/BillInputPanel'
import { ComparisonPanel } from '../components/dashboard/ComparisonPanel'
import { SimulationPanel } from '../components/dashboard/SimulationPanel'
import { SuggestionsPanel } from '../components/dashboard/SuggestionsPanel'
import { TariffSlabCard } from '../components/dashboard/TariffSlabCard'
import { MetricCard } from '../components/common/MetricCard'

export function DashboardPage() {
  const { savingsAmount, currentScenario, tariffProfile } = useEnergy()

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="glass-panel p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--accent)]">Dashboard</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            A household bill audit in seconds, not a consulting project.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            VoltIQ reverse-engineers the bill from tariff slabs and appliance runtime, then shows what to change to cut cost fast.
          </p>
          <div className="panel-surface mt-6 px-4 py-4 text-sm leading-6 text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">Pitch line:</span> an energy auditor used to cost money and time.
            VoltIQ gives a practical first answer immediately.
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="Current slab"
            value={formatSlabLabel(currentScenario.slabStatus.slab)}
            hint={tariffProfile.provider}
            tone="warning"
          />
          <MetricCard
            label="Live savings"
            value={formatCurrency(savingsAmount)}
            hint={`${formatUnits(currentScenario.totalUnits)} after optimization`}
            tone="positive"
          />
        </div>
      </section>

      <BillInputPanel />
      <BillBreakdownChart />
      <TariffSlabCard />
      <SimulationPanel />
      <SuggestionsPanel />
      <ComparisonPanel />
    </div>
  )
}
