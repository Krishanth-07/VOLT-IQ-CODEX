import { clamp } from './format'

export type EnergyAgeApplianceType =
  | 'ac_1_5t'
  | 'refrigerator'
  | 'washing_machine'
  | 'water_heater'
  | 'ceiling_fan'
  | 'television'

export type EnergyAgeInput = {
  name: string
  type: EnergyAgeApplianceType
  purchaseYear: number
  starRating: number
  dailyHours: number
}

export type EnergyAgeResult = {
  input: EnergyAgeInput
  age: number
  baseWattage: number
  actualWattage: number
  modernWattage: number
  degradation: number
  unitsPerMonth: number
  modernUnitsPerMonth: number
  actualCost: number
  modernCost: number
  monthlySaving: number
  yearlySaving: number
  energyAgeScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  replacementCost: number
  schemeDiscount: number
  effectiveReplacementCost: number
  paybackYears: number | null
  verdict: string
}

type ApplianceSpec = {
  label: string
  wattageByStar: Record<number, number>
  replacementCost: number
  schemeDiscount: number
}

export const ENERGY_AGE_SPECS: Record<EnergyAgeApplianceType, ApplianceSpec> = {
  ac_1_5t: {
    label: '1.5T Air Conditioner',
    wattageByStar: { 1: 1800, 2: 1650, 3: 1500, 4: 1300, 5: 1100 },
    replacementCost: 45000,
    schemeDiscount: 5000,
  },
  refrigerator: {
    label: 'Refrigerator',
    wattageByStar: { 1: 230, 2: 180, 3: 140, 4: 110, 5: 90 },
    replacementCost: 28000,
    schemeDiscount: 3000,
  },
  washing_machine: {
    label: 'Washing Machine',
    wattageByStar: { 1: 700, 2: 650, 3: 600, 4: 520, 5: 450 },
    replacementCost: 25000,
    schemeDiscount: 0,
  },
  water_heater: {
    label: 'Water Heater (Geyser)',
    wattageByStar: { 1: 2300, 2: 2150, 3: 2000, 4: 1850, 5: 1700 },
    replacementCost: 14000,
    schemeDiscount: 0,
  },
  ceiling_fan: {
    label: 'Ceiling Fan Cluster',
    wattageByStar: { 1: 95, 2: 85, 3: 75, 4: 60, 5: 50 },
    replacementCost: 3500,
    schemeDiscount: 0,
  },
  television: {
    label: 'Television',
    wattageByStar: { 1: 180, 2: 150, 3: 120, 4: 95, 5: 75 },
    replacementCost: 22000,
    schemeDiscount: 0,
  },
}

export const ENERGY_AGE_TYPE_OPTIONS = Object.entries(ENERGY_AGE_SPECS).map(([key, value]) => ({
  id: key as EnergyAgeApplianceType,
  label: value.label,
}))

export function getEnergyGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'F'
}

export function createDefaultEnergyAgeInput(currentYear: number): EnergyAgeInput {
  return {
    name: 'Living Room AC',
    type: 'ac_1_5t',
    purchaseYear: Math.max(currentYear - 6, 2005),
    starRating: 3,
    dailyHours: 8,
  }
}

export function calculateEnergyAgeResult(
  appliance: EnergyAgeInput,
  tariffRate: number,
  currentYear: number,
): EnergyAgeResult {
  const spec = ENERGY_AGE_SPECS[appliance.type]
  const normalizedStar = Math.round(clamp(appliance.starRating, 1, 5))
  const safeHours = clamp(appliance.dailyHours, 0, 24)
  const safePurchaseYear = Math.round(clamp(appliance.purchaseYear, 1990, currentYear))

  const baseWattage = spec.wattageByStar[normalizedStar]
  const modernWattage = spec.wattageByStar[5]
  const age = Math.max(currentYear - safePurchaseYear, 0)
  const degradation = age > 5 ? Math.min((age - 5) * 0.04, 0.4) : 0
  const actualWattage = baseWattage * (1 + degradation)

  const unitsPerMonth = (actualWattage / 1000) * safeHours * 30
  const modernUnitsPerMonth = (modernWattage / 1000) * safeHours * 30
  const actualCost = unitsPerMonth * tariffRate
  const modernCost = modernUnitsPerMonth * tariffRate
  const monthlySaving = Math.max(actualCost - modernCost, 0)
  const yearlySaving = monthlySaving * 12

  const starScore = (normalizedStar / 5) * 100
  const ageScore = Math.max(0, 100 - age * 5)
  const energyAgeScore = Number((starScore * 0.5 + ageScore * 0.5).toFixed(1))
  const grade = getEnergyGrade(energyAgeScore)

  const replacementCost = spec.replacementCost
  const schemeDiscount = spec.schemeDiscount
  const effectiveReplacementCost = Math.max(replacementCost - schemeDiscount, 0)
  const paybackYearsRaw = monthlySaving > 0 ? effectiveReplacementCost / monthlySaving / 12 : null
  const paybackYears = paybackYearsRaw === null ? null : Number(paybackYearsRaw.toFixed(1))

  let verdict = 'Not worth replacing yet'
  if (paybackYears !== null && paybackYears < 5) {
    verdict = 'Worth replacing now'
  } else if (paybackYears !== null && paybackYears <= 8) {
    verdict = 'Consider replacing if it breaks'
  }

  return {
    input: {
      ...appliance,
      purchaseYear: safePurchaseYear,
      starRating: normalizedStar,
      dailyHours: safeHours,
    },
    age,
    baseWattage,
    actualWattage: Number(actualWattage.toFixed(0)),
    modernWattage,
    degradation: Number((degradation * 100).toFixed(1)),
    unitsPerMonth: Number(unitsPerMonth.toFixed(1)),
    modernUnitsPerMonth: Number(modernUnitsPerMonth.toFixed(1)),
    actualCost: Number(actualCost.toFixed(0)),
    modernCost: Number(modernCost.toFixed(0)),
    monthlySaving: Number(monthlySaving.toFixed(0)),
    yearlySaving: Number(yearlySaving.toFixed(0)),
    energyAgeScore,
    grade,
    replacementCost,
    schemeDiscount,
    effectiveReplacementCost,
    paybackYears,
    verdict,
  }
}
