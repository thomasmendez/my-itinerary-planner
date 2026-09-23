import type { SavedRentalCreate } from '../api/savedRentals'
import type { CustomRentalOption } from '../types/rentals'

// Normalizes a not-yet-saved candidate into the payload the saved_rentals API expects.
// Rentals are custom-entry only
export function toSavedRentalCreate(candidate: CustomRentalOption): SavedRentalCreate {
  return {
    source: 'custom',
    description: candidate.description,
    pickup_location: candidate.pickup_location,
    pickup_at: candidate.pickup_at,
    dropoff_at: candidate.dropoff_at,
    price: candidate.price,
    raw_payload: candidate,
  }
}

function formatDateTime(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ')
}

export function candidateDateRange(candidate: CustomRentalOption): string {
  return `${formatDateTime(candidate.pickup_at)} to ${formatDateTime(candidate.dropoff_at)}`
}
