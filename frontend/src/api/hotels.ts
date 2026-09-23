import { parseOrThrow, postBestEffort } from './client'

// Types below mirror SerpApi's `engine=google_hotels` response shape, trimmed to the
// fields the UI needs (price/distance/rating, not full review breakdowns):
// https://serpapi.com/search.json?engine=google_hotels
export type HotelRate = {
  lowest: string
  extracted_lowest: number
}

export type HotelGpsCoordinates = {
  latitude: number
  longitude: number
}

export type HotelImage = {
  thumbnail: string
  original_image: string
}

export type HotelOption = {
  type: string
  name: string
  description?: string
  link?: string
  property_token: string
  gps_coordinates: HotelGpsCoordinates
  check_in_time: string
  check_out_time: string
  rate_per_night: HotelRate
  total_rate: HotelRate
  hotel_class?: string
  extracted_hotel_class?: number
  overall_rating?: number
  reviews?: number
  amenities?: string[]
  images?: HotelImage[]
  deal?: string
  deal_description?: string
  // Fetched separately via fetchHotelBookingLink once this hotel is added as a candidate
  // (SerpApi requires a second `search` call with the property_token to get the
  // property's own booking link) — absent on raw search results, present once a
  // candidate has it. Mirrors FlightOption.direct_booking_url.
  direct_booking_url?: string | null
}

export type GoogleHotelsSearchResponse = {
  search_metadata: {
    id: string
    status: string
    json_endpoint: string
    created_at: string
    processed_at: string
    google_hotels_url: string
    raw_html_file: string
    prettify_html_file: string
    total_time_taken: number
  }
  search_parameters: {
    engine: string
    q: string
    gl: string
    hl: string
    currency: string
    check_in_date: string
    check_out_date: string
    adults: number
    children: number
  }
  properties?: HotelOption[]
}

// Raw shape of SerpApi's property-details follow-up call (the second google_hotels
// request that get_hotel_booking_link makes, with property_token attached) — much richer
// than a search result: full description, reviews/ratings breakdown, nearby places, and
// detailed amenities instead of the search response's trimmed rate/rating summary. Only
// fetchHotelBookingLink's narrowed {url, address} reaches the client today; this type
// exists to keep the mock fixture (mocks/data/hotelsPropertyDetails.ts) honest and to
// document the shape for future UI that might want e.g. amenities or nearby places.
export type HotelAmenityDetail = {
  title: string
  label?: string
  available: boolean
  details?: {
    snippet: string
    snippet_original: string
    snippet_highlighted_words: string[]
    link: string
    displayed_link: string
    title: string
    source_logo: string
  }
}

export type HotelAmenityGroup = { title: string; list: HotelAmenityDetail[] }

export type HotelNearbyPlace = {
  category: string
  name: string
  link?: string
  thumbnail?: string
  transportations: { type: string; duration: string }[]
  rating?: number
  reviews?: number
  description?: string
  gps_coordinates: HotelGpsCoordinates
}

export type HotelReviewBreakdown = {
  name: string
  description: string
  total_mentioned: number
  positive: number
  negative: number
  neutral: number
  category_token: string
  serpapi_link: string
}

export type HotelOtherReview = {
  source: string
  source_icon: string
  source_rating: { score: number; max_score: number }
  reviews: number
  user_review: {
    username: string
    date: string
    rating: { score: number; max_score: number }
    comment: string
    link?: string
  }
  source_number: number
  serpapi_link: string
}

export type HotelPropertyDetailsResponse = {
  search_metadata: {
    id: string
    status: string
    json_endpoint: string
    markdown_endpoint: string
    created_at: string
    processed_at: string
    google_hotels_url: string
    raw_html_file: string
    prettify_html_file: string
    total_time_taken: { float: number }
  }
  search_parameters: {
    engine: string
    q: string
    gl: string
    hl: string
    currency: string
    check_in_date: string
    check_out_date: string
    adults: number
    children: number
    property_token: string
  }
  type: string
  name: string
  description: string
  link: string
  property_token: string
  address: string
  directions?: string
  phone?: string
  phone_link?: string
  gps_coordinates: HotelGpsCoordinates
  check_in_time: string
  check_out_time: string
  typical_price_range: { extracted_lowest: number; extracted_highest: number }
  nearby_places: HotelNearbyPlace[]
  hotel_class?: string
  extracted_hotel_class?: number
  images: HotelImage[]
  overall_rating: number
  reviews: number
  ratings: { stars: number; count: number }[]
  location_rating?: number
  reviews_breakdown?: HotelReviewBreakdown[]
  amenities: string[]
  excluded_amenities?: string[]
  amenities_detailed: {
    groups: HotelAmenityGroup[]
    popular?: HotelAmenityDetail[]
  }
  health_and_safety?: { groups: HotelAmenityGroup[]; details_link?: string }
  sustainability?: { groups: HotelAmenityGroup[] }
  eco_certified?: boolean
  other_reviews?: HotelOtherReview[]
  serpapi_google_hotels_reviews_link?: string
  serpapi_google_hotels_photos_link?: string
}

export type HotelSearchParams = {
  location: string
  checkIn: string
  checkOut: string
  guests: number
  // Optional SerpApi filters — omit to search with no preference.
  sort_by?: number
  min_price?: number
  max_price?: number
  rating?: number
}

export async function searchHotels(params: HotelSearchParams): Promise<HotelOption[]> {
  const res = await fetch('/api/search/hotels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await parseOrThrow<GoogleHotelsSearchResponse>(res, 'Hotel search')
  // SerpApi omits rate_per_night for properties with no live pricing (e.g. sold
  // out) — every downstream consumer (compare, save, spend totals) assumes a price exists,
  // so drop those here rather than null-checking rate_per_night everywhere it's read.
  return (data.properties ?? []).filter((p) => p.rate_per_night != null)
}

export type HotelBookingDetails = {
  url: string | null
  address: string | null
}

// Best-effort enrichment, not on the save's critical path — swallows failures so a slow/
// broken property-details lookup never blocks saving the candidate itself. Mirrors
// fetchFlightBookingLink.
//
// SerpApi's `engine=google_hotels` property-details endpoint (property_token) returns the
// hotel's own `link` (booking URL) and `address` — neither is on the search response —
// this needs the same check-in/out/guest counts the search itself used, all recoverable
// from the search params the hotel came from.
export async function fetchHotelBookingLink(
  hotel: HotelOption,
  params: HotelSearchParams,
): Promise<HotelBookingDetails> {
  const data = await postBestEffort(
    '/api/search/hotels/booking-link',
    {
      property_token: hotel.property_token,
      location: params.location,
      check_in_date: params.checkIn,
      check_out_date: params.checkOut,
      adults: params.guests,
    },
    { url: null, address: null } as HotelBookingDetails,
  )
  return { url: data.url ?? null, address: data.address ?? null }
}
