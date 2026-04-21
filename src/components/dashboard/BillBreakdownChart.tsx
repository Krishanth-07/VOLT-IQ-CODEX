import { Bar } from 'react-chartjs-2'
import { useEnergy } from '../../context/EnergyContext'
import '../../lib/chartSetup'
import { formatCurrency, formatUnits } from '../../utils/format'
import { SectionCard } from '../common/SectionCard'

export function BillBreakdownChart() {
  const { baseScenario, currentScenario } = useEnergy()
  const labels = baseScenario.applianceBreakdown.map((item) => item.name)

  return (
    <SectionCard
      eyebrow="Section 2"
      title="Where Your Bill Comes From"
      description="This compares your current setup with the adjusted setup so you can quickly spot high-cost appliances."
    >
      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="panel-elevated rounded-xl p-4">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: 'Before changes',
                  data: baseScenario.applianceBreakdown.map((item) => item.cost),
                  backgroundColor: '#60738c',
                  borderRadius: 10,
                },
                {
                  label: 'After changes',
                  data: currentScenario.applianceBreakdown.map((item) => item.cost),
                  backgroundColor: '#00ff88',
                  borderRadius: 10,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: { color: '#cbd5e1' },
                },
              },
              scales: {
                x: {
                  ticks: { color: '#cbd5e1' },
                  grid: { display: false },
                },
                y: {
                  ticks: {
                    color: '#94a3b8',
                    callback(value) {
                      return `₹${value}`
                    },
                  },
                  grid: { color: 'rgba(148, 163, 184, 0.08)' },
                },
              },
            }}
            height={280}
          />
        </div>

        <div className="space-y-3">
          {baseScenario.applianceBreakdown.map((item) => (
            <div key={item.id} className="panel-surface rounded-xl p-4">
              <p className="label-muted">{item.name}</p>
              <p className="num-mono mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">{formatCurrency(item.cost)}</p>
              <p className="num-mono mt-2 text-sm text-[var(--text-secondary)]">{formatUnits(item.units)} from {item.hours.toFixed(1)} h/day</p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
