import { useState } from 'react'
import type { FlightSearchParams } from '../../api/flights'
import { AIRPORTS } from '../../data/airports'
import { Field, fieldInputClass } from '../Field'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setTimeFormat } from '../../store/settingsSlice'
import type { TimeFormat } from '../../lib/time'
import { isMocking } from '../../lib/mocking'

// Dev mocking defaults to CDG/AUS/2026-07-30, the one populated fixture
// (serpapi.py's _stub_response). A live search defaults to today instead.
const allowPastDepartDate = isMocking || import.meta.env.VITE_ALLOW_PAST_DEPART_DATE === 'true'
const todayISO = () => new Date().toISOString().slice(0, 10)

const DEFAULTS: FlightSearchParams = {
  from: isMocking ? 'CDG' : '',
  to: isMocking ? 'AUS' : '',
  depart: allowPastDepartDate ? '2026-07-30' : todayISO(),
  return: '',
  travelers: 1,
  travel_class: 1,
  sort_by: 1,
  stops: 0,
}

// Optional filters row — SerpApi defaults to the first option/no limit when these are
// left as-is; labelWithDefault() surfaces that default via a native tooltip on the label.
function labelWithDefault(text: string, defaultLabel: string) {
  return <span title={`Default: ${defaultLabel}`}>{text}</span>
}

export function FlightSearchForm({
  onSearch,
  loading,
}: {
  onSearch: (params: FlightSearchParams) => void
  loading: boolean
}) {
  const [params, setParams] = useState<FlightSearchParams>(DEFAULTS)
  const [showFilters, setShowFilters] = useState(false)
  const dispatch = useAppDispatch()
  const timeFormat = useAppSelector((state) => state.settings.timeFormat)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(params)
      }}
      className="grid grid-cols-2 gap-3 rounded border border-line-soft p-4 sm:grid-cols-3 lg:grid-cols-6 lg:items-end"
    >
      <Field label="From">
        <input
          data-testid="flight-from-input"
          list="airport-options"
          placeholder="CDG"
          value={params.from}
          onChange={(e) => setParams({ ...params, from: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="To">
        <input
          data-testid="flight-to-input"
          list="airport-options"
          placeholder="AUS"
          value={params.to}
          onChange={(e) => setParams({ ...params, to: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <datalist id="airport-options">
        {AIRPORTS.map((airport) => (
          <option key={airport.code} value={airport.code}>
            {airport.name} ({airport.city})
          </option>
        ))}
      </datalist>
      <Field label="Depart">
        <input
          data-testid="flight-depart-input"
          type="date"
          min={allowPastDepartDate ? undefined : todayISO()}
          value={params.depart}
          onChange={(e) => setParams({ ...params, depart: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Return">
        <input
          data-testid="flight-return-input"
          type="date"
          value={params.return}
          onChange={(e) => setParams({ ...params, return: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Travelers">
        <input
          data-testid="flight-travelers-input"
          type="number"
          min={1}
          value={params.travelers}
          onChange={(e) => setParams({ ...params, travelers: Number(e.target.value) })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Time format">
        <select
          data-testid="flight-time-format-select"
          value={timeFormat}
          onChange={(e) => dispatch(setTimeFormat(e.target.value as TimeFormat))}
          className={fieldInputClass}
        >
          <option value="24h">24-hour (13:00)</option>
          <option value="12h">12-hour (1:00 PM)</option>
        </select>
      </Field>
      <button
        type="button"
        data-testid="flight-toggle-additional-options"
        onClick={() => setShowFilters(!showFilters)}
        className="col-span-full w-fit rounded border border-line px-3 py-1 text-sm font-medium text-ink-soft"
      >
        {showFilters ? 'Hide additional options' : 'Additional options'}
      </button>
      {showFilters && (
      <div className="col-span-full grid grid-cols-2 gap-3 border-t border-line-soft pt-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end">
        <p className="col-span-full text-xs text-muted">Optional filters — leave as-is to search with no preference.</p>
        <Field label={labelWithDefault('Class', 'Economy')}>
          <select
            data-testid="flight-class-select"
            value={params.travel_class}
            onChange={(e) => setParams({ ...params, travel_class: Number(e.target.value) })}
            className={fieldInputClass}
          >
            <option value={1}>Economy</option>
            <option value={2}>Premium economy</option>
            <option value={3}>Business</option>
            <option value={4}>First</option>
          </select>
        </Field>
        <Field label={labelWithDefault('Sort by', 'Top flights')}>
          <select
            data-testid="flight-sort-by-select"
            value={params.sort_by}
            onChange={(e) => setParams({ ...params, sort_by: Number(e.target.value) })}
            className={fieldInputClass}
          >
            <option value={1}>Top flights</option>
            <option value={2}>Price</option>
            <option value={3}>Departure time</option>
            <option value={4}>Arrival time</option>
            <option value={5}>Duration</option>
            <option value={6}>Emissions</option>
          </select>
        </Field>
        <Field label={labelWithDefault('Stops', 'Any number of stops')}>
          <select
            data-testid="flight-stops-select"
            value={params.stops}
            onChange={(e) => setParams({ ...params, stops: Number(e.target.value) })}
            className={fieldInputClass}
          >
            <option value={0}>Any number of stops</option>
            <option value={1}>Nonstop only</option>
            <option value={2}>1 stop or fewer</option>
            <option value={3}>2 stops or fewer</option>
          </select>
        </Field>
        <Field label={labelWithDefault('Max price', 'Unlimited')} extraClassName="sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2">
            <input
              data-testid="flight-max-price-input"
              type="number"
              min={0}
              placeholder="No limit"
              value={params.max_price ?? ''}
              onChange={(e) => setParams({ ...params, max_price: e.target.value ? Number(e.target.value) : undefined })}
              className={`${fieldInputClass} w-24`}
            />
            <input
              data-testid="flight-max-price-slider"
              type="range"
              min={0}
              max={9999}
              value={params.max_price ?? 9999}
              onChange={(e) => setParams({ ...params, max_price: Number(e.target.value) === 9999 ? undefined : Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </Field>
      </div>
      )}
      <button
        data-testid="flight-search-submit"
        type="submit"
        disabled={loading}
        className="rounded bg-strong px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
