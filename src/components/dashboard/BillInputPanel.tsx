import { APPLIANCE_CATALOG, CITY_OPTIONS, CITY_TO_STATE, STATE_OPTIONS } from '../../data/demo'
import { useEnergy } from '../../context/EnergyContext'
import type { ApplianceCatalogId, ApplianceEntry } from '../../types'
import { formatCurrency, formatUnits } from '../../utils/format'
import { rawUnitsForEntry } from '../../utils/simulation'
import { SectionCard } from '../common/SectionCard'

function ApplianceInputCard({ entry }: { entry: ApplianceEntry }) {
  const { replaceInputEntryCatalog, removeAppliance, updateInputEntry } = useEnergy()
  const appliance = APPLIANCE_CATALOG.find((item) => item.id === entry.catalogId) ?? APPLIANCE_CATALOG[0]
  const rawMonthlyUnits = rawUnitsForEntry(entry)

  return (
    <div className="panel-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-medium text-[var(--text-primary)]">{entry.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{appliance.category}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="panel-elevated rounded-full px-3 py-1 text-xs text-[var(--text-secondary)]">
            ~{formatUnits(rawMonthlyUnits)}
          </div>
          <button
            type="button"
            onClick={() => removeAppliance(entry.id)}
            className="btn-secondary rounded-full px-3 py-1 text-xs"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="panel-elevated rounded-xl p-3">
          <span className="label-muted">Appliance type</span>
          <select
            value={entry.catalogId}
            onChange={(event) => replaceInputEntryCatalog(entry.id, event.target.value as ApplianceCatalogId)}
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
              value={entry.quantity}
              onChange={(event) =>
                updateInputEntry(entry.id, { quantity: Number(event.target.value) || appliance.minQuantity })
              }
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
              value={entry.wattage}
              onChange={(event) =>
                updateInputEntry(entry.id, { wattage: Number(event.target.value) || appliance.defaultWattage })
              }
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
              value={entry.hours}
              onChange={(event) =>
                updateInputEntry(entry.id, { hours: Number(event.target.value) || appliance.minHours })
              }
              className="input-base num-mono mt-2 w-full"
            />
          </label>
        </div>

        <div className="panel-elevated rounded-xl p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="label-muted">Hours slider</span>
            <span className="num-mono text-sm text-[var(--text-secondary)]">{entry.hours.toFixed(1)} h/day</span>
          </div>
          <input
            type="range"
            min={appliance.minHours}
            max={appliance.maxHours}
            step="0.5"
            value={entry.hours}
            onChange={(event) =>
              updateInputEntry(entry.id, { hours: Number(event.target.value) || appliance.minHours })
            }
            className="slider mt-4 w-full"
          />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{appliance.tip}</p>
    </div>
  )
}

export function BillInputPanel() {
  const { input, setInput, addAppliance, analyzeBill } = useEnergy()
  const rawPreviewUnits = input.applianceEntries.reduce((sum, entry) => sum + rawUnitsForEntry(entry), 0)
  const defaultApplianceId = (APPLIANCE_CATALOG[0]?.id ?? 'ac') as ApplianceCatalogId

  return (
    <SectionCard
      eyebrow="Section 1"
      title="Bill and Appliance Inputs"
      description="Start with the actual bill, location, and the appliances you really own. You can add more loads from the catalog and edit wattage instead of guessing a fixed AC value."
      action={
        <div className="pill-accent px-4 py-2 text-sm">
          Draft load profile: {formatUnits(rawPreviewUnits)}
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
              <p className="mt-2 text-sm text-[var(--text-muted)]">Tariff logic changes by DISCOM profile.</p>
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
              <p className="mt-2 text-sm text-[var(--text-muted)]">Used for regional context and solar assumptions.</p>
            </label>
          </div>

          <div className="panel-elevated rounded-xl p-4">
            <p className="label-muted">How to fill this fast</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Enter the appliances that run regularly, then set realistic average daily hours for the billing month. Perfect values are not required for a useful breakdown.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {input.applianceEntries.map((entry) => (
            <ApplianceInputCard key={entry.id} entry={entry} />
          ))}
          <div className="panel-surface rounded-xl border-dashed p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Add another appliance</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Choose from the catalog</p>
              </div>
              <button
                type="button"
                onClick={() => addAppliance(defaultApplianceId)}
                className="btn-primary rounded-lg px-4 py-2 text-sm"
              >
                Add appliance
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
              {APPLIANCE_CATALOG.slice(0, 6).map((item) => (
                <span key={item.id} className="panel-surface rounded-full px-3 py-1">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="text-sm text-[var(--text-muted)]">
          Current bill target: <span className="num-mono font-medium text-[var(--text-primary)]">{formatCurrency(input.monthlyBill)}</span>
        </div>
        <button
          type="button"
          onClick={analyzeBill}
          className="btn-primary rounded-lg px-6 py-3 text-base"
        >
          Analyze My Bill
        </button>
      </div>
    </SectionCard>
  )
}
