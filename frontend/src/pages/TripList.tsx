import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TripForm } from '../components/trips/TripForm'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addTrip, editTrip, loadTrips, removeTrip } from '../store/tripsSlice'
import type { TripInput } from '../api/trips'

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return 'Dates TBD'
  return `${start} – ${end}`
}

export function TripList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { trips, loading, error } = useAppSelector((state) => state.trips)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    dispatch(loadTrips())
  }, [dispatch])

  async function handleCreate(input: TripInput) {
    const trip = await dispatch(addTrip(input)).unwrap()
    setCreating(false)
    navigate(`/trips/${trip.id}`)
  }

  async function handleEdit(id: number, input: TripInput) {
    await dispatch(editTrip({ id, payload: input })).unwrap()
    setEditingId(null)
  }

  function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"? This removes all its saved flights, hotels, rentals, and events.`)) return
    dispatch(removeTrip(id))
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">My Trips</h1>
        <button
          data-testid="new-trip-button"
          type="button"
          disabled={!!error}
          onClick={() => setCreating((c) => !c)}
          className="rounded bg-strong px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          + New Trip
        </button>
      </div>

      {creating && (
        <div className="mb-6 rounded border border-line-soft p-4">
          <TripForm submitLabel="Create trip" onSubmit={handleCreate} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-faint">Loading trips…</p>
      ) : trips.length === 0 ? (
        error ? (
          <p data-testid="trip-list-fetch-error" className="text-sm text-red-400">
            {error}
          </p>
        ) : (
          <p className="text-sm text-faint">No trips yet — create one to get started.</p>
        )
      ) : (
        <ul data-testid="trip-list" className="flex flex-col gap-3">
          {trips.map((trip) => (
            <li key={trip.id} data-testid="trip-list-item" className="rounded border border-line-soft p-4">
              {editingId === trip.id ? (
                <div>
                  <TripForm trip={trip} submitLabel="Save changes" onSubmit={(input) => handleEdit(trip.id, input)} />
                  <button
                    data-testid="trip-list-cancel-edit-button"
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="mt-3 text-sm text-faint hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Link to={`/trips/${trip.id}`} className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{trip.name}</p>
                    <p className="text-xs text-faint">
                      {trip.destinations.join(', ') || 'No destinations set'} ·{' '}
                      {formatDateRange(trip.start_date, trip.end_date)}
                    </p>
                  </Link>
                  <div className="ml-4 flex items-center gap-3">
                    <button
                      data-testid="trip-list-edit-button"
                      type="button"
                      onClick={() => setEditingId(trip.id)}
                      className="text-sm text-faint hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      data-testid="trip-list-delete-button"
                      type="button"
                      onClick={() => handleDelete(trip.id, trip.name)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
