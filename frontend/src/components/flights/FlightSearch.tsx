import { useState } from 'react'
import type { FlightOption, FlightSearchParams } from '../../api/flights'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  addCandidate,
  addRoundTripCandidate,
  flightIdentity,
  runFlightSearch,
  selectVisibleFlightResults,
} from '../../store/flightsSlice'
import { FlightSearchForm } from './FlightSearchForm'
import { FlightResults } from './FlightResults'
import { FlightCustomTransportForm } from './FlightCustomTransportForm'
import { ReturnFlightPicker } from './ReturnFlightPicker'

export function FlightSearch() {
  const dispatch = useAppDispatch()
  const { loading, error, searched, searchParams } = useAppSelector((state) => state.flights)
  const visibleResults = useAppSelector(selectVisibleFlightResults)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [returnPickerFor, setReturnPickerFor] = useState<FlightOption | null>(null)
  const [savingReturn, setSavingReturn] = useState(false)
  // One-way saves await a real network round-trip (booking-link fetch, then save). Track
  // in-flight ids so the card can gray out and disable Compare instead of letting a slow
  // save get double-clicked into two candidates for the same flight.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const runSearch = (params: FlightSearchParams) => {
    dispatch(runFlightSearch(params))
  }

  const handleCompare = (flight: FlightOption) => {
    if (flight.departure_token) {
      setReturnPickerFor(flight)
      return
    }
    const id = flightIdentity(flight)
    setPendingIds((prev) => new Set(prev).add(id))
    dispatch(addCandidate(flight)).finally(() => {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    })
  }

  return (
    <div className="space-y-4">
      <FlightSearchForm onSearch={runSearch} loading={loading} />
      {searched && !returnPickerFor && (
        <FlightResults
          flights={visibleResults}
          loading={loading}
          error={error}
          pendingIds={pendingIds}
          onCompare={handleCompare}
        />
      )}
      {returnPickerFor && (
        <ReturnFlightPicker
          key={`${flightIdentity(returnPickerFor)}|${searchParams?.return ?? ''}`}
          outbound={returnPickerFor}
          returnDate={searchParams?.return ?? ''}
          saving={savingReturn}
          onSelect={(returnFlight) => {
            setSavingReturn(true)
            dispatch(addRoundTripCandidate({ outbound: returnPickerFor, returnFlight })).finally(() => {
              setSavingReturn(false)
              setReturnPickerFor(null)
            })
          }}
          onCancel={() => setReturnPickerFor(null)}
        />
      )}
      <button
        data-testid="flight-add-custom-button"
        type="button"
        onClick={() => setShowCustomForm((show) => !show)}
        className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink-soft"
      >
        + Add custom transport
      </button>
      {showCustomForm && <FlightCustomTransportForm onSaved={() => setShowCustomForm(false)} />}
    </div>
  )
}
