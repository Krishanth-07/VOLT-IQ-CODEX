import { useEnergy } from '../../context/EnergyContext'
import { getCatalogItem } from '../../data/demo'
import { formatCurrency, formatUnits } from '../../utils/format'
import { formatSlabLabel } from '../../utils/tariff'
import { SectionCard } from '../common/SectionCard'

export function SimulationPanel() {
  const {
    manualEntries,
    currentEntries,
    updateManualHour,
    currentBill,
    savingsAmount,
    currentUnits,
    currentScenario,
    dropToNextSlab,
    slabDropMessage,
  } = useEnergy()

  return (
    <SectionCard
      eyebrow="Section 4"
      title="Try Changes and See Savings"
      description="Move the sliders to reduce daily usage and instantly see your updated bill."
      action={
        <button
          type="button"
          onClick={dropToNextSlab}
          className="btn-secondary rounded-full px-4 py-2 text-sm"
        >
          Auto-Reduce to Next Band
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="panel-elevated space-y-3 rounded-xl p-4">
          {manualEntries.map((entry) => {
            const currentEntry = currentEntries.find((item) => item.id === entry.id) ?? entry
            const catalogItem = getCatalogItem(entry.catalogId)
            const quantityDisabled = entry.quantity === 0

            return (
              <div key={entry.id} className="panel-surface rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{entry.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      {entry.wattage}W, {entry.quantity} unit{entry.quantity === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num-mono font-display text-2xl font-semibold text-[var(--text-primary)]">{currentEntry.hours.toFixed(1)} h</p>
                    <p className="num-mono text-xs text-[var(--text-muted)]">baseline {entry.hours.toFixed(1)} h</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Practical range: {catalogItem.minHours.toFixed(1)} to {catalogItem.maxHours.toFixed(1)} h/day
                </p>
                {quantityDisabled ? (
                  <p className="mt-1 text-xs text-[var(--warning)]">Quantity is 0. Increase quantity in inputs to simulate this appliance.</p>
                ) : null}
                <input
                  type="range"
                  min={catalogItem.minHours}
                  max={catalogItem.maxHours}
                  step="0.5"
                  value={entry.hours}
                  disabled={quantityDisabled}
                  onChange={(event) => updateManualHour(entry.id, Number(event.target.value))}
                  className="slider mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          <div className="panel-surface rounded-xl p-5">
            <p className="label-muted">Optimized bill</p>
            <p className="num-mono mt-3 font-display text-5xl font-semibold text-[var(--text-primary)]">{formatCurrency(currentBill)}</p>
            <p className="num-mono mt-2 text-sm text-[var(--text-secondary)]">{formatUnits(currentUnits)} after optimization</p>
          </div>
          <div className="rounded-xl border border-[var(--success)]/30 bg-[color-mix(in_srgb,var(--success)_10%,var(--bg-surface))] p-5">
            <p className="label-muted">Monthly savings</p>
            <p className="num-mono mt-3 font-display text-5xl font-semibold text-[var(--accent)]">
              {formatCurrency(savingsAmount)}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Current slab is {formatSlabLabel(currentScenario.slabStatus.slab)}.
            </p>
          </div>
          {slabDropMessage ? (
            <div className="rounded-xl border border-[var(--warning)]/30 bg-[color-mix(in_srgb,var(--warning)_10%,var(--bg-surface))] p-5">
              <p className="label-muted">Slab drop alert</p>
              <p className="mt-3 text-lg font-medium text-[var(--text-primary)]">{slabDropMessage}</p>
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  )
}
