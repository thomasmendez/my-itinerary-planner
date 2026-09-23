import type { EventOption } from '../api/events'

// "source" discriminates it from custom entries wherever the two are mixed (Comparing
// list, trip plan, spend totals).
export type SearchEventOption = EventOption & { source: 'search' }

// Custom (manually-entered) event — not from SerpApi. "Save as candidate" or "Add to
// plan" (save + immediately confirm, skipping the candidate stage).
export type CustomEventOption = {
  source: 'custom'
  name: string
  location?: string
  starts_at: string // 'YYYY-MM-DD HH:mm'
  ends_at?: string
  attendees?: string
  price?: number
  cost_unit: string
  booking_token: string
}

// savedEventId is the backend saved event's (events table) id — needed to PATCH/DELETE
// this candidate. starts_at is the backend's normalized ISO/space-separated value
// (SavedEvent.starts_at), not the raw_payload's free-text SerpApi date — search-sourced
// candidates carry no usable starts_at client-side otherwise, which broke chronological
// sort/comparison against flights/hotels/rentals.
export type EventCandidate = (SearchEventOption | CustomEventOption) & {
  savedAt: string
  savedEventId: number
  starts_at: string
}

export type CustomEventInput = {
  name: string
  location?: string
  date: string // date input value, 'YYYY-MM-DD'
  startTime: string // time input value, 'HH:mm'
  endTime?: string
  attendees?: string
  price?: number
  costUnit?: string
}
