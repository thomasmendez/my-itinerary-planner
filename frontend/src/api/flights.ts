import { parseOrThrow, postBestEffort } from './client'

// Types below mirror SerpApi's `engine=google_flights` response shape:
// https://serpapi.com/search.json?engine=google_flights
export type FlightAirport = {
  name: string
  id: string
  time: string
}

export type FlightLeg = {
  departure_airport: FlightAirport
  arrival_airport: FlightAirport
  duration: number
  airplane: string
  airline: string
  airline_logo: string
  travel_class: string
  flight_number: string
  ticket_also_sold_by?: string[]
  legroom?: string
  extensions?: string[]
  often_delayed_by_over_30_min?: boolean
  plane_and_crew_by?: string
}

export type FlightLayover = {
  duration: number
  name: string
  id: string
  overnight?: boolean
}

export type FlightCarbonEmissions = {
  this_flight: number
  typical_for_this_route: number
  difference_percent: number
}

export type FlightOption = {
  flights: FlightLeg[]
  layovers?: FlightLayover[]
  total_duration: number
  carbon_emissions?: FlightCarbonEmissions
  price: number
  type: string
  airline_logo: string
  extensions?: string[]
  booking_token?: string
  // Present on round-trip outbound results only — re-issuing the search with this token
  // fetches that leg's matching return-flight options (see fetchReturnFlights).
  departure_token?: string
  // Fetched separately via fetchFlightBookingLink once this flight is added as a
  // candidate (SerpApi requires a second `search` call with the booking_token to get
  // booking_options) — absent on raw search results, present once a candidate has it.
  direct_booking_url?: string | null
  // `url` alone 404s — Google's redirector requires this POSTed alongside it (see
  // DirectBookingLink.tsx). Only present when direct_booking_url is.
  direct_booking_post_data?: string | null
  // Client-side tag (not from SerpApi): true for best_flights, false for other_flights —
  // lets the UI split results the way Google Flights itself does. Absent on
  // candidates/confirmed/custom entries, which never go through this split.
  isBestFlight?: boolean
}

export type FlightPriceInsights = {
  lowest_price: number
  price_level: string
  typical_price_range: [number, number]
  price_history: [number, number][]
}

export type FlightAirportCity = {
  airport: { id: string; name: string }
  city: string
  country: string
  country_code: string
  image?: string
  thumbnail?: string
}

export type FlightAirportsEntry = {
  departure: FlightAirportCity[]
  arrival: FlightAirportCity[]
}

export type GoogleFlightsSearchResponse = {
  search_metadata: {
    id: string
    status: string
    json_endpoint: string
    created_at: string
    processed_at: string
    google_flights_url: string
    raw_html_file: string
    prettify_html_file: string
    total_time_taken: number
  }
  search_parameters: {
    engine: string
    hl: string
    gl: string
    type: string
    departure_id: string
    arrival_id: string
    outbound_date: string
    return_date?: string
    currency: string
  }
  best_flights?: FlightOption[]
  other_flights?: FlightOption[]
  price_insights?: FlightPriceInsights
  airports?: FlightAirportsEntry[]
}

// Raw shape of SerpApi's booking-token follow-up call (the second google_flights request
// that get_flight_booking_link makes, with booking_token attached) — richer than a plain
// search result: real booking_options (price tiers, baggage, the actual booking_request
// to POST) instead of just a booking_token. Only fetchFlightBookingLink's narrowed
// {url, post_data} reaches the client today; this type exists to keep the mock fixture
// (mocks/data/flightsBookingToken.ts) honest and to document the shape for future UI that
// might want e.g. baggage_prices or the other booking tiers.
export type FlightSelectedOption = {
  flights: FlightLeg[]
  layovers?: FlightLayover[]
  total_duration: number
  carbon_emissions?: FlightCarbonEmissions
  type: string
  airline_logo: string
}

export type FlightBookingOption = {
  together: {
    book_with: string
    airline: boolean
    airline_logos: string[]
    marketed_as: string[]
    price: number
    option_title: string
    extensions: string[]
    baggage_prices: string[]
    booking_request: { url: string; post_data?: string }
  }
}

export type FlightBookingTokenResponse = {
  search_metadata: {
    id: string
    status: string
    json_endpoint: string
    markdown_endpoint: string
    created_at: string
    processed_at: string
    google_flights_url: string
    raw_html_file: string
    prettify_html_file: string
    total_time_taken: number
  }
  search_parameters: {
    engine: string
    hl: string
    gl: string
    type: string
    departure_id: string
    arrival_id: string
    outbound_date: string
    booking_token: string
    currency: string
  }
  selected_flights: FlightSelectedOption[]
  baggage_prices: { together: string[] }
  booking_options: FlightBookingOption[]
  price_insights?: FlightPriceInsights
}

export type FlightSearchParams = {
  from: string
  to: string
  depart: string
  return: string
  travelers: number
  // Optional SerpApi filters — omit or leave at SerpApi's own default to search as before.
  travel_class?: number
  sort_by?: number
  stops?: number
  max_price?: number
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOption[]> {
  const res = await fetch('/api/search/flights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await parseOrThrow<GoogleFlightsSearchResponse>(res, 'Flight search')
  // show_hidden=true (adapter always sends it) puts the extra results in other_flights,
  // not best_flights — both need surfacing for it to actually mean "more options" here.
  return tagBestFlights(data)
}

function tagBestFlights(data: Pick<GoogleFlightsSearchResponse, 'best_flights' | 'other_flights'>): FlightOption[] {
  return [
    ...(data.best_flights ?? []).map((f) => ({ ...f, isBestFlight: true })),
    ...(data.other_flights ?? []).map((f) => ({ ...f, isBestFlight: false })),
  ]
}

// Best-effort enrichment, not on the save's critical path — swallows failures so a slow/
// broken booking-link lookup never blocks saving the candidate itself.
//
// SerpApi's booking-token flow re-issues the *original* google_flights search with
// booking_token added, not just the token alone - so this needs the same
// departure/arrival/date/type the search itself used, all recoverable from the flight.
export type BookingLink = { url: string | null; post_data: string | null }

const NO_BOOKING_LINK: BookingLink = { url: null, post_data: null }

async function fetchBookingLink(
  outbound: FlightOption,
  bookingToken: string | undefined,
  type: string,
  returnDate: string,
): Promise<BookingLink> {
  if (!bookingToken) return NO_BOOKING_LINK
  const firstLeg = outbound.flights[0]
  const lastLeg = outbound.flights[outbound.flights.length - 1]
  return postBestEffort(
    '/api/search/flights/booking-link',
    {
      departure_id: firstLeg.departure_airport.id,
      arrival_id: lastLeg.arrival_airport.id,
      outbound_date: firstLeg.departure_airport.time.slice(0, 10),
      return_date: returnDate,
      type,
      booking_token: bookingToken,
    },
    NO_BOOKING_LINK,
  )
}

export async function fetchFlightBookingLink(flight: FlightOption): Promise<BookingLink> {
  return fetchBookingLink(flight, flight.booking_token, flight.type === 'Round trip' ? '1' : '2', '')
}

// Round trip's second required SerpApi call: an outbound result's departure_token
// fetches that leg's matching return-flight options.
export async function fetchReturnFlights(outbound: FlightOption, returnDate: string): Promise<FlightOption[]> {
  const firstLeg = outbound.flights[0]
  const lastLeg = outbound.flights[outbound.flights.length - 1]
  const res = await fetch('/api/search/flights/return', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      departure_id: firstLeg.departure_airport.id,
      arrival_id: lastLeg.arrival_airport.id,
      outbound_date: firstLeg.departure_airport.time.slice(0, 10),
      return_date: returnDate,
      departure_token: outbound.departure_token,
    }),
  })
  const data = await parseOrThrow<GoogleFlightsSearchResponse>(res, 'Return flight search')
  return tagBestFlights(data)
}

// Booking-link lookup for a completed round trip — same shape as fetchFlightBookingLink,
// but uses the *return* leg's booking_token (that's the one SerpApi attaches real
// booking_options to for a round trip) plus the outbound leg's route/date and the return
// date, per SerpApi's round-trip booking-link requirement.
export async function fetchRoundTripBookingLink(
  outbound: FlightOption,
  returnFlight: FlightOption,
  returnDate: string,
): Promise<BookingLink> {
  return fetchBookingLink(outbound, returnFlight.booking_token, '1', returnDate)
}
