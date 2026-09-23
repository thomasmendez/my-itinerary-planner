import { useState } from 'react'
import { Field, fieldInputClass } from '../Field'
import { CostUnitField } from '../CostUnitField'
import { useAppDispatch } from '../../store/hooks'
import { addCustomVehicleCandidate, updateCustomVehicleCandidate } from '../../store/rentalsSlice'
import type { CustomRentalOption } from '../../types/rentals'

const DEFAULTS = {
  description: '',
  pickupLocation: '',
  dropoffLocation: '',
  pickupAt: '',
  dropoffAt: '',
  price: '',
  costUnit: '/ rental',
  notes: '',
}

export type RentalCustomVehicleEditTarget = { savedRentalId: number; initial: CustomRentalOption }

export function RentalCustomVehicleForm({
  onSaved,
  onCancel,
  editing,
}: {
  onSaved: () => void
  onCancel?: () => void
  editing?: RentalCustomVehicleEditTarget
}) {
  const dispatch = useAppDispatch()
  const [fields, setFields] = useState(() =>
    editing
      ? {
          description: editing.initial.description,
          pickupLocation: editing.initial.pickup_location,
          dropoffLocation: editing.initial.dropoff_location ?? '',
          pickupAt: editing.initial.pickup_at.slice(0, 16),
          dropoffAt: editing.initial.dropoff_at.slice(0, 16),
          price: String(editing.initial.price),
          costUnit: editing.initial.cost_unit,
          notes: editing.initial.notes ?? '',
        }
      : DEFAULTS,
  )

  return (
    <form
      data-testid="rental-custom-form"
      onSubmit={(e) => {
        e.preventDefault()
        const input = {
          description: fields.description,
          pickupLocation: fields.pickupLocation,
          dropoffLocation: fields.dropoffLocation || undefined,
          pickupAt: fields.pickupAt,
          dropoffAt: fields.dropoffAt,
          price: fields.price === '' ? undefined : Number(fields.price),
          costUnit: fields.costUnit,
          notes: fields.notes || undefined,
        }
        if (editing) {
          dispatch(
            updateCustomVehicleCandidate({
              savedRentalId: editing.savedRentalId,
              bookingToken: editing.initial.booking_token,
              input,
            }),
          )
        } else {
          dispatch(addCustomVehicleCandidate(input))
          setFields(DEFAULTS)
        }
        onSaved()
      }}
      className="grid grid-cols-1 gap-3 rounded border border-line-soft p-4 sm:grid-cols-2"
    >
      <p className="col-span-full text-xs font-semibold uppercase tracking-wide text-muted">
        {editing ? 'Edit custom vehicle' : 'Add custom vehicle'}
      </p>
      <Field label="Vehicle / Description" extraClassName="col-span-full">
        <input
          data-testid="rental-custom-description-input"
          required
          value={fields.description}
          onChange={(e) => setFields({ ...fields, description: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Pickup Location">
        <input
          data-testid="rental-custom-pickup-location-input"
          required
          value={fields.pickupLocation}
          onChange={(e) => setFields({ ...fields, pickupLocation: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Dropoff Location (optional)">
        <input
          data-testid="rental-custom-dropoff-location-input"
          value={fields.dropoffLocation}
          onChange={(e) => setFields({ ...fields, dropoffLocation: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Pickup">
        <input
          data-testid="rental-custom-pickup-input"
          type="datetime-local"
          required
          value={fields.pickupAt}
          onChange={(e) => setFields({ ...fields, pickupAt: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Dropoff">
        <input
          data-testid="rental-custom-dropoff-input"
          type="datetime-local"
          required
          value={fields.dropoffAt}
          onChange={(e) => setFields({ ...fields, dropoffAt: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <CostUnitField
        testIdPrefix="rental-custom"
        cost={fields.price}
        costUnit={fields.costUnit}
        onCostChange={(price) => setFields({ ...fields, price })}
        onCostUnitChange={(costUnit) => setFields({ ...fields, costUnit })}
      />
      <Field label="Notes (optional)" extraClassName="col-span-full">
        <input
          data-testid="rental-custom-notes-input"
          value={fields.notes}
          onChange={(e) => setFields({ ...fields, notes: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
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
          data-testid="rental-custom-save-button"
          type="submit"
          className="rounded bg-strong px-4 py-1.5 text-sm font-medium text-white"
        >
          {editing ? 'Save changes' : 'Save as candidate'}
        </button>
      </div>
    </form>
  )
}
