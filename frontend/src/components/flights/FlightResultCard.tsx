import type { FlightOption } from '../../api/flights'
import { FlightSummary } from './FlightSummary'

export function FlightResultCard({
  flight,
  pending = false,
  onCompare,
}: {
  flight: FlightOption
  pending?: boolean
  onCompare: () => void
}) {
  return (
    <div
      data-testid="flight-result-card"
      className={`flex items-center justify-between gap-4 rounded border border-line-soft p-4 ${pending ? 'opacity-50' : ''}`}
    >
      <FlightSummary flight={flight} testIdPrefix="result" />
      <div className="flex items-center gap-4">
        <p data-testid="flight-result-price" className="text-lg font-bold text-ink">
          ${flight.price}
        </p>
        <button
          data-testid="flight-result-compare-button"
          type="button"
          onClick={onCompare}
          disabled={pending}
          className="rounded bg-strong px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Adding to trip…' : '+ Compare'}
        </button>
      </div>
    </div>
  )
}
