import { useState } from 'react'
import { Field, fieldInputClass } from '../Field'
import { AIRPORTS } from '../../data/airports'
import type { Trip, TripInput } from '../../api/trips'

const CITY_OPTIONS = Array.from(new Set(AIRPORTS.map((a) => a.city))).sort()

type FormValues = {
  name: string
  destinations: string[]
  start_date: string
  end_date: string
  travelers: string[]
}

function fromTrip(trip?: Trip): FormValues {
  return {
    name: trip?.name ?? '',
    destinations: trip?.destinations ?? [],
    start_date: trip?.start_date ?? '',
    end_date: trip?.end_date ?? '',
    travelers: trip?.travelers ?? [],
  }
}

function toInput(values: FormValues): TripInput {
  return {
    name: values.name,
    destinations: values.destinations,
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    travelers: values.travelers,
  }
}

// Shared "type a value, Add or Enter to add it, click x to remove" chip list -
// used for both destinations (with a city datalist) and travelers (free text).
function TagListField({
  label,
  values,
  onChange,
  datalistId,
  datalistOptions,
  testIdPrefix,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  datalistId?: string
  datalistOptions?: string[]
  testIdPrefix: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const value = input.trim()
    if (!value || values.includes(value)) return
    onChange([...values, value])
    setInput('')
  }

  return (
    <Field label={label} extraClassName="col-span-full">
      <div className="flex gap-2">
        <input
          data-testid={`${testIdPrefix}-input`}
          list={datalistId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            add()
          }}
          className={`flex-1 ${fieldInputClass}`}
        />
        {datalistId && datalistOptions && (
          <datalist id={datalistId}>
            {datalistOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        )}
        <button
          data-testid={`${testIdPrefix}-add-button`}
          type="button"
          onClick={add}
          className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink-soft"
        >
          Add
        </button>
      </div>
      {values.length > 0 && (
        <ul data-testid={`${testIdPrefix}-list`} className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              data-testid={`${testIdPrefix}-chip`}
              className="flex items-center gap-1 rounded-full bg-line-soft px-3 py-1 text-xs text-ink-soft"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                data-testid={`${testIdPrefix}-remove-button`}
                onClick={() => onChange(values.filter((v) => v !== value))}
                className="text-faint hover:text-ink"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  )
}

export function TripForm({
  trip,
  submitLabel,
  onSubmit,
}: {
  trip?: Trip
  submitLabel: string
  onSubmit: (input: TripInput) => void
}) {
  const [values, setValues] = useState<FormValues>(fromTrip(trip))

  return (
    <form
      data-testid="trip-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(toInput(values))
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <Field label="Trip name" extraClassName="col-span-full">
        <input
          data-testid="trip-form-name-input"
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <TagListField
        label="Destinations (optional)"
        values={values.destinations}
        onChange={(destinations) => setValues({ ...values, destinations })}
        datalistId="trip-form-city-options"
        datalistOptions={CITY_OPTIONS}
        testIdPrefix="trip-form-destination"
      />
      <Field label="Start date (optional)">
        <input
          data-testid="trip-form-start-date-input"
          type="date"
          value={values.start_date}
          onChange={(e) => setValues({ ...values, start_date: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="End date (optional)">
        <input
          data-testid="trip-form-end-date-input"
          type="date"
          value={values.end_date}
          onChange={(e) => setValues({ ...values, end_date: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <TagListField
        label="Travelers (optional)"
        values={values.travelers}
        onChange={(travelers) => setValues({ ...values, travelers })}
        testIdPrefix="trip-form-traveler"
      />
      <div className="col-span-full flex justify-end">
        <button
          data-testid="trip-form-submit-button"
          type="submit"
          className="rounded bg-strong px-4 py-1.5 text-sm font-medium text-white"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
