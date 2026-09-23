import { createAsyncThunk, isRejected, type ActionReducerMapBuilder, type AsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from './store'
import { selectActiveTrip } from './tripsSlice'

// Shared shape/lifecycle for the "search -> save as candidate -> confirm -> remove" flow
// every saved-item domain (flights, hotels, and eventually rentals) follows identically.
// addCandidate/addCustom*Candidate thunks stay domain-specific (their save payload shape
// differs) - build those directly in the slice module and addCase their .fulfilled next
// to attachSavedItemCases in extraReducers.

export function requireActiveTripId(state: RootState): number {
  const trip = selectActiveTrip(state)
  if (!trip) throw new Error('No active trip to save this item to')
  return trip.id
}

// Client-side placeholder id for a not-yet-persisted custom entry, replaced by the
// backend's real id once saved. Every domain's addCustom*Candidate thunk needs one.
export function generateBookingToken(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export type SpendSummary = {
  confirmedTotal: number
  pendingTotal: number
  potentialCost: number
  hasCandidates: boolean
}

// Shared shape behind every domain's selectXSpend: sum of confirmed, sum of open
// candidates, and a potential-cost estimate that treats open candidates as one
// contested group (cheapest wins) since there's no route/leg grouping model yet.
export function computeSpend<T>(candidates: T[], confirmed: T[], getPrice: (item: T) => number): SpendSummary {
  const confirmedTotal = confirmed.reduce((sum, c) => sum + getPrice(c), 0)
  const pendingTotal = candidates.reduce((sum, c) => sum + getPrice(c), 0)
  const cheapestCandidate = candidates.length ? Math.min(...candidates.map(getPrice)) : 0
  return {
    confirmedTotal,
    pendingTotal,
    potentialCost: confirmedTotal + cheapestCandidate,
    hasCandidates: candidates.length > 0,
  }
}

export type SavedRecord = {
  id: number
  status: 'candidate' | 'confirmed'
  overlap_warning?: string | null
}

export type SavedItemState<TResult, TCandidate> = {
  results: TResult[]
  loading: boolean
  error: string | null
  searched: boolean
  candidates: TCandidate[]
  confirmed: TCandidate[]
}

export function baseSavedItemState<TResult, TCandidate>(): SavedItemState<TResult, TCandidate> {
  return { results: [], loading: false, error: null, searched: false, candidates: [], confirmed: [] }
}

export type SavedItemThunks<TSearchParams, TResult, TSaved> = {
  search: AsyncThunk<TResult[], TSearchParams, object>
  loadSaved: AsyncThunk<TSaved[], void, object>
  confirmCandidate: AsyncThunk<TSaved, number, object>
  removeCandidate: AsyncThunk<number, number, object>
}

export function createSavedItemThunks<TSearchParams, TResult, TSaved extends SavedRecord>(
  name: string,
  api: {
    search: (params: TSearchParams) => Promise<TResult[]>
    fetchSaved: (tripId: number) => Promise<TSaved[]>
    confirmSaved: (tripId: number, id: number) => Promise<TSaved>
    deleteSaved: (tripId: number, id: number) => Promise<void>
  },
): SavedItemThunks<TSearchParams, TResult, TSaved> {
  return {
    search: createAsyncThunk(`${name}/search`, (params: TSearchParams) => api.search(params)),
    loadSaved: createAsyncThunk(`${name}/loadSaved`, (_: void, { getState }) =>
      api.fetchSaved(requireActiveTripId(getState() as RootState)),
    ),
    confirmCandidate: createAsyncThunk(`${name}/confirmCandidate`, (savedId: number, { getState }) =>
      api.confirmSaved(requireActiveTripId(getState() as RootState), savedId),
    ),
    removeCandidate: createAsyncThunk(`${name}/removeCandidate`, async (savedId: number, { getState }) => {
      await api.deleteSaved(requireActiveTripId(getState() as RootState), savedId)
      return savedId
    }),
  }
}

// Wires the pending/fulfilled/rejected cases shared by every saved-item slice onto its own
// builder. Call first inside extraReducers, then addCase the slice's own save thunks after.
//
// builder is typed `any` here rather than `ActionReducerMapBuilder<S>` - RTK's
// Draft<S> is invariant enough that a generic S extending SavedItemState doesn't structurally
// satisfy it (Immer can't prove Draft<S> from an unconstrained generic). Each case reducer
// below still gets S annotated explicitly, so the mutation bodies stay type-checked; only the
// builder handoff itself steps outside strict checking.
export function attachSavedItemCases<S extends SavedItemState<TResult, TCandidate>, TResult, TCandidate, TSearchParams, TSaved extends SavedRecord>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  builder: ActionReducerMapBuilder<any>,
  thunks: SavedItemThunks<TSearchParams, TResult, TSaved>,
  toCandidate: (saved: TSaved) => TCandidate,
  getSavedId: (candidate: TCandidate) => number,
  itemLabel: string,
  // Escape hatch for state fields beyond the shared shape (e.g. hotels' searchParams,
  // stashed on search.pending so a later save thunk can stamp it onto the candidate).
  onSearchPending?: (state: S, params: TSearchParams) => void,
) {
  builder
    .addCase(thunks.search.pending, (state: S, action: { meta: { arg: TSearchParams } }) => {
      state.loading = true
      state.error = null
      state.searched = true
      onSearchPending?.(state, action.meta.arg)
    })
    .addCase(thunks.search.fulfilled, (state: S, action: { payload: TResult[] }) => {
      state.loading = false
      state.results = action.payload
    })
    .addCase(thunks.search.rejected, (state: S, action: { error: { message?: string } }) => {
      state.loading = false
      state.error = action.error.message ?? `${itemLabel} search failed`
    })
    .addCase(thunks.loadSaved.fulfilled, (state: S, action: { payload: TSaved[] }) => {
      state.candidates = action.payload.filter((s) => s.status === 'candidate').map(toCandidate)
      state.confirmed = action.payload.filter((s) => s.status === 'confirmed').map(toCandidate)
    })
    .addCase(thunks.confirmCandidate.fulfilled, (state: S, action: { payload: TSaved }) => {
      const saved = action.payload
      state.candidates = state.candidates.filter((c) => getSavedId(c) !== saved.id)
      state.confirmed.push(toCandidate(saved))
      // overlap_warning has no toast/banner to land in yet.
      if (saved.overlap_warning) console.warn(saved.overlap_warning)
    })
    .addCase(thunks.removeCandidate.fulfilled, (state: S, action: { payload: number }) => {
      state.candidates = state.candidates.filter((c) => getSavedId(c) !== action.payload)
      state.confirmed = state.confirmed.filter((c) => getSavedId(c) !== action.payload)
    })
    .addMatcher(
      isRejected(thunks.loadSaved, thunks.confirmCandidate, thunks.removeCandidate),
      (state: S, action: { error: { message?: string } }) => {
        state.error = action.error.message ?? `${itemLabel} request failed`
        console.error(state.error)
      },
    )
}
