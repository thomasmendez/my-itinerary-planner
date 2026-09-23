import type { SavedEventCreate } from '../api/savedEvents'
import type { CustomEventOption, EventCandidate, SearchEventOption } from '../types/events'
import { formatFlightTime, formatShortDate, parseSerpApiEventDate } from './time'

// SerpApi gives no per-event id/token (unlike hotels' property_token) - a stable
// synthetic key is built from the fields that make two result entries distinguishable.
export function eventResultKey(option: SearchEventOption): string {
  return `${option.title}|${option.date}|${option.time ?? ''}|${option.address.join(',')}`
}

// Normalizes a not-yet-saved candidate into the payload the events API expects.
export function toSavedEventCreate(candidate: SearchEventOption | CustomEventOption): SavedEventCreate {
  if (candidate.source === 'custom') {
    return {
      source: 'custom',
      name: candidate.name,
      location: candidate.location ?? null,
      starts_at: candidate.starts_at,
      ends_at: candidate.ends_at ?? null,
      price: candidate.price ?? null,
      raw_payload: candidate,
    }
  }

  const { starts_at, ends_at } = parseSerpApiEventDate(candidate.date, candidate.time, new Date())
  return {
    source: 'search',
    name: candidate.title,
    location: candidate.address.join(', '),
    starts_at,
    ends_at,
    price: null,
    raw_payload: candidate,
  }
}

// Display accessors for an already-saved candidate (Comparing list, Trip Timeline).
export function candidateName(candidate: EventCandidate): string {
  return candidate.source === 'custom' ? candidate.name : candidate.title
}

export function candidateEventLocation(candidate: EventCandidate): string {
  return candidate.source === 'custom' ? (candidate.location ?? '') : candidate.address.join(', ')
}

// Search-sourced candidates carry no price (SerpApi gives none) - custom is the only
// priced source.
export function candidatePrice(candidate: EventCandidate): number {
  return candidate.source === 'custom' ? (candidate.price ?? 0) : 0
}

export function candidateCostUnit(candidate: EventCandidate): string {
  return candidate.source === 'custom' ? candidate.cost_unit : ''
}

// Backend-normalized starts_at (set by toEventCandidate from SavedEvent.starts_at) -
// sortable/comparable against flights/hotels/rentals, unlike search candidates' raw
// free-text `date` field.
export function candidateStartsAt(candidate: EventCandidate): string {
  return candidate.starts_at
}

// Read-only date/time label for the Comparing list. Search-sourced dates are already
// human-readable free text from SerpApi ("Oct 1", "3:00 PM"); custom starts_at is
// machine-formatted ('YYYY-MM-DD HH:mm') and needs formatting to match.
export function candidateDateTimeLabel(candidate: EventCandidate): string {
  if (candidate.source === 'custom') {
    const [date, time] = candidate.starts_at.split(' ')
    return time ? `${formatShortDate(date)} · ${formatFlightTime(candidate.starts_at, '12h')}` : formatShortDate(date)
  }
  return candidate.time ? `${candidate.date} · ${candidate.time}` : candidate.date
}
