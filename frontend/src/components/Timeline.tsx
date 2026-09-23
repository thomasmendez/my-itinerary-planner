import { useState, type ReactNode } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { removeCandidate as removeFlight } from '../store/flightsSlice'
import { removeCandidate as removeHotel } from '../store/hotelsSlice'
import { removeCandidate as removeRental } from '../store/rentalsSlice'
import { removeCandidate as removeEvent } from '../store/eventsSlice'
import { formatFlightTime, formatShortDate } from '../lib/time'
import {
  candidateDepartureTime,
  candidateLabel,
  candidateReturnRoute,
  candidateReturnTime,
  candidateRoute,
} from '../lib/flightCandidate'
import { candidateCheckIn, candidateCheckOut, candidateLocation } from '../lib/hotelCandidate'
import { candidateEventLocation, candidateName, candidateStartsAt } from '../lib/eventCandidate'
import type { FlightCandidate } from '../types/flights'
import type { HotelCandidate } from '../types/hotels'
import type { RentalCandidate } from '../types/rentals'
import type { EventCandidate } from '../types/events'
import { FlightCustomTransportForm } from './flights/FlightCustomTransportForm'
import { HotelCustomLodgingForm } from './hotels/HotelCustomLodgingForm'
import { RentalCustomVehicleForm } from './rentals/RentalCustomVehicleForm'
import { EventCustomForm } from './events/EventCustomForm'

type Status = 'candidate' | 'confirmed'

type Entry =
  | { kind: 'flight'; status: Status; date: string; item: FlightCandidate }
  | { kind: 'hotel'; status: Status; date: string; item: HotelCandidate }
  | { kind: 'rental'; status: Status; date: string; item: RentalCandidate }
  | { kind: 'event'; status: Status; date: string; item: EventCandidate }

// Flight (round-trip only), hotel, and rental entries render as two timeline rows
// (start leg + end leg) but are one saved item / one removal — this is what drives
// both the two-row split and the remove-confirmation wording, so removing from the
// second row doesn't look row-scoped. Behavior covered by e2e (timeline.spec.ts).
function pairedLegs(entry: Entry): { startLabel: string; start: string; endLabel: string; end: string } | null {
  if (entry.kind === 'flight') {
    const returnTime = candidateReturnTime(entry.item)
    return returnTime ? { startLabel: 'departure', start: candidateDepartureTime(entry.item), endLabel: 'return', end: returnTime } : null
  }
  if (entry.kind === 'hotel') {
    return { startLabel: 'check-in', start: candidateCheckIn(entry.item), endLabel: 'check-out', end: candidateCheckOut(entry.item) }
  }
  if (entry.kind === 'rental') {
    return { startLabel: 'pickup', start: entry.item.pickup_at, endLabel: 'drop-off', end: entry.item.dropoff_at }
  }
  return null
}

type Row = {
  key: string
  icon: string
  date: string
  description: ReactNode
  detail: string
  status: Status
  onRemove: () => void
  editForm?: (close: () => void) => ReactNode
}

// Only candidate custom entries are editable (confirmed dates are locked in, search
// results have no editable fields) - mirrors the *Comparing components' Edit gating.
function renderEditForm(entry: Entry): ((close: () => void) => ReactNode) | undefined {
  if (entry.status !== 'candidate' || entry.item.source !== 'custom') return undefined
  if (entry.kind === 'flight') {
    const item = entry.item
    return (close) => (
      <FlightCustomTransportForm editing={{ savedFlightId: item.savedFlightId, initial: item }} onSaved={close} onCancel={close} />
    )
  }
  if (entry.kind === 'hotel') {
    const item = entry.item
    return (close) => (
      <HotelCustomLodgingForm editing={{ savedHotelId: item.savedHotelId, initial: item }} onSaved={close} onCancel={close} />
    )
  }
  if (entry.kind === 'rental') {
    const item = entry.item
    return (close) => (
      <RentalCustomVehicleForm editing={{ savedRentalId: item.savedRentalId, initial: item }} onSaved={close} onCancel={close} />
    )
  }
  const item = entry.item
  return (close) => <EventCustomForm editing={{ savedEventId: item.savedEventId, initial: item }} onSaved={close} onCancel={close} />
}

function removeConfirmMessage(entry: Entry): string | null {
  const legs = pairedLegs(entry)
  const pairedNote = legs
    ? `This removes both the ${legs.startLabel} (${formatShortDate(legs.start)}) and ${legs.endLabel} (${formatShortDate(legs.end)}). `
    : ''
  if (!pairedNote && entry.status !== 'confirmed') return null
  return `Remove this item? ${pairedNote}${entry.status === 'confirmed' ? "This can't be undone." : ''}`
}

// Full list view across flights/hotels/rentals/events (candidates + confirmed), the one
// place a confirmed item can be removed if travel plans change — the left "Trip Plan"
// sidebar (TripPlan.tsx) stays read-only and critical-dates-only by design.
export function Timeline() {
  const dispatch = useAppDispatch()
  const flights = useAppSelector((state) => state.flights)
  const hotels = useAppSelector((state) => state.hotels)
  const rentals = useAppSelector((state) => state.rentals)
  const events = useAppSelector((state) => state.events)
  const timeFormat = useAppSelector((state) => state.settings.timeFormat)

  const entries: Entry[] = [
    ...flights.candidates.map((item) => ({ kind: 'flight' as const, status: 'candidate' as const, date: candidateDepartureTime(item), item })),
    ...flights.confirmed.map((item) => ({ kind: 'flight' as const, status: 'confirmed' as const, date: candidateDepartureTime(item), item })),
    ...hotels.candidates.map((item) => ({ kind: 'hotel' as const, status: 'candidate' as const, date: candidateCheckIn(item), item })),
    ...hotels.confirmed.map((item) => ({ kind: 'hotel' as const, status: 'confirmed' as const, date: candidateCheckIn(item), item })),
    ...rentals.candidates.map((item) => ({ kind: 'rental' as const, status: 'candidate' as const, date: item.pickup_at, item })),
    ...rentals.confirmed.map((item) => ({ kind: 'rental' as const, status: 'confirmed' as const, date: item.pickup_at, item })),
    ...events.candidates.map((item) => ({ kind: 'event' as const, status: 'candidate' as const, date: candidateStartsAt(item), item })),
    ...events.confirmed.map((item) => ({ kind: 'event' as const, status: 'confirmed' as const, date: candidateStartsAt(item), item })),
  ]

  function remove(entry: Entry) {
    const message = removeConfirmMessage(entry)
    if (message && !window.confirm(message)) return
    if (entry.kind === 'flight') dispatch(removeFlight(entry.item.savedFlightId))
    else if (entry.kind === 'hotel') dispatch(removeHotel(entry.item.savedHotelId))
    else if (entry.kind === 'rental') dispatch(removeRental(entry.item.savedRentalId))
    else dispatch(removeEvent(entry.item.savedEventId))
  }

  if (entries.length === 0) {
    return <p className="text-sm text-faint">Nothing saved yet.</p>
  }

  // Each leg (departure/return, check-in/check-out, pickup/drop-off) sorts on its own
  // date rather than by parent item, so e.g. an Oct 5 return doesn't render ahead of an
  // Oct 1 event just because its sibling departure leg was Sep 30.
  const rows: Row[] = entries.flatMap((entry): Row[] => {
    const editForm = renderEditForm(entry)
    if (entry.kind === 'flight') {
      const departureTime = candidateDepartureTime(entry.item)
      const returnTime = candidateReturnTime(entry.item)
      const description = (
        <>
          {candidateRoute(entry.item)} &nbsp;
          {candidateLabel(entry.item)}
        </>
      )
      const rows: Row[] = [
        {
          key: `flight-${entry.item.savedFlightId}-depart`,
          icon: 'F',
          date: departureTime,
          description,
          detail: `Departs ${formatFlightTime(departureTime, timeFormat)}`,
          status: entry.status,
          onRemove: () => remove(entry),
          editForm,
        },
      ]
      if (returnTime) {
        rows.push({
          key: `flight-${entry.item.savedFlightId}-return`,
          icon: 'F',
          date: returnTime,
          description: (
            <>
              {candidateReturnRoute(entry.item)} &nbsp;
              {candidateLabel(entry.item)}
            </>
          ),
          detail: `Returns ${formatFlightTime(returnTime, timeFormat)}`,
          status: entry.status,
          onRemove: () => remove(entry),
          editForm,
        })
      }
      return rows
    }
    if (entry.kind === 'hotel') {
      const description = (
        <>
          {entry.item.name} &nbsp;
          {candidateLocation(entry.item)}
        </>
      )
      return [
        {
          key: `hotel-${entry.item.savedHotelId}-checkin`,
          icon: 'H',
          date: candidateCheckIn(entry.item),
          description,
          detail: 'Check-in',
          status: entry.status,
          onRemove: () => remove(entry),
          editForm,
        },
        {
          key: `hotel-${entry.item.savedHotelId}-checkout`,
          icon: 'H',
          date: candidateCheckOut(entry.item),
          description,
          detail: 'Check-out',
          status: entry.status,
          onRemove: () => remove(entry),
          editForm,
        },
      ]
    }
    if (entry.kind === 'rental') {
      const description = (
        <>
          {entry.item.description} &nbsp;
          {entry.item.pickup_location}
        </>
      )
      return [
        {
          key: `rental-${entry.item.savedRentalId}-pickup`,
          icon: 'R',
          date: entry.item.pickup_at,
          description,
          detail: 'Pickup',
          status: entry.status,
          onRemove: () => remove(entry),
          editForm,
        },
        {
          key: `rental-${entry.item.savedRentalId}-dropoff`,
          icon: 'R',
          date: entry.item.dropoff_at,
          description,
          detail: 'Drop-off',
          status: entry.status,
          onRemove: () => remove(entry),
          editForm,
        },
      ]
    }
    const startsAt = candidateStartsAt(entry.item)
    return [
      {
        key: `event-${entry.item.savedEventId}`,
        icon: 'E',
        date: startsAt,
        description: (
          <>
            {candidateName(entry.item)} &nbsp;
            {candidateEventLocation(entry.item)}
          </>
        ),
        detail: startsAt,
        status: entry.status,
        onRemove: () => remove(entry),
        editForm,
      },
    ]
  })

  rows.sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      <p data-testid="timeline-count" className="mb-2 text-sm text-faint">
        {entries.length} {entries.length === 1 ? 'item' : 'items'}
      </p>
      <div className="divide-y divide-line-soft">
        {rows.map(({ key, ...row }) => (
          <TimelineRow key={key} {...row} />
        ))}
      </div>
    </div>
  )
}

function TimelineRow({
  icon,
  date,
  description,
  detail,
  status,
  onRemove,
  editForm,
}: Omit<Row, 'key'>) {
  const [editing, setEditing] = useState(false)

  if (editing && editForm) {
    return <div className="py-3">{editForm(() => setEditing(false))}</div>
  }

  return (
    <div data-testid="timeline-entry" className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-start gap-3">
        <span
          data-testid="timeline-icon"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line-soft text-xs font-semibold text-ink-soft"
        >
          {icon}
        </span>
        <div>
          <p data-testid="timeline-date" className="text-xs text-faint">
            {formatShortDate(date)}
          </p>
          <p data-testid="timeline-description" className="text-sm font-semibold text-ink">
            {description}
          </p>
          <p data-testid="timeline-detail" className="text-xs text-faint">
            {detail}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          data-testid="timeline-status"
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            status === 'confirmed' ? 'bg-strong text-white' : 'bg-line-soft text-ink-soft'
          }`}
        >
          {status === 'confirmed' ? 'Confirmed' : 'Candidate'}
        </span>
        {editForm && (
          <button
            data-testid="timeline-edit-button"
            type="button"
            onClick={() => setEditing(true)}
            className="rounded border border-line px-3 py-1 text-sm font-medium text-ink-soft"
          >
            Edit
          </button>
        )}
        <button
          data-testid="timeline-remove-button"
          type="button"
          onClick={onRemove}
          className="rounded border border-line px-3 py-1 text-sm font-medium text-ink-soft"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
