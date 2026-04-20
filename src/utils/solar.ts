import { DEFAULT_CITY } from '../data/demo'
import type { SolarInputs, SolarOutcome } from '../types'
import { calculateBillFromUnits, estimateUnitsFromBill, getTariffProfile } from './tariff'

const CO2_PER_UNIT_KG = 0.82
const CO2_PER_TREE_KG_PER_YEAR = 20
const COST_PER_KW = 78000

const STATE_SOLAR_TOP_UP: Record<string, { ratePerKw: number; maxKw: number; label: string }> = {
  'Tamil Nadu': { ratePerKw: 0, maxKw: 0, label: 'No active state capital top-up published in this model' },
  Karnataka: { ratePerKw: 4000, maxKw: 3, label: 'State rooftop incentive support' },
  Maharashtra: { ratePerKw: 5000, maxKw: 3, label: 'State rooftop subsidy add-on' },
  Delhi: { ratePerKw: 2000, maxKw: 3, label: 'Delhi state rooftop subsidy add-on' },
  Telangana: { ratePerKw: 3000, maxKw: 3, label: 'State rooftop incentive support' },
}

const STATE_NET_METERING: Record<string, string> = {
  'Tamil Nadu': 'Domestic net metering supported; settlement and caps vary by DISCOM circulars.',
  Karnataka: 'Net metering allowed for residential rooftop with utility-defined capacity limits.',
  Maharashtra: 'Net metering available with DISCOM approvals and consumer-category caps.',
  Delhi: 'Net metering available for domestic rooftop systems, subject to sanctioned load norms.',
  Telangana: 'Net metering available for residential installations under state DISCOM procedures.',
}

const CITY_SOLAR_FACTOR: Record<string, number> = {
  Chennai: 1.05,
  Coimbatore: 1,
  Madurai: 1.03,
  Tiruchirappalli: 1,
  Salem: 0.98,
  Bengaluru: 0.96,
  Hyderabad: 1.02,
  Mumbai: 0.95,
  Delhi: 0.97,
}

export function calculateSolarOutcome(inputs: SolarInputs): SolarOutcome {
  const cityFactor = CITY_SOLAR_FACTOR[inputs.city] ?? CITY_SOLAR_FACTOR[DEFAULT_CITY]
  const profile = getTariffProfile(inputs.state)
  const monthlyUnits = estimateUnitsFromBill(inputs.monthlyBill, profile)
  const roofCapacityKw = Number((inputs.roofSize / 80).toFixed(1))
  const suggestedKw = Number(Math.max(1, monthlyUnits / 235).toFixed(1))
  const systemSizeKw = Number(Math.min(suggestedKw, roofCapacityKw).toFixed(1))
  const effectiveSystem = Math.max(systemSizeKw, 1)
  const installedCost = effectiveSystem * COST_PER_KW

  const pmSuryaGharSubsidy =
    inputs.ownership === 'own'
      ? Math.min(effectiveSystem, 2) * 30000 + Math.max(Math.min(effectiveSystem - 2, 1), 0) * 18000
      : 0
  const stateRule = STATE_SOLAR_TOP_UP[inputs.state] ?? STATE_SOLAR_TOP_UP['Tamil Nadu']
  const stateSubsidy =
    inputs.ownership === 'own'
      ? Math.min(effectiveSystem, stateRule.maxKw) * stateRule.ratePerKw
      : 0
  const subsidy = pmSuryaGharSubsidy + stateSubsidy

  const applicableSchemes = inputs.ownership === 'own'
    ? [
        {
          id: 'pm-surya-ghar',
          title: 'PM Surya Ghar: Muft Bijli Yojana',
          subsidyAmount: Math.round(pmSuryaGharSubsidy),
          summary: `Central subsidy up to ₹78,000 for systems up to 3 kW in this model.`,
          detail: `Estimated support for ${effectiveSystem.toFixed(1)} kW: ₹${Math.round(pmSuryaGharSubsidy).toLocaleString('en-IN')}.`,
        },
        ...(stateSubsidy > 0
          ? [
              {
                id: 'state-top-up',
                title: `${inputs.state} Rooftop Subsidy`,
                subsidyAmount: Math.round(stateSubsidy),
                summary: stateRule.label,
                detail: `Estimated state support: ₹${Math.round(stateSubsidy).toLocaleString('en-IN')}.`,
              },
            ]
          : []),
      ]
    : []

  const netMeteringPolicy =
    inputs.ownership === 'own'
      ? STATE_NET_METERING[inputs.state] ?? 'Net metering policy depends on the local DISCOM and sanctioned load.'
      : 'Net metering usually requires owner-led DISCOM registration; renters often need landlord and connection-holder approval.'
  const solarUnits = effectiveSystem * 120 * cityFactor
  const remainingUnits = Math.max(monthlyUnits - solarUnits, 0)
  const remainingBill = calculateBillFromUnits(remainingUnits, profile)
  const monthlySavings = Math.max(inputs.monthlyBill - remainingBill, 0)
  const annualSavings = monthlySavings * 12
  const fiveYearSavings = annualSavings * 5
  const postSubsidyCost = Math.max(installedCost - subsidy, 0)
  const paybackYears = monthlySavings > 0 ? postSubsidyCost / annualSavings : 99
  const scheme =
    inputs.ownership === 'own' ? 'PM Surya Ghar residential subsidy' : 'No residential subsidy for renters'
  const annualCo2OffsetKg = Number((solarUnits * 12 * CO2_PER_UNIT_KG).toFixed(0))
  const treesEquivalent = Math.max(Math.round(annualCo2OffsetKg / CO2_PER_TREE_KG_PER_YEAR), 0)

  const verdict =
    inputs.ownership === 'own' &&
    effectiveSystem <= roofCapacityKw &&
    monthlySavings >= 900 &&
    paybackYears <= 8.5
      ? 'GO SOLAR'
      : 'NOT WORTH IT'

  const verdictReason =
    verdict === 'GO SOLAR'
      ? 'Roof area, subsidy access, and monthly offset make the project financially sensible.'
      : inputs.ownership === 'rent'
        ? 'Rental properties rarely offer enough control over the roof to recover the investment.'
        : 'The current bill size or usable roof area does not create a strong payback case yet.'

  return {
    systemSizeKw: effectiveSystem,
    postSubsidyCost,
    subsidy,
    monthlySavings,
    annualSavings,
    paybackYears,
    roofCapacityKw,
    monthlyGeneration: solarUnits,
    fiveYearSavings,
    scheme,
    applicableSchemes,
    netMeteringPolicy,
    annualCo2OffsetKg,
    treesEquivalent,
    verdict,
    verdictReason,
  }
}
