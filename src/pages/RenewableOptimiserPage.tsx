import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { SectionCard } from '../components/common/SectionCard'
import { MetricCard } from '../components/common/MetricCard'
import { useEnergy } from '../context/EnergyContext'
import { calculateSolarOutcome } from '../utils/solar'
import { formatCurrency } from '../utils/format'
import '../lib/chartSetup'

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SEASONAL_FACTORS = [0.88, 0.95, 1.02, 1.08, 1.12, 0.98, 0.87, 0.86, 0.9, 0.96, 1, 0.92]

const CITY_IRRADIANCE: Record<string, number> = {
  Chennai: 1,
  Bengaluru: 0.96,
  Hyderabad: 1.02,
  Coimbatore: 0.98,
  Mumbai: 0.94,
  Delhi: 0.92,
  Madurai: 1.01,
  Tiruchirappalli: 1,
  Salem: 0.97,
}

const STATE_PEAK_WINDOW: Record<string, number[]> = {
  'Tamil Nadu': [18, 19, 20],
  Karnataka: [18, 19, 20, 21],
  Maharashtra: [18, 19, 20, 21],
  Delhi: [17, 18, 19, 20],
  Telangana: [18, 19, 20, 21],
}

type ApplianceClass = 'fixed' | 'flexible' | 'shiftable'

function hourLabel(hour: number) {
  const normalized = ((hour % 24) + 24) % 24
  const suffix = normalized >= 12 ? 'PM' : 'AM'
  const clock = normalized % 12 === 0 ? 12 : normalized % 12
  return `${clock}:00 ${suffix}`
}

function formatHourRange(start: number, end: number) {
  return `${hourLabel(start)}-${hourLabel(end)}`
}

function createSolarCurve(irradiance: number, capacityKw: number) {
  const base = [
    0, 0, 0, 0, 0, 0,
    0.06, 0.16, 0.34, 0.55, 0.73, 0.86,
    0.94, 0.9, 0.78, 0.58, 0.36, 0.18,
    0.05, 0, 0, 0, 0, 0,
  ]

  return base.map((value) => value * capacityKw * irradiance)
}

function getClassification(catalogId: string): ApplianceClass {
  const classes: Record<string, ApplianceClass> = {
    ac: 'shiftable',
    geyser: 'flexible',
    refrigerator: 'fixed',
    lights_fans: 'fixed',
    washing_machine: 'flexible',
    water_pump: 'flexible',
    induction: 'flexible',
    microwave: 'flexible',
    ev_charger: 'shiftable',
    computer: 'flexible',
    television: 'flexible',
  }

  return classes[catalogId] ?? 'flexible'
}

function getOriginalWindow(catalogId: string) {
  const windows: Record<string, number[]> = {
    ac: [18, 19, 20, 21, 22, 23],
    geyser: [6, 7],
    refrigerator: HOURS,
    lights_fans: [18, 19, 20, 21, 22, 23],
    washing_machine: [19, 20, 21],
    water_pump: [6, 7, 20],
    induction: [7, 8, 13, 20, 21],
    microwave: [8, 13, 20],
    ev_charger: [19, 20, 21, 22],
    computer: [10, 11, 12, 13, 14, 15, 19, 20],
    television: [20, 21, 22],
  }

  return windows[catalogId] ?? HOURS
}

function getOptimizedWindow(catalogId: string, applianceClass: ApplianceClass) {
  const windows: Record<string, number[]> = {
    ac: [16, 17, 21, 22, 23, 0, 1],
    geyser: [5, 6],
    refrigerator: HOURS,
    lights_fans: [18, 19, 20, 21, 22, 23],
    washing_machine: [23, 0, 1],
    water_pump: [5, 6, 22],
    induction: [6, 7, 13, 21],
    microwave: [7, 13, 21],
    ev_charger: [0, 1, 2, 3, 4, 5],
    computer: [10, 11, 12, 13, 14, 15, 16, 21],
    television: [21, 22, 23],
  }

  if (applianceClass === 'fixed') return getOriginalWindow(catalogId)
  return windows[catalogId] ?? [10, 11, 12, 13, 14, 15, 22, 23]
}

function mergeUniqueHours(...collections: number[][]) {
  return [...new Set(collections.flat())]
}

function peakAvoidingWindow(baseWindow: number[], peakWindow: number[]) {
  const filtered = baseWindow.filter((hour) => !peakWindow.includes(hour))
  return filtered.length ? filtered : baseWindow
}

function distributeLoad(curve: number[], candidateHours: number[], hours: number, unitsPerHour: number) {
  if (!Number.isFinite(hours) || hours <= 0 || unitsPerHour <= 0) return [] as number[]

  const allocated: number[] = []
  const scheduleHours = candidateHours.length ? candidateHours : HOURS
  let remaining = hours
  let index = 0

  while (remaining > 0.01) {
    const hour = scheduleHours[index % scheduleHours.length]
    const chunk = Math.min(1, remaining)
    curve[hour] += chunk * unitsPerHour
    allocated.push(hour)
    remaining -= chunk
    index += 1
  }

  return allocated
}

function summarizeAllocatedWindow(allocatedHours: number[]) {
  if (!allocatedHours.length) return 'No active runtime'

  const sortedUnique = [...new Set(allocatedHours)].sort((left, right) => left - right)
  if (sortedUnique.length === 1) {
    return formatHourRange(sortedUnique[0], (sortedUnique[0] + 1) % 24)
  }

  const start = sortedUnique[0]
  const end = (sortedUnique[sortedUnique.length - 1] + 1) % 24
  return formatHourRange(start, end)
}

export function RenewableOptimiserPage() {
  const { input, currentEntries, unitsPerHour, currentScenario } = useEnergy()
  const solarOutcome = calculateSolarOutcome({
    monthlyBill: currentScenario.bill,
    roofSize: Math.max(currentEntries.length * 60, 200),
    city: input.city,
    state: input.state,
    ownership: 'own',
  })

  const optimisation = useMemo(() => {
    const irradiance = CITY_IRRADIANCE[input.city] ?? 0.96
    const solarCapacityKw = Math.max(solarOutcome.systemSizeKw, 1)
    const peakWindow = STATE_PEAK_WINDOW[input.state] ?? [18, 19, 20]
    const solarRichWindow = [10, 11, 12, 13, 14, 15]
    const lateNightWindow = [22, 23, 0, 1, 2, 3, 4, 5]

    const solarCurve = createSolarCurve(irradiance, solarCapacityKw)
    const currentCurve = new Array<number>(24).fill(0)
    const optimizedCurve = new Array<number>(24).fill(0)

    const scheduleRows = currentEntries
      .filter((entry) => entry.quantity > 0 && entry.hours > 0)
      .map((entry) => {
        const monthlyUnitsPerHour = unitsPerHour[entry.id] ?? ((entry.wattage * entry.quantity) / 1000) * 30
        const hourlyUnits = monthlyUnitsPerHour / 30
        const applianceClass = getClassification(entry.catalogId)
        const strictOptimizedWindow = (() => {
          const baseOptimized = getOptimizedWindow(entry.catalogId, applianceClass)

          if (entry.catalogId === 'ac') {
            return mergeUniqueHours([16, 17], [21, 22, 23, 0, 1])
          }

          if (entry.catalogId === 'ev_charger') {
            return lateNightWindow
          }

          if (entry.catalogId === 'washing_machine' || entry.catalogId === 'water_pump') {
            return mergeUniqueHours(lateNightWindow, [5, 6])
          }

          if (applianceClass === 'shiftable') {
            return peakAvoidingWindow(mergeUniqueHours(baseOptimized, lateNightWindow), peakWindow)
          }

          if (applianceClass === 'flexible') {
            return peakAvoidingWindow(mergeUniqueHours(baseOptimized, solarRichWindow, [21, 22, 23]), peakWindow)
          }

          return baseOptimized
        })()

        const originalAllocated = distributeLoad(currentCurve, getOriginalWindow(entry.catalogId), entry.hours, hourlyUnits)
        const optimizedAllocated = distributeLoad(
          optimizedCurve,
          strictOptimizedWindow,
          entry.hours,
          hourlyUnits,
        )

        const originalText = summarizeAllocatedWindow(originalAllocated)
        const optimizedText = applianceClass === 'fixed'
          ? `${originalText} (cannot shift)`
          : summarizeAllocatedWindow(optimizedAllocated)

        const originalPeakShare = originalAllocated.filter((hour) => peakWindow.includes(hour)).length / Math.max(originalAllocated.length, 1)
        const optimizedPeakShare = optimizedAllocated.filter((hour) => peakWindow.includes(hour)).length / Math.max(optimizedAllocated.length, 1)
        const shiftedPeakUnits = Math.max(originalPeakShare - optimizedPeakShare, 0) * entry.hours * hourlyUnits
        const savings = shiftedPeakUnits * currentScenario.slabStatus.slab.rate * 30

        return {
          id: entry.id,
          applianceName: entry.name,
          originalText,
          optimizedText,
          solarUse: Math.max(entry.hours * hourlyUnits * (applianceClass === 'fixed' ? 0.2 : 0.45), 0),
          saving: savings,
          applianceClass,
        }
      })

    function calculateGridDependency(consumptionCurve: number[], generationCurve: number[]) {
      const consumed = consumptionCurve.reduce((sum, value) => sum + value, 0)
      const imported = consumptionCurve.reduce((sum, value, hour) => sum + Math.max(value - generationCurve[hour], 0), 0)
      const dependency = consumed > 0 ? (imported / consumed) * 100 : 0
      return {
        consumed,
        imported,
        solarUsed: Math.max(consumed - imported, 0),
        dependency,
      }
    }

    const before = calculateGridDependency(currentCurve, solarCurve)
    const after = calculateGridDependency(optimizedCurve, solarCurve)

    const monthlySaving = Math.max((before.imported - after.imported) * 30 * currentScenario.slabStatus.slab.rate, 0)
    const solarCoverageBefore = before.consumed > 0 ? (before.solarUsed / before.consumed) * 100 : 0
    const solarCoverageAfter = after.consumed > 0 ? (after.solarUsed / after.consumed) * 100 : 0

    const seasonalRows = MONTH_NAMES.map((month, index) => {
      const factor = SEASONAL_FACTORS[index]
      const seasonalSolar = solarCurve.reduce((sum, value) => sum + value, 0) * factor
      const seasonalConsumption = optimizedCurve.reduce((sum, value) => sum + value, 0)
      const solarShare = seasonalConsumption > 0 ? Math.min((seasonalSolar / seasonalConsumption) * 100, 100) : 0

      return {
        month,
        factor,
        solarShare,
      }
    })

    return {
      solarCurve,
      currentCurve,
      optimizedCurve,
      peakWindow,
      before,
      after,
      solarCoverageBefore,
      solarCoverageAfter,
      monthlySaving,
      scheduleRows,
      seasonalRows,
    }
  }, [currentEntries, currentScenario.slabStatus.slab.rate, input.city, input.state, solarOutcome.systemSizeKw, unitsPerHour])

  const peakWindowText = useMemo(() => {
    const hours = optimisation.peakWindow
    if (!hours.length) return '6:00 PM-9:00 PM'

    const start = Math.min(...hours)
    const end = (Math.max(...hours) + 1) % 24
    return formatHourRange(start, end)
  }, [optimisation.peakWindow])

  const chartData = {
    labels: HOURS.map((hour) => `${hour}:00`),
    datasets: [
      {
        label: 'Solar generation',
        data: optimisation.solarCurve,
        borderColor: '#00c16a',
        backgroundColor: 'rgba(0,193,106,0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 1.8,
      },
      {
        label: 'Current consumption',
        data: optimisation.currentCurve,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        tension: 0.32,
        fill: false,
        pointRadius: 1.6,
      },
      {
        label: 'Optimized consumption',
        data: optimisation.optimizedCurve,
        borderColor: '#ff5d5d',
        backgroundColor: 'rgba(255,93,93,0.08)',
        tension: 0.32,
        fill: false,
        pointRadius: 1.6,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="glass-panel p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--accent)]">Renewable Energy Optimiser</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            One dashboard to align appliance timing with rooftop solar.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Uses your current appliances, city, and tariff slab to compare before-vs-after hourly demand and generate a practical shift plan.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="City irradiance"
            value={`${((CITY_IRRADIANCE[input.city] ?? 0.96) * 100).toFixed(0)}%`}
            hint={`${input.city}, ${input.state}`}
            tone="positive"
          />
          <MetricCard
            label="Solar capacity used"
            value={`${Math.max(solarOutcome.systemSizeKw, 1).toFixed(1)} kW`}
            hint="Derived from your existing profile"
            tone="positive"
          />
        </div>
      </section>

      <SectionCard
        eyebrow="Section 1"
        title="Generation vs Consumption"
        description="Green shows estimated hourly solar generation, blue is current load, and red is optimized load."
      >
        <div className="panel-elevated rounded-xl p-4">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: {
                    color: '#c9d6ea',
                  },
                },
              },
              scales: {
                x: {
                  ticks: { color: '#a7b5ca' },
                  grid: { color: 'rgba(122,141,166,0.12)' },
                },
                y: {
                  ticks: { color: '#a7b5ca' },
                  grid: { color: 'rgba(122,141,166,0.12)' },
                  title: {
                    display: true,
                    text: 'kWh/day by hour (relative)',
                    color: '#9fb0c8',
                  },
                },
              },
            }}
            height={280}
          />
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Section 2"
        title="Before vs After Metrics"
        description={`Core outcomes from shifting flexible loads toward solar-rich hours and away from your ${peakWindowText} peak stress window.`}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Grid dependency"
            value={`${optimisation.before.dependency.toFixed(1)}% → ${optimisation.after.dependency.toFixed(1)}%`}
            hint={`Drop of ${(optimisation.before.dependency - optimisation.after.dependency).toFixed(1)} percentage points`}
            tone="positive"
          />
          <MetricCard
            label="Solar coverage"
            value={`${optimisation.solarCoverageBefore.toFixed(1)}% → ${optimisation.solarCoverageAfter.toFixed(1)}%`}
            hint="Higher direct solar utilization"
            tone="positive"
          />
          <MetricCard
            label="Monthly savings"
            value={formatCurrency(optimisation.monthlySaving)}
            hint={`At current slab rate ₹${currentScenario.slabStatus.slab.rate.toFixed(2)}/unit`}
            tone="positive"
          />
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Section 3"
        title="Optimised Appliance Timetable"
        description={`Literal schedule showing what to run when. Policy rule: strongly avoid ${peakWindowText} for shiftable/flexible loads.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                <th className="px-3 py-2">Appliance</th>
                <th className="px-3 py-2">Original time</th>
                <th className="px-3 py-2">Optimized time</th>
                <th className="px-3 py-2">Solar use (daily units)</th>
                <th className="px-3 py-2">Savings / month</th>
              </tr>
            </thead>
            <tbody>
              {optimisation.scheduleRows.map((row) => (
                <tr key={row.id} className="panel-surface text-sm text-[var(--text-secondary)]">
                  <td className="rounded-l-lg px-3 py-3 font-medium text-[var(--text-primary)]">{row.applianceName}</td>
                  <td className="px-3 py-3">{row.originalText}</td>
                  <td className="px-3 py-3">
                    {row.optimizedText}
                    {row.applianceClass === 'fixed' ? (
                      <span className="ml-2 rounded-full bg-[color-mix(in_srgb,var(--bg-elevated)_85%,white_6%)] px-2 py-1 text-xs text-[var(--text-muted)]">
                        fixed
                      </span>
                    ) : null}
                  </td>
                  <td className="num-mono px-3 py-3">{row.solarUse.toFixed(2)}</td>
                  <td className="num-mono rounded-r-lg px-3 py-3 text-[var(--accent)]">{formatCurrency(row.saving)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Section 4"
        title="Seasonal Solar Calendar"
        description="Simple month-wise seasonal multipliers to keep expected solar contribution realistic through the year."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {optimisation.seasonalRows.map((row) => (
            <div key={row.month} className="panel-surface rounded-xl p-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">{row.month}</p>
              <p className="num-mono mt-2 text-sm text-[var(--text-secondary)]">Sun factor: {row.factor.toFixed(2)}</p>
              <p className="num-mono mt-1 text-sm text-[var(--accent)]">Solar share: {row.solarShare.toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
