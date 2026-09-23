import { parseOrThrow } from './client'

export type EventOption = {
  title: string
  type?: string
  date: string
  time?: string
  address: string[]
  thumbnail?: string
}

// The backend strips SerpApi's raw engine=google response down to just events_results
export type GoogleEventsSearchResponse = {
  events_results?: EventOption[]
}

export type EventSearchParams = {
  location: string
  eventName?: string
  startDate?: string
  endDate?: string
}

export async function searchEvents(params: EventSearchParams): Promise<EventOption[]> {
  const res = await fetch('/api/search/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await parseOrThrow<GoogleEventsSearchResponse>(res, 'Event search')
  return data.events_results ?? []
}
