import { configureStore } from '@reduxjs/toolkit'
import calendarReducer from './calendarSlice'
import eventsReducer from './eventsSlice'
import flightsReducer from './flightsSlice'
import hotelsReducer from './hotelsSlice'
import mapReducer from './mapSlice'
import rentalsReducer from './rentalsSlice'
import settingsReducer from './settingsSlice'
import tripsReducer from './tripsSlice'

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
    events: eventsReducer,
    flights: flightsReducer,
    hotels: hotelsReducer,
    map: mapReducer,
    rentals: rentalsReducer,
    settings: settingsReducer,
    trips: tripsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
