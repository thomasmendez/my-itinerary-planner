import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loadCalendar } from '../../store/calendarSlice'
import type { CalendarEntry, CalendarEntryStatus } from '../../api/calendar'
import { formatShortDate, toDate } from '../../lib/time'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// day cells are small, cap dots instead of one per entry.
const MAX_DOTS = 4

const dotColor = (status: CalendarEntryStatus) => (status === 'confirmed' ? 'bg-blue-500' : 'bg-amber-400')
const badgeClass = (status: CalendarEntryStatus) =>
  status === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-amber-400 text-amber-950'

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 6 weeks covering the month, including leading/trailing days from adjacent
// months so the grid is always a full 7x6 rectangle.
function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(year, month, 1 - firstOfMonth.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return date
  })
}

const navButton =
  'rounded-md border border-line-soft px-3 py-1.5 text-lg/none text-ink hover:border-faint'

export function CalendarView() {
  const dispatch = useAppDispatch()
  const entries = useAppSelector((state) => state.calendar.entries)
  const loading = useAppSelector((state) => state.calendar.loading)

  const [monthCursor, setMonthCursor] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))

  // Jump to the earliest entry's day the moment the first (and only, per mount)
  // load finishes — entries arrive pre-sorted by starts_at (see calendarSlice).
  // Adjusting state during render, not an effect: https://react.dev/learn/you-might-not-need-an-effect.
  const [prevLoading, setPrevLoading] = useState(loading)
  if (loading !== prevLoading) {
    setPrevLoading(loading)
    if (prevLoading && !loading && entries.length > 0) {
      const earliest = toDate(entries[0].starts_at)
      setMonthCursor(new Date(earliest.getFullYear(), earliest.getMonth(), 1))
      setSelectedDate(toDateKey(earliest))
    }
  }

  useEffect(() => {
    dispatch(loadCalendar())
  }, [dispatch])

  const grid = useMemo(() => getMonthGrid(monthCursor.getFullYear(), monthCursor.getMonth()), [monthCursor])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>()
    for (const entry of entries) {
      const start = toDate(entry.starts_at)
      const end = toDate(entry.ends_at)
      if (entry.type === 'rental' || entry.type === 'hotel') {
        // Rental (pickup/dropoff) and hotel (check-in/check-out) are boundary events,
        // not occupancy spans - dot only those two days.
        for (const key of new Set([toDateKey(start), toDateKey(end)])) {
          const forDate = map.get(key) ?? []
          forDate.push(entry)
          map.set(key, forDate)
        }
        continue
      }
      // Other multi-day entries span more than one calendar cell - place the entry on
      // every day in [starts_at, ends_at], not just the start day, or the end day
      // silently has no dot.
      for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        const key = toDateKey(day)
        const forDate = map.get(key) ?? []
        forDate.push(entry)
        map.set(key, forDate)
      }
    }
    return map
  }, [entries])

  const todayKey = toDateKey(new Date())
  const selectedEntries = entriesByDate.get(selectedDate) ?? []

  function changeMonth(offset: number) {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-center gap-4">
        <button
          type="button"
          data-testid="calendar-prev-month-button"
          className={navButton}
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2
          data-testid="calendar-month-label"
          className="min-w-[160px] text-center text-lg font-medium text-ink"
        >
          {monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          type="button"
          data-testid="calendar-next-month-button"
          className={navButton}
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          ›
        </button>
      </header>

      <div className="mb-3 flex items-center justify-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-400" /> Candidate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-500" /> Confirmed
        </span>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs text-faint">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((date) => {
          const key = toDateKey(date)
          const dayEntries = entriesByDate.get(key) ?? []
          const isOutside = date.getMonth() !== monthCursor.getMonth()
          const isToday = key === todayKey
          const isSelected = key === selectedDate

          return (
            <button
              type="button"
              key={key}
              data-testid="calendar-day"
              data-date={key}
              onClick={() => setSelectedDate(key)}
              className={[
                'relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md border hover:border-faint',
                isSelected ? 'border-ink bg-surface' : 'border-line-soft bg-transparent',
                isOutside ? 'text-line' : 'text-ink',
              ].join(' ')}
            >
              <span className={isToday ? 'font-semibold text-ink underline' : undefined}>
                {date.getDate()}
              </span>
              {dayEntries.length > 0 && (
                <span className="flex gap-0.5">
                  {dayEntries.slice(0, MAX_DOTS).map((entry) => (
                    <span
                      key={entry.id}
                      data-testid="calendar-day-dot"
                      className={`size-[5px] rounded-full ${dotColor(entry.status)}`}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <section className="mt-6 border-t border-line-soft pt-4">
        {entries.length === 0 ? (
          <p className="text-sm text-faint">No items on the calendar yet.</p>
        ) : selectedEntries.length === 0 ? (
          <p className="text-sm text-faint">No items on this day.</p>
        ) : (
          <div className="divide-y divide-line-soft">
            {selectedEntries.map((entry) => (
              <div key={entry.id} data-testid="calendar-entry" className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p data-testid="calendar-entry-date" className="text-xs text-faint">
                    {toDateKey(toDate(entry.starts_at)) === toDateKey(toDate(entry.ends_at))
                      ? formatShortDate(entry.starts_at)
                      : `${formatShortDate(entry.starts_at)} – ${formatShortDate(entry.ends_at)}`}
                  </p>
                  <p data-testid="calendar-entry-label" className="text-sm font-semibold text-ink">
                    {entry.label}
                  </p>
                </div>
                <span
                  data-testid="calendar-entry-status"
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(entry.status)}`}
                >
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
