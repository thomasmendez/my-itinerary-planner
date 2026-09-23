import type { SavedHotelCreate } from '../api/savedHotels'
import type { CustomLodgingOption, HotelCandidate, SearchHotelOption } from '../types/hotels'

export function candidateCheckIn(candidate: HotelCandidate): string {
  return candidate.source === 'custom' ? candidate.check_in : candidate.check_in_date
}

export function candidateCheckOut(candidate: HotelCandidate): string {
  return candidate.source === 'custom' ? candidate.check_out : candidate.check_out_date
}

export function candidateLocation(candidate: HotelCandidate): string {
  return candidate.source === 'custom' ? (candidate.location ?? '') : candidate.location
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

export function candidatePricePerNight(candidate: HotelCandidate): number {
  return candidate.source === 'custom' ? candidate.price : candidate.rate_per_night.extracted_lowest
}

// Trip Spend totals need a total dollar amount, not the per-night rate the
// candidate/result cards display.
export function candidateTotalPrice(candidate: HotelCandidate): number {
  return candidatePricePerNight(candidate) * nightsBetween(candidateCheckIn(candidate), candidateCheckOut(candidate))
}

// Normalizes a not-yet-saved candidate into the payload the saved_hotels API expects.
// raw_payload is the candidate itself — the same shape already held client-side — so
// no information is lost, and loading it back is a straight spread
export function toSavedHotelCreate(candidate: SearchHotelOption | CustomLodgingOption): SavedHotelCreate {
  if (candidate.source === 'custom') {
    return {
      source: 'custom',
      name: candidate.name,
      address: candidate.location ?? '',
      check_in_date: candidate.check_in,
      check_out_date: candidate.check_out,
      price_per_night: candidate.price,
      rating: null,
      // No distance-from-center to compute without a search center, add when
      // custom lodging gains its own location geocoding.
      distance_km: null,
      latitude: null,
      longitude: null,
      raw_payload: candidate,
    }
  }

  return {
    source: 'search',
    name: candidate.name,
    // Real street address from the property-details call; falls back to the search query
    // text if that lookup failed (best-effort, never blocks the save).
    address: candidate.address ?? candidate.location,
    check_in_date: candidate.check_in_date,
    check_out_date: candidate.check_out_date,
    price_per_night: candidate.rate_per_night.extracted_lowest,
    rating: candidate.overall_rating ?? null,
    // SerpApi's google_hotels response has no distance-from-search-center field,
    // add when a provider/endpoint that returns one is wired in.
    distance_km: null,
    // Not a substitute for a real address - held for a possible future map feature.
    latitude: candidate.gps_coordinates.latitude,
    longitude: candidate.gps_coordinates.longitude,
    raw_payload: candidate,
  }
}
