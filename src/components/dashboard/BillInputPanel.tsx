import { useState } from 'react'
import { APPLIANCE_CATALOG, CITY_OPTIONS, CITY_TO_STATE, STATE_OPTIONS, createApplianceEntry } from '../../data/demo'
import { useEnergy } from '../../context/EnergyContext'
import type { ApplianceCatalogId, ApplianceEntry } from '../../types'
import { formatCurrency, formatUnits } from '../../utils/format'
import { rawUnitsForEntry } from '../../utils/simulation'
import { SectionCard } from '../common/SectionCard'

function AppliancePickerCard({ onAdd }: { onAdd: (entry: ApplianceEntry) => void }) {
  const defaultCatalogId = (APPLIANCE_CATALOG[0]?.id ?? 'ac') as ApplianceCatalogId
  const [catalogId, setCatalogId] = useState<ApplianceCatalogId>(defaultCatalogId)

  const appliance = APPLIANCE_CATALOG.find((item) => item.id === catalogId) ?? APPLIANCE_CATALOG[0]
  const [quantity, setQuantity] = useState(appliance.defaultQuantity)
  const [wattage, setWattage] = useState(appliance.defaultWattage)
  const [hours, setHours] = useState(appliance.defaultHours)
  const rawMonthlyUnits = rawUnitsForEntry({
    id: 'draft',
    catalogId,
    name: appliance.label,
    quantity,
    wattage,
    hours,
  })

  function handleCatalogChange(nextId: ApplianceCatalogId) {
    const nextAppliance = APPLIANCE_CATALOG.find((item) => item.id === nextId) ?? APPLIANCE_CATALOG[0]
    setCatalogId(nextAppliance.id)
    setQuantity(nextAppliance.defaultQuantity)
    setWattage(nextAppliance.defaultWattage)
    setHours(nextAppliance.defaultHours)
  }

  function handleAddAppliance() {
    const baseEntry = createApplianceEntry(catalogId)
    onAdd({
      ...baseEntry,
      quantity,
      wattage,
      hours,
    })
  }

  return (
    <div className="panel-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-medium text-[var(--text-primary)]">{appliance.label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{appliance.category}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="panel-elevated rounded-full px-3 py-1 text-xs text-[var(--text-secondary)]">
            ~{formatUnits(rawMonthlyUnits)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="panel-elevated rounded-xl p-3">
          <span className="label-muted">Appliance</span>
          <select
            value={catalogId}
            onChange={(event) => handleCatalogChange(event.target.value as ApplianceCatalogId)}
            className="input-base mt-2 w-full"
          >
            {APPLIANCE_CATALOG.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="panel-elevated rounded-xl p-3">
            <span className="label-muted">Quantity</span>
            <input
              type="number"
              min={appliance.minQuantity}
              max={appliance.maxQuantity}
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value) || appliance.minQuantity)}
              className="input-base num-mono mt-2 w-full"
            />
          </label>

          <label className="panel-elevated rounded-xl p-3">
            <span className="label-muted">Wattage</span>
            <input
              type="number"
              min={appliance.minWattage}
              max={appliance.maxWattage}
              step="10"
              value={wattage}
              onChange={(event) => setWattage(Number(event.target.value) || appliance.defaultWattage)}
              className="input-base num-mono mt-2 w-full"
            />
          </label>

          <label className="panel-elevated rounded-xl p-3">
            <span className="label-muted">Hours per day</span>
            <input
              type="number"
              min={appliance.minHours}
              max={appliance.maxHours}
              step="0.5"
              value={hours}
              onChange={(event) => setHours(Number(event.target.value) || appliance.minHours)}
              className="input-base num-mono mt-2 w-full"
            />
          </label>
        </div>

        <div className="panel-elevated rounded-xl p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="label-muted">Hours slider</span>
            <span className="num-mono text-sm text-[var(--text-secondary)]">{hours.toFixed(1)} h/day</span>
          </div>
          <input
            type="range"
            min={appliance.minHours}
            max={appliance.maxHours}
            step="0.5"
            value={hours}
            onChange={(event) => setHours(Number(event.target.value) || appliance.minHours)}
            className="slider mt-4 w-full"
          />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{appliance.tip}</p>
      <button
        type="button"
        onClick={handleAddAppliance}
        className="btn-primary mt-3 rounded-lg px-4 py-2 text-sm"
      >
        Add to list
      </button>
    </div>
  )
}

export function BillInputPanel() {
  const { input, setInput, removeAppliance, analyzeBill } = useEnergy()
  const rawPreviewUnits = input.applianceEntries.reduce((sum, entry) => sum + rawUnitsForEntry(entry), 0)

  return (
    <SectionCard
      eyebrow="Section 1"
      title="Your Bill Details"
      description="Start with your latest bill and the appliances you use often. You can add or remove items any time."
      action={
        <div className="pill-accent px-4 py-2 text-sm">
          Estimated usage: {formatUnits(rawPreviewUnits)}
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="panel-surface p-4">
              <span className="label-muted">Monthly bill</span>
              <input
                type="number"
                min="0"
                value={input.monthlyBill}
                onChange={(event) =>
                  setInput({
                    ...input,
                    monthlyBill: Number(event.target.value),
                  })
                }
                className="input-base num-mono mt-3 w-full"
              />
              <p className="mt-2 text-sm text-[var(--text-muted)]">Use the latest full bill amount in rupees.</p>
            </label>

            <label className="panel-surface p-4">
              <span className="label-muted">State</span>
              <select
                value={input.state}
                onChange={(event) =>
                  setInput({
                    ...input,
                    state: event.target.value,
                  })
                }
                className="input-base mt-5 w-full"
              >
                {STATE_OPTIONS.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Choose your state for correct electricity rates.</p>
            </label>

            <label className="panel-surface p-4">
              <span className="label-muted">City</span>
              <select
                value={input.city}
                onChange={(event) =>
                  setInput({
                    ...input,
                    city: event.target.value,
                    state: CITY_TO_STATE[event.target.value] ?? input.state,
                  })
                }
                className="input-base mt-5 w-full"
              >
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Used for better local estimates.</p>
            </label>
          </div>

          <div className="panel-elevated rounded-xl p-4">
            <p className="label-muted">Quick help</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Add appliances you use regularly and set average daily hours. Rough values are okay.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <AppliancePickerCard
            onAdd={(entry) =>
              setInput({
                ...input,
                applianceEntries: [...input.applianceEntries, entry],
              })
            }
          />

          <div className="panel-surface p-3">
            <p className="label-muted">Added appliances</p>
            {input.applianceEntries.length ? (
              <div className="mt-2 space-y-2">
                {input.applianceEntries.map((entry) => (
                  <div key={entry.id} className="panel-elevated flex items-center justify-between gap-3 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{entry.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Qty {entry.quantity} | {entry.wattage} W | {entry.hours.toFixed(1)} h/day
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAppliance(entry.id)}
                      className="btn-secondary rounded-md px-3 py-1.5 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-muted)]">No appliances added yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="text-sm text-[var(--text-muted)]">
          Current bill: <span className="num-mono font-medium text-[var(--text-primary)]">{formatCurrency(input.monthlyBill)}</span>
        </div>
        <button
          type="button"
          onClick={() => analyzeBill()}
          className="btn-primary rounded-lg px-6 py-3 text-base"
        >
          Analyze My Bill
        </button>
      </div>
    </SectionCard>
  )
}
