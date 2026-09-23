import { useState } from 'react'
import { Field, fieldInputClass } from '../Field'
import { CostUnitField } from '../CostUnitField'
import { useAppDispatch } from '../../store/hooks'
import { addCustomLodgingCandidate, updateCustomLodgingCandidate } from '../../store/hotelsSlice'
import type { CustomLodgingOption } from '../../types/hotels'

const DEFAULTS = {
  name: '',
  location: '',
  checkIn: '',
  checkOut: '',
  price: '',
  costUnit: '/ night',
  notes: '',
}

export type HotelCustomLodgingEditTarget = { savedHotelId: number; initial: CustomLodgingOption }

export function HotelCustomLodgingForm({
  onSaved,
  onCancel,
  editing,
}: {
  onSaved: () => void
  onCancel?: () => void
  editing?: HotelCustomLodgingEditTarget
}) {
  const dispatch = useAppDispatch()
  const [fields, setFields] = useState(() =>
    editing
      ? {
          name: editing.initial.name,
          location: editing.initial.location ?? '',
          checkIn: editing.initial.check_in,
          checkOut: editing.initial.check_out,
          price: String(editing.initial.price),
          costUnit: editing.initial.cost_unit,
          notes: editing.initial.notes ?? '',
        }
      : DEFAULTS,
  )

  return (
    <form
      data-testid="hotel-custom-form"
      onSubmit={(e) => {
        e.preventDefault()
        const input = {
          name: fields.name,
          location: fields.location || undefined,
          checkIn: fields.checkIn,
          checkOut: fields.checkOut,
          price: fields.price === '' ? undefined : Number(fields.price),
          costUnit: fields.costUnit,
          notes: fields.notes || undefined,
        }
        if (editing) {
          dispatch(
            updateCustomLodgingCandidate({
              savedHotelId: editing.savedHotelId,
              bookingToken: editing.initial.booking_token,
              input,
            }),
          )
        } else {
          dispatch(addCustomLodgingCandidate(input))
          setFields(DEFAULTS)
        }
        onSaved()
      }}
      className="grid grid-cols-1 gap-3 rounded border border-line-soft p-4 sm:grid-cols-2"
    >
      <p className="col-span-full text-xs font-semibold uppercase tracking-wide text-muted">
        {editing ? 'Edit custom lodging' : 'Add custom lodging'}
      </p>
      <Field label="Name / Description" extraClassName="col-span-full">
        <input
          data-testid="hotel-custom-name-input"
          required
          value={fields.name}
          onChange={(e) => setFields({ ...fields, name: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Location (optional)" extraClassName="col-span-full">
        <input
          data-testid="hotel-custom-location-input"
          value={fields.location}
          onChange={(e) => setFields({ ...fields, location: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Check-in">
        <input
          data-testid="hotel-custom-check-in-input"
          type="date"
          required
          value={fields.checkIn}
          onChange={(e) => setFields({ ...fields, checkIn: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Check-out">
        <input
          data-testid="hotel-custom-check-out-input"
          type="date"
          required
          value={fields.checkOut}
          onChange={(e) => setFields({ ...fields, checkOut: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <CostUnitField
        testIdPrefix="hotel-custom"
        cost={fields.price}
        costUnit={fields.costUnit}
        onCostChange={(price) => setFields({ ...fields, price })}
        onCostUnitChange={(costUnit) => setFields({ ...fields, costUnit })}
      />
      <Field label="Notes (optional)" extraClassName="col-span-full">
        <input
          data-testid="hotel-custom-notes-input"
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
          data-testid="hotel-custom-save-button"
          type="submit"
          className="rounded bg-strong px-4 py-1.5 text-sm font-medium text-white"
        >
          {editing ? 'Save changes' : 'Save as candidate'}
        </button>
      </div>
    </form>
  )
}
