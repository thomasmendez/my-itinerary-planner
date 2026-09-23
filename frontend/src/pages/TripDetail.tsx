import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { TripPlan } from '../components/TripPlan'
import { TripSpend } from '../components/TripSpend'
import { SearchWorkspace } from '../components/SearchWorkspace'
import { ChatWidget } from '../components/chat/ChatWidget'
import { useAppDispatch } from '../store/hooks'
import { loadSavedEvents } from '../store/eventsSlice'
import { loadSavedFlights } from '../store/flightsSlice'
import { loadSavedHotels } from '../store/hotelsSlice'
import { loadSavedRentals } from '../store/rentalsSlice'
import { loadTrips, setActiveTripId } from '../store/tripsSlice'

export function TripDetail() {
  const dispatch = useAppDispatch()
  const { tripId } = useParams<{ tripId: string }>()

  useEffect(() => {
    dispatch(setActiveTripId(Number(tripId)))
    dispatch(loadTrips()).then(() => {
      dispatch(loadSavedFlights())
      dispatch(loadSavedHotels())
      dispatch(loadSavedRentals())
      dispatch(loadSavedEvents())
    })
  }, [dispatch, tripId])

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6 pb-24 lg:flex-row">
        <aside className="flex flex-col gap-6 lg:w-72 lg:shrink-0">
          <TripPlan />
          <TripSpend />
        </aside>
        <main className="min-w-0 flex-1">
          <SearchWorkspace />
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
