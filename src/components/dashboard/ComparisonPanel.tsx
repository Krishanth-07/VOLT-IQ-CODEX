import { useEnergy } from '../../context/EnergyContext'
import { formatCurrency, formatUnits } from '../../utils/format'
import { SectionCard } from '../common/SectionCard'

export function ComparisonPanel() {
  const { baseBill, currentBill, savingsAmount, baseUnits, currentUnits } = useEnergy()

  return (
    <SectionCard
      eyebrow="Section 6"
      title="Comparison Mode"
      description="Side-by-side comparison keeps the pitch grounded: original bill on the left, optimized bill on the right, savings in the middle."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="panel-surface rounded-xl p-6">
          <p className="label-muted">Current bill</p>
          <p className="num-mono mt-4 font-display text-5xl font-semibold text-[var(--text-primary)]">{formatCurrency(baseBill)}</p>
          <p className="num-mono mt-3 text-sm text-[var(--text-secondary)]">{formatUnits(baseUnits)}</p>
        </div>

        <div className="flex items-center justify-center rounded-xl border border-[var(--success)]/30 bg-[color-mix(in_srgb,var(--success)_10%,var(--bg-surface))] px-8 py-6 text-center">
          <div>
            <p className="label-muted">Saved</p>
            <p className="num-mono mt-3 font-display text-5xl font-semibold text-[var(--accent)]">
              {formatCurrency(savingsAmount)}
            </p>
          </div>
        </div>

        <div className="panel-surface rounded-xl p-6">
          <p className="label-muted">Optimized bill</p>
          <p className="num-mono mt-4 font-display text-5xl font-semibold text-[var(--text-primary)]">{formatCurrency(currentBill)}</p>
          <p className="num-mono mt-3 text-sm text-[var(--text-secondary)]">{formatUnits(currentUnits)}</p>
        </div>
      </div>
    </SectionCard>
  )
}
