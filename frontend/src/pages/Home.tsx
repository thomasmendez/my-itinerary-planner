import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TripForm } from '../components/trips/TripForm'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addTrip, loadTrips } from '../store/tripsSlice'
import type { TripInput } from '../api/trips'

// Single active-trip experience: "/" isn't a dashboard, it drops the user straight
// into their most recent trip (or a create form if they have none yet). Browsing/
// switching between trips lives at /trips.
export function Home() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { trips, loading, error } = useAppSelector((state) => state.trips)

  useEffect(() => {
    dispatch(loadTrips())
  }, [dispatch])

  async function handleCreate(input: TripInput) {
    const trip = await dispatch(addTrip(input)).unwrap()
    navigate(`/trips/${trip.id}`)
  }

  if (loading) return <p className="p-6 text-sm text-faint">Loading…</p>
  if (error)
    return (
      <p data-testid="home-fetch-error" className="p-6 text-sm text-red-400">
        {error}
      </p>
    )
  if (trips.length > 0) return <Navigate to={`/trips/${trips[0].id}`} replace />

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-lg font-bold text-ink">Create your first trip</h1>
      <TripForm submitLabel="Create trip" onSubmit={handleCreate} />
    </div>
  )
}
