import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { fetchTripCalendar, type CalendarEntry } from '../api/calendar'
import type { RootState } from './store'
import { selectActiveTrip } from './tripsSlice'

type CalendarState = {
  entries: CalendarEntry[]
  loading: boolean
  error: string | null
}

const initialState: CalendarState = {
  entries: [],
  loading: false,
  error: null,
}

export const loadCalendar = createAsyncThunk('calendar/load', (_: void, { getState }) => {
  const trip = selectActiveTrip(getState() as RootState)
  if (!trip) throw new Error('No active trip to load a calendar for')
  return fetchTripCalendar(trip.id)
})

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadCalendar.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadCalendar.fulfilled, (state, action) => {
        state.loading = false
        state.entries = [...action.payload].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      })
      .addCase(loadCalendar.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load calendar'
        console.error('Failed to load calendar', action.error)
      })
  },
})

export default calendarSlice.reducer
