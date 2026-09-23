import { Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { TripList } from './pages/TripList'
import { TripDetail } from './pages/TripDetail'
import { DemoBanner } from './components/DemoBanner'

function App() {
  return (
    <>
      {import.meta.env.VITE_DEMO === 'true' && <DemoBanner />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trips" element={<TripList />} />
        <Route path="/trips/:tripId" element={<TripDetail />} />
      </Routes>
    </>
  )
}

export default App
