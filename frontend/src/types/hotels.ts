import type { HotelOption } from '../api/hotels'

// Custom (manually-entered) lodging — not from SerpApi, so it only carries the fields
// the UI actually needs rather than SerpApi's full property shape (amenities, images, ...).
// "source" discriminates it from search results wherever the two are mixed (Comparing
// list, trip plan, spend totals).
export type CustomLodgingOption = {
  source: 'custom'
  name: string
  location?: string
  check_in: string // 'YYYY-MM-DD'
  check_out: string // 'YYYY-MM-DD'
  price: number
  cost_unit: string
  notes?: string
  booking_token: string
}

// location/check_in_date/check_out_date aren't part of SerpApi's per-property shape (the
// property result carries no address, and check-in/out dates are search params shared by
// every result) — the search thunk stamps them onto the option from the search form at save
// time, mirroring how flights read their per-leg times straight off the property.
export type SearchHotelOption = HotelOption & {
  source: 'search'
  location: string
  check_in_date: string // 'YYYY-MM-DD'
  check_out_date: string // 'YYYY-MM-DD'
  // Real street address, resolved via the same property-details call as direct_booking_url
  address?: string | null
}

// savedHotelId is the backend saved_hotels.id — needed to PATCH/DELETE this candidate.
export type HotelCandidate = (SearchHotelOption | CustomLodgingOption) & {
  savedAt: string
  savedHotelId: number
}

export type CustomLodgingInput = {
  name: string
  location?: string
  checkIn: string // date input value, 'YYYY-MM-DD'
  checkOut: string // date input value, 'YYYY-MM-DD'
  price?: number
  costUnit?: string
  notes?: string
}
