import { TARIFF_PROFILES } from '../data/demo'
import type { ApplianceBreakdown, SimulationScenario, TariffProfile, TariffSlab, TariffStatus } from '../types'

const TN_UPTO_500_SLABS: TariffSlab[] = [
  { index: 0, bandLabel: '0-100', rate: 0, minUnits: 0, maxUnits: 100 },
  { index: 1, bandLabel: '101-200', rate: 2.25, minUnits: 100, maxUnits: 200 },
  { index: 2, bandLabel: '201-400', rate: 4.5, minUnits: 200, maxUnits: 400 },
  { index: 3, bandLabel: '401-500', rate: 6, minUnits: 400, maxUnits: 500 },
]

const TN_ABOVE_500_SLABS: TariffSlab[] = [
  { index: 0, bandLabel: '0-100', rate: 0, minUnits: 0, maxUnits: 100 },
  { index: 1, bandLabel: '101-400', rate: 4.5, minUnits: 100, maxUnits: 400 },
  { index: 2, bandLabel: '401-500', rate: 6, minUnits: 400, maxUnits: 500 },
  { index: 3, bandLabel: '501-600', rate: 8, minUnits: 500, maxUnits: 600 },
  { index: 4, bandLabel: '601-800', rate: 9, minUnits: 600, maxUnits: 800 },
  { index: 5, bandLabel: '801-1000', rate: 10, minUnits: 800, maxUnits: 1000 },
  { index: 6, bandLabel: '1001+', rate: 11, minUnits: 1000, maxUnits: null },
]

export function getTariffProfile(state: string) {
  return TARIFF_PROFILES.find((profile) => profile.state === state) ?? TARIFF_PROFILES[0]
}

export function formatSlabRate(rate: number) {
  return `₹${rate.toFixed(rate % 1 === 0 ? 0 : 2)}`
}

export function formatSlabLabel(slab: TariffSlab) {
  return `${formatSlabRate(slab.rate)} slab`
}

export function getEffectiveTariffSlabs(units: number, profile: TariffProfile): TariffSlab[] {
  if (profile.id !== 'tn') return profile.slabs
  return units > 500 ? TN_ABOVE_500_SLABS : TN_UPTO_500_SLABS
}

export function calculateBillFromUnits(units: number, profile: TariffProfile) {
  if (units <= 0) return 0

  let bill = 0
  const slabs = getEffectiveTariffSlabs(units, profile)

  for (const slab of slabs) {
    const upper = slab.maxUnits ?? units
    const unitsInSlab = Math.max(Math.min(units, upper) - slab.minUnits, 0)
    bill += unitsInSlab * slab.rate
  }

  return Number(bill.toFixed(2))
}

export function estimateUnitsFromBill(monthlyBill: number, profile: TariffProfile) {
  if (monthlyBill <= 0) return 0

  let low = 0
  let high = 2500

  for (let step = 0; step < 50; step += 1) {
    const mid = (low + high) / 2
    const estimatedBill = calculateBillFromUnits(mid, profile)

    if (estimatedBill < monthlyBill) low = mid
    else high = mid
  }

  return Number(high.toFixed(2))
}

export function getTariffStatus(units: number, profile: TariffProfile): TariffStatus {
  const slabs = getEffectiveTariffSlabs(units, profile)
  const slab =
    slabs.find((item) => {
      const upper = item.maxUnits ?? Number.POSITIVE_INFINITY
      return units > item.minUnits && units <= upper
    }) ??
    slabs.find((item) => units <= (item.maxUnits ?? Number.POSITIVE_INFINITY)) ??
    slabs[slabs.length - 1]

  const unitsIntoSlab = Math.max(units - slab.minUnits, 0)
  const slabWidth =
    slab.maxUnits === null ? Math.max(unitsIntoSlab, 1) : Math.max(slab.maxUnits - slab.minUnits, 1)
  const progressPercent = Math.min((unitsIntoSlab / slabWidth) * 100, 100)
  const nextThreshold = slab.maxUnits

  return {
    profile,
    slab,
    units,
    unitsIntoSlab,
    progressPercent,
    nextThreshold,
    remainingToNextSlab: nextThreshold === null ? null : Math.max(nextThreshold - units, 0),
  }
}

export function buildSimulationScenario(
  applianceBreakdown: ApplianceBreakdown[],
  profile: TariffProfile,
): SimulationScenario {
  const totalUnits = applianceBreakdown.reduce((sum, item) => sum + item.units, 0)
  const bill = calculateBillFromUnits(totalUnits, profile)
  const breakdownWithCosts = applianceBreakdown.map((item) => ({
    ...item,
    cost: totalUnits > 0 ? Number(((bill * item.units) / totalUnits).toFixed(2)) : 0,
  }))

  return {
    applianceBreakdown: breakdownWithCosts,
    totalUnits,
    bill,
    slabStatus: getTariffStatus(totalUnits, profile),
  }
}
