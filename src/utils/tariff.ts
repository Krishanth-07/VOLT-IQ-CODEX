import { TARIFF_PROFILES } from '../data/demo'
import type { ApplianceBreakdown, SimulationScenario, TariffProfile, TariffSlab, TariffStatus } from '../types'

export function getTariffProfile(state: string) {
  return TARIFF_PROFILES.find((profile) => profile.state === state) ?? TARIFF_PROFILES[0]
}

export function formatSlabRate(rate: number) {
  return `₹${rate.toFixed(rate % 1 === 0 ? 0 : 2)}`
}

export function formatSlabLabel(slab: TariffSlab) {
  return `${formatSlabRate(slab.rate)} slab`
}

export function calculateBillFromUnits(units: number, profile: TariffProfile) {
  if (units <= 0) return 0

  let bill = 0

  for (const slab of profile.slabs) {
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
  const slab =
    profile.slabs.find((item) => {
      const upper = item.maxUnits ?? Number.POSITIVE_INFINITY
      return units > item.minUnits && units <= upper
    }) ??
    profile.slabs.find((item) => units <= (item.maxUnits ?? Number.POSITIVE_INFINITY)) ??
    profile.slabs[profile.slabs.length - 1]

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
