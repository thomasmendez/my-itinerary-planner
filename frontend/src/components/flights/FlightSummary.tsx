import type { FlightOption } from '../../api/flights'
import { formatFlightTime, formatShortDate } from '../../lib/time'
import { useAppSelector } from '../../store/hooks'

const stopsLabel = (stops: number) =>
  stops === 0 ? 'Nonstop' : stops === 1 ? '1 stop' : `${stops} stops`

const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`

export function FlightSummary({ flight, testIdPrefix }: { flight: FlightOption; testIdPrefix: string }) {
  const timeFormat = useAppSelector((state) => state.settings.timeFormat)
  const firstLeg = flight.flights[0]
  const lastLeg = flight.flights[flight.flights.length - 1]
  const stops = flight.flights.length - 1

  return (
    <div className="flex items-center gap-4">
      <img
        src={flight.airline_logo}
        alt={firstLeg.airline}
        className="h-9 w-9 shrink-0 rounded bg-surface object-contain p-1"
      />
      <div>
        <p data-testid={`flight-${testIdPrefix}-airline`} className="text-xs text-faint">
          {firstLeg.airline}
        </p>
        <p data-testid={`flight-${testIdPrefix}-route`} className="text-sm font-semibold text-ink">
          {firstLeg.departure_airport.id} to {lastLeg.arrival_airport.id}
        </p>
        <p data-testid={`flight-${testIdPrefix}-detail`} className="text-xs text-faint">
          {formatShortDate(firstLeg.departure_airport.time)} &middot;{' '}
          {formatFlightTime(firstLeg.departure_airport.time, timeFormat)} &ndash;{' '}
          {formatFlightTime(lastLeg.arrival_airport.time, timeFormat)} &middot;{' '}
          {formatDuration(flight.total_duration)} &middot; {stopsLabel(stops)}
        </p>
      </div>
    </div>
  )
}
