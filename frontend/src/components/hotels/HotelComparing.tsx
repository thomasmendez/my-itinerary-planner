import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { confirmCandidate, removeCandidate } from '../../store/hotelsSlice'
import { formatShortDate } from '../../lib/time'
import {
  candidateCheckIn,
  candidateCheckOut,
  candidateLocation,
  candidatePricePerNight,
  candidateTotalPrice,
} from '../../lib/hotelCandidate'
import { DirectBookingLink } from '../DirectBookingLink'
import { HotelCustomLodgingForm } from './HotelCustomLodgingForm'
import { CandidateComparingList } from '../CandidateComparingList'

export function HotelComparing() {
  const dispatch = useAppDispatch()
  const candidates = [...useAppSelector((state) => state.hotels.candidates)].sort(
    (a, b) => candidatePricePerNight(a) - candidatePricePerNight(b),
  )
  const [editingId, setEditingId] = useState<number | null>(null)

  return (
    <CandidateComparingList
      candidates={candidates}
      testIdPrefix="hotel"
      emptyMessage="No candidates yet. Add one from Search."
      showSortedByPrice
      keyFn={(candidate) => (candidate.source === 'custom' ? candidate.booking_token : candidate.property_token)}
      onConfirm={(candidate) => dispatch(confirmCandidate(candidate.savedHotelId))}
      onRemove={(candidate) => dispatch(removeCandidate(candidate.savedHotelId))}
      onEdit={(candidate) => setEditingId(candidate.savedHotelId)}
      canEdit={(candidate) => candidate.source === 'custom'}
      isEditing={(candidate) => editingId === candidate.savedHotelId && candidate.source === 'custom'}
      renderEditForm={(candidate) =>
        candidate.source === 'custom' && (
          <HotelCustomLodgingForm
            editing={{ savedHotelId: candidate.savedHotelId, initial: candidate }}
            onSaved={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        )
      }
      renderDetail={(candidate) => (
        <div>
          <p data-testid="hotel-candidate-name" className="text-sm font-semibold text-ink">
            {candidate.name}
          </p>
          <p data-testid="hotel-candidate-location" className="text-xs text-faint">
            {candidateLocation(candidate)}
          </p>
          <p data-testid="hotel-candidate-dates" className="text-xs text-faint">
            {candidateCheckIn(candidate)} to {candidateCheckOut(candidate)}
          </p>
          {candidate.source === 'search' && candidate.address && (
            <p data-testid="hotel-candidate-address" className="text-xs text-faint">
              {candidate.address}
            </p>
          )}
          {candidate.source === 'search' && (candidate.check_in_time || candidate.check_out_time) && (
            <p data-testid="hotel-candidate-checkin-checkout" className="text-xs text-faint">
              Check-in {candidate.check_in_time} &middot; Check-out {candidate.check_out_time}
            </p>
          )}
        </div>
      )}
      renderPrice={(candidate) => (
        <>
          <p data-testid="hotel-candidate-price" className="text-lg font-bold text-ink">
            ${candidate.source === 'custom' ? candidate.price : candidate.rate_per_night.extracted_lowest}
            {candidate.source === 'custom' ? ` ${candidate.cost_unit}` : '/night'}
          </p>
          {candidate.source === 'search' && (
            <p data-testid="hotel-candidate-total" className="text-xs text-faint">
              ${candidateTotalPrice(candidate)} total
            </p>
          )}
          <p data-testid="hotel-candidate-snapshot" className="text-xs text-faint">
            Price as of {formatShortDate(candidate.savedAt, { year: true })}
          </p>
          {candidate.source === 'search' && (
            <DirectBookingLink url={candidate.direct_booking_url} testId="hotel-candidate-booking-link" />
          )}
        </>
      )}
    />
  )
}
