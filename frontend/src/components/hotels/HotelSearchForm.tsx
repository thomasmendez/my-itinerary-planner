import { useState } from 'react'
import type { HotelSearchParams } from '../../api/hotels'
import { Field, fieldInputClass } from '../Field'
import { isMocking } from '../../lib/mocking'

// Dev mocking defaults to Bali Resorts/2026-08-29/2026-08-30, the one populated
// fixture (mocks/data/hotels.ts, mirrored by the backend's serpapi_stub.py).
const allowPastCheckInDate = isMocking || import.meta.env.VITE_ALLOW_PAST_DEPART_DATE === 'true'
const todayISO = () => new Date().toISOString().slice(0, 10)

const DEFAULTS: HotelSearchParams = {
  location: isMocking ? 'Bali Resorts' : '',
  checkIn: allowPastCheckInDate ? '2026-08-29' : todayISO(),
  checkOut: allowPastCheckInDate ? '2026-08-30' : todayISO(),
  guests: 2,
}

// Optional filters row — SerpApi has no explicit default value for these (unset means no
// filter); labelWithDefault() surfaces that via a native tooltip on the label. Mirrors
// FlightSearchForm's labelWithDefault.
function labelWithDefault(text: string, defaultLabel: string) {
  return <span title={`Default: ${defaultLabel}`}>{text}</span>
}

export function HotelSearchForm({
  onSearch,
  loading,
}: {
  onSearch: (params: HotelSearchParams) => void
  loading: boolean
}) {
  const [params, setParams] = useState<HotelSearchParams>(DEFAULTS)
  const [showFilters, setShowFilters] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(params)
      }}
      className="grid grid-cols-2 gap-3 rounded border border-line-soft p-4 sm:grid-cols-3 lg:grid-cols-5 lg:items-end"
    >
      <Field label="Location / Search">
        <input
          data-testid="hotel-location-input"
          placeholder="Bali Resorts"
          value={params.location}
          onChange={(e) => setParams({ ...params, location: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Check-in">
        <input
          data-testid="hotel-checkin-input"
          type="date"
          min={allowPastCheckInDate ? undefined : todayISO()}
          value={params.checkIn}
          onChange={(e) => setParams({ ...params, checkIn: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Check-out">
        <input
          data-testid="hotel-checkout-input"
          type="date"
          min={params.checkIn}
          value={params.checkOut}
          onChange={(e) => setParams({ ...params, checkOut: e.target.value })}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Guests">
        <input
          data-testid="hotel-guests-input"
          type="number"
          min={1}
          value={params.guests}
          onChange={(e) => setParams({ ...params, guests: Number(e.target.value) })}
          className={fieldInputClass}
        />
      </Field>
      <button
        type="button"
        data-testid="hotel-toggle-additional-options"
        onClick={() => setShowFilters(!showFilters)}
        className="col-span-full w-fit rounded border border-line px-3 py-1 text-sm font-medium text-ink-soft"
      >
        {showFilters ? 'Hide additional options' : 'Additional options'}
      </button>
      {showFilters && (
      <div className="col-span-full grid grid-cols-2 gap-3 border-t border-line-soft pt-3 sm:grid-cols-3 lg:grid-cols-5 lg:items-end">
        <p className="col-span-full text-xs text-muted">Optional filters — leave as-is to search with no preference.</p>
        <Field label={labelWithDefault('Sort by', 'Relevance')}>
          <select
            data-testid="hotel-sort-by-select"
            value={params.sort_by ?? ''}
            onChange={(e) => setParams({ ...params, sort_by: e.target.value ? Number(e.target.value) : undefined })}
            className={fieldInputClass}
          >
            <option value="">Relevance</option>
            <option value={3}>Lowest price</option>
            <option value={8}>Highest rating</option>
            <option value={13}>Most reviewed</option>
          </select>
        </Field>
        <Field label={labelWithDefault('Rating', 'Any')}>
          <select
            data-testid="hotel-rating-select"
            value={params.rating ?? ''}
            onChange={(e) => setParams({ ...params, rating: e.target.value ? Number(e.target.value) : undefined })}
            className={fieldInputClass}
          >
            <option value="">Any</option>
            <option value={7}>3.5+</option>
            <option value={8}>4.0+</option>
            <option value={9}>4.5+</option>
          </select>
        </Field>
        <Field label={labelWithDefault('Min price', 'No minimum')}>
          <input
            data-testid="hotel-min-price-input"
            type="number"
            min={0}
            placeholder="No minimum"
            value={params.min_price ?? ''}
            onChange={(e) => setParams({ ...params, min_price: e.target.value ? Number(e.target.value) : undefined })}
            className={fieldInputClass}
          />
        </Field>
        <Field label={labelWithDefault('Max price', 'Unlimited')}>
          <input
            data-testid="hotel-max-price-input"
            type="number"
            min={0}
            placeholder="No limit"
            value={params.max_price ?? ''}
            onChange={(e) => setParams({ ...params, max_price: e.target.value ? Number(e.target.value) : undefined })}
            className={fieldInputClass}
          />
        </Field>
      </div>
      )}
      <button
        data-testid="hotel-search-submit"
        type="submit"
        disabled={loading}
        className="rounded bg-strong px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
