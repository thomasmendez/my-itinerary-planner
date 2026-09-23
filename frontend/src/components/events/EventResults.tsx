import type { EventOption } from '../../api/events'
import { EventResultCard } from './EventResultCard'
import { eventResultKey } from '../../lib/eventCandidate'

export function EventResults({
  events,
  loading,
  error,
  onCompare,
}: {
  events: EventOption[]
  loading: boolean
  error: string | null
  onCompare: (event: EventOption, startsAt: string) => void
}) {
  if (loading) return <p className="text-sm text-faint">Searching…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (events.length === 0) return <p className="text-sm text-faint">No results.</p>

  return (
    <div>
      <p data-testid="event-results-count" className="mb-2 text-sm text-faint">
        {events.length} results
      </p>
      <div className="space-y-3">
        {events.map((event) => (
          <EventResultCard
            key={eventResultKey({ ...event, source: 'search' })}
            event={event}
            onCompare={(startsAt) => onCompare(event, startsAt)}
          />
        ))}
      </div>
    </div>
  )
}
