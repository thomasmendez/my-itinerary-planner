import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { searchEvents, type EventOption, type EventSearchParams } from '../api/events'
import {
  confirmSavedEvent,
  deleteSavedEvent,
  fetchSavedEvents,
  saveEvent,
  updateSavedEvent,
  type SavedEvent,
} from '../api/savedEvents'
import { candidatePrice, candidateStartsAt, eventResultKey, toSavedEventCreate } from '../lib/eventCandidate'
import {
  attachSavedItemCases,
  baseSavedItemState,
  computeSpend,
  createSavedItemThunks,
  generateBookingToken,
  requireActiveTripId,
} from './savedItemSlice'
import type { CustomEventInput, CustomEventOption, EventCandidate, SearchEventOption } from '../types/events'
import type { RootState } from './store'

type EventsState = ReturnType<typeof baseSavedItemState<EventOption, EventCandidate>> & {
  searchParams: EventSearchParams | null
}

const initialState: EventsState = { ...baseSavedItemState(), searchParams: null }

function toEventCandidate(saved: SavedEvent): EventCandidate {
  return { ...saved.raw_payload, savedAt: saved.created_at, savedEventId: saved.id, starts_at: saved.starts_at } as EventCandidate
}

const thunks = createSavedItemThunks<EventSearchParams, EventOption, SavedEvent>('events', {
  search: searchEvents,
  fetchSaved: fetchSavedEvents,
  confirmSaved: confirmSavedEvent,
  deleteSaved: deleteSavedEvent,
})

export const runEventSearch = thunks.search
export const loadSavedEvents = thunks.loadSaved
export const confirmCandidate = thunks.confirmCandidate
export const removeCandidate = thunks.removeCandidate

// startsAt is the result card's best-effort parsed date/time,
// passed through so the saved event's starts_at is normalized rather than free text.
export const addCandidate = createAsyncThunk(
  'events/addCandidate',
  (arg: { event: EventOption; startsAt: string }, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    const candidate: SearchEventOption = { ...arg.event, source: 'search' }
    return saveEvent(tripId, { ...toSavedEventCreate(candidate), starts_at: arg.startsAt })
  },
)

// "Save as candidate" — leaves the custom event unconfirmed in Comparing.
export const addCustomEventCandidate = createAsyncThunk(
  'events/addCustomEventCandidate',
  async (input: CustomEventInput, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    return saveEvent(tripId, toSavedEventCreate(toCustomEventOption(input)))
  },
)

// "Add to plan" — saves and immediately confirms, skipping the candidate stage
export const addCustomEventAndConfirm = createAsyncThunk(
  'events/addCustomEventAndConfirm',
  async (input: CustomEventInput, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    const saved = await saveEvent(tripId, toSavedEventCreate(toCustomEventOption(input)))
    return confirmSavedEvent(tripId, saved.id)
  },
)

function toCustomEventOption(input: CustomEventInput, bookingToken?: string): CustomEventOption {
  const { name, location, date, startTime, endTime, attendees, price, costUnit } = input
  return {
    source: 'custom',
    name,
    location: location || undefined,
    starts_at: `${date} ${startTime}`,
    ends_at: endTime ? `${date} ${endTime}` : undefined,
    attendees: attendees || undefined,
    price: price ?? 0,
    cost_unit: costUnit || '/ event',
    booking_token: bookingToken ?? generateBookingToken(),
  }
}

// Edits a candidate custom event entry in place (backend rejects the edit once
// confirmed or search-sourced). bookingToken is carried through unchanged.
export const updateCustomEventCandidate = createAsyncThunk(
  'events/updateCustomEventCandidate',
  (arg: { savedEventId: number; bookingToken: string; input: CustomEventInput }, { getState }) => {
    const tripId = requireActiveTripId(getState() as RootState)
    const candidate = toCustomEventOption(arg.input, arg.bookingToken)
    return updateSavedEvent(tripId, arg.savedEventId, toSavedEventCreate(candidate))
  },
)

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addCandidate.fulfilled, (state, action) => {
        state.candidates.push(toEventCandidate(action.payload))
      })
      .addCase(addCustomEventCandidate.fulfilled, (state, action) => {
        state.candidates.push(toEventCandidate(action.payload))
      })
      .addCase(addCustomEventAndConfirm.fulfilled, (state, action) => {
        state.confirmed.push(toEventCandidate(action.payload))
      })
      .addCase(updateCustomEventCandidate.fulfilled, (state, action) => {
        const updated = toEventCandidate(action.payload)
        state.candidates = state.candidates.map((c) => (c.savedEventId === updated.savedEventId ? updated : c))
      })
    attachSavedItemCases<EventsState, EventOption, EventCandidate, EventSearchParams, SavedEvent>(
      builder,
      thunks,
      toEventCandidate,
      (c) => c.savedEventId,
      'Event',
      (state: EventsState, params) => {
        state.searchParams = params
      },
    )
  },
})

export default eventsSlice.reducer

// Search results still in the pool, i.e. not already saved as a candidate or confirmed.
// Keyed on eventResultKey 
export const selectVisibleEventResults = createSelector(
  (state: RootState) => state.events.results,
  (state: RootState) => state.events.candidates,
  (state: RootState) => state.events.confirmed,
  (results, candidates, confirmed) => {
    const taken = new Set(
      [...candidates, ...confirmed]
        .filter((c): c is SearchEventOption & EventCandidate => c.source === 'search')
        .map(eventResultKey),
    )
    return results.filter((event) => !taken.has(eventResultKey({ ...event, source: 'search' })))
  },
)

export const selectEventTripPlanEntries = createSelector(
  (state: RootState) => state.events.confirmed,
  (confirmed) => [...confirmed].sort((a, b) => candidateStartsAt(a).localeCompare(candidateStartsAt(b))),
)

export const selectEventSpend = createSelector(
  (state: RootState) => state.events.candidates,
  (state: RootState) => state.events.confirmed,
  (candidates, confirmed) => computeSpend(candidates, confirmed, candidatePrice),
)
