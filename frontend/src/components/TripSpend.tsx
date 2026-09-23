import { useAppSelector } from '../store/hooks'
import { selectEventSpend } from '../store/eventsSlice'
import { selectFlightSpend } from '../store/flightsSlice'
import { selectHotelSpend } from '../store/hotelsSlice'
import { selectRentalSpend } from '../store/rentalsSlice'

const formatPrice = (n: number) => `$${n.toLocaleString('en-US')}`

export function TripSpend() {
  const flights = useAppSelector(selectFlightSpend)
  const hotels = useAppSelector(selectHotelSpend)
  const rentals = useAppSelector(selectRentalSpend)
  const events = useAppSelector(selectEventSpend)
  const confirmedTotal = flights.confirmedTotal + hotels.confirmedTotal + rentals.confirmedTotal + events.confirmedTotal
  const pendingTotal = flights.pendingTotal + hotels.pendingTotal + rentals.pendingTotal + events.pendingTotal
  const potentialCost = flights.potentialCost + hotels.potentialCost + rentals.potentialCost + events.potentialCost
  const hasCandidates = flights.hasCandidates || hotels.hasCandidates || rentals.hasCandidates || events.hasCandidates
  const { label } = flights

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Trip Spend
      </h2>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted" data-testid="trip-spend-flights-label">{label}</span>
          <span data-testid="trip-spend-flights">{formatPrice(flights.confirmedTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Hotel</span>
          <span data-testid="trip-spend-hotel">{formatPrice(hotels.confirmedTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Rental</span>
          <span data-testid="trip-spend-rental">{formatPrice(rentals.confirmedTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Events</span>
          <span data-testid="trip-spend-events">{formatPrice(events.confirmedTotal)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-line-soft pt-2 font-semibold text-ink">
          <span>Confirmed</span>
          <span data-testid="trip-spend-confirmed">{formatPrice(confirmedTotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>+ Pending</span>
          <span data-testid="trip-spend-pending">{formatPrice(pendingTotal)}</span>
        </div>
        <div className="flex justify-between border-t border-line-soft pt-2 font-semibold text-ink">
          <span>{pendingTotal === 0 ? 'Total Cost' : 'Potential Cost'}</span>
          <span data-testid="trip-spend-potential">{formatPrice(potentialCost)}</span>
        </div>
        {hasCandidates && (
          <p data-testid="trip-spend-snapshot-note" className="pt-1 text-xs text-faint">
            &#9432; Candidate prices are snapshots from save date.
          </p>
        )}
      </div>
    </div>
  )
}
