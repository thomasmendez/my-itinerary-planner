import { useState } from 'react'
import type { CustomTransportOption, TransportMode } from '../../types/flights'
import { Field, fieldInputClass } from '../Field'
import { CostUnitField } from '../CostUnitField'
import { useAppDispatch } from '../../store/hooks'
import { addCustomTransportCandidate, updateCustomTransportCandidate } from '../../store/flightsSlice'

const MODES: TransportMode[] = ['Self-drive', 'Train', 'Bus', 'Ferry', 'Carpool', 'Other']

const DEFAULTS = {
  mode: MODES[0],
  from: '',
  to: '',
  depart: '',
  return: '',
  cost: '',
  costUnit: '/ travel',
  notes: '',
}

export type FlightCustomTransportEditTarget = { savedFlightId: number; initial: CustomTransportOption }

export function FlightCustomTransportForm({
  onSaved,
  onCancel,
  editing,
}: {
  onSaved: () => void
  onCancel?: () => void
  editing?: FlightCustomTransportEditTarget
}) {
  const dispatch = useAppDispatch()
  const [fields, setFields] = useState(() =>
    editing
      ? {
          mode: editing.initial.mode,
          from: editing.initial.from,
          to: editing.initial.to,
          depart: editing.initial.depart.replace(' ', 'T'),
          return: editing.initial.return ? editing.initial.return.replace(' ', 'T') : '',
          cost: String(editing.initial.price),
          costUnit: editing.initial.cost_unit,
          notes: editing.initial.notes ?? '',
        }
      : DEFAULTS,
  )

  return (
    <form
      data-testid="flight-custom-form"
      onSubmit={(e) => {
        e.preventDefault()
        const input = {
          mode: fields.mode,
          from: fields.from,
          to: fields.to,
          depart: fields.depart,
          return: fields.return || undefined,
          price: fields.cost === '' ? undefined : Number(fields.cost),
          costUnit: fields.costUnit,
          notes: fields.notes || undefined,
        }
        if (editing) {
          dispatch(
            updateCustomTransportCandidate({
              savedFlightId: editing.savedFlightId,
              bookingToken: editing.initial.booking_token,
              input,
            }),
          )
        } else {
          dispatch(addCustomTransportCandidate(input))
          setFields(DEFAULTS)
        }
        onSaved()
      }}
      className="grid grid-cols-1 gap-3 rounded border border-line-soft p-4 sm:grid-cols-2"
    >
      <p className="col-span-full text-xs font-semibold uppercase tracking-wide text-muted">
        {editing ? 'Edit custom transport' : 'Add custom transport'}
      </p>
      <Field label="Mode" extraClassName="col-span-full">
        <select
          data-testid="flight-custom-mode-select"
          value={fields.mode}
          onChange={(e) => setFields({ ...fields, mode: e.target.value as TransportMode })}
          className={fieldInputClass}
        >
          {MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </Field>
      <Field label="From">
        <input
          data-testid="flight-custom-from-input"
          required
          value={fields.from}
          onChange={(e) => setFields({ ...fields, from: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="To">
        <input
          data-testid="flight-custom-to-input"
          required
          value={fields.to}
          onChange={(e) => setFields({ ...fields, to: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Depart">
        <input
          data-testid="flight-custom-depart-input"
          type="datetime-local"
          required
          value={fields.depart}
          onChange={(e) => setFields({ ...fields, depart: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Return (optional)">
        <input
          data-testid="flight-custom-return-input"
          type="datetime-local"
          value={fields.return}
          onChange={(e) => setFields({ ...fields, return: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <CostUnitField
        testIdPrefix="flight-custom"
        cost={fields.cost}
        costUnit={fields.costUnit}
        onCostChange={(cost) => setFields({ ...fields, cost })}
        onCostUnitChange={(costUnit) => setFields({ ...fields, costUnit })}
      />
      <Field label="Notes (optional)" extraClassName="col-span-full">
        <input
          data-testid="flight-custom-notes-input"
          value={fields.notes}
          onChange={(e) => setFields({ ...fields, notes: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      {!editing && (
        <p className="col-span-full text-[10px] text-faint">
          &#9432; Saved as candidate appears in Comparing tab alongside search results
        </p>
      )}
      <div className="col-span-full flex justify-end gap-2">
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-line px-4 py-1.5 text-sm font-medium text-ink-soft"
          >
            Cancel
          </button>
        )}
        <button
          data-testid="flight-custom-save-button"
          type="submit"
          className="rounded bg-strong px-4 py-1.5 text-sm font-medium text-white"
        >
          {editing ? 'Save changes' : 'Save as candidate'}
        </button>
      </div>
    </form>
  )
}
