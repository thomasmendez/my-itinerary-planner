import type { FlightOption } from '../../api/flights'
import { flightIdentity, partitionFlightsByBest } from '../../store/flightsSlice'
import { FlightResultCard } from './FlightResultCard'

function FlightResultGroup({
  label,
  testId,
  flights,
  pendingIds,
  onCompare,
}: {
  label: string
  testId: string
  flights: FlightOption[]
  pendingIds: Set<string>
  onCompare: (flight: FlightOption) => void
}) {
  if (flights.length === 0) return null
  return (
    <div>
      <p data-testid={testId} className="mb-2 text-xs font-semibold uppercase text-faint">
        {label}
      </p>
      <div className="space-y-3">
        {flights.map((flight) => (
          <FlightResultCard
            key={flightIdentity(flight)}
            flight={flight}
            pending={pendingIds.has(flightIdentity(flight))}
            onCompare={() => onCompare(flight)}
          />
        ))}
      </div>
    </div>
  )
}

export function FlightResults({
  flights,
  loading,
  error,
  pendingIds,
  onCompare,
}: {
  flights: FlightOption[]
  loading: boolean
  error: string | null
  pendingIds: Set<string>
  onCompare: (flight: FlightOption) => void
}) {
  if (loading) return <p className="text-sm text-faint">Searching…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (flights.length === 0) return <p className="text-sm text-faint">No results.</p>

  const { best, other } = partitionFlightsByBest(flights)

  return (
    <div className="space-y-4">
      <p data-testid="flight-results-count" className="text-sm text-faint">
        {flights.length} results &middot; sorted by price
      </p>
      <FlightResultGroup
        label="Best flights"
        testId="flight-results-best-label"
        flights={best}
        pendingIds={pendingIds}
        onCompare={onCompare}
      />
      <FlightResultGroup
        label="Other flights"
        testId="flight-results-other-label"
        flights={other}
        pendingIds={pendingIds}
        onCompare={onCompare}
      />
    </div>
  )
}
