import { useAppSelector } from '../store/hooks'
import { selectEventSpend } from '../store/eventsSlice'
import { selectFlightSpend } from '../store/flightsSlice'
import { selectHotelSpend } from '../store/hotelsSlice'
import { selectRentalSpend } from '../store/rentalsSlice'
import { candidateRoute } from '../lib/flightCandidate'
import { candidateTotalPrice } from '../lib/hotelCandidate'
import { candidateName as eventCandidateName, candidatePrice as eventCandidatePrice } from '../lib/eventCandidate'

const formatPrice = (n: number) => `$${n.toLocaleString('en-US')}`

export type ComparingTab = 'Flights' | 'Hotels' | 'Rentals' | 'Events'

type NamedItem = { key: string | number; name: string; price: number }

// Fixed swatches (not theme tokens) so slice identity reads the same in light/dark, and
// chosen to stay clear of the calendar's blue (confirmed) / amber (candidate) meaning.
const CATEGORY_COLOR: Record<ComparingTab, string> = {
  Flights: '#8b5cf6', // violet-500
  Hotels: '#10b981', // emerald-500
  Rentals: '#f43f5e', // rose-500
  Events: '#14b8a6', // teal-500
}

// Bar length is scaled to the category with the most money on the table (confirmed +
// pending), not to potentialCost — potentialCost mixes in "cheapest candidate wins"
// logic from TripSpend that doesn't belong in a bar meant to show current spend.
export function Budget({ onReviewPending }: { onReviewPending: (tab: ComparingTab) => void }) {
  const flights = useAppSelector(selectFlightSpend)
  const hotels = useAppSelector(selectHotelSpend)
  const rentals = useAppSelector(selectRentalSpend)
  const events = useAppSelector(selectEventSpend)

  const flightsRaw = useAppSelector((state) => state.flights)
  const hotelsRaw = useAppSelector((state) => state.hotels)
  const rentalsRaw = useAppSelector((state) => state.rentals)
  const eventsRaw = useAppSelector((state) => state.events)

  const categories = [
    { tab: 'Flights' as const, ...flights },
    { label: 'Hotel', tab: 'Hotels' as const, ...hotels },
    { label: 'Rental', tab: 'Rentals' as const, ...rentals },
    { label: 'Events', tab: 'Events' as const, ...events },
  ]

  // Name + price line items for the read-only breakdown below each bar
  // No dates/times here — Timeline already owns the dated view.
  // Each item's price is its total dollar contribution to the category — same basis the
  // spend selectors sum over — so the list always reconciles with the bar/summary above it.
  const itemsByTab: Record<ComparingTab, { confirmed: NamedItem[]; pending: NamedItem[] }> = {
    Flights: {
      confirmed: flightsRaw.confirmed.map((i) => ({ key: i.savedFlightId, name: candidateRoute(i), price: i.price })),
      pending: flightsRaw.candidates.map((i) => ({ key: i.savedFlightId, name: candidateRoute(i), price: i.price })),
    },
    Hotels: {
      confirmed: hotelsRaw.confirmed.map((i) => ({ key: i.savedHotelId, name: i.name, price: candidateTotalPrice(i) })),
      pending: hotelsRaw.candidates.map((i) => ({ key: i.savedHotelId, name: i.name, price: candidateTotalPrice(i) })),
    },
    Rentals: {
      confirmed: rentalsRaw.confirmed.map((i) => ({ key: i.savedRentalId, name: i.description, price: i.price })),
      pending: rentalsRaw.candidates.map((i) => ({ key: i.savedRentalId, name: i.description, price: i.price })),
    },
    Events: {
      confirmed: eventsRaw.confirmed.map((i) => ({ key: i.savedEventId, name: eventCandidateName(i), price: eventCandidatePrice(i) })),
      pending: eventsRaw.candidates.map((i) => ({ key: i.savedEventId, name: eventCandidateName(i), price: eventCandidatePrice(i) })),
    },
  }

  const confirmedTotal = categories.reduce((sum, c) => sum + c.confirmedTotal, 0)
  const pendingTotal = categories.reduce((sum, c) => sum + c.pendingTotal, 0)
  const potentialCost = categories.reduce((sum, c) => sum + c.potentialCost, 0)
  const maxOnTheTable = Math.max(...categories.map((c) => c.confirmedTotal + c.pendingTotal), 1)

  // Pie shows spend composition by category (confirmed + pending, same basis as each bar),
  // not confirmed-vs-pending — the bars already cover that split.
  const totalOnTheTable = confirmedTotal + pendingTotal
  const slices = categories.filter((c) => c.confirmedTotal + c.pendingTotal > 0)
  let cursor = 0
  const gradientStops = slices.map((c) => {
    const share = ((c.confirmedTotal + c.pendingTotal) / totalOnTheTable) * 100
    const start = cursor
    cursor += share
    return `${CATEGORY_COLOR[c.tab]} ${start}% ${cursor}%`
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-end gap-8 border-b border-line-soft pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Confirmed</p>
          <p data-testid="budget-confirmed" className="text-3xl font-semibold text-ink">
            {formatPrice(confirmedTotal)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">+ Pending</p>
          <p data-testid="budget-pending" className="text-3xl font-semibold text-faint">
            {formatPrice(pendingTotal)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {pendingTotal === 0 ? 'Total' : 'Potential Total'}
          </p>
          <p data-testid="budget-potential" className="text-3xl font-semibold text-ink-soft">
            {formatPrice(potentialCost)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs text-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink" /> Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-line-soft" /> Pending
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {categories.map((c) => {
          const onTheTable = c.confirmedTotal + c.pendingTotal
          const barWidthPct = (onTheTable / maxOnTheTable) * 100
          const confirmedSharePct = onTheTable > 0 ? (c.confirmedTotal / onTheTable) * 100 : 0
          const { confirmed: confirmedItems, pending: pendingItems } = itemsByTab[c.tab]
          const showTwoColumns = confirmedItems.length > 0 && pendingItems.length > 0
          return (
            <div key={c.label} data-testid="budget-category-row">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-ink">{c.label}</span>
                <span className="text-ink-soft">
                  {onTheTable > 0 ? (
                    <>
                      {formatPrice(c.confirmedTotal)} confirmed
                      {c.pendingTotal > 0 && ` + ${formatPrice(c.pendingTotal)} pending`}
                    </>
                  ) : (
                    formatPrice(0)
                  )}
                  {c.pendingTotal > 0 && (
                    <button
                      type="button"
                      data-testid="budget-review-pending-button"
                      onClick={() => onReviewPending(c.tab)}
                      className="ml-2 font-medium text-ink underline underline-offset-2"
                    >
                      Review &rarr;
                    </button>
                  )}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded bg-canvas ring-1 ring-inset ring-line-soft">
                <div className="flex h-full" style={{ width: `${barWidthPct}%` }}>
                  <div className="h-full bg-ink" style={{ width: `${confirmedSharePct}%` }} />
                  <div className="h-full bg-line-soft" style={{ width: `${100 - confirmedSharePct}%` }} />
                </div>
              </div>
              {(confirmedItems.length > 0 || pendingItems.length > 0) && (
                <div className={`mt-2 grid gap-x-4 text-xs ${showTwoColumns ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {confirmedItems.length > 0 && (
                    <ul data-testid="budget-item-list-confirmed" className="space-y-0.5 text-ink-soft">
                      {confirmedItems.map((item) => (
                        <li key={item.key} data-testid="budget-item" className="flex justify-between gap-2">
                          <span className="truncate">{item.name}</span>
                          <span data-testid="budget-item-price" className="shrink-0 tabular-nums">
                            {formatPrice(item.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {pendingItems.length > 0 && (
                    <ul data-testid="budget-item-list-pending" className="space-y-0.5 text-faint">
                      {pendingItems.map((item) => (
                        <li key={item.key} data-testid="budget-item" className="flex justify-between gap-2">
                          <span className="truncate">{item.name}</span>
                          <span data-testid="budget-item-price" className="shrink-0 tabular-nums">
                            {formatPrice(item.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalOnTheTable > 0 && (
        <div className="mt-8 flex flex-col items-center gap-4 border-t border-line-soft pt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Spend by Category</p>
          <div
            data-testid="budget-pie-chart"
            className="h-40 w-40 rounded-full"
            style={{ background: `conic-gradient(${gradientStops.join(', ')})` }}
          />
          <div
            data-testid="budget-pie-legend"
            className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-ink-soft"
          >
            {slices.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: CATEGORY_COLOR[c.tab] }}
                />
                {c.label} &middot; {Math.round(((c.confirmedTotal + c.pendingTotal) / totalOnTheTable) * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
