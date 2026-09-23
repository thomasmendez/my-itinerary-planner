import { useAppSelector } from '../store/hooks'
import { selectFlightTripPlanEntries } from '../store/flightsSlice'
import { selectHotelTripPlanEntries } from '../store/hotelsSlice'
import { selectRentalTripPlanEntries } from '../store/rentalsSlice'
import { formatFlightTime, formatShortDate } from '../lib/time'
import { candidateDepartureTime, candidateLabel, candidateReturnTime, candidateRoute } from '../lib/flightCandidate'
import { candidateCheckIn, candidateCheckOut, candidateLocation } from '../lib/hotelCandidate'

// Critical dates only (flights/hotels/rentals) — events can be numerous, and live in full
// on the Timeline tab alongside everything else
type PlanEntry =
  | { kind: 'flight'; key: number; date: string }
  | { kind: 'hotel'; key: number; date: string }
  | { kind: 'rental'; key: number; date: string }

export function TripPlan() {
  const flights = useAppSelector(selectFlightTripPlanEntries)
  const hotels = useAppSelector(selectHotelTripPlanEntries)
  const rentals = useAppSelector(selectRentalTripPlanEntries)
  const timeFormat = useAppSelector((state) => state.settings.timeFormat)

  const entries: PlanEntry[] = [
    ...flights.map((f) => ({ kind: 'flight' as const, key: f.savedFlightId, date: candidateDepartureTime(f) })),
    ...hotels.map((h) => ({ kind: 'hotel' as const, key: h.savedHotelId, date: candidateCheckIn(h) })),
    ...rentals.map((r) => ({ kind: 'rental' as const, key: r.savedRentalId, date: r.pickup_at })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Trip Plan
      </h2>
      <p data-testid="trip-plan-events-note" className="mb-2 text-xs text-faint">
        Key bookings will be shown here. See the Calendar or Timeline tab for events.
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-faint">No confirmed items yet.</p>
      ) : (
        <div className="divide-y divide-line-soft">
          {entries.map((entry) => {
            if (entry.kind === 'flight') {
              const flight = flights.find((f) => f.savedFlightId === entry.key)!
              const departureTime = candidateDepartureTime(flight)
              const returnTime = candidateReturnTime(flight)
              return (
                <div key={`flight-${entry.key}`} data-testid="trip-plan-entry" className="flex items-start gap-3 py-3">
                  <span
                    data-testid="trip-plan-icon"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line-soft text-xs font-semibold text-ink-soft"
                  >
                    F
                  </span>
                  <div>
                    <p data-testid="trip-plan-date" className="text-xs text-faint">
                      {formatShortDate(departureTime)}
                    </p>
                    <p data-testid="trip-plan-description" className="text-sm font-semibold text-ink">
                      {candidateRoute(flight)} &nbsp;
                      {candidateLabel(flight)}
                    </p>
                    {returnTime ? (
                      <p data-testid="trip-plan-detail" className="text-xs text-faint">
                        Return {formatShortDate(returnTime)}
                      </p>
                    ) : (
                      <p data-testid="trip-plan-detail" className="text-xs text-faint">
                        Departs {formatFlightTime(departureTime, timeFormat)}
                      </p>
                    )}
                  </div>
                </div>
              )
            }

            if (entry.kind === 'hotel') {
              const hotel = hotels.find((h) => h.savedHotelId === entry.key)!
              return (
                <div key={`hotel-${entry.key}`} data-testid="trip-plan-entry" className="flex items-start gap-3 py-3">
                  <span
                    data-testid="trip-plan-icon"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line-soft text-xs font-semibold text-ink-soft"
                  >
                    H
                  </span>
                  <div>
                    <p data-testid="trip-plan-date" className="text-xs text-faint">
                      {formatShortDate(candidateCheckIn(hotel))}
                    </p>
                    <p data-testid="trip-plan-description" className="text-sm font-semibold text-ink">
                      {hotel.name} &nbsp;
                      {candidateLocation(hotel)}
                    </p>
                    <p data-testid="trip-plan-detail" className="text-xs text-faint">
                      Check-out {formatShortDate(candidateCheckOut(hotel))}
                    </p>
                  </div>
                </div>
              )
            }

            const rental = rentals.find((r) => r.savedRentalId === entry.key)!
            return (
              <div key={`rental-${entry.key}`} data-testid="trip-plan-entry" className="flex items-start gap-3 py-3">
                <span
                  data-testid="trip-plan-icon"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line-soft text-xs font-semibold text-ink-soft"
                >
                  R
                </span>
                <div>
                  <p data-testid="trip-plan-date" className="text-xs text-faint">
                    {formatShortDate(rental.pickup_at)}
                  </p>
                  <p data-testid="trip-plan-description" className="text-sm font-semibold text-ink">
                    {rental.description} &nbsp;
                    {rental.pickup_location}
                  </p>
                  <p data-testid="trip-plan-detail" className="text-xs text-faint">
                    Drop-off {formatShortDate(rental.dropoff_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
