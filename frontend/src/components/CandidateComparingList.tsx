import type { ReactNode } from 'react'

// Shared shell for Flight/Hotel/Event/RentalComparing — same count line, card wrapper,
// and Edit/Remove/Confirm buttons across all four; only the detail block, price, and
// edit-in-place form differ.
export function CandidateComparingList<T>({
  candidates,
  testIdPrefix,
  emptyMessage,
  showSortedByPrice = false,
  keyFn,
  renderDetail,
  renderPrice,
  onConfirm,
  onRemove,
  onEdit,
  canEdit,
  isEditing,
  renderEditForm,
}: {
  candidates: T[]
  testIdPrefix: string
  emptyMessage: string
  showSortedByPrice?: boolean
  keyFn: (candidate: T) => string | number | undefined
  renderDetail: (candidate: T) => ReactNode
  renderPrice: (candidate: T) => ReactNode | null
  onConfirm: (candidate: T) => void
  onRemove: (candidate: T) => void
  // Custom entries only support inline editing while still a candidate — omit onEdit
  // entirely for candidate types that never support it (e.g. search results).
  onEdit?: (candidate: T) => void
  canEdit?: (candidate: T) => boolean
  isEditing?: (candidate: T) => boolean
  renderEditForm?: (candidate: T) => ReactNode
}) {
  if (candidates.length === 0) {
    return <p className="text-sm text-faint">{emptyMessage}</p>
  }

  return (
    <div>
      <p data-testid={`${testIdPrefix}-candidates-count`} className="mb-2 text-sm text-faint">
        {candidates.length} {candidates.length === 1 ? 'candidate' : 'candidates'}
        {showSortedByPrice && <> &middot; sorted by price</>}
      </p>
      <div className="space-y-3">
        {candidates.map((candidate) => {
          if (isEditing?.(candidate) && renderEditForm) {
            return <div key={keyFn(candidate)}>{renderEditForm(candidate)}</div>
          }

          return (
            <div
              key={keyFn(candidate)}
              data-testid={`${testIdPrefix}-candidate-card`}
              className="flex items-center justify-between gap-4 rounded border border-line-soft p-4"
            >
              {renderDetail(candidate)}
              <div className="flex flex-col items-end gap-2">
                {renderPrice(candidate)}
                <div className="flex gap-2">
                  {onEdit && (canEdit ? canEdit(candidate) : true) && (
                    <button
                      data-testid={`${testIdPrefix}-candidate-edit-button`}
                      type="button"
                      onClick={() => onEdit(candidate)}
                      className="rounded border border-line px-3 py-1 text-sm font-medium text-ink-soft"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    data-testid={`${testIdPrefix}-candidate-remove-button`}
                    type="button"
                    onClick={() => onRemove(candidate)}
                    className="rounded border border-line px-3 py-1 text-sm font-medium text-ink-soft"
                  >
                    Remove
                  </button>
                  <button
                    data-testid={`${testIdPrefix}-candidate-confirm-button`}
                    type="button"
                    onClick={() => onConfirm(candidate)}
                    className="rounded bg-strong px-3 py-1 text-sm font-medium text-white"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
