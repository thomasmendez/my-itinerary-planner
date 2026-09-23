import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { fetchMapPoints, fetchMapRoute, type MapPoint, type Route, type RoutePoint } from '../api/map'
import type { RootState } from './store'
import { selectActiveTrip } from './tripsSlice'

type MapState = {
  points: MapPoint[]
  loading: boolean
  route: Route | null
  routeLoading: boolean
  error: string | null
}

const initialState: MapState = {
  points: [],
  loading: false,
  route: null,
  routeLoading: false,
  error: null,
}

export const loadMapPoints = createAsyncThunk('map/loadPoints', (_: void, { getState }) => {
  const trip = selectActiveTrip(getState() as RootState)
  if (!trip) throw new Error('No active trip to load map points for')
  return fetchMapPoints(trip.id)
})

export const loadRoute = createAsyncThunk('map/loadRoute', (points: RoutePoint[], { getState }) => {
  const trip = selectActiveTrip(getState() as RootState)
  if (!trip) throw new Error('No active trip to route')
  return fetchMapRoute(trip.id, points)
})

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    clearRoute(state) {
      state.route = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMapPoints.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadMapPoints.fulfilled, (state, action) => {
        state.loading = false
        state.points = action.payload
      })
      .addCase(loadMapPoints.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load map points'
        console.error('Failed to load map points', action.error)
      })
      .addCase(loadRoute.pending, (state) => {
        state.routeLoading = true
        state.error = null
      })
      .addCase(loadRoute.fulfilled, (state, action) => {
        state.routeLoading = false
        state.route = action.payload
      })
      .addCase(loadRoute.rejected, (state, action) => {
        state.routeLoading = false
        state.error = action.error.message ?? 'Failed to load route'
        console.error('Failed to load route', action.error)
      })
  },
})

export const { clearRoute } = mapSlice.actions
export default mapSlice.reducer
