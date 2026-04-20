export type ApplianceCatalogId =
  | 'ac'
  | 'geyser'
  | 'refrigerator'
  | 'washing_machine'
  | 'lights_fans'
  | 'television'
  | 'water_pump'
  | 'induction'
  | 'microwave'
  | 'computer'
  | 'ev_charger'

export type ApplianceCatalogItem = {
  id: ApplianceCatalogId
  label: string
  category: string
  defaultWattage: number
  minWattage: number
  maxWattage: number
  minQuantity: number
  maxQuantity: number
  minHours: number
  maxHours: number
  defaultQuantity: number
  defaultHours: number
  tip: string
}

export type ApplianceEntry = {
  id: string
  catalogId: ApplianceCatalogId
  name: string
  wattage: number
  quantity: number
  hours: number
}

export type ApplianceBreakdown = {
  id: string
  name: string
  wattage: number
  quantity: number
  hours: number
  units: number
  cost: number
}

export type SuggestionCard = {
  id: string
  title: string
  savings: number
  units: number
  co2: number
  detail: string
  applianceId: string
  applianceName: string
  hoursDelta: number
  effort: 'Easy' | 'Medium' | 'Hard'
  enabled: boolean
}

export type TariffSlab = {
  index: number
  rate: number
  minUnits: number
  maxUnits: number | null
  bandLabel: string
}

export type TariffProfile = {
  id: string
  state: string
  provider: string
  slabs: TariffSlab[]
}

export type TariffStatus = {
  profile: TariffProfile
  slab: TariffSlab
  units: number
  unitsIntoSlab: number
  progressPercent: number
  nextThreshold: number | null
  remainingToNextSlab: number | null
}

export type SimulationScenario = {
  applianceBreakdown: ApplianceBreakdown[]
  totalUnits: number
  bill: number
  slabStatus: TariffStatus
}

export type SolarInputs = {
  monthlyBill: number
  roofSize: number
  city: string
  state: string
  ownership: 'own' | 'rent'
}

export type SchemeMatch = {
  id: string
  title: string
  subsidyAmount: number
  summary: string
  detail: string
}

export type SolarOutcome = {
  systemSizeKw: number
  postSubsidyCost: number
  subsidy: number
  monthlySavings: number
  annualSavings: number
  paybackYears: number
  roofCapacityKw: number
  monthlyGeneration: number
  fiveYearSavings: number
  scheme: string
  applicableSchemes: SchemeMatch[]
  netMeteringPolicy: string
  annualCo2OffsetKg: number
  treesEquivalent: number
  verdict: 'GO SOLAR' | 'NOT WORTH IT'
  verdictReason: string
}
