import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { confirmCandidate, removeCandidate } from '../../store/flightsSlice'
import { formatShortDate } from '../../lib/time'
import { DirectBookingLink } from '../DirectBookingLink'
import { FlightSummary } from './FlightSummary'
import { FlightCustomTransportForm } from './FlightCustomTransportForm'
import { CandidateComparingList } from '../CandidateComparingList'

export function FlightComparing() {
  const dispatch = useAppDispatch()
  const candidates = [...useAppSelector((state) => state.flights.candidates)].sort((a, b) => a.price - b.price)
  const [editingId, setEditingId] = useState<number | null>(null)

  return (
    <CandidateComparingList
      candidates={candidates}
      testIdPrefix="flight"
      emptyMessage="No candidates yet. Add one from Search."
      showSortedByPrice
      keyFn={(candidate) => candidate.booking_token}
      onConfirm={(candidate) => dispatch(confirmCandidate(candidate.savedFlightId))}
      onRemove={(candidate) => dispatch(removeCandidate(candidate.savedFlightId))}
      onEdit={(candidate) => setEditingId(candidate.savedFlightId)}
      canEdit={(candidate) => candidate.source === 'custom'}
      isEditing={(candidate) => editingId === candidate.savedFlightId && candidate.source === 'custom'}
      renderEditForm={(candidate) =>
        candidate.source === 'custom' && (
          <FlightCustomTransportForm
            editing={{ savedFlightId: candidate.savedFlightId, initial: candidate }}
            onSaved={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        )
      }
      renderDetail={(candidate) =>
        candidate.source === 'custom' ? (
          <div>
            <p data-testid="flight-candidate-mode" className="text-xs text-faint">
              {candidate.mode}
            </p>
            <p data-testid="flight-candidate-route" className="text-sm font-semibold text-ink">
              {candidate.from} to {candidate.to}
            </p>
            {candidate.notes && (
              <p data-testid="flight-candidate-notes" className="text-xs text-faint">
                {candidate.notes}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <FlightSummary flight={candidate} testIdPrefix="candidate" />
            {candidate.return_flight && (
              <FlightSummary flight={candidate.return_flight} testIdPrefix="candidate-return" />
            )}
          </div>
        )
      }
      renderPrice={(candidate) => (
        <>
          <p data-testid="flight-candidate-price" className="text-lg font-bold text-ink">
            ${candidate.price}
            {candidate.source === 'custom' && ` ${candidate.cost_unit}`}
          </p>
          <p data-testid="flight-candidate-snapshot" className="text-xs text-faint">
            Price as of {formatShortDate(candidate.savedAt, { year: true })}
          </p>
          {candidate.source === 'search' && (
            <DirectBookingLink
              url={candidate.direct_booking_url}
              postData={candidate.direct_booking_post_data}
              testId="flight-candidate-booking-link"
            />
          )}
        </>
      )}
    />
  )
}
