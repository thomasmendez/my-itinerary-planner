import { http, HttpResponse } from 'msw'
import { googleEventsSearchResponse } from './data/events'
import {
  googleFlightsRoundTripSearchResponse,
  googleFlightsRoundTripWithTokensSearchResponse,
  googleFlightsSearchResponse,
  googleReturnFlightsSearchResponse,
} from './data/flights'
import { flightBookingTokenResponse } from './data/flightsBookingToken'
import { googleHotelsSearchResponse } from './data/hotels'
import { hotelPropertyDetailsResponse } from './data/hotelsPropertyDetails'
import { trips } from './data/trips'
import type { CalendarEntry } from '../api/calendar'
import type { EventSearchParams, GoogleEventsSearchResponse } from '../api/events'
import type { FlightSearchParams, GoogleFlightsSearchResponse } from '../api/flights'
import type { HotelSearchParams, GoogleHotelsSearchResponse } from '../api/hotels'
import type { MapPoint, RoutePoint } from '../api/map'
import type { SavedEvent, SavedEventCreate } from '../api/savedEvents'
import type { SavedFlight, SavedFlightCreate } from '../api/savedFlights'
import type { SavedHotel, SavedHotelCreate } from '../api/savedHotels'
import type { SavedRental, SavedRentalCreate } from '../api/savedRentals'
import type { ItemStatus } from '../types/common'
import type { Trip, TripInput } from '../api/trips'

// Three fixtures exist (see mocks/data/flights.ts): one one-way, one round-trip
// (tokenless, exercises the flightIdentity fallback), one round-trip with real tokens
// (exercises the ReturnFlightPicker flow). To see them in the UI, search one of:
//   From: CDG  To: AUS  Depart: 2026-07-30  Return: (blank, one-way)  Travelers: 1
//   From: DAL  To: DEN  Depart: 2026-11-01  Return: 2026-11-07            Travelers: 1
//   From: AUS  To: DEN  Depart: 2026-12-01  Return: 2026-12-08            Travelers: 1
// Any other combination returns a same-shaped response with no flights.
function emptyResponse(params: FlightSearchParams): GoogleFlightsSearchResponse {
  return {
    search_metadata: googleFlightsSearchResponse.search_metadata,
    search_parameters: {
      engine: 'google_flights',
      hl: 'en',
      gl: 'us',
      type: params.return.trim() ? '1' : '2',
      departure_id: params.from.trim().toUpperCase(),
      arrival_id: params.to.trim().toUpperCase(),
      outbound_date: params.depart,
      currency: 'USD',
    },
    best_flights: [],
    other_flights: [],
  }
}

let nextTripId = trips.reduce((max, t) => Math.max(max, t.id), 0) + 1

export const tripsHandlers = [
  http.get('/api/trips', () => HttpResponse.json(trips)),

  http.post('/api/trips', async ({ request }) => {
    const payload = (await request.json()) as TripInput
    const now = new Date().toISOString()
    const trip: Trip = { ...payload, id: nextTripId++, created_at: now, updated_at: now }
    trips.push(trip)
    return HttpResponse.json(trip, { status: 201 })
  }),

  http.patch('/api/trips/:tripId', async ({ params, request }) => {
    const trip = trips.find((t) => t.id === Number(params.tripId))
    if (!trip) return HttpResponse.json({ detail: 'Trip not found' }, { status: 404 })
    const payload = (await request.json()) as Partial<TripInput>
    Object.assign(trip, payload, { updated_at: new Date().toISOString() })
    return HttpResponse.json(trip)
  }),

  http.delete('/api/trips/:tripId', ({ params }) => {
    const index = trips.findIndex((t) => t.id === Number(params.tripId))
    if (index >= 0) trips.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// In-memory stand-ins for the saved_flights/hotels/rentals/events tables — reset on every
// full page load, same lifetime as the rest of this module's state. Doesn't replicate the
// real backend's
let nextSavedFlightId = 1
const savedFlightsByTrip = new Map<number, SavedFlight[]>()
let nextSavedHotelId = 1
const savedHotelsByTrip = new Map<number, SavedHotel[]>()
let nextSavedRentalId = 1
const savedRentalsByTrip = new Map<number, SavedRental[]>()
let nextSavedEventId = 1
const savedEventsByTrip = new Map<number, SavedEvent[]>()

// In-memory stand-in for calendar_entries one row per saved item
// (two for a flight with a return leg), kept in sync with the item's
// status, removed when the item is removed
let nextCalendarEntryId = 1
const calendarEntriesByTrip = new Map<number, CalendarEntry[]>()

function calendarEntriesForFlight(flight: SavedFlight): CalendarEntry[] {
  const now = new Date().toISOString()
  const base = {
    trip_id: flight.trip_id,
    status: flight.status,
    source_type: 'saved_flight' as const,
    source_id: flight.id,
    created_at: now,
    updated_at: now,
  }
  const entries: CalendarEntry[] = [
    {
      ...base,
      id: nextCalendarEntryId++,
      type: 'flight_departure',
      label: `${flight.airline} ${flight.origin} → ${flight.destination}`,
      starts_at: flight.outbound_departs_at,
      ends_at: flight.outbound_arrives_at,
    },
  ]
  if (flight.return_departs_at) {
    entries.push({
      ...base,
      id: nextCalendarEntryId++,
      type: 'flight_return',
      label: `${flight.airline} ${flight.destination} → ${flight.origin}`,
      starts_at: flight.return_departs_at,
      ends_at: flight.return_arrives_at ?? flight.return_departs_at,
    })
  }
  return entries
}

function calendarEntryForHotel(hotel: SavedHotel): CalendarEntry {
  const now = new Date().toISOString()
  return {
    trip_id: hotel.trip_id,
    status: hotel.status,
    source_type: 'saved_hotel',
    source_id: hotel.id,
    id: nextCalendarEntryId++,
    type: 'hotel',
    label: hotel.name,
    starts_at: hotel.check_in_date,
    ends_at: hotel.check_out_date,
    created_at: now,
    updated_at: now,
  }
}

function calendarEntryForRental(rental: SavedRental): CalendarEntry {
  const now = new Date().toISOString()
  return {
    trip_id: rental.trip_id,
    status: rental.status,
    source_type: 'saved_rental',
    source_id: rental.id,
    id: nextCalendarEntryId++,
    type: 'rental',
    label: rental.description,
    starts_at: rental.pickup_at,
    ends_at: rental.dropoff_at,
    created_at: now,
    updated_at: now,
  }
}

function calendarEntryForEvent(event: SavedEvent): CalendarEntry {
  const now = new Date().toISOString()
  return {
    trip_id: event.trip_id,
    status: event.status,
    source_type: 'event',
    source_id: event.id,
    id: nextCalendarEntryId++,
    type: 'event',
    label: event.name,
    starts_at: event.starts_at,
    ends_at: event.ends_at ?? event.starts_at,
    created_at: now,
    updated_at: now,
  }
}

// Generic GET-list/POST/PATCH/DELETE trio backing each saved-item domain's in-memory Map,
// POST inserts as a candidate and syncs calendar_entries,
// PATCH merges fields and re-syncs entries, DELETE drops the item and all its entries.
function makeSavedItemHandlers<T extends { id: number }, TCreate>(opts: {
  segment: string
  store: Map<number, T[]>
  nextId: () => number
  sourceType: CalendarEntry['source_type']
  notFoundDetail: string
  buildItem: (payload: TCreate, id: number, tripId: number) => T
  calendarEntriesFor: (item: T) => CalendarEntry[]
}) {
  const { segment, store, nextId, sourceType, notFoundDetail, buildItem, calendarEntriesFor } = opts

  function syncCalendarEntries(tripId: number, itemId: number, entries: CalendarEntry[]) {
    calendarEntriesByTrip.set(tripId, [
      ...(calendarEntriesByTrip.get(tripId) ?? []).filter(
        (e) => !(e.source_type === sourceType && e.source_id === itemId),
      ),
      ...entries,
    ])
  }

  return [
    http.get(`/api/trips/:tripId/${segment}`, ({ params }) =>
      HttpResponse.json(store.get(Number(params.tripId)) ?? []),
    ),

    http.post(`/api/trips/:tripId/${segment}`, async ({ params, request }) => {
      const tripId = Number(params.tripId)
      const payload = (await request.json()) as TCreate
      const item = buildItem(payload, nextId(), tripId)
      store.set(tripId, [...(store.get(tripId) ?? []), item])
      syncCalendarEntries(tripId, item.id, calendarEntriesFor(item))
      return HttpResponse.json(item, { status: 201 })
    }),

    http.patch(`/api/trips/:tripId/${segment}/:itemId`, async ({ params, request }) => {
      const tripId = Number(params.tripId)
      const itemId = Number(params.itemId)
      const payload = (await request.json()) as Partial<TCreate> & { status?: ItemStatus }
      const item = (store.get(tripId) ?? []).find((i) => i.id === itemId)
      if (!item) return HttpResponse.json({ detail: notFoundDetail }, { status: 404 })

      Object.assign(item, payload)
      syncCalendarEntries(tripId, itemId, calendarEntriesFor(item))
      return HttpResponse.json(item)
    }),

    http.delete(`/api/trips/:tripId/${segment}/:itemId`, ({ params }) => {
      const tripId = Number(params.tripId)
      const itemId = Number(params.itemId)
      store.set(tripId, (store.get(tripId) ?? []).filter((i) => i.id !== itemId))
      syncCalendarEntries(tripId, itemId, [])
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

export const savedFlightsHandlers = makeSavedItemHandlers<SavedFlight, SavedFlightCreate>({
  segment: 'flights',
  store: savedFlightsByTrip,
  nextId: () => nextSavedFlightId++,
  sourceType: 'saved_flight',
  notFoundDetail: 'Saved flight not found',
  buildItem: (payload, id, tripId) => ({
    ...payload,
    id,
    trip_id: tripId,
    status: 'candidate',
    return_departs_at: payload.return_departs_at ?? null,
    return_arrives_at: payload.return_arrives_at ?? null,
    overlap_warning: null,
    created_at: new Date().toISOString(),
  }),
  calendarEntriesFor: calendarEntriesForFlight,
})

export const calendarHandlers = [
  http.get('/api/trips/:tripId/calendar', ({ params }) =>
    HttpResponse.json(calendarEntriesByTrip.get(Number(params.tripId)) ?? []),
  ),
]

export const flightsHandlers = [
  http.post('/api/search/flights', async ({ request }) => {
    const params = (await request.json()) as FlightSearchParams
    const oneWay = googleFlightsSearchResponse.search_parameters
    const roundTrip = googleFlightsRoundTripSearchResponse.search_parameters

    const matchesOneWay =
      params.from.trim().toUpperCase() === oneWay.departure_id &&
      params.to.trim().toUpperCase() === oneWay.arrival_id &&
      params.depart === oneWay.outbound_date &&
      !params.return.trim() &&
      params.travelers === 1

    const matchesRoundTrip =
      params.from.trim().toUpperCase() === roundTrip.departure_id &&
      params.to.trim().toUpperCase() === roundTrip.arrival_id &&
      params.depart === roundTrip.outbound_date &&
      params.return.trim() === roundTrip.return_date &&
      params.travelers === 1

    const roundTripWithTokens = googleFlightsRoundTripWithTokensSearchResponse.search_parameters
    const matchesRoundTripWithTokens =
      params.from.trim().toUpperCase() === roundTripWithTokens.departure_id &&
      params.to.trim().toUpperCase() === roundTripWithTokens.arrival_id &&
      params.depart === roundTripWithTokens.outbound_date &&
      params.return.trim() === roundTripWithTokens.return_date &&
      params.travelers === 1

    if (matchesOneWay) return HttpResponse.json(googleFlightsSearchResponse)
    if (matchesRoundTrip) return HttpResponse.json(googleFlightsRoundTripSearchResponse)
    if (matchesRoundTripWithTokens) return HttpResponse.json(googleFlightsRoundTripWithTokensSearchResponse)
    return HttpResponse.json(emptyResponse(params))
  }),

  // Second step of the round-trip flow (ReturnFlightPicker) — re-issued with the outbound
  // result's departure_token. Only googleFlightsRoundTripWithTokensSearchResponse's token is
  // recognized; anything else returns a same-shaped empty response.
  http.post('/api/search/flights/return', async ({ request }) => {
    const body = (await request.json()) as { departure_token?: string }
    if (body.departure_token === googleFlightsRoundTripWithTokensSearchResponse.best_flights?.[0]?.departure_token) {
      return HttpResponse.json(googleReturnFlightsSearchResponse)
    }
    return HttpResponse.json({ ...googleReturnFlightsSearchResponse, best_flights: [] })
  }),

  // Only one fixture exists (see mocks/data/flightsBookingToken.ts) — a real SerpApi
  // `search` call re-issued with the selected flight's booking_token. Any booking_token
  // here returns that fixture's cheapest booking option's request (url + post_data).
  http.post('/api/search/flights/booking-link', async () => {
    const cheapest = flightBookingTokenResponse.booking_options[0]?.together?.booking_request
    return HttpResponse.json({ url: cheapest?.url ?? null, post_data: cheapest?.post_data ?? null })
  }),
]

// Only one fixture exists. To see it in the UI, search
// Location: Bali Resorts  Check-in: 2026-08-29  Check-out: 2026-08-30  Guests: 2
// Any other combination returns a same-shaped response with no properties.
function emptyHotelsResponse(params: HotelSearchParams): GoogleHotelsSearchResponse {
  return {
    search_metadata: googleHotelsSearchResponse.search_metadata,
    search_parameters: {
      engine: 'google_hotels',
      q: params.location,
      gl: 'us',
      hl: 'en',
      currency: 'USD',
      check_in_date: params.checkIn,
      check_out_date: params.checkOut,
      adults: params.guests,
      children: 0,
    },
    properties: [],
  }
}

export const hotelsHandlers = [
  http.post('/api/search/hotels', async ({ request }) => {
    const params = (await request.json()) as HotelSearchParams
    const { q, check_in_date, check_out_date, adults } = googleHotelsSearchResponse.search_parameters

    const matches =
      params.location.trim().toLowerCase() === q.toLowerCase() &&
      params.checkIn === check_in_date &&
      params.checkOut === check_out_date &&
      params.guests === adults

    return HttpResponse.json(matches ? googleHotelsSearchResponse : emptyHotelsResponse(params))
  }),

  // Only one fixture exists — a real SerpApi
  // `google_hotels` property-details call re-issued with the selected hotel's
  // property_token. Any property_token here returns that fixture's official booking link
  // and address.
  http.post('/api/search/hotels/booking-link', async () => {
    return HttpResponse.json({
      url: hotelPropertyDetailsResponse.link ?? null,
      address: hotelPropertyDetailsResponse.address ?? null,
    })
  }),
]

export const savedHotelsHandlers = makeSavedItemHandlers<SavedHotel, SavedHotelCreate>({
  segment: 'hotels',
  store: savedHotelsByTrip,
  nextId: () => nextSavedHotelId++,
  sourceType: 'saved_hotel',
  notFoundDetail: 'Saved hotel not found',
  buildItem: (payload, id, tripId) => ({
    ...payload,
    id,
    trip_id: tripId,
    status: 'candidate',
    rating: payload.rating ?? null,
    distance_km: payload.distance_km ?? null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    overlap_warning: null,
    created_at: new Date().toISOString(),
  }),
  calendarEntriesFor: (hotel) => [calendarEntryForHotel(hotel)],
})

export const savedRentalsHandlers = makeSavedItemHandlers<SavedRental, SavedRentalCreate>({
  segment: 'rentals',
  store: savedRentalsByTrip,
  nextId: () => nextSavedRentalId++,
  sourceType: 'saved_rental',
  notFoundDetail: 'Saved rental not found',
  buildItem: (payload, id, tripId) => ({
    ...payload,
    id,
    trip_id: tripId,
    status: 'candidate',
    overlap_warning: null,
    created_at: new Date().toISOString(),
  }),
  calendarEntriesFor: (rental) => [calendarEntryForRental(rental)],
})

// Only one fixture exists. To see it in the UI, search Location: Austin, Texas
// (case-insensitive) with Event name blank or Networking; dates don't affect matching.
// Any other input returns a same-shaped response with no events.
export const eventsHandlers = [
  http.post('/api/search/events', async ({ request }) => {
    const params = (await request.json()) as EventSearchParams
    const { location_requested } = googleEventsSearchResponse.search_parameters

    // Mirrors search/adapters/serpapi.py::search_events appending ", United States"
    // server-side to the city/state the user enters.
    const matches =
      ['', 'networking'].includes((params.eventName ?? '').trim().toLowerCase()) &&
      `${params.location.trim()}, United States`.toLowerCase() === location_requested.toLowerCase()

    // Mirrors search/adapters/serpapi.py::search_events, which strips the raw SerpApi
    // response down to just events_results before it reaches the client.
    const response: GoogleEventsSearchResponse = {
      events_results: matches ? googleEventsSearchResponse.events_results : [],
    }
    return HttpResponse.json(response)
  }),
]

export const savedEventsHandlers = makeSavedItemHandlers<SavedEvent, SavedEventCreate>({
  segment: 'events',
  store: savedEventsByTrip,
  nextId: () => nextSavedEventId++,
  sourceType: 'event',
  notFoundDetail: 'Saved event not found',
  buildItem: (payload, id, tripId) => ({
    ...payload,
    id,
    trip_id: tripId,
    status: 'candidate',
    overlap_warning: null,
    created_at: new Date().toISOString(),
  }),
  calendarEntriesFor: (event) => [calendarEntryForEvent(event)],
})

// Stands in for app/chat/service.py's provider round trip - always a single
// Anthropic-shaped text reply, no tool-call round trip (nothing in the widget's
// own tests needs one; the tool loop itself is covered by the backend's
// chat/test_service.py).
// Real geocoding can't run against ORS in e2e - a deterministic hash-based stand-in gives
// every location a stable (fake) coordinate so markers/routes still have something to render.
function fakeCoords(text: string): { latitude: number; longitude: number } {
  let hash = 0
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return { latitude: (Math.abs(hash) % 1800) / 10 - 90, longitude: (Math.abs(hash >> 8) % 3600) / 10 - 180 }
}

// A blank location string is never geocoded/plotted - mirrors the backend's map/service.py
// `_point`, which skips geocoding entirely (and leaves coordinates null) for a falsy location
// rather than guessing one (e.g. a hotel's name, which used to be a wrongful fallback here).
function coordsFor(location: string): { latitude: number | null; longitude: number | null } {
  return location ? fakeCoords(location) : { latitude: null, longitude: null }
}

// Mirrors backend/app/map/service.py's list_trip_points, reading the same
// in-memory maps the other handlers above already keep in sync.
function mapPointsFor(tripId: number): MapPoint[] {
  const points: MapPoint[] = []

  for (const flight of savedFlightsByTrip.get(tripId) ?? []) {
    points.push({
      source_type: 'saved_flight',
      source_id: flight.id,
      status: flight.status,
      label: `Departure: ${flight.origin}`,
      location: flight.origin,
      ...coordsFor(flight.origin),
    })
    points.push({
      source_type: 'saved_flight',
      source_id: flight.id,
      status: flight.status,
      label: `Arrival: ${flight.destination}`,
      location: flight.destination,
      ...coordsFor(flight.destination),
    })
  }

  for (const hotel of savedHotelsByTrip.get(tripId) ?? []) {
    // A hotel's name is not a location - only geocode/plot a real address.
    points.push({
      source_type: 'saved_hotel',
      source_id: hotel.id,
      status: hotel.status,
      label: hotel.name,
      location: hotel.address ?? '',
      ...(hotel.latitude != null && hotel.longitude != null
        ? { latitude: hotel.latitude, longitude: hotel.longitude }
        : coordsFor(hotel.address ?? '')),
    })
  }

  for (const rental of savedRentalsByTrip.get(tripId) ?? []) {
    points.push({
      source_type: 'saved_rental',
      source_id: rental.id,
      status: rental.status,
      label: rental.description,
      location: rental.pickup_location,
      ...coordsFor(rental.pickup_location),
    })
  }

  for (const event of savedEventsByTrip.get(tripId) ?? []) {
    // An event with no location still belongs in the list (flagged with a warning by the
    // frontend) rather than being dropped from it entirely.
    points.push({
      source_type: 'event',
      source_id: event.id,
      status: event.status,
      label: event.name,
      location: event.location ?? '',
      ...coordsFor(event.location ?? ''),
    })
  }

  return points
}

// A 1x1 transparent PNG - stands in for real OpenStreetMap tiles so the map tab renders
// without reaching the public internet. Leaflet's <img> tile requests go through the
// service worker like any other fetch; left unmocked, they'd hit the real tile servers and,
// with no network access, fail as an uncaught "Failed to fetch" inside the worker.
const BLANK_TILE_PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='),
  (c) => c.charCodeAt(0),
)

export const mapHandlers = [
  // MapView checks this once on mount for a proactive "ORS_API_KEY not set" warning that
  // doesn't depend on an actual geocode/route call failing - see MapView.tsx. Mocked as
  // configured by default; override via __mswTestOverrides to exercise the warning banner.
  http.get('/health', () => HttpResponse.json({ status: 'ok', ors_configured: true })),

  http.get('https://*.tile.openstreetmap.org/*', () => new HttpResponse(BLANK_TILE_PNG, { headers: { 'Content-Type': 'image/png' } })),

  http.get('/api/trips/:tripId/map/points', ({ params }) =>
    HttpResponse.json(mapPointsFor(Number(params.tripId))),
  ),

  http.post('/api/trips/:tripId/map/route', async ({ request }) => {
    const { points } = (await request.json()) as { points: RoutePoint[] }
    return HttpResponse.json({
      features: [
        {
          geometry: { coordinates: points.map((p) => [p.longitude, p.latitude]) },
          properties: { summary: { distance: 42000, duration: 3000 } },
        },
      ],
    })
  }),
]

const chatReplyText =
  import.meta.env.VITE_DEMO === 'true'
    ? 'This is a demo response, chat replies are placeholders. Run your own copy with an LLM provider API key or a local Ollama instance to enable the real assistant'
    : 'Mock reply: this is a stubbed assistant response.'

export const chatHandlers = [
  http.post('/api/chat', async ({ request }) => {
    const { messages } = (await request.json()) as { messages: Record<string, unknown>[] }
    return HttpResponse.json({
      messages: [
        ...messages,
        { role: 'assistant', content: [{ type: 'text', text: chatReplyText }] },
      ],
    })
  }),
]

export const handlers = [
  ...tripsHandlers,
  ...savedFlightsHandlers,
  ...savedHotelsHandlers,
  ...savedRentalsHandlers,
  ...savedEventsHandlers,
  ...calendarHandlers,
  ...flightsHandlers,
  ...hotelsHandlers,
  ...eventsHandlers,
  ...mapHandlers,
  ...chatHandlers,
]
