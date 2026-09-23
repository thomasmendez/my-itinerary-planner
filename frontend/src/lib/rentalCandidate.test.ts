import { describe, expect, it } from 'vitest'
import type { SavedRentalCreate } from '../api/savedRentals'
import type { CustomRentalOption } from '../types/rentals'
import { toSavedRentalCreate } from './rentalCandidate'

// Rentals are custom-entry only — there's no SearchRentalOption and therefore no
// source==='search' branch to test here, unlike hotelCandidate.test.ts.
// pickup_location is the only location column saved_rentals has (NOT NULL, and
// required client-side); dropoff_location and notes have no top-level column, so —
// mirroring how CustomLodgingOption.notes never appears on SavedHotelCreate — they
// only round-trip through raw_payload.
//
// pickup_at/dropoff_at carry full date+time (pickup/dropoff time of day matters for
// planning) as UTC-offset ISO-8601 strings, matching the backend test fixtures in
// rentals/test_router.py — not flights' offset-less local-time exception.

const customOption: CustomRentalOption = {
  source: 'custom',
  description: 'Rented SUV from Enterprise',
  pickup_location: 'Denver Airport (DEN)',
  dropoff_location: 'Denver Airport (DEN)',
  pickup_at: '2026-09-10T10:00:00+00:00',
  dropoff_at: '2026-09-15T10:00:00+00:00',
  price: 320,
  cost_unit: '/ rental',
  booking_token: 'custom-1',
}

describe('toSavedRentalCreate', () => {
  it('normalizes a custom rental entry', () => {
    const payload: SavedRentalCreate = toSavedRentalCreate(customOption)
    expect(payload).toEqual({
      source: 'custom',
      description: 'Rented SUV from Enterprise',
      pickup_location: 'Denver Airport (DEN)',
      pickup_at: '2026-09-10T10:00:00+00:00',
      dropoff_at: '2026-09-15T10:00:00+00:00',
      price: 320,
      raw_payload: customOption,
    })
  })

  it('keeps dropoff_location and notes out of the top-level payload, but preserves them in raw_payload', () => {
    const withNotes: CustomRentalOption = { ...customOption, notes: 'Free upgrade to a Jeep', booking_token: 'custom-2' }
    const payload = toSavedRentalCreate(withNotes)

    expect(payload).not.toHaveProperty('dropoff_location')
    expect(payload).not.toHaveProperty('notes')
    expect(payload.raw_payload).toMatchObject({
      dropoff_location: 'Denver Airport (DEN)',
      notes: 'Free upgrade to a Jeep',
    })
  })

  it('normalizes a free/borrowed-vehicle entry at $0', () => {
    const freeOption: CustomRentalOption = {
      ...customOption,
      description: "Borrowing Dad's car",
      price: 0,
      booking_token: 'custom-3',
    }
    const payload = toSavedRentalCreate(freeOption)

    expect(payload.price).toBe(0)
    expect(payload.raw_payload).toEqual(freeOption)
  })

  it('sends only pickup_location at the top level for a one-way rental with a different dropoff_location', () => {
    const oneWay: CustomRentalOption = {
      ...customOption,
      dropoff_location: 'Colorado Springs Airport (COS)',
      booking_token: 'custom-4',
    }
    const payload = toSavedRentalCreate(oneWay)

    expect(payload.pickup_location).toBe('Denver Airport (DEN)')
    expect(payload.raw_payload).toMatchObject({ dropoff_location: 'Colorado Springs Airport (COS)' })
  })
})
