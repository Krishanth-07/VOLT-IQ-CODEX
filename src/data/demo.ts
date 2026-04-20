import type { ApplianceCatalogItem, ApplianceEntry, SolarInputs, TariffProfile } from '../types'

export const DEFAULT_CITY = 'Chennai'
export const DEFAULT_STATE = 'Tamil Nadu'
export const DEFAULT_MONTHLY_BILL = 2400

export const STATE_OPTIONS = [
  'Tamil Nadu',
  'Karnataka',
  'Maharashtra',
  'Delhi',
  'Telangana',
]

export const CITY_OPTIONS = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Salem',
  'Bengaluru',
  'Hyderabad',
  'Mumbai',
  'Delhi',
]

export const CITY_TO_STATE: Record<string, string> = {
  Chennai: 'Tamil Nadu',
  Coimbatore: 'Tamil Nadu',
  Madurai: 'Tamil Nadu',
  Tiruchirappalli: 'Tamil Nadu',
  Salem: 'Tamil Nadu',
  Bengaluru: 'Karnataka',
  Hyderabad: 'Telangana',
  Mumbai: 'Maharashtra',
  Delhi: 'Delhi',
}

export const APPLIANCE_CATALOG: ApplianceCatalogItem[] = [
  {
    id: 'ac',
    label: 'Air conditioner',
    category: 'Cooling',
    defaultWattage: 1500,
    minWattage: 500,
    maxWattage: 2500,
    minQuantity: 0,
    maxQuantity: 6,
    minHours: 0,
    maxHours: 18,
    defaultQuantity: 1,
    defaultHours: 8,
    tip: 'Use the actual rated wattage if you know it. Otherwise start with an approximate nameplate value.',
  },
  {
    id: 'geyser',
    label: 'Geyser',
    category: 'Water heating',
    defaultWattage: 2000,
    minWattage: 800,
    maxWattage: 3000,
    minQuantity: 0,
    maxQuantity: 4,
    minHours: 0,
    maxHours: 5,
    defaultQuantity: 1,
    defaultHours: 1,
    tip: 'Enter only the units used during this billing cycle.',
  },
  {
    id: 'refrigerator',
    label: 'Refrigerator',
    category: 'Kitchen',
    defaultWattage: 180,
    minWattage: 80,
    maxWattage: 500,
    minQuantity: 0,
    maxQuantity: 3,
    minHours: 1,
    maxHours: 24,
    defaultQuantity: 1,
    defaultHours: 10,
    tip: 'This should reflect compressor runtime, not 24 full hours unless the appliance is very old or heavily loaded.',
  },
  {
    id: 'washing_machine',
    label: 'Washing machine',
    category: 'Laundry',
    defaultWattage: 600,
    minWattage: 300,
    maxWattage: 1500,
    minQuantity: 0,
    maxQuantity: 2,
    minHours: 0,
    maxHours: 4,
    defaultQuantity: 1,
    defaultHours: 0.5,
    tip: 'Use average hours per day. For example, 3.5 hours per week is about 0.5 hours per day.',
  },
  {
    id: 'lights_fans',
    label: 'Lights and fans cluster',
    category: 'Base load',
    defaultWattage: 400,
    minWattage: 100,
    maxWattage: 1500,
    minQuantity: 1,
    maxQuantity: 10,
    minHours: 1,
    maxHours: 24,
    defaultQuantity: 2,
    defaultHours: 10,
    tip: 'Treat each quantity as one active room or zone with lights, fans, and small plug loads.',
  },
  {
    id: 'television',
    label: 'Television',
    category: 'Entertainment',
    defaultWattage: 120,
    minWattage: 40,
    maxWattage: 300,
    minQuantity: 0,
    maxQuantity: 4,
    minHours: 0,
    maxHours: 12,
    defaultQuantity: 1,
    defaultHours: 4,
    tip: 'Use combined viewing hours for all TVs in regular use.',
  },
  {
    id: 'water_pump',
    label: 'Water pump',
    category: 'Utilities',
    defaultWattage: 750,
    minWattage: 250,
    maxWattage: 2000,
    minQuantity: 0,
    maxQuantity: 3,
    minHours: 0,
    maxHours: 6,
    defaultQuantity: 1,
    defaultHours: 0.5,
    tip: 'Use average daily pumping time, especially if the motor is intermittent.',
  },
  {
    id: 'induction',
    label: 'Induction cooktop',
    category: 'Kitchen',
    defaultWattage: 1800,
    minWattage: 800,
    maxWattage: 2500,
    minQuantity: 0,
    maxQuantity: 3,
    minHours: 0,
    maxHours: 6,
    defaultQuantity: 1,
    defaultHours: 1,
    tip: 'Use cooking-only hours, not total kitchen time.',
  },
  {
    id: 'microwave',
    label: 'Microwave / OTG',
    category: 'Kitchen',
    defaultWattage: 1200,
    minWattage: 500,
    maxWattage: 2200,
    minQuantity: 0,
    maxQuantity: 2,
    minHours: 0,
    maxHours: 3,
    defaultQuantity: 1,
    defaultHours: 0.3,
    tip: 'Short use is normal here. Even 20 minutes per day is enough to matter over a month.',
  },
  {
    id: 'computer',
    label: 'Desktop / workstation',
    category: 'Work',
    defaultWattage: 250,
    minWattage: 80,
    maxWattage: 800,
    minQuantity: 0,
    maxQuantity: 5,
    minHours: 0,
    maxHours: 18,
    defaultQuantity: 1,
    defaultHours: 6,
    tip: 'Use actual monitor and CPU combined wattage if available.',
  },
  {
    id: 'ev_charger',
    label: 'EV charging',
    category: 'Mobility',
    defaultWattage: 3300,
    minWattage: 1000,
    maxWattage: 7400,
    minQuantity: 0,
    maxQuantity: 2,
    minHours: 0,
    maxHours: 10,
    defaultQuantity: 1,
    defaultHours: 1,
    tip: 'Average the charging time across the month instead of using the highest single-day value.',
  },
]

export function getCatalogItem(id: ApplianceCatalogItem['id']) {
  return APPLIANCE_CATALOG.find((item) => item.id === id) ?? APPLIANCE_CATALOG[0]
}

let applianceSequence = 0

export function createApplianceEntry(catalogId: ApplianceCatalogItem['id']): ApplianceEntry {
  const item = getCatalogItem(catalogId)
  applianceSequence += 1

  return {
    id: `${catalogId}-${applianceSequence}`,
    catalogId: item.id,
    name: item.label,
    wattage: item.defaultWattage,
    quantity: item.defaultQuantity,
    hours: item.defaultHours,
  }
}

export function getDefaultApplianceEntries() {
  return [
    createApplianceEntry('ac'),
    createApplianceEntry('geyser'),
    createApplianceEntry('lights_fans'),
  ]
}

export const TARIFF_PROFILES: TariffProfile[] = [
  {
    id: 'tn',
    state: 'Tamil Nadu',
    provider: 'TANGEDCO Domestic',
    slabs: [
      { index: 0, bandLabel: '0-100', rate: 0, minUnits: 0, maxUnits: 100 },
      { index: 1, bandLabel: '101-200', rate: 2.25, minUnits: 100, maxUnits: 200 },
      { index: 2, bandLabel: '201-400', rate: 4.5, minUnits: 200, maxUnits: 400 },
      { index: 3, bandLabel: '401-500', rate: 6, minUnits: 400, maxUnits: 500 },
    ],
  },
  {
    id: 'ka',
    state: 'Karnataka',
    provider: 'BESCOM Domestic',
    slabs: [
      { index: 0, bandLabel: '0-100', rate: 4.2, minUnits: 0, maxUnits: 100 },
      { index: 1, bandLabel: '101-200', rate: 5.6, minUnits: 100, maxUnits: 200 },
      { index: 2, bandLabel: '201-500', rate: 7.15, minUnits: 200, maxUnits: 500 },
      { index: 3, bandLabel: '501+', rate: 8.2, minUnits: 500, maxUnits: null },
    ],
  },
  {
    id: 'mh',
    state: 'Maharashtra',
    provider: 'MSEDCL Residential',
    slabs: [
      { index: 0, bandLabel: '0-100', rate: 3.44, minUnits: 0, maxUnits: 100 },
      { index: 1, bandLabel: '101-300', rate: 7.34, minUnits: 100, maxUnits: 300 },
      { index: 2, bandLabel: '301-500', rate: 10.36, minUnits: 300, maxUnits: 500 },
      { index: 3, bandLabel: '501+', rate: 11.82, minUnits: 500, maxUnits: null },
    ],
  },
  {
    id: 'dl',
    state: 'Delhi',
    provider: 'Delhi Domestic',
    slabs: [
      { index: 0, bandLabel: '0-200', rate: 3, minUnits: 0, maxUnits: 200 },
      { index: 1, bandLabel: '201-400', rate: 4.5, minUnits: 200, maxUnits: 400 },
      { index: 2, bandLabel: '401-800', rate: 6.5, minUnits: 400, maxUnits: 800 },
      { index: 3, bandLabel: '801+', rate: 7, minUnits: 800, maxUnits: null },
    ],
  },
  {
    id: 'ts',
    state: 'Telangana',
    provider: 'TGSPDCL Domestic',
    slabs: [
      { index: 0, bandLabel: '0-100', rate: 2.9, minUnits: 0, maxUnits: 100 },
      { index: 1, bandLabel: '101-200', rate: 4.3, minUnits: 100, maxUnits: 200 },
      { index: 2, bandLabel: '201-500', rate: 6.7, minUnits: 200, maxUnits: 500 },
      { index: 3, bandLabel: '501+', rate: 7.9, minUnits: 500, maxUnits: null },
    ],
  },
]

export const BASE_CO2_PER_UNIT = 0.82

export const DEMO_SOLAR_INPUTS: SolarInputs = {
  monthlyBill: DEFAULT_MONTHLY_BILL,
  roofSize: 240,
  city: DEFAULT_CITY,
  state: DEFAULT_STATE,
  ownership: 'own',
}
