import { useState } from 'react'
import type { EventSearchParams } from '../../api/events'
import { Field, fieldInputClass } from '../Field'
import { isMocking } from '../../lib/mocking'
import { US_STATES } from '../../lib/usStates'

// Only city and state are required (sent as one "City, State" location); event name and dates
// are optional. Dev mocking defaults to Austin, Texas, the one populated fixture (mocks/data/events.ts).
const allowPastEventDate = isMocking || import.meta.env.VITE_ALLOW_PAST_DEPART_DATE === 'true'
const todayISO = () => new Date().toISOString().slice(0, 10)

const DEFAULTS = {
  city: isMocking ? 'Austin' : '',
  state: isMocking ? 'Texas' : '',
  eventName: '',
  startDate: '',
  endDate: '',
}

export function EventSearchForm({
  onSearch,
  loading,
}: {
  onSearch: (params: EventSearchParams) => void
  loading: boolean
}) {
  const [params, setParams] = useState(DEFAULTS)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const { city, state, ...rest } = params
        onSearch({ ...rest, location: `${city.trim()}, ${state}` })
      }}
      className="grid grid-cols-2 gap-3 rounded border border-line-soft p-4 sm:grid-cols-3 lg:grid-cols-6 lg:items-end"
    >
      <Field label="City">
        <input
          data-testid="event-city-input"
          placeholder="Austin"
          required
          value={params.city}
          onChange={(e) => setParams({ ...params, city: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="State">
        <select
          data-testid="event-state-select"
          required
          value={params.state}
          onChange={(e) => setParams({ ...params, state: e.target.value })}
          className={fieldInputClass}
        >
          <option value="">Select a state</option>
          {US_STATES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Event name (optional)" extraClassName="col-span-2 sm:col-span-1">
        <input
          data-testid="event-name-input"
          placeholder="Networking"
          value={params.eventName}
          onChange={(e) => setParams({ ...params, eventName: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Date from (optional)">
        <input
          data-testid="event-date-start-input"
          type="date"
          min={allowPastEventDate ? undefined : todayISO()}
          value={params.startDate}
          onChange={(e) => setParams({ ...params, startDate: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Date to (optional)">
        <input
          data-testid="event-date-end-input"
          type="date"
          min={params.startDate}
          value={params.endDate}
          onChange={(e) => setParams({ ...params, endDate: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <button
        data-testid="event-search-submit"
        type="submit"
        disabled={loading}
        className="rounded bg-strong px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
