import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { confirmCandidate, removeCandidate } from '../../store/rentalsSlice'
import { formatShortDate } from '../../lib/time'
import { candidateDateRange } from '../../lib/rentalCandidate'
import { RentalCustomVehicleForm } from './RentalCustomVehicleForm'
import { CandidateComparingList } from '../CandidateComparingList'

export function RentalComparing() {
  const dispatch = useAppDispatch()
  const candidates = useAppSelector((state) => state.rentals.candidates)
  const [editingId, setEditingId] = useState<number | null>(null)

  return (
    <CandidateComparingList
      candidates={candidates}
      testIdPrefix="rental"
      emptyMessage="No candidates yet. Add one from Search."
      keyFn={(candidate) => candidate.booking_token}
      onConfirm={(candidate) => dispatch(confirmCandidate(candidate.savedRentalId))}
      onRemove={(candidate) => dispatch(removeCandidate(candidate.savedRentalId))}
      onEdit={(candidate) => setEditingId(candidate.savedRentalId)}
      isEditing={(candidate) => editingId === candidate.savedRentalId}
      renderEditForm={(candidate) => (
        <RentalCustomVehicleForm
          editing={{ savedRentalId: candidate.savedRentalId, initial: candidate }}
          onSaved={() => setEditingId(null)}
          onCancel={() => setEditingId(null)}
        />
      )}
      renderDetail={(candidate) => (
        <div>
          <p data-testid="rental-candidate-description" className="text-sm font-semibold text-ink">
            {candidate.description}
          </p>
          <p data-testid="rental-candidate-pickup-location" className="text-xs text-faint">
            {candidate.pickup_location}
          </p>
          <p data-testid="rental-candidate-dates" className="text-xs text-faint">
            {candidateDateRange(candidate)}
          </p>
        </div>
      )}
      renderPrice={(candidate) => (
        <>
          <p data-testid="rental-candidate-price" className="text-lg font-bold text-ink">
            ${candidate.price} {candidate.cost_unit}
          </p>
          <p data-testid="rental-candidate-snapshot" className="text-xs text-faint">
            Price as of {formatShortDate(candidate.savedAt, { year: true })}
          </p>
        </>
      )}
    />
  )
}
