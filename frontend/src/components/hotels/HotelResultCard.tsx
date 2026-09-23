import type { HotelOption } from '../../api/hotels'
import { nightsBetween } from '../../lib/hotelCandidate'

function starRating(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(Math.max(0, 5 - stars))
}

export function HotelResultCard({
  hotel,
  checkIn,
  checkOut,
  pending = false,
  onCompare,
}: {
  hotel: HotelOption
  checkIn: string
  checkOut: string
  pending?: boolean
  onCompare: () => void
}) {
  const nights = nightsBetween(checkIn, checkOut)
  const thumbnail = hotel.images?.[0]?.thumbnail

  return (
    <div
      data-testid="hotel-result-card"
      className={`flex items-center justify-between gap-4 rounded border border-line-soft p-4 ${pending ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded bg-surface" />
        )}
        <div>
          <p data-testid="hotel-result-name" className="text-base font-semibold text-ink">
            {hotel.name}
          </p>
          {hotel.extracted_hotel_class != null && (
            <p data-testid="hotel-result-stars" className="text-sm text-amber-500">
              {starRating(hotel.extracted_hotel_class)}
            </p>
          )}
          <p data-testid="hotel-result-detail" className="text-xs text-faint">
            {checkIn} to {checkOut} &middot; {nights} {nights === 1 ? 'night' : 'nights'}
            {hotel.overall_rating != null && (
              <>
                {' '}
                &middot; {hotel.overall_rating.toFixed(1)} ({hotel.reviews ?? 0})
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p data-testid="hotel-result-price" className="text-lg font-bold text-ink">
            ${hotel.rate_per_night.extracted_lowest}
          </p>
          <p className="text-xs text-faint">/night</p>
          <p data-testid="hotel-result-total" className="text-xs text-faint">
            ${hotel.rate_per_night.extracted_lowest * nights} total
          </p>
        </div>
        <button
          data-testid="hotel-result-compare-button"
          type="button"
          onClick={onCompare}
          disabled={pending}
          className="rounded bg-strong px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Adding to trip…' : '+ Compare'}
        </button>
      </div>
    </div>
  )
}
