import type { ApplianceBreakdown, ApplianceEntry, SimulationScenario, TariffProfile } from '../types'
import { getCatalogItem } from '../data/demo'
import { clamp } from './format'
import { buildSimulationScenario, estimateUnitsFromBill } from './tariff'

export function rawUnitsForEntry(entry: ApplianceEntry) {
  return (entry.wattage * entry.quantity * entry.hours * 30) / 1000
}

export function getUnitsPerHourByAppliance(entries: ApplianceEntry[], calibrationFactor: number) {
  return entries.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.id] = (entry.wattage * entry.quantity * 30 * calibrationFactor) / 1000
    return accumulator
  }, {})
}

export function createCalibrationFactor(
  monthlyBill: number,
  tariffProfile: TariffProfile,
  baselineEntries: ApplianceEntry[],
) {
  const targetUnits = estimateUnitsFromBill(monthlyBill, tariffProfile)
  const rawUnits = baselineEntries.reduce((sum, entry) => sum + rawUnitsForEntry(entry), 0)

  return rawUnits > 0 ? targetUnits / rawUnits : 0
}

export function createScenarioFromEntries(
  entries: ApplianceEntry[],
  calibrationFactor: number,
  tariffProfile: TariffProfile,
) {
  const scaledBreakdown = entries.map<ApplianceBreakdown>((entry) => ({
    id: entry.id,
    name: entry.name,
    wattage: entry.wattage,
    quantity: entry.quantity,
    hours: entry.hours,
    units: rawUnitsForEntry(entry) * calibrationFactor,
    cost: 0,
  }))

  return buildSimulationScenario(scaledBreakdown, tariffProfile)
}

export function getSavingsAmount(baseBill: number, scenario: SimulationScenario) {
  return Math.max(baseBill - scenario.bill, 0)
}

export function getSavedUnits(baseUnits: number, scenario: SimulationScenario) {
  return Math.max(baseUnits - scenario.totalUnits, 0)
}

export function optimizeEntriesToNextSlab(
  currentEntries: ApplianceEntry[],
  calibrationFactor: number,
  tariffProfile: TariffProfile,
) {
  const currentScenario = createScenarioFromEntries(currentEntries, calibrationFactor, tariffProfile)
  const totalUnits = currentScenario.totalUnits

  let targetUnits = totalUnits
  if (totalUnits > 800) targetUnits = 800
  else if (totalUnits > 500) targetUnits = 500
  else if (totalUnits > 400) targetUnits = 400
  else if (totalUnits > 300) targetUnits = 300
  else if (totalUnits > 200) targetUnits = 200
  else if (totalUnits > 100) targetUnits = 100

  const unitsToCut = Math.max(totalUnits - targetUnits, 0)
  if (!unitsToCut) {
    return {
      entries: currentEntries,
      scenario: currentScenario,
    }
  }

  let remainingCut = unitsToCut
  const sortedEntries = [...currentEntries].sort(
    (left, right) => rawUnitsForEntry(right) - rawUnitsForEntry(left),
  )
  const nextEntries = currentEntries.map((entry) => ({ ...entry }))

  for (const sortedEntry of sortedEntries) {
    const entry = nextEntries.find((item) => item.id === sortedEntry.id)
    if (!entry) continue
    const catalogItem = getCatalogItem(entry.catalogId)

    const unitsPerHour = (entry.wattage * entry.quantity * 30 * calibrationFactor) / 1000
    const reducibleHours = Math.max(entry.hours - catalogItem.minHours, 0)
    const reducibleUnits = reducibleHours * unitsPerHour
    const appliedReduction = Math.min(reducibleUnits, remainingCut)
    const hoursReduction = unitsPerHour > 0 ? appliedReduction / unitsPerHour : 0

    entry.hours = clamp(entry.hours - hoursReduction, catalogItem.minHours, catalogItem.maxHours)
    remainingCut -= appliedReduction

    if (remainingCut <= 0) break
  }

  return {
    entries: nextEntries,
    scenario: createScenarioFromEntries(nextEntries, calibrationFactor, tariffProfile),
  }
}
