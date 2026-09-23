import { useEffect, useState } from 'react'
import { fetchReturnFlights, type FlightOption } from '../../api/flights'
import { flightIdentity, partitionFlightsByBest } from '../../store/flightsSlice'
import { FlightSummary } from './FlightSummary'

function ReturnFlightGroup({
  label,
  flights,
  saving,
  onSelect,
}: {
  label: string
  flights: FlightOption[]
  saving: boolean
  onSelect: (returnFlight: FlightOption) => void
}) {
  if (flights.length === 0) return null
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase text-faint">{label}</p>
      {flights.map((flight) => (
        <div
          key={flightIdentity(flight)}
          data-testid="return-flight-option"
          className="flex items-center justify-between gap-4 rounded border border-line-soft p-4"
        >
          <FlightSummary flight={flight} testIdPrefix="return-option" />
          <div className="flex items-center gap-4">
            <p data-testid="return-flight-option-price" className="text-lg font-bold text-ink">
              ${flight.price}
            </p>
            <button
              data-testid="return-flight-option-select-button"
              type="button"
              onClick={() => onSelect(flight)}
              disabled={saving}
              className="rounded bg-strong px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Select
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Shown after "+ Compare" on a round-trip outbound result (one with a departure_token) —
// SerpApi's round-trip search only returns outbound legs, so the return leg is a second
// call made here (`/search/flights/return`), once the user is ready to pick one.
export function ReturnFlightPicker({
  outbound,
  returnDate,
  saving = false,
  onSelect,
  onCancel,
}: {
  outbound: FlightOption
  returnDate: string
  saving?: boolean
  onSelect: (returnFlight: FlightOption) => void
  onCancel: () => void
}) {
  const [flights, setFlights] = useState<FlightOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { best, other } = partitionFlightsByBest(flights)

  useEffect(() => {
    let cancelled = false
    fetchReturnFlights(outbound, returnDate)
      .then((results) => {
        if (!cancelled) setFlights(results)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load return flights.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [outbound, returnDate])

  return (
    <div data-testid="return-flight-picker" className="space-y-3 rounded border border-line-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Choose a return flight</p>
        <button
          data-testid="return-flight-picker-cancel"
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-medium text-ink-soft disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      <div data-testid="return-flight-picker-outbound-reference" className="rounded bg-surface p-3">
        <p className="mb-2 text-xs font-medium text-faint">Your selected departure</p>
        <div className="flex items-center justify-between gap-4">
          <FlightSummary flight={outbound} testIdPrefix="outbound-reference" />
          <p data-testid="flight-outbound-reference-price" className="text-sm font-bold text-ink">
            ${outbound.price}
          </p>
        </div>
      </div>
      {loading && <p className="text-sm text-faint">Searching…</p>}
      {saving && <p data-testid="return-flight-picker-saving" className="text-sm text-faint">Saving candidate…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && flights.length === 0 && (
        <p className="text-sm text-faint">No return flights found.</p>
      )}
      <div className="space-y-4">
        <ReturnFlightGroup label="Best flights" flights={best} saving={saving} onSelect={onSelect} />
        <ReturnFlightGroup label="Other flights" flights={other} saving={saving} onSelect={onSelect} />
      </div>
    </div>
  )
}
