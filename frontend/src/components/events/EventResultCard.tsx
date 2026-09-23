import type { EventOption } from '../../api/events'
import { parseSerpApiEventDate } from '../../lib/time'

export function EventResultCard({
  event,
  onCompare,
}: {
  event: EventOption
  onCompare: (startsAt: string) => void
}) {
  const startsAt = parseSerpApiEventDate(event.date, event.time, new Date()).starts_at

  return (
    <div
      data-testid="event-result-card"
      className="flex items-center justify-between gap-4 rounded border border-line-soft p-4"
    >
      <div className="flex items-center gap-4">
        {event.thumbnail ? (
          <img src={event.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded bg-surface" />
        )}
        <div>
          <p data-testid="event-result-title" className="text-base font-semibold text-ink">
            {event.title}
          </p>
          {event.type && (
            <p data-testid="event-result-type" className="text-sm text-faint">
              {event.type}
            </p>
          )}
          <p data-testid="event-result-date" className="text-xs text-faint">
            {event.date}
            {event.time ? ` · ${event.time}` : ''}
          </p>
          <p data-testid="event-result-venue" className="text-xs text-faint">
            {event.address.join(', ')}
          </p>
        </div>
      </div>
      <button
        data-testid="event-result-compare-button"
        type="button"
        onClick={() => onCompare(startsAt)}
        className="rounded bg-strong px-3 py-1.5 text-sm font-medium text-white"
      >
        + Compare
      </button>
    </div>
  )
}
