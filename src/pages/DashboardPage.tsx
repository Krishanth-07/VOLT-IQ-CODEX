import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { MetricCard } from '../components/common/MetricCard'
import { SectionCard } from '../components/common/SectionCard'
import { useEnergy } from '../context/EnergyContext'
import { formatCompactCurrency, formatCurrency } from '../utils/format'
import { calculateEnergyAgeResult } from '../utils/energyAge'
import { calculateSolarOutcome } from '../utils/solar'
import { EnergyReportModal } from '../components/dashboard/EnergyReportModal'

type PriorityAction = {
  id: string
  title: string
  detail: string
  monthlyImpact: number
}

function getHomeGrade(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs work'
}

export function DashboardPage() {
  const [reportOpen, setReportOpen] = useState(false)
  const {
    currentScenario,
    tariffProfile,
    solarInputs,
    suggestions,
    savingsAmount,
    energyAgeInputs,
    baseBill,
  } = useEnergy()

  const currentYear = new Date().getFullYear()
  const tariffRate = currentScenario.slabStatus.slab.rate
  const solarOutcome = useMemo(() => calculateSolarOutcome(solarInputs), [solarInputs])

  const applianceHealthResults = useMemo(() => {
    return energyAgeInputs.map((input) => calculateEnergyAgeResult(input, tariffRate, currentYear))
  }, [currentYear, energyAgeInputs, tariffRate])

  const avgApplianceGrade = applianceHealthResults.length
    ? applianceHealthResults.reduce((sum, item) => sum + item.energyAgeScore, 0) / applianceHealthResults.length
    : 50

  const solarViabilityScore = solarOutcome.verdict === 'GO SOLAR' ? 100 : 50
  const recommendationsTaken = suggestions.filter((item) => item.enabled).length
  const notTakenPercent = suggestions.length > 0 ? ((suggestions.length - recommendationsTaken) / suggestions.length) * 100 : 100
  const optimisationScore = 100 - notTakenPercent

  const topSlabStart = tariffProfile.slabs[tariffProfile.slabs.length - 1]?.minUnits ?? Math.max(currentScenario.totalUnits, 1)
  const billEfficiencyScore = Math.max(0, Math.min(100, (1 - currentScenario.totalUnits / Math.max(topSlabStart, 1)) * 100))

  const energyHealthScore = Math.round(
    avgApplianceGrade * 0.3 + solarViabilityScore * 0.25 + optimisationScore * 0.25 + billEfficiencyScore * 0.2,
  )
  const energyHealthGrade = getHomeGrade(energyHealthScore)

  const urgentAppliances = applianceHealthResults.filter((item) => item.grade === 'D' || item.grade === 'F')
  const aiSavingPotential = suggestions.reduce((max, item) => Math.max(max, item.savings), 0)

  const reportAppliancePills = useMemo(() => {
    return applianceHealthResults.slice(0, 4).map((item) => ({
      label: item.input.name,
      grade: item.grade,
    }))
  }, [applianceHealthResults])
  const reportScore = energyHealthScore
  const reportGradeLabel: 'Good' | 'Fair' | 'Needs Attention' =
    reportScore > 70 ? 'Good' : reportScore >= 40 ? 'Fair' : 'Needs Attention'

  const topActions = useMemo(() => {
    const actions: PriorityAction[] = []

    if (solarOutcome.monthlySavings > 0) {
      actions.push({
        id: 'solar',
        title: `Go solar (${solarOutcome.systemSizeKw.toFixed(1)} kW)` ,
        detail: `${solarOutcome.paybackYears.toFixed(1)} year payback in ${solarInputs.city}`,
        monthlyImpact: solarOutcome.monthlySavings,
      })
    }

    actions.push(
      ...applianceHealthResults
        .filter((item) => item.monthlySaving > 0)
        .sort((left, right) => right.monthlySaving - left.monthlySaving)
        .slice(0, 2)
        .map((item, index) => ({
          id: `age-${index}`,
          title: `Replace ${item.input.name}`,
          detail: `${item.grade} grade appliance with ${item.age} years of use`,
          monthlyImpact: item.monthlySaving,
        })),
    )

    actions.push(
      ...suggestions
        .filter((item) => !item.enabled)
        .sort((left, right) => right.savings - left.savings)
        .slice(0, 2)
        .map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.detail,
          monthlyImpact: item.savings,
        })),
    )

    if (actions.length < 3) {
      actions.push({
        id: 'what-if',
        title: 'Run a What-If scenario',
        detail: 'Ask how one appliance or runtime change affects your monthly bill',
        monthlyImpact: Math.round(savingsAmount * 0.1),
      })
    }

    return actions
      .sort((left, right) => right.monthlyImpact - left.monthlyImpact)
      .slice(0, 3)
  }, [applianceHealthResults, savingsAmount, solarInputs.city, solarOutcome.monthlySavings, solarOutcome.paybackYears, solarOutcome.systemSizeKw, suggestions])

  const reportTopRecommendation =
    topActions[0] && topActions[0].monthlyImpact > 0
      ? `${topActions[0].title} -> save Rs.${Math.round(topActions[0].monthlyImpact)}/month`
      : 'Generate suggestions in AI Advisor to unlock your top saving action'

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setReportOpen(true)}
        className="w-full rounded-xl bg-[#00C46A] px-5 py-4 text-center text-base font-bold text-[#04120A]"
      >
        Generate My Energy Report
      </button>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="glass-panel p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--accent)]">Energy Intelligence Dashboard</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            One home view for your complete energy story.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Judges can understand your current performance in 10 seconds, then jump into each module for details.
          </p>
          <div className="panel-surface mt-6 px-4 py-4 text-sm leading-6 text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">Pitch anchor:</span> VoltIQ gives every home an Energy Health Score from 0 to 100 with clear next actions.
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="Energy Health Score"
            value={`${energyHealthScore}/100`}
            hint={`${energyHealthGrade} • Composite of appliance health, solar, optimization, and slab efficiency`}
            tone={energyHealthScore >= 60 ? 'positive' : 'warning'}
          />
          <MetricCard
            label="Top monthly opportunity"
            value={formatCurrency(topActions[0]?.monthlyImpact ?? 0)}
            hint={topActions[0]?.title ?? 'Add data in modules to unlock opportunities'}
            tone="positive"
          />
        </div>
      </section>

      <SectionCard
        eyebrow="Module Summary"
        title="4 Modules, One Snapshot"
        description="Each card shows the key output and links to detailed screens."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="panel-surface rounded-xl p-5">
            <p className="label-muted">Energy Age</p>
            <p className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">
              {urgentAppliances.length} appliances need attention {urgentAppliances.length > 0 ? `- Grade ${urgentAppliances[0].grade}` : ''}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Based on appliance age and efficiency proxies from your current home usage profile.</p>
            <Link to="/energy-age" className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] hover:underline">
              View Details
            </Link>
          </article>

          <article className="panel-surface rounded-xl p-5">
            <p className="label-muted">AI Advisor</p>
            <p className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">
              {formatCurrency(aiSavingPotential)} saving potential identified
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {suggestions.length > 0
                ? `${suggestions.length} recommendation${suggestions.length > 1 ? 's' : ''} available, ${recommendationsTaken} already selected.`
                : 'Generate suggestions to replace this estimate with personalized actions.'}
            </p>
            <Link to="/advisor" className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] hover:underline">
              View Details
            </Link>
          </article>

          <article className="panel-surface rounded-xl p-5">
            <p className="label-muted">Solar Advisor</p>
            <p className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">
              {solarOutcome.verdict === 'GO SOLAR' ? 'GO SOLAR' : 'NOT YET'} - {solarOutcome.paybackYears.toFixed(1)} year payback
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Est. monthly saving {formatCurrency(solarOutcome.monthlySavings)} at {solarOutcome.systemSizeKw.toFixed(1)} kW for {solarInputs.city}.
            </p>
            <Link to="/solar" className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] hover:underline">
              View Details
            </Link>
          </article>

          <article className="panel-surface rounded-xl p-5">
            <p className="label-muted">What-If Assistant</p>
            <p className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">
              Ask anything about your bill and usage decisions
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Run scenario questions with your current bill, slab, and appliance context preloaded.</p>
            <Link to="/what-if" className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] hover:underline">
              View Details
            </Link>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Prioritized"
        title="Top 3 Priority Actions"
        description="Highest-impact actions ranked by monthly rupee impact across all modules."
      >
        <div className="space-y-3">
          {topActions.map((action, index) => (
            <article key={action.id} className="panel-elevated flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {index + 1}. {action.title}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{action.detail}</p>
              </div>
              <p className="num-mono text-lg font-semibold text-[var(--accent)]">{formatCurrency(action.monthlyImpact)}/month</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Appliance grade score" value={`${Math.round(avgApplianceGrade)}`} hint="Weighted from appliance efficiency and age" />
        <MetricCard label="Solar viability score" value={`${solarViabilityScore}`} hint={solarOutcome.verdict} tone={solarOutcome.verdict === 'GO SOLAR' ? 'positive' : 'warning'} />
        <MetricCard
          label="Optimization score"
          value={`${Math.round(optimisationScore)}`}
          hint={suggestions.length > 0 ? `${Math.round(notTakenPercent)}% recommendations still pending` : 'Generate AI suggestions to track completion'}
        />
        <MetricCard
          label="Bill efficiency score"
          value={`${Math.round(billEfficiencyScore)}`}
          hint={`${Math.round(currentScenario.totalUnits)} units vs top slab trigger at ${topSlabStart} units`}
        />
      </section>

      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
        Composite formula: 0.30 x appliance grade + 0.25 x solar viability + 0.25 x optimization completion + 0.20 x bill efficiency.
        Current weighted outcome: <span className="font-semibold text-[var(--text-primary)]">{energyHealthScore}/100 ({energyHealthGrade})</span>.
        Potential monthly upside in identified actions: <span className="font-semibold text-[var(--accent)]">{formatCompactCurrency(topActions.reduce((sum, item) => sum + item.monthlyImpact, 0))}</span>.
      </div>

      <EnergyReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        score={reportScore}
        gradeLabel={reportGradeLabel}
        monthlyBill={baseBill}
        savingPotential={aiSavingPotential}
        solarVerdict={solarOutcome.verdict === 'GO SOLAR' ? 'GO SOLAR' : 'NOT YET'}
        appliances={reportAppliancePills}
        topRecommendation={reportTopRecommendation}
      />
    </div>
  )
}
