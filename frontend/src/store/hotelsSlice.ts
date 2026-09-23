import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { fetchHotelBookingLink, searchHotels, type HotelOption, type HotelSearchParams } from '../api/hotels'
import {
  confirmSavedHotel,
  deleteSavedHotel,
  fetchSavedHotels,
  saveHotel,
  updateSavedHotel,
  type SavedHotel,
} from '../api/savedHotels'
import { candidateCheckIn, candidateTotalPrice, toSavedHotelCreate } from '../lib/hotelCandidate'
import {
  attachSavedItemCases,
  baseSavedItemState,
  computeSpend,
  createSavedItemThunks,
  generateBookingToken,
  requireActiveTripId,
} from './savedItemSlice'
import type { CustomLodgingInput, CustomLodgingOption, HotelCandidate, SearchHotelOption } from '../types/hotels'
import type { RootState } from './store'

type HotelsState = ReturnType<typeof baseSavedItemState<HotelOption, HotelCandidate>> & {
  searchParams: HotelSearchParams | null
}

const initialState: HotelsState = { ...baseSavedItemState(), searchParams: null }

function toHotelCandidate(saved: SavedHotel): HotelCandidate {
  return { ...saved.raw_payload, savedAt: saved.created_at, savedHotelId: saved.id } as HotelCandidate
}

const thunks = createSavedItemThunks<HotelSearchParams, HotelOption, SavedHotel>('hotels', {
  search: searchHotels,
  fetchSaved: fetchSavedHotels,
  confirmSaved: confirmSavedHotel,
  deleteSaved: deleteSavedHotel,
})

export const runHotelSearch = thunks.search
export const loadSavedHotels = thunks.loadSaved
export const confirmCandidate = thunks.confirmCandidate
export const removeCandidate = thunks.removeCandidate

export const addCandidate = createAsyncThunk('hotels/addCandidate', async (hotel: HotelOption, { getState }) => {
  const state = getState() as RootState
  const tripId = requireActiveTripId(state)
  const params = state.hotels.searchParams
  if (!params) throw new Error('No active hotel search to attach this candidate to')
  // Fetched before the save (not after) since search-sourced saved hotels can't be
  // PATCHed to attach it later - see updateCustomLodgingCandidate's comment below.
  const { url: enrichedUrl, address } = await fetchHotelBookingLink(hotel, params)
  // Property-details doesn't return `link` for every property type (e.g. vacation
  // rentals routed through a reseller gate URL) - fall back to the link SerpApi already
  // put on the search result itself rather than losing it.
  const direct_booking_url = enrichedUrl ?? hotel.link ?? null
  const candidate: SearchHotelOption = {
    ...hotel,
    direct_booking_url,
    address,
    source: 'search',
    location: params.location,
    check_in_date: params.checkIn,
    check_out_date: params.checkOut,
  }
  return saveHotel(tripId, toSavedHotelCreate(candidate))
})

export const addCustomLodgingCandidate = createAsyncThunk(
  'hotels/addCustomLodgingCandidate',
  (input: CustomLodgingInput, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    const { name, location, checkIn, checkOut, price, costUnit, notes } = input
    const candidate: CustomLodgingOption = {
      source: 'custom',
      name,
      location,
      check_in: checkIn,
      check_out: checkOut,
      price: price ?? 0,
      cost_unit: costUnit || '/ night',
      notes: notes || undefined,
      booking_token: generateBookingToken(),
    }
    return saveHotel(tripId, toSavedHotelCreate(candidate))
  },
)

// Edits a candidate custom lodging entry in place (backend rejects the edit once the
// entry is confirmed or search-sourced). bookingToken is carried through unchanged.
export const updateCustomLodgingCandidate = createAsyncThunk(
  'hotels/updateCustomLodgingCandidate',
  (arg: { savedHotelId: number; bookingToken: string; input: CustomLodgingInput }, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    const { name, location, checkIn, checkOut, price, costUnit, notes } = arg.input
    const candidate: CustomLodgingOption = {
      source: 'custom',
      name,
      location,
      check_in: checkIn,
      check_out: checkOut,
      price: price ?? 0,
      cost_unit: costUnit || '/ night',
      notes: notes || undefined,
      booking_token: arg.bookingToken,
    }
    return updateSavedHotel(tripId, arg.savedHotelId, toSavedHotelCreate(candidate))
  },
)

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // attachSavedItemCases ends its chain with addMatcher, which RTK requires to come
    // after every addCase - so the slice's own addCase calls go first.
    builder
      .addCase(addCandidate.fulfilled, (state, action) => {
        state.candidates.push(toHotelCandidate(action.payload))
      })
      .addCase(addCustomLodgingCandidate.fulfilled, (state, action) => {
        state.candidates.push(toHotelCandidate(action.payload))
      })
      .addCase(updateCustomLodgingCandidate.fulfilled, (state, action) => {
        const updated = toHotelCandidate(action.payload)
        state.candidates = state.candidates.map((c) => (c.savedHotelId === updated.savedHotelId ? updated : c))
      })
    attachSavedItemCases<HotelsState, HotelOption, HotelCandidate, HotelSearchParams, SavedHotel>(
      builder,
      thunks,
      toHotelCandidate,
      (c) => c.savedHotelId,
      'Hotel',
      (state: HotelsState, params) => {
        state.searchParams = params
      },
    )
  },
})

export default hotelsSlice.reducer

// Search results still in the pool, i.e. not already saved as a candidate or confirmed.
// Mirrors flights' selectVisibleFlightResults, keyed on property_token (hotels' stable id)
// instead of booking_token.
export const selectVisibleHotelResults = createSelector(
  (state: RootState) => state.hotels.results,
  (state: RootState) => state.hotels.candidates,
  (state: RootState) => state.hotels.confirmed,
  (results, candidates, confirmed) => {
    const takenTokens = new Set(
      [...candidates, ...confirmed].map((c) => (c.source === 'custom' ? c.booking_token : c.property_token)),
    )
    return results.filter((hotel) => !takenTokens.has(hotel.property_token))
  },
)

// Mirrors flights' selectFlightTripPlanEntries.
export const selectHotelTripPlanEntries = createSelector(
  (state: RootState) => state.hotels.confirmed,
  (confirmed) => [...confirmed].sort((a, b) => candidateCheckIn(a).localeCompare(candidateCheckIn(b))),
)

// Mirrors flights' selectFlightSpend. Candidate/confirmed prices are per-night, so totals
// go through candidateTotalPrice (price * nights) rather than summing raw candidate.price.
export const selectHotelSpend = createSelector(
  (state: RootState) => state.hotels.candidates,
  (state: RootState) => state.hotels.confirmed,
  (candidates, confirmed) => computeSpend(candidates, confirmed, candidateTotalPrice),
)
