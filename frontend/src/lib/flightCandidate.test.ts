import { describe, expect, it } from 'vitest'
import type { SavedFlightCreate } from '../api/savedFlights'
import type { FlightLeg } from '../api/flights'
import type { CustomTransportOption, FlightCandidate, SearchFlightOption } from '../types/flights'
import {
  candidateDepartureTime,
  candidateLabel,
  candidateReturnRoute,
  candidateReturnTime,
  candidateRoute,
  toSavedFlightCreate,
} from './flightCandidate'

const leg = (overrides: Partial<FlightLeg> = {}): FlightLeg => ({
  departure_airport: { name: 'Austin', id: 'AUS', time: '2026-08-29 08:00' },
  arrival_airport: { name: 'Denver', id: 'DEN', time: '2026-08-29 10:00' },
  duration: 120,
  airplane: 'Boeing 737',
  airline: 'United',
  airline_logo: 'https://example.com/logo.png',
  travel_class: 'Economy',
  flight_number: 'UA123',
  ...overrides,
})

const searchOption: SearchFlightOption = {
  source: 'search',
  flights: [leg()],
  total_duration: 120,
  price: 250,
  type: 'One way',
  airline_logo: 'https://example.com/logo.png',
  booking_token: 'token-1',
}

const multiLegOption: SearchFlightOption = {
  ...searchOption,
  flights: [
    leg(),
    leg({
      departure_airport: { name: 'Denver', id: 'DEN', time: '2026-08-29 11:00' },
      arrival_airport: { name: 'Seattle', id: 'SEA', time: '2026-08-29 13:00' },
    }),
  ],
}

const customOption: CustomTransportOption = {
  source: 'custom',
  mode: 'Train',
  from: 'Austin',
  to: 'Dallas',
  depart: '2026-08-29 08:00',
  price: 40,
  cost_unit: '/ travel',
  booking_token: 'custom-1',
}

describe('candidateDepartureTime', () => {
  it('reads the first leg time from a search candidate', () => {
    expect(candidateDepartureTime({ ...searchOption, savedAt: 'now', savedFlightId: 1 })).toBe('2026-08-29 08:00')
  })

  it('reads depart from a custom candidate', () => {
    expect(candidateDepartureTime({ ...customOption, savedAt: 'now', savedFlightId: 2 })).toBe('2026-08-29 08:00')
  })
})

describe('candidateRoute', () => {
  it('spans first departure to last arrival for a multi-leg search candidate', () => {
    expect(candidateRoute({ ...multiLegOption, savedAt: 'now', savedFlightId: 1 })).toBe('AUS to SEA')
  })

  it('reads from/to for a custom candidate', () => {
    expect(candidateRoute({ ...customOption, savedAt: 'now', savedFlightId: 2 })).toBe('Austin to Dallas')
  })
})

describe('candidateLabel', () => {
  it('combines airline and flight number for a search candidate', () => {
    expect(candidateLabel({ ...searchOption, savedAt: 'now', savedFlightId: 1 })).toBe('United UA123')
  })

  it('uses mode for a custom candidate', () => {
    expect(candidateLabel({ ...customOption, savedAt: 'now', savedFlightId: 2 })).toBe('Train')
  })
})

describe('toSavedFlightCreate', () => {
  it('normalizes a search result', () => {
    const payload: SavedFlightCreate = toSavedFlightCreate(multiLegOption)
    expect(payload).toEqual({
      source: 'search',
      origin: 'AUS',
      destination: 'SEA',
      outbound_departs_at: '2026-08-29 08:00',
      outbound_arrives_at: '2026-08-29 13:00',
      return_departs_at: null,
      return_arrives_at: null,
      airline: 'United',
      price: 250,
      duration_minutes: 120,
      stops: 1,
      raw_payload: multiLegOption,
    })
  })

  it('normalizes a custom transport entry, mirroring depart into arrives_at', () => {
    const payload: SavedFlightCreate = toSavedFlightCreate(customOption)
    expect(payload).toEqual({
      source: 'custom',
      origin: 'Austin',
      destination: 'Dallas',
      outbound_departs_at: '2026-08-29 08:00',
      outbound_arrives_at: '2026-08-29 08:00',
      return_departs_at: null,
      return_arrives_at: null,
      airline: 'Train',
      price: 40,
      duration_minutes: 0,
      stops: 0,
      raw_payload: customOption,
    })
  })

  it('carries return date through for a round-trip custom entry', () => {
    const roundTrip: CustomTransportOption = { ...customOption, return: '2026-09-02 18:00' }
    const payload: SavedFlightCreate = toSavedFlightCreate(roundTrip)
    expect(payload.return_departs_at).toBe('2026-09-02 18:00')
    expect(payload.return_arrives_at).toBe('2026-09-02 18:00')
  })
})

const customOneWay: FlightCandidate = {
  source: 'custom',
  mode: 'Self-drive',
  from: 'Dallas',
  to: 'Austin',
  depart: '2026-09-30 09:00',
  price: 60,
  cost_unit: '/ travel',
  booking_token: 'custom-1',
  savedAt: 'now',
  savedFlightId: 1,
}

const customRoundTrip: FlightCandidate = {
  ...customOneWay,
  return: '2026-10-05 16:30',
  savedFlightId: 2,
}

const searchFlight: FlightCandidate = {
  source: 'search',
  type: 'best',
  price: 220,
  total_duration: 120,
  airline_logo: '',
  flights: [
    {
      departure_airport: { id: 'DFW', name: 'Dallas', time: '2026-09-30 09:00' },
      arrival_airport: { id: 'AUS', name: 'Austin', time: '2026-09-30 10:00' },
      duration: 60,
      airplane: '737',
      airline: 'Delta',
      airline_logo: '',
      travel_class: 'Economy',
      flight_number: 'DL123',
    },
  ],
  savedAt: 'now',
  savedFlightId: 3,
}

const searchRoundTrip: FlightCandidate = {
  ...searchFlight,
  return_flight: {
    type: 'best',
    price: 220,
    total_duration: 65,
    airline_logo: '',
    booking_token: 'return-token-1',
    flights: [
      {
        departure_airport: { id: 'AUS', name: 'Austin', time: '2026-10-05 16:30' },
        arrival_airport: { id: 'DFW', name: 'Dallas', time: '2026-10-05 17:35' },
        duration: 65,
        airplane: '737',
        airline: 'Delta',
        airline_logo: '',
        travel_class: 'Economy',
        flight_number: 'DL456',
      },
    ],
  },
}

describe('candidateReturnTime', () => {
  it('reads the return date off a round-trip custom entry', () => {
    expect(candidateReturnTime(customRoundTrip)).toBe('2026-10-05 16:30')
  })

  it('is null for a one-way custom entry', () => {
    expect(candidateReturnTime(customOneWay)).toBeNull()
  })

  it('is null for a search flight with no return leg selected', () => {
    expect(candidateReturnTime(searchFlight)).toBeNull()
  })

  it('reads the return leg departure time off a round-trip search flight', () => {
    expect(candidateReturnTime(searchRoundTrip)).toBe('2026-10-05 16:30')
  })
})

describe('candidateReturnRoute', () => {
  it('reverses the custom route', () => {
    expect(candidateReturnRoute(customRoundTrip)).toBe('Austin to Dallas')
  })

  it('falls back to reversing the outbound route when no return leg was selected', () => {
    expect(candidateReturnRoute(searchFlight)).toBe('AUS to DFW')
  })

  it('uses the real return leg route when one was selected', () => {
    expect(candidateReturnRoute(searchRoundTrip)).toBe('AUS to DFW')
  })
})

describe('toSavedFlightCreate', () => {
  it('populates real return departs_at/arrives_at from the selected return leg', () => {
    const payload = toSavedFlightCreate(searchRoundTrip)
    expect(payload.return_departs_at).toBe('2026-10-05 16:30')
    expect(payload.return_arrives_at).toBe('2026-10-05 17:35')
  })

  it('leaves return departs_at/arrives_at null when no return leg was selected', () => {
    const payload = toSavedFlightCreate(searchFlight)
    expect(payload.return_departs_at).toBeNull()
    expect(payload.return_arrives_at).toBeNull()
  })
})
