import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { confirmCandidate, removeCandidate } from '../../store/eventsSlice'
import {
  candidateCostUnit,
  candidateDateTimeLabel,
  candidateEventLocation,
  candidateName,
  candidatePrice,
} from '../../lib/eventCandidate'
import { formatShortDate } from '../../lib/time'
import { EventCustomForm } from './EventCustomForm'
import { CandidateComparingList } from '../CandidateComparingList'

export function EventComparing() {
  const dispatch = useAppDispatch()
  const candidates = useAppSelector((state) => state.events.candidates)
  const [editingId, setEditingId] = useState<number | null>(null)

  return (
    <CandidateComparingList
      candidates={candidates}
      testIdPrefix="event"
      emptyMessage="No candidates yet. Add one from Search."
      keyFn={(candidate) => candidate.savedEventId}
      onConfirm={(candidate) => dispatch(confirmCandidate(candidate.savedEventId))}
      onRemove={(candidate) => dispatch(removeCandidate(candidate.savedEventId))}
      onEdit={(candidate) => setEditingId(candidate.savedEventId)}
      canEdit={(candidate) => candidate.source === 'custom'}
      isEditing={(candidate) => editingId === candidate.savedEventId && candidate.source === 'custom'}
      renderEditForm={(candidate) =>
        candidate.source === 'custom' && (
          <EventCustomForm
            editing={{ savedEventId: candidate.savedEventId, initial: candidate }}
            onSaved={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        )
      }
      renderDetail={(candidate) => (
        <div>
          <p data-testid="event-candidate-name" className="text-sm font-semibold text-ink">
            {candidateName(candidate)}
          </p>
          <p data-testid="event-candidate-location" className="text-xs text-faint">
            {candidateEventLocation(candidate)}
          </p>
          <p data-testid="event-candidate-datetime" className="text-xs text-faint">
            {candidateDateTimeLabel(candidate)}
          </p>
        </div>
      )}
      renderPrice={(candidate) =>
        candidate.source === 'custom' ? (
          <>
            <p data-testid="event-candidate-price" className="text-lg font-bold text-ink">
              ${candidatePrice(candidate)} {candidateCostUnit(candidate)}
            </p>
            <p data-testid="event-candidate-snapshot" className="text-xs text-faint">
              Price as of {formatShortDate(candidate.savedAt, { year: true })}
            </p>
          </>
        ) : null
      }
    />
  )
}
