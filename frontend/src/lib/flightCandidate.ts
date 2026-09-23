import type { SavedFlightCreate } from '../api/savedFlights'
import type { CustomTransportOption, FlightCandidate, SearchFlightOption } from '../types/flights'

export function candidateDepartureTime(candidate: FlightCandidate): string {
  return candidate.source === 'custom' ? candidate.depart : candidate.flights[0].departure_airport.time
}

export function candidateRoute(candidate: FlightCandidate): string {
  if (candidate.source === 'custom') return `${candidate.from} to ${candidate.to}`
  const firstLeg = candidate.flights[0]
  const lastLeg = candidate.flights[candidate.flights.length - 1]
  return `${firstLeg.departure_airport.id} to ${lastLeg.arrival_airport.id}`
}

export function candidateReturnTime(candidate: FlightCandidate): string | null {
  if (candidate.source === 'custom') return candidate.return ?? null
  const returnFlight = candidate.return_flight
  return returnFlight ? returnFlight.flights[0].departure_airport.time : null
}

export function candidateReturnRoute(candidate: FlightCandidate): string {
  if (candidate.source === 'custom') return `${candidate.to} to ${candidate.from}`
  if (candidate.return_flight) {
    const firstLeg = candidate.return_flight.flights[0]
    const lastLeg = candidate.return_flight.flights[candidate.return_flight.flights.length - 1]
    return `${firstLeg.departure_airport.id} to ${lastLeg.arrival_airport.id}`
  }
  const firstLeg = candidate.flights[0]
  const lastLeg = candidate.flights[candidate.flights.length - 1]
  return `${lastLeg.arrival_airport.id} to ${firstLeg.departure_airport.id}`
}

export function candidateLabel(candidate: FlightCandidate): string {
  return candidate.source === 'custom'
    ? candidate.mode
    : `${candidate.flights[0].airline} ${candidate.flights[0].flight_number}`
}

// Normalizes a not-yet-saved candidate into the payload the saved_flights API expects.
// raw_payload is the candidate itself — the same shape already held client-side — so
// no information is lost, and loading it back is a straight spread.
export function toSavedFlightCreate(candidate: SearchFlightOption | CustomTransportOption): SavedFlightCreate {
  if (candidate.source === 'custom') {
    return {
      source: 'custom',
      origin: candidate.from,
      destination: candidate.to,
      outbound_departs_at: candidate.depart,
      // The custom transport form only collects one depart/return timestamp
      // each (no separate arrival time), so arrives_at mirrors departs_at.
      outbound_arrives_at: candidate.depart,
      return_departs_at: candidate.return ?? null,
      return_arrives_at: candidate.return ?? null,
      airline: candidate.mode,
      price: candidate.price,
      duration_minutes: 0,
      stops: 0,
      raw_payload: candidate,
    }
  }

  const firstLeg = candidate.flights[0]
  const lastLeg = candidate.flights[candidate.flights.length - 1]
  return {
    source: 'search',
    origin: firstLeg.departure_airport.id,
    destination: lastLeg.arrival_airport.id,
    outbound_departs_at: firstLeg.departure_airport.time,
    outbound_arrives_at: lastLeg.arrival_airport.time,
    return_departs_at: candidate.return_flight ? candidate.return_flight.flights[0].departure_airport.time : null,
    return_arrives_at: candidate.return_flight
      ? candidate.return_flight.flights[candidate.return_flight.flights.length - 1].arrival_airport.time
      : null,
    airline: firstLeg.airline,
    price: candidate.price,
    duration_minutes: candidate.total_duration,
    stops: candidate.flights.length - 1,
    raw_payload: candidate,
  }
}
