import { useState } from 'react'
import { Placeholder } from './Placeholder'
import { CalendarView } from './calendar/CalendarView'
import { Timeline } from './Timeline'
import { Budget } from './Budget'
import { FlightSearch } from './flights/FlightSearch'
import { FlightComparing } from './flights/FlightComparing'
import { HotelSearch } from './hotels/HotelSearch'
import { HotelComparing } from './hotels/HotelComparing'
import { RentalSearch } from './rentals/RentalSearch'
import { RentalComparing } from './rentals/RentalComparing'
import { EventSearch } from './events/EventSearch'
import { EventComparing } from './events/EventComparing'
import { MapView } from './map/MapView'
import { useAppSelector } from '../store/hooks'

const TABS = ['Flights', 'Hotels', 'Rentals', 'Events', 'Map', 'Calendar', 'Timeline', 'Budget'] as const
type Tab = (typeof TABS)[number]

const TABS_WITH_SUB_TABS: Tab[] = ['Flights', 'Hotels', 'Rentals', 'Events']
const SUB_TAB_LABELS: [string, string] = ['Search', 'Comparing']

export function SearchWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>('Flights')
  const [activeSubTab, setActiveSubTab] = useState(0)
  const candidateCounts: Partial<Record<Tab, number>> = {
    Flights: useAppSelector((state) => state.flights.candidates.length),
    Hotels: useAppSelector((state) => state.hotels.candidates.length),
    Rentals: useAppSelector((state) => state.rentals.candidates.length),
    Events: useAppSelector((state) => state.events.candidates.length),
  }

  const subTabs = TABS_WITH_SUB_TABS.includes(activeTab) ? SUB_TAB_LABELS : undefined
  const subTabLabel = (tab: Tab, label: string) =>
    label === 'Comparing' ? `${label} [${candidateCounts[tab]}]` : label

  return (
    <div>
      <div className="flex gap-6 border-b border-line-soft">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab)
              setActiveSubTab(0)
            }}
            className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium ${
              activeTab === tab
                ? 'border-ink text-ink'
                : 'border-transparent text-faint hover:text-ink-soft'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {subTabs && (
        <div className="flex gap-4 border-b border-line-soft py-2 text-sm">
          {subTabs.map((label, i) => (
            <button
              key={label}
              type="button"
              data-testid={`subtab-${activeTab.toLowerCase()}-${label.toLowerCase()}`}
              onClick={() => setActiveSubTab(i)}
              className={`px-1 ${
                activeSubTab === i ? 'font-semibold text-ink' : 'text-faint'
              }`}
            >
              {subTabLabel(activeTab, label)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        {activeTab === 'Flights' && activeSubTab === 0 ? (
          <FlightSearch />
        ) : activeTab === 'Flights' && activeSubTab === 1 ? (
          <FlightComparing />
        ) : activeTab === 'Hotels' && activeSubTab === 0 ? (
          <HotelSearch />
        ) : activeTab === 'Hotels' && activeSubTab === 1 ? (
          <HotelComparing />
        ) : activeTab === 'Rentals' && activeSubTab === 0 ? (
          <RentalSearch />
        ) : activeTab === 'Rentals' && activeSubTab === 1 ? (
          <RentalComparing />
        ) : activeTab === 'Events' && activeSubTab === 0 ? (
          <EventSearch />
        ) : activeTab === 'Events' && activeSubTab === 1 ? (
          <EventComparing />
        ) : activeTab === 'Map' ? (
          <MapView />
        ) : activeTab === 'Calendar' ? (
          <CalendarView />
        ) : activeTab === 'Timeline' ? (
          <Timeline />
        ) : activeTab === 'Budget' ? (
          <Budget
            onReviewPending={(tab) => {
              setActiveTab(tab)
              setActiveSubTab(1)
            }}
          />
        ) : (
          <div className="space-y-4">
            <Placeholder label={`${activeTab} search form`} className="h-24" />
            <Placeholder label={`${activeTab} results / comparing list`} className="h-96" />
          </div>
        )}
      </div>
    </div>
  )
}
