import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_CITY, DEFAULT_MONTHLY_BILL, DEFAULT_STATE, DEMO_SOLAR_INPUTS, getDefaultApplianceEntries, getCatalogItem, createApplianceEntry } from '../data/demo'
import { getAiSuggestions } from '../services/openai'
import type { ApplianceCatalogId, ApplianceEntry, SolarInputs, SuggestionCard } from '../types'
import {
  createCalibrationFactor,
  createScenarioFromEntries,
  getSavedUnits,
  getSavingsAmount,
  getUnitsPerHourByAppliance,
  optimizeEntriesToNextSlab,
} from '../utils/simulation'
import { clamp } from '../utils/format'
import { formatSlabLabel, getTariffProfile } from '../utils/tariff'

type InputState = {
  monthlyBill: number
  state: string
  city: string
  applianceEntries: ApplianceEntry[]
}

type EnergyContextValue = {
  input: InputState
  setInput: (next: InputState) => void
  updateInputEntry: (entryId: string, patch: Partial<ApplianceEntry>) => void
  replaceInputEntryCatalog: (entryId: string, catalogId: ApplianceCatalogId) => void
  addAppliance: (catalogId: ApplianceCatalogId) => void
  removeAppliance: (entryId: string) => void
  analyzeBill: () => void
  updateManualHour: (entryId: string, value: number) => void
  dropToNextSlab: () => void
  generateSuggestions: () => Promise<void>
  toggleSuggestion: (id: string) => void
  baseBill: number
  baseUnits: number
  currentBill: number
  currentUnits: number
  savingsAmount: number
  savedUnits: number
  baselineEntries: ApplianceEntry[]
  manualEntries: ApplianceEntry[]
  currentEntries: ApplianceEntry[]
  unitsPerHour: Record<string, number>
  baseScenario: ReturnType<typeof createScenarioFromEntries>
  currentScenario: ReturnType<typeof createScenarioFromEntries>
  tariffProfile: ReturnType<typeof getTariffProfile>
  slabDropMessage: string | null
  suggestions: SuggestionCard[]
  suggestionsLoading: boolean
  solarInputs: SolarInputs
  setSolarInputs: (next: SolarInputs) => void
}

const initialApplianceEntries = getDefaultApplianceEntries()

const defaultInput: InputState = {
  monthlyBill: DEFAULT_MONTHLY_BILL,
  state: DEFAULT_STATE,
  city: DEFAULT_CITY,
  applianceEntries: initialApplianceEntries,
}

const EnergyContext = createContext<EnergyContextValue | null>(null)

function cloneEntries(entries: ApplianceEntry[]) {
  return entries.map((entry) => ({ ...entry }))
}

function sanitizeEntry(entry: ApplianceEntry): ApplianceEntry {
  const item = getCatalogItem(entry.catalogId)
  const nextWattage = Number(entry.wattage)
  const nextQuantity = Number(entry.quantity)
  const nextHours = Number(entry.hours)

  return {
    ...entry,
    name: entry.name || item.label,
    wattage: clamp(
      Number.isFinite(nextWattage) ? nextWattage : item.defaultWattage,
      item.minWattage,
      item.maxWattage,
    ),
    quantity: Math.round(
      clamp(
        Number.isFinite(nextQuantity) ? nextQuantity : item.defaultQuantity,
        item.minQuantity,
        item.maxQuantity,
      ),
    ),
    hours: clamp(
      Number.isFinite(nextHours) ? nextHours : item.defaultHours,
      item.minHours,
      item.maxHours,
    ),
  }
}

function applySuggestions(entries: ApplianceEntry[], suggestions: SuggestionCard[]) {
  const next = cloneEntries(entries)

  for (const suggestion of suggestions) {
    if (!suggestion.enabled) continue

    const entry = next.find((item) => item.id === suggestion.applianceId)
    if (!entry) continue
    const item = getCatalogItem(entry.catalogId)

    entry.hours = clamp(entry.hours - suggestion.hoursDelta, item.minHours, item.maxHours)
  }

  return next
}

export function EnergyProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState<InputState>(defaultInput)
  const [analyzedInput, setAnalyzedInput] = useState<InputState>(defaultInput)
  const [manualEntries, setManualEntries] = useState<ApplianceEntry[]>(() => cloneEntries(initialApplianceEntries))
  const [slabDropMessage, setSlabDropMessage] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionCard[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [solarInputs, setSolarInputs] = useState<SolarInputs>(DEMO_SOLAR_INPUTS)

  const tariffProfile = useMemo(() => getTariffProfile(analyzedInput.state), [analyzedInput.state])
  const calibrationFactor = useMemo(
    () =>
      createCalibrationFactor(
        analyzedInput.monthlyBill,
        tariffProfile,
        analyzedInput.applianceEntries,
      ),
    [analyzedInput.applianceEntries, analyzedInput.monthlyBill, tariffProfile],
  )
  const unitsPerHour = useMemo(
    () => getUnitsPerHourByAppliance(analyzedInput.applianceEntries, calibrationFactor),
    [analyzedInput.applianceEntries, calibrationFactor],
  )
  const baseScenario = useMemo(
    () => createScenarioFromEntries(analyzedInput.applianceEntries, calibrationFactor, tariffProfile),
    [analyzedInput.applianceEntries, calibrationFactor, tariffProfile],
  )
  const currentEntries = useMemo(() => applySuggestions(manualEntries, suggestions), [manualEntries, suggestions])
  const currentScenario = useMemo(
    () => createScenarioFromEntries(currentEntries, calibrationFactor, tariffProfile),
    [calibrationFactor, currentEntries, tariffProfile],
  )

  const baseBill = analyzedInput.monthlyBill
  const baseUnits = baseScenario.totalUnits
  const currentBill = currentScenario.bill
  const currentUnits = currentScenario.totalUnits
  const savingsAmount = getSavingsAmount(baseBill, currentScenario)
  const savedUnits = getSavedUnits(baseUnits, currentScenario)

  function updateInputEntry(entryId: string, patch: Partial<ApplianceEntry>) {
    setInput((current) => ({
      ...current,
      applianceEntries: current.applianceEntries.map((entry) =>
        entry.id === entryId ? sanitizeEntry({ ...entry, ...patch }) : entry,
      ),
    }))
  }

  function replaceInputEntryCatalog(entryId: string, catalogId: ApplianceCatalogId) {
    const item = getCatalogItem(catalogId)
    updateInputEntry(entryId, {
      catalogId: item.id,
      name: item.label,
      wattage: item.defaultWattage,
      quantity: item.defaultQuantity,
      hours: item.defaultHours,
    })
  }

  function addAppliance(catalogId: ApplianceCatalogId) {
    setInput((current) => ({
      ...current,
      applianceEntries: [...current.applianceEntries, createApplianceEntry(catalogId)],
    }))
  }

  function removeAppliance(entryId: string) {
    setInput((current) => ({
      ...current,
      applianceEntries: current.applianceEntries.filter((entry) => entry.id !== entryId),
    }))
  }

  function analyzeBill() {
    const normalizedEntries = (
      input.applianceEntries.length ? cloneEntries(input.applianceEntries) : cloneEntries(initialApplianceEntries)
    ).map(sanitizeEntry)
    const normalized: InputState = {
      ...input,
      monthlyBill: Number.isFinite(Number(input.monthlyBill)) && Number(input.monthlyBill) > 0 ? Number(input.monthlyBill) : DEFAULT_MONTHLY_BILL,
      state: input.state || DEFAULT_STATE,
      city: input.city || DEFAULT_CITY,
      applianceEntries: normalizedEntries,
    }

    setAnalyzedInput(normalized)
    setManualEntries(cloneEntries(normalized.applianceEntries))
    setSuggestions([])
    setSlabDropMessage(null)
    setSolarInputs((current) => ({
      ...current,
      monthlyBill: normalized.monthlyBill,
      city: normalized.city,
      state: normalized.state,
    }))
  }

  function updateManualHour(entryId: string, value: number) {
    setSlabDropMessage(null)
    setSuggestions((current) => current.map((item) => ({ ...item, enabled: false })))
    setManualEntries((current) =>
      current.map((entry) =>
        entry.id === entryId ? sanitizeEntry({ ...entry, hours: value }) : entry,
      ),
    )
  }

  function dropToNextSlab() {
    const previousScenario = currentScenario
    const optimized = optimizeEntriesToNextSlab(currentEntries, calibrationFactor, tariffProfile)
    setManualEntries(cloneEntries(optimized.entries))
    setSuggestions((current) => current.map((item) => ({ ...item, enabled: false })))

    const monthlySavings = Math.round(previousScenario.bill - optimized.scenario.bill)
    const slabChanged = optimized.scenario.slabStatus.slab.index < previousScenario.slabStatus.slab.index

    if (monthlySavings <= 0 && !slabChanged) {
      setSlabDropMessage(
        'No further practical slab drop is available with current appliance limits.',
      )
      return
    }

    setSlabDropMessage(
      `Now at ${formatSlabLabel(optimized.scenario.slabStatus.slab)} with ₹${Math.max(
        monthlySavings,
        0,
      )} additional monthly savings.`,
    )
  }

  async function generateSuggestions() {
    setSuggestionsLoading(true)
    try {
      const nextSuggestions = await getAiSuggestions({
        bill: currentBill,
        city: analyzedInput.city,
        state: analyzedInput.state,
        appliances: currentEntries.map((entry) => ({
          id: entry.id,
          name: entry.name,
          hours: entry.hours,
          perHourUnits: unitsPerHour[entry.id] ?? 0,
        })),
        tariffRateLabel: formatSlabLabel(currentScenario.slabStatus.slab),
      })
      setSuggestions(nextSuggestions)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  function toggleSuggestion(id: string) {
    setSlabDropMessage(null)
    setSuggestions((current) => current.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)))
  }

  return (
    <EnergyContext.Provider
      value={{
        input,
        setInput,
        updateInputEntry,
        replaceInputEntryCatalog,
        addAppliance,
        removeAppliance,
        analyzeBill,
        updateManualHour,
        dropToNextSlab,
        generateSuggestions,
        toggleSuggestion,
        baseBill,
        baseUnits,
        currentBill,
        currentUnits,
        savingsAmount,
        savedUnits,
        baselineEntries: analyzedInput.applianceEntries,
        manualEntries,
        currentEntries,
        unitsPerHour,
        baseScenario,
        currentScenario,
        tariffProfile,
        slabDropMessage,
        suggestions,
        suggestionsLoading,
        solarInputs,
        setSolarInputs,
      }}
    >
      {children}
    </EnergyContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEnergy() {
  const context = useContext(EnergyContext)
  if (!context) {
    throw new Error('useEnergy must be used inside EnergyProvider')
  }

  return context
}
