import { describe, expect, it } from 'vitest'
import type { SavedHotelCreate } from '../api/savedHotels'
import type { CustomLodgingOption, SearchHotelOption } from '../types/hotels'
import {
  candidateCheckIn,
  candidateCheckOut,
  candidateLocation,
  candidatePricePerNight,
  candidateTotalPrice,
  nightsBetween,
  toSavedHotelCreate,
} from './hotelCandidate'

const searchOption: SearchHotelOption = {
  source: 'search',
  type: 'hotel',
  name: 'Sol by Melia Benoa Bali',
  property_token: 'ChcI4e7r_e32oJUmGgsvZy8xdnA1XzlzZxAB',
  gps_coordinates: { latitude: -8.786757, longitude: 115.226429 },
  check_in_time: '3:00 PM',
  check_out_time: '12:00 PM',
  rate_per_night: { lowest: '$130', extracted_lowest: 130 },
  total_rate: { lowest: '$130', extracted_lowest: 130 },
  overall_rating: 4.5,
  location: 'Bali Resorts',
  check_in_date: '2026-08-29',
  check_out_date: '2026-08-30',
}

const customOption: CustomLodgingOption = {
  source: 'custom',
  name: "Staying at Mom's house",
  location: 'Austin, TX',
  check_in: '2026-08-29',
  check_out: '2026-08-30',
  price: 0,
  cost_unit: '/ night',
  booking_token: 'custom-1',
}

describe('candidateCheckIn / candidateCheckOut', () => {
  it('reads dates from the search option', () => {
    expect(candidateCheckIn({ ...searchOption, savedAt: 'now', savedHotelId: 1 })).toBe('2026-08-29')
    expect(candidateCheckOut({ ...searchOption, savedAt: 'now', savedHotelId: 1 })).toBe('2026-08-30')
  })

  it('reads dates from the custom option', () => {
    expect(candidateCheckIn({ ...customOption, savedAt: 'now', savedHotelId: 2 })).toBe('2026-08-29')
    expect(candidateCheckOut({ ...customOption, savedAt: 'now', savedHotelId: 2 })).toBe('2026-08-30')
  })
})

describe('candidateLocation', () => {
  it('falls back to an empty string for a custom option with no location', () => {
    const withoutLocation: CustomLodgingOption = { ...customOption, location: undefined }
    expect(candidateLocation({ ...withoutLocation, savedAt: 'now', savedHotelId: 2 })).toBe('')
  })
})

describe('nightsBetween', () => {
  it('counts nights between check-in and check-out', () => {
    expect(nightsBetween('2026-08-29', '2026-08-30')).toBe(1)
    expect(nightsBetween('2026-08-29', '2026-09-02')).toBe(4)
  })

  it('floors at 1 night for a same-day stay', () => {
    expect(nightsBetween('2026-08-29', '2026-08-29')).toBe(1)
  })
})

describe('candidatePricePerNight / candidateTotalPrice', () => {
  it('reads the rate off a search candidate and multiplies by nights', () => {
    const multiNight: SearchHotelOption = { ...searchOption, check_out_date: '2026-09-02' }
    const candidate = { ...multiNight, savedAt: 'now', savedHotelId: 1 }

    expect(candidatePricePerNight(candidate)).toBe(130)
    expect(candidateTotalPrice(candidate)).toBe(130 * 4)
  })

  it('reads the price off a custom candidate and multiplies by nights', () => {
    const multiNight: CustomLodgingOption = { ...customOption, price: 200, check_out: '2026-09-01' }
    const candidate = { ...multiNight, savedAt: 'now', savedHotelId: 2 }

    expect(candidatePricePerNight(candidate)).toBe(200)
    expect(candidateTotalPrice(candidate)).toBe(200 * 3)
  })
})

describe('toSavedHotelCreate', () => {
  it('normalizes a search result', () => {
    const payload: SavedHotelCreate = toSavedHotelCreate(searchOption)
    expect(payload).toEqual({
      source: 'search',
      name: 'Sol by Melia Benoa Bali',
      address: 'Bali Resorts',
      check_in_date: '2026-08-29',
      check_out_date: '2026-08-30',
      price_per_night: 130,
      rating: 4.5,
      distance_km: null,
      latitude: -8.786757,
      longitude: 115.226429,
      raw_payload: searchOption,
    })
  })

  it('prefers the resolved address over the search query text when present', () => {
    const withAddress: SearchHotelOption = { ...searchOption, address: '123 Beach Rd, Bali' }
    const payload: SavedHotelCreate = toSavedHotelCreate(withAddress)
    expect(payload.address).toBe('123 Beach Rd, Bali')
  })

  it('falls back to the search query text when the address lookup returned null', () => {
    const withNullAddress: SearchHotelOption = { ...searchOption, address: null }
    const payload: SavedHotelCreate = toSavedHotelCreate(withNullAddress)
    expect(payload.address).toBe('Bali Resorts')
  })

  it('normalizes a custom lodging entry, defaulting rating to null', () => {
    const payload: SavedHotelCreate = toSavedHotelCreate(customOption)
    expect(payload).toEqual({
      source: 'custom',
      name: "Staying at Mom's house",
      address: 'Austin, TX',
      check_in_date: '2026-08-29',
      check_out_date: '2026-08-30',
      price_per_night: 0,
      rating: null,
      distance_km: null,
      latitude: null,
      longitude: null,
      raw_payload: customOption,
    })
  })
})
