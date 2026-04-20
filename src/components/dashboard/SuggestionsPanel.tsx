import { useEnergy } from '../../context/EnergyContext'
import { formatCurrency } from '../../utils/format'
import { SectionCard } from '../common/SectionCard'

export function SuggestionsPanel() {
  const { generateSuggestions, suggestions, suggestionsLoading, toggleSuggestion } = useEnergy()

  return (
    <SectionCard
      eyebrow="Section 5"
      title="AI Optimization Advisor"
      description="These recommendations are quantified and toggle directly into the simulation, so the user can see the bill change instead of reading static advice."
      action={
        <button
          onClick={() => void generateSuggestions()}
          className="btn-primary rounded-full px-4 py-2 text-sm"
        >
          {suggestionsLoading ? 'Generating...' : 'Get Smart Suggestions'}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {(suggestions.length ? suggestions : new Array(3).fill(null)).map((suggestion, index) => (
          <div
            key={suggestion?.id ?? index}
            className="panel-surface rounded-xl p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label-muted">
                  {suggestion ? suggestion.effort : 'Ready'}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {suggestion?.title ?? 'Generate ranked actions'}
                </h3>
              </div>
              {suggestion ? (
                <button
                  onClick={() => toggleSuggestion(suggestion.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    suggestion.enabled
                      ? 'bg-[var(--accent)] text-white'
                      : 'btn-secondary text-[var(--text-secondary)]'
                  }`}
                >
                  {suggestion.enabled ? 'Applied' : 'Apply'}
                </button>
              ) : null}
            </div>
            <p className="num-mono mt-4 text-2xl font-semibold text-[var(--accent)]">
              {suggestion ? `${formatCurrency(suggestion.savings)}/month` : '₹ savings first'}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {suggestion
                ? `${suggestion.units.toFixed(1)} units saved, ${suggestion.co2.toFixed(1)} kg CO2 avoided`
                : 'Advice is generated in rupees first, then units, then CO2.'}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {suggestion?.detail ?? 'Each recommendation can be toggled on and off to verify the impact instantly.'}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
