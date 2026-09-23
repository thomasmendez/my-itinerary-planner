import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { editTrip, removeTrip, selectActiveTrip } from '../store/tripsSlice'
import { useTheme } from '../lib/useTheme'
import { TripForm } from './trips/TripForm'
import type { TripInput } from '../api/trips'

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return 'Dates TBD'
  const format = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return `${format(start)} - ${format(end)}`
}

export function Header() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const trip = useAppSelector(selectActiveTrip)
  const { loading, error } = useAppSelector((state) => state.trips)
  const { theme, toggleTheme } = useTheme()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const title = loading
    ? 'Loading trip…'
    : error
      ? error
      : trip
        ? `${trip.name}, ${formatDateRange(trip.start_date, trip.end_date)}`
        : 'No trip found'

  function handleEditSubmit(input: TripInput) {
    if (!trip) return
    dispatch(editTrip({ id: trip.id, payload: input }))
    dialogRef.current?.close()
  }

  function handleDelete() {
    if (!trip) return
    if (!window.confirm(`Delete "${trip.name}"? This removes all its saved flights, hotels, rentals, and events.`))
      return
    dispatch(removeTrip(trip.id))
    dialogRef.current?.close()
    navigate('/trips')
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 bg-strong px-6 py-4 text-white">
      <div className="flex items-center gap-4">
        <h1 data-testid="trip-header-title" className={`text-lg font-bold ${error ? 'text-red-400' : ''}`}>
          {title}
        </h1>
        <button
          type="button"
          data-testid="edit-trip-button"
          disabled={!trip}
          onClick={() => dialogRef.current?.showModal()}
          className="text-sm text-neutral-400 hover:text-white disabled:opacity-50"
        >
          Edit Trip
        </button>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/trips" data-testid="my-trips-link" className="text-sm text-neutral-400 hover:text-white">
          My Trips
        </Link>
        <button
          type="button"
          data-testid="theme-toggle-button"
          onClick={toggleTheme}
          className="text-sm text-neutral-400 hover:text-white"
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        {import.meta.env.VITE_DEMO === 'true' && (
          <a
            href="https://github.com/thomasmendez/my-itinerary-planner"
            target="_blank"
            rel="noreferrer"
            data-testid="github-link"
            aria-label="View source on GitHub"
            className="text-neutral-400 hover:text-white"
          >
            <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
        )}
      </div>

      <dialog
        ref={dialogRef}
        data-testid="edit-trip-dialog"
        className="w-full max-w-lg rounded border border-line-soft bg-canvas p-6 text-ink backdrop:bg-black/50"
      >
        {trip && (
          <>
            <h2 className="mb-4 text-base font-bold">Edit trip</h2>
            <TripForm key={trip.id} trip={trip} submitLabel="Save changes" onSubmit={handleEditSubmit} />
            <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-4">
              <button
                type="button"
                data-testid="delete-trip-button"
                onClick={handleDelete}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Delete trip
              </button>
              <button
                type="button"
                data-testid="cancel-edit-trip-button"
                onClick={() => dialogRef.current?.close()}
                className="rounded border border-line px-4 py-1.5 text-sm font-medium text-ink-soft"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </dialog>
    </header>
  )
}
