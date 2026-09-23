import type { FlightOption } from '../api/flights'

// Custom (manually-entered) transport — not from SerpApi, so it only carries the
// fields the UI actually needs rather than SerpApi's per-leg shape (airplane,
// travel_class, legroom, ...). "source" discriminates it from search results
// wherever the two are mixed (Comparing list, trip plan, spend totals).
export type TransportMode = 'Self-drive' | 'Train' | 'Bus' | 'Ferry' | 'Carpool' | 'Other'

export type CustomTransportOption = {
  source: 'custom'
  mode: TransportMode
  from: string
  to: string
  depart: string // 'YYYY-MM-DD HH:mm' — same shape as FlightAirport.time
  return?: string
  price: number
  cost_unit: string
  notes?: string
  booking_token: string
}

// Set once the user picks a return leg for a round-trip outbound result (see
// ReturnFlightPicker); absent for one-way results and for round trips saved before a
// return leg could be selected.
export type SearchFlightOption = FlightOption & { source: 'search'; return_flight?: FlightOption }

// savedFlightId is the backend saved_flights.id — needed to PATCH/DELETE this candidate.
export type FlightCandidate = (SearchFlightOption | CustomTransportOption) & {
  savedAt: string
  savedFlightId: number
}

export type CustomTransportInput = {
  mode: TransportMode
  from: string
  to: string
  depart: string // datetime-local value, 'YYYY-MM-DDTHH:mm'
  return?: string
  price?: number
  costUnit?: string
  notes?: string
}
