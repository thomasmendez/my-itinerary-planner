import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import {
  fetchFlightBookingLink,
  fetchRoundTripBookingLink,
  searchFlights,
  type FlightOption,
  type FlightSearchParams,
} from '../api/flights'
import {
  confirmSavedFlight,
  deleteSavedFlight,
  fetchSavedFlights,
  saveFlight,
  updateSavedFlight,
  type SavedFlight,
} from '../api/savedFlights'
import { candidateDepartureTime, toSavedFlightCreate } from '../lib/flightCandidate'
import {
  attachSavedItemCases,
  baseSavedItemState,
  computeSpend,
  createSavedItemThunks,
  generateBookingToken,
  requireActiveTripId,
} from './savedItemSlice'
import type {
  CustomTransportInput,
  CustomTransportOption,
  FlightCandidate,
  SearchFlightOption,
} from '../types/flights'
import type { RootState } from './store'

type FlightsState = ReturnType<typeof baseSavedItemState<FlightOption, FlightCandidate>> & {
  searchParams: FlightSearchParams | null
}

const initialState: FlightsState = { ...baseSavedItemState(), searchParams: null }

function toFlightCandidate(saved: SavedFlight): FlightCandidate {
  return { ...saved.raw_payload, savedAt: saved.created_at, savedFlightId: saved.id } as FlightCandidate
}

const thunks = createSavedItemThunks<FlightSearchParams, FlightOption, SavedFlight>('flights', {
  search: searchFlights,
  fetchSaved: fetchSavedFlights,
  confirmSaved: confirmSavedFlight,
  deleteSaved: deleteSavedFlight,
})

export const runFlightSearch = thunks.search
export const loadSavedFlights = thunks.loadSaved
export const confirmCandidate = thunks.confirmCandidate
export const removeCandidate = thunks.removeCandidate

export const addCandidate = createAsyncThunk('flights/addCandidate', async (flight: FlightOption, { getState }) => {
  const tripId = requireActiveTripId(getState() as RootState)
  // Fetched before the save (not after) since search-sourced saved flights can't be
  // PATCHed to attach it later - see updateCustomTransportCandidate's comment below.
  const { url: direct_booking_url, post_data: direct_booking_post_data } = await fetchFlightBookingLink(flight)
  return saveFlight(
    tripId,
    toSavedFlightCreate({ ...flight, direct_booking_url, direct_booking_post_data, source: 'search' }),
  )
})

// Round trip's completion step: the user has already picked an outbound flight and a
// return flight (via ReturnFlightPicker) — fetch the combined booking link and save both
// legs as one candidate. Uses searchParams.return (stashed on search) as the return date
// SerpApi's booking-link call requires alongside the return leg's booking_token.
export const addRoundTripCandidate = createAsyncThunk(
  'flights/addRoundTripCandidate',
  async (arg: { outbound: FlightOption; returnFlight: FlightOption }, { getState }) => {
    const state = getState() as RootState
    const tripId = requireActiveTripId(state)
    const returnDate = state.flights.searchParams?.return
    if (!returnDate) throw new Error('No active round-trip search to attach this candidate to')
    const { url: direct_booking_url, post_data: direct_booking_post_data } = await fetchRoundTripBookingLink(
      arg.outbound,
      arg.returnFlight,
      returnDate,
    )
    const candidate: SearchFlightOption = {
      ...arg.outbound,
      direct_booking_url,
      direct_booking_post_data,
      source: 'search',
      return_flight: arg.returnFlight,
    }
    return saveFlight(tripId, toSavedFlightCreate(candidate))
  },
)

export const addCustomTransportCandidate = createAsyncThunk(
  'flights/addCustomTransportCandidate',
  (input: CustomTransportInput, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    const { mode, from, to, depart, return: returnDate, price, costUnit, notes } = input
    const candidate: CustomTransportOption = {
      source: 'custom',
      mode,
      from,
      to,
      depart: depart.replace('T', ' '),
      return: returnDate ? returnDate.replace('T', ' ') : undefined,
      price: price ?? 0,
      cost_unit: costUnit || '/ travel',
      notes: notes || undefined,
      booking_token: generateBookingToken(),
    }
    return saveFlight(tripId, toSavedFlightCreate(candidate))
  },
)

// Edits a candidate custom transport entry in place (backend rejects the edit once the
// entry is confirmed or search-sourced). bookingToken is carried through unchanged -
// custom entries don't need a new one on edit, unlike addCustomTransportCandidate's
// creation of a fresh one.
export const updateCustomTransportCandidate = createAsyncThunk(
  'flights/updateCustomTransportCandidate',
  (arg: { savedFlightId: number; bookingToken: string; input: CustomTransportInput }, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    const { mode, from, to, depart, return: returnDate, price, costUnit, notes } = arg.input
    const candidate: CustomTransportOption = {
      source: 'custom',
      mode,
      from,
      to,
      depart: depart.replace('T', ' '),
      return: returnDate ? returnDate.replace('T', ' ') : undefined,
      price: price ?? 0,
      cost_unit: costUnit || '/ travel',
      notes: notes || undefined,
      booking_token: arg.bookingToken,
    }
    return updateSavedFlight(tripId, arg.savedFlightId, toSavedFlightCreate(candidate))
  },
)

const flightsSlice = createSlice({
  name: 'flights',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addCandidate.fulfilled, (state, action) => {
        state.candidates.push(toFlightCandidate(action.payload))
      })
      .addCase(addRoundTripCandidate.fulfilled, (state, action) => {
        state.candidates.push(toFlightCandidate(action.payload))
      })
      .addCase(addCustomTransportCandidate.fulfilled, (state, action) => {
        state.candidates.push(toFlightCandidate(action.payload))
      })
      .addCase(updateCustomTransportCandidate.fulfilled, (state, action) => {
        const updated = toFlightCandidate(action.payload)
        state.candidates = state.candidates.map((c) => (c.savedFlightId === updated.savedFlightId ? updated : c))
      })
    attachSavedItemCases<FlightsState, FlightOption, FlightCandidate, FlightSearchParams, SavedFlight>(
      builder,
      thunks,
      toFlightCandidate,
      (c) => c.savedFlightId,
      'Flight',
      (state: FlightsState, params) => {
        state.searchParams = params
      },
    )
  },
})

export default flightsSlice.reducer

// booking_token is the natural identity, but round-trip SerpApi results carry none
// (departure_token only), so it can't be relied on alone. Fall back to the leg/price
// combo the user actually sees on the card, which is stable and unique per distinct
// search result.
export function flightIdentity(flight: {
  booking_token?: string
  flights?: FlightOption['flights']
  price: number
}): string {
  if (flight.booking_token) return flight.booking_token
  const legs = flight.flights ?? []
  const first = legs[0]
  const last = legs[legs.length - 1]
  if (!first || !last) return `notoken-${flight.price}`
  return `${first.departure_airport.id}|${first.departure_airport.time}|${last.arrival_airport.id}|${last.arrival_airport.time}|${flight.price}`
}

// Splits a result list into SerpApi's best_flights vs other_flights groups (tagged by
// searchFlights/fetchReturnFlights via isBestFlight) so the UI can mirror Google
// Flights' own "Best flights" / "Other flights" sections. Untagged entries (candidates,
// custom transport) count as "best" so they never get sorted into an "Other" section.
export function partitionFlightsByBest(flights: FlightOption[]): { best: FlightOption[]; other: FlightOption[] } {
  const best = flights.filter((f) => f.isBestFlight !== false)
  const other = flights.filter((f) => f.isBestFlight === false)
  return { best, other }
}

// Search results still in the pool, i.e. not already saved as a candidate or confirmed.
// Derived rather than mutated on add/remove so a Comparing removal naturally
// puts the flight back in the search list without duplicating list-membership state.
export const selectVisibleFlightResults = createSelector(
  (state: RootState) => state.flights.results,
  (state: RootState) => state.flights.candidates,
  (state: RootState) => state.flights.confirmed,
  (results, candidates, confirmed) => {
    const taken = new Set([...candidates, ...confirmed].map(flightIdentity))
    return results.filter((flight) => !taken.has(flightIdentity(flight)))
  },
)

export const selectFlightTripPlanEntries = createSelector(
  (state: RootState) => state.flights.confirmed,
  (confirmed) => [...confirmed].sort((a, b) => candidateDepartureTime(a).localeCompare(candidateDepartureTime(b))),
)

// This category's confirmed/pending totals feed into Budget.tsx's trip-wide sums
// alongside Hotels/Rentals/Events. Potential Cost treats all open candidates as one
// contested group (min price) since there's no route/leg grouping model yet
export const selectFlightSpend = createSelector(
  (state: RootState) => state.flights.candidates,
  (state: RootState) => state.flights.confirmed,
  (candidates, confirmed) => {
    const hasSearchConfirmed = confirmed.some((c) => c.source === 'search')
    const hasCustomConfirmed = confirmed.some((c) => c.source === 'custom')
    const label =
      hasCustomConfirmed && hasSearchConfirmed ? 'Flights + Other' : hasCustomConfirmed ? 'Transportation' : 'Flights'
    return { ...computeSpend(candidates, confirmed, (c) => c.price), label }
  },
)
