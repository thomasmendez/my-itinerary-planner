import { useState } from 'react'
import type { HotelOption, HotelSearchParams } from '../../api/hotels'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { addCandidate, runHotelSearch, selectVisibleHotelResults } from '../../store/hotelsSlice'
import { HotelSearchForm } from './HotelSearchForm'
import { HotelResults } from './HotelResults'
import { HotelCustomLodgingForm } from './HotelCustomLodgingForm'

export function HotelSearch() {
  const dispatch = useAppDispatch()
  const { loading, error, searched, searchParams } = useAppSelector((state) => state.hotels)
  const results = useAppSelector(selectVisibleHotelResults)
  const [showCustomForm, setShowCustomForm] = useState(false)
  // Compare awaits a real network round-trip (booking-link fetch, then save). Track
  // in-flight tokens so the card can gray out and disable Compare instead of letting a
  // slow save get double-clicked into two candidates for the same hotel.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const runSearch = (params: HotelSearchParams) => {
    dispatch(runHotelSearch(params))
  }

  const handleCompare = (hotel: HotelOption) => {
    const id = hotel.property_token
    setPendingIds((prev) => new Set(prev).add(id))
    dispatch(addCandidate(hotel)).finally(() => {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    })
  }

  return (
    <div className="space-y-4">
      <HotelSearchForm onSearch={runSearch} loading={loading} />
      {searched && searchParams && (
        <HotelResults
          hotels={results}
          loading={loading}
          error={error}
          checkIn={searchParams.checkIn}
          checkOut={searchParams.checkOut}
          pendingIds={pendingIds}
          onCompare={handleCompare}
        />
      )}
      <button
        data-testid="hotel-add-custom-button"
        type="button"
        onClick={() => setShowCustomForm((show) => !show)}
        className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink-soft"
      >
        + Add custom lodging
      </button>
      {showCustomForm && <HotelCustomLodgingForm onSaved={() => setShowCustomForm(false)} />}
    </div>
  )
}
