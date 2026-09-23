import type { HotelOption } from '../../api/hotels'
import { HotelResultCard } from './HotelResultCard'

export function HotelResults({
  hotels,
  loading,
  error,
  checkIn,
  checkOut,
  pendingIds,
  onCompare,
}: {
  hotels: HotelOption[]
  loading: boolean
  error: string | null
  checkIn: string
  checkOut: string
  pendingIds: Set<string>
  onCompare: (hotel: HotelOption) => void
}) {
  if (loading) return <p className="text-sm text-faint">Searching…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (hotels.length === 0) return <p className="text-sm text-faint">No results.</p>

  return (
    <div>
      <p data-testid="hotel-results-count" className="mb-2 text-sm text-faint">
        {hotels.length} results &middot; sorted by price
      </p>
      <div className="space-y-3">
        {hotels.map((hotel) => (
          <HotelResultCard
            key={hotel.property_token}
            hotel={hotel}
            checkIn={checkIn}
            checkOut={checkOut}
            pending={pendingIds.has(hotel.property_token)}
            onCompare={() => onCompare(hotel)}
          />
        ))}
      </div>
    </div>
  )
}
