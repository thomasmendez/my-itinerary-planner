import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import {
  confirmSavedRental,
  deleteSavedRental,
  fetchSavedRentals,
  saveRental,
  updateSavedRental,
  type SavedRental,
} from '../api/savedRentals'
import { toSavedRentalCreate } from '../lib/rentalCandidate'
import {
  attachSavedItemCases,
  baseSavedItemState,
  computeSpend,
  createSavedItemThunks,
  generateBookingToken,
  requireActiveTripId,
} from './savedItemSlice'
import type { CustomRentalInput, CustomRentalOption, RentalCandidate } from '../types/rentals'
import type { RootState } from './store'

// Rentals have no search path, no backend working endpoint - the shared
// search/results/loading/searched fields from savedItemSlice stay unused here; only
// loadSaved/confirmCandidate/removeCandidate apply.
type RentalsState = ReturnType<typeof baseSavedItemState<never, RentalCandidate>>

const initialState: RentalsState = baseSavedItemState()

function toRentalCandidate(saved: SavedRental): RentalCandidate {
  return { ...saved.raw_payload, savedAt: saved.created_at, savedRentalId: saved.id }
}

const thunks = createSavedItemThunks<void, never, SavedRental>('rentals', {
  search: () => Promise.reject(new Error('Rentals have no search path')),
  fetchSaved: fetchSavedRentals,
  confirmSaved: confirmSavedRental,
  deleteSaved: deleteSavedRental,
})

export const loadSavedRentals = thunks.loadSaved
export const confirmCandidate = thunks.confirmCandidate
export const removeCandidate = thunks.removeCandidate

// A native <input type="datetime-local"> value ('YYYY-MM-DDTHH:mm') carries no timezone -
// treated here as already being the intended UTC instant, matching the backend test
// fixtures' UTC-offset ISO strings.
function toIsoUtcOffset(localDateTime: string): string {
  return `${localDateTime}:00+00:00`
}

export const addCustomVehicleCandidate = createAsyncThunk(
  'rentals/addCustomVehicleCandidate',
  (input: CustomRentalInput, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    const { description, pickupLocation, dropoffLocation, pickupAt, dropoffAt, price, costUnit, notes } = input
    const candidate: CustomRentalOption = {
      source: 'custom',
      description,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation || undefined,
      pickup_at: toIsoUtcOffset(pickupAt),
      dropoff_at: toIsoUtcOffset(dropoffAt),
      price: price ?? 0,
      cost_unit: costUnit || '/ rental',
      notes: notes || undefined,
      booking_token: generateBookingToken(),
    }
    return saveRental(tripId, toSavedRentalCreate(candidate))
  },
)

// Edits a candidate custom vehicle entry in place (backend rejects the edit once
// confirmed). bookingToken is carried through unchanged.
export const updateCustomVehicleCandidate = createAsyncThunk(
  'rentals/updateCustomVehicleCandidate',
  (arg: { savedRentalId: number; bookingToken: string; input: CustomRentalInput }, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    const { description, pickupLocation, dropoffLocation, pickupAt, dropoffAt, price, costUnit, notes } = arg.input
    const candidate: CustomRentalOption = {
      source: 'custom',
      description,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation || undefined,
      pickup_at: toIsoUtcOffset(pickupAt),
      dropoff_at: toIsoUtcOffset(dropoffAt),
      price: price ?? 0,
      cost_unit: costUnit || '/ rental',
      notes: notes || undefined,
      booking_token: arg.bookingToken,
    }
    return updateSavedRental(tripId, arg.savedRentalId, toSavedRentalCreate(candidate))
  },
)

const rentalsSlice = createSlice({
  name: 'rentals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addCustomVehicleCandidate.fulfilled, (state, action) => {
        state.candidates.push(toRentalCandidate(action.payload))
      })
      .addCase(updateCustomVehicleCandidate.fulfilled, (state, action) => {
        const updated = toRentalCandidate(action.payload)
        state.candidates = state.candidates.map((c) => (c.savedRentalId === updated.savedRentalId ? updated : c))
      })
    attachSavedItemCases<RentalsState, never, RentalCandidate, void, SavedRental>(
      builder,
      thunks,
      toRentalCandidate,
      (c) => c.savedRentalId,
      'Rental',
    )
  },
})

export default rentalsSlice.reducer

// Mirrors hotels' selectHotelTripPlanEntries.
export const selectRentalTripPlanEntries = createSelector(
  (state: RootState) => state.rentals.confirmed,
  (confirmed) => [...confirmed].sort((a, b) => a.pickup_at.localeCompare(b.pickup_at)),
)

// price is already a total (not per-night like hotels), so totals sum it directly - no
// nights-multiplication helper needed.
export const selectRentalSpend = createSelector(
  (state: RootState) => state.rentals.candidates,
  (state: RootState) => state.rentals.confirmed,
  (candidates, confirmed) => computeSpend(candidates, confirmed, (c) => c.price),
)
