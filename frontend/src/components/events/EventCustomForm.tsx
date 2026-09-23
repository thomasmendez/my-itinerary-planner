import { useState } from 'react'
import { Field, fieldInputClass } from '../Field'
import { CostUnitField } from '../CostUnitField'
import { useAppDispatch } from '../../store/hooks'
import { addCustomEventAndConfirm, addCustomEventCandidate, updateCustomEventCandidate } from '../../store/eventsSlice'
import type { CustomEventInput, CustomEventOption } from '../../types/events'

const DEFAULTS = {
  name: '',
  location: '',
  date: '',
  startTime: '',
  endTime: '',
  attendees: '',
  price: '',
  costUnit: '/ event',
}

export type EventCustomEditTarget = { savedEventId: number; initial: CustomEventOption }

export function EventCustomForm({
  onSaved,
  onCancel,
  editing,
}: {
  onSaved: () => void
  onCancel?: () => void
  editing?: EventCustomEditTarget
}) {
  const dispatch = useAppDispatch()
  const [fields, setFields] = useState(() => {
    if (!editing) return DEFAULTS
    const [date, startTime] = editing.initial.starts_at.split(' ')
    const endTime = editing.initial.ends_at?.split(' ')[1] ?? ''
    return {
      name: editing.initial.name,
      location: editing.initial.location ?? '',
      date,
      startTime,
      endTime,
      attendees: editing.initial.attendees ?? '',
      price: editing.initial.price === undefined ? '' : String(editing.initial.price),
      costUnit: editing.initial.cost_unit,
    }
  })

  const toInput = (): CustomEventInput => ({
    name: fields.name,
    location: fields.location || undefined,
    date: fields.date,
    startTime: fields.startTime,
    endTime: fields.endTime || undefined,
    attendees: fields.attendees || undefined,
    price: fields.price === '' ? undefined : Number(fields.price),
    costUnit: fields.costUnit,
  })

  return (
    <form
      data-testid="event-custom-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (editing) {
          dispatch(
            updateCustomEventCandidate({
              savedEventId: editing.savedEventId,
              bookingToken: editing.initial.booking_token,
              input: toInput(),
            }),
          )
        } else {
          dispatch(addCustomEventCandidate(toInput()))
          setFields(DEFAULTS)
        }
        onSaved()
      }}
      className="grid grid-cols-1 gap-3 rounded border border-line-soft p-4 sm:grid-cols-2"
    >
      <p className="col-span-full text-xs font-semibold uppercase tracking-wide text-muted">
        {editing ? 'Edit custom event' : 'Add custom event'}
      </p>
      <Field label="Name" extraClassName="col-span-full">
        <input
          data-testid="event-custom-name-input"
          required
          value={fields.name}
          onChange={(e) => setFields({ ...fields, name: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Location (optional)">
        <input
          data-testid="event-custom-location-input"
          value={fields.location}
          onChange={(e) => setFields({ ...fields, location: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Attendees (optional)">
        <input
          data-testid="event-custom-attendees-input"
          value={fields.attendees}
          onChange={(e) => setFields({ ...fields, attendees: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Date">
        <input
          data-testid="event-custom-date-input"
          type="date"
          required
          value={fields.date}
          onChange={(e) => setFields({ ...fields, date: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Start Time">
        <input
          data-testid="event-custom-start-time-input"
          type="time"
          required
          value={fields.startTime}
          onChange={(e) => setFields({ ...fields, startTime: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="End Time (optional)">
        <input
          data-testid="event-custom-end-time-input"
          type="time"
          value={fields.endTime}
          onChange={(e) => setFields({ ...fields, endTime: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <CostUnitField
        testIdPrefix="event-custom"
        cost={fields.price}
        costUnit={fields.costUnit}
        onCostChange={(price) => setFields({ ...fields, price })}
        onCostUnitChange={(costUnit) => setFields({ ...fields, costUnit })}
      />
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
          data-testid="event-custom-save-button"
          type="submit"
          className={
            editing
              ? 'rounded bg-strong px-4 py-1.5 text-sm font-medium text-white'
              : 'rounded border border-line px-4 py-1.5 text-sm font-medium text-ink-soft'
          }
        >
          {editing ? 'Save changes' : 'Save as candidate'}
        </button>
        {!editing && (
          <button
            data-testid="event-custom-add-to-plan-button"
            type="button"
            onClick={() => {
              dispatch(addCustomEventAndConfirm(toInput()))
              setFields(DEFAULTS)
              onSaved()
            }}
            className="rounded bg-strong px-4 py-1.5 text-sm font-medium text-white"
          >
            Add to plan
          </button>
        )}
      </div>
    </form>
  )
}
