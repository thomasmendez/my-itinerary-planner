import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createTrip, deleteTrip, fetchTrips, updateTrip, type Trip, type TripInput } from '../api/trips'
import type { RootState } from './store'

type TripsState = {
  trips: Trip[]
  activeTripId: number | null
  loading: boolean
  error: string | null
}

const initialState: TripsState = {
  trips: [],
  activeTripId: null,
  loading: false,
  error: null,
}

export const loadTrips = createAsyncThunk('trips/load', () => fetchTrips())
export const addTrip = createAsyncThunk('trips/add', (payload: TripInput) => createTrip(payload))
export const editTrip = createAsyncThunk('trips/edit', ({ id, payload }: { id: number; payload: TripInput }) =>
  updateTrip(id, payload),
)
export const removeTrip = createAsyncThunk('trips/remove', async (id: number) => {
  await deleteTrip(id)
  return id
})

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setActiveTripId: (state, action: PayloadAction<number>) => {
      state.activeTripId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTrips.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadTrips.fulfilled, (state, action) => {
        state.loading = false
        state.trips = action.payload
      })
      .addCase(loadTrips.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load trips'
        console.error('Failed to load trips', action.error)
      })
      .addCase(addTrip.fulfilled, (state, action) => {
        state.trips.push(action.payload)
      })
      .addCase(editTrip.fulfilled, (state, action) => {
        const index = state.trips.findIndex((t) => t.id === action.payload.id)
        if (index >= 0) state.trips[index] = action.payload
      })
      .addCase(removeTrip.fulfilled, (state, action) => {
        state.trips = state.trips.filter((t) => t.id !== action.payload)
      })
  },
})

export const { setActiveTripId } = tripsSlice.actions
export default tripsSlice.reducer

export const selectActiveTrip = (state: RootState) =>
  state.trips.trips.find((t) => t.id === state.trips.activeTripId) as Trip | undefined
