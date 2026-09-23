import { useState } from 'react'
import type { EventOption, EventSearchParams } from '../../api/events'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { addCandidate, runEventSearch, selectVisibleEventResults } from '../../store/eventsSlice'
import { EventSearchForm } from './EventSearchForm'
import { EventResults } from './EventResults'
import { EventCustomForm } from './EventCustomForm'

export function EventSearch() {
  const dispatch = useAppDispatch()
  const { loading, error, searched } = useAppSelector((state) => state.events)
  const results = useAppSelector(selectVisibleEventResults)
  const [showCustomForm, setShowCustomForm] = useState(false)

  const runSearch = (params: EventSearchParams) => {
    dispatch(runEventSearch(params))
  }

  return (
    <div className="space-y-4">
      <EventSearchForm onSearch={runSearch} loading={loading} />
      {searched && (
        <EventResults
          events={results}
          loading={loading}
          error={error}
          onCompare={(event: EventOption, startsAt: string) => dispatch(addCandidate({ event, startsAt }))}
        />
      )}
      <button
        data-testid="event-add-custom-button"
        type="button"
        onClick={() => setShowCustomForm((show) => !show)}
        className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink-soft"
      >
        + Add custom event
      </button>
      {showCustomForm && <EventCustomForm onSaved={() => setShowCustomForm(false)} />}
    </div>
  )
}
