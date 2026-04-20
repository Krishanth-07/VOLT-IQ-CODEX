import { useEnergy } from '../../context/EnergyContext'
import { formatUnits } from '../../utils/format'
import { formatSlabLabel } from '../../utils/tariff'
import { SectionCard } from '../common/SectionCard'

export function TariffSlabCard() {
  const { currentScenario, tariffProfile } = useEnergy()
  const status = currentScenario.slabStatus

  return (
    <SectionCard
      eyebrow="Section 3"
      title="Tariff Slab Visualizer"
      description={`Using ${tariffProfile.provider}. The current bill is mapped into the exact slab band, including how far you are into the expensive tier.`}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel-surface rounded-xl p-4">
          <p className="label-muted">Current slab</p>
          <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {formatSlabLabel(status.slab)}
          </p>
        </div>
        <div className="panel-surface rounded-xl p-4">
          <p className="label-muted">Units consumed</p>
          <p className="num-mono mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {formatUnits(status.units)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--warning)]/30 bg-[color-mix(in_srgb,var(--warning)_10%,var(--bg-surface))] p-4">
          <p className="label-muted">Status</p>
          <p className="mt-3 text-lg font-medium text-[var(--text-primary)]">
            You are {Math.round(status.unitsIntoSlab)} units into the {formatSlabLabel(status.slab)}.
          </p>
        </div>
      </div>

      <div className="panel-elevated mt-5 rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
          <span>Slab progress</span>
          <span className="num-mono">
            {status.remainingToNextSlab === null
              ? 'Highest slab active'
              : `${Math.round(status.remainingToNextSlab)} units to next threshold`}
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#00ff88,#19c37d)] transition-all duration-500"
            style={{ width: `${Math.max(status.progressPercent, 4)}%` }}
          />
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-4">
          {tariffProfile.slabs.map((slab) => (
            <div key={slab.index} className="panel-surface rounded-2xl px-3 py-3">
              <p className="text-xs text-[var(--text-muted)]">{slab.bandLabel}</p>
              <p className="mt-1 font-medium text-[var(--text-primary)]">{formatSlabLabel(slab)}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
