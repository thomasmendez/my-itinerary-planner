import type { ItemStatus } from '../types/common'
import { parseOrThrow } from './client'

export type CalendarEntryType = 'flight_departure' | 'flight_return' | 'rental' | 'hotel' | 'event'
export type CalendarEntryStatus = ItemStatus
export type CalendarSourceType = 'saved_flight' | 'saved_rental' | 'saved_hotel' | 'event'

export type CalendarEntry = {
  id: number
  trip_id: number
  type: CalendarEntryType
  status: CalendarEntryStatus
  label: string
  starts_at: string
  ends_at: string
  source_type: CalendarSourceType
  source_id: number
  created_at: string
  updated_at: string
}

export async function fetchTripCalendar(tripId: number): Promise<CalendarEntry[]> {
  const res = await fetch(`/api/trips/${tripId}/calendar`)
  return parseOrThrow(res, 'Fetch calendar')
}
