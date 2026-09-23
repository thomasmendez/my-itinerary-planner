import { expect, type Page } from '@playwright/test'
import type { MockOverride } from '../src/mocks/browser'

// Shared Playwright actions reused across spec files. Plain functions taking `page`,
// matching the existing per-file shape — no page-object classes, no fixtures/DI.

export type Category = 'flight' | 'hotel' | 'rental' | 'event'

export async function mockOverrides(page: Page, overrides: MockOverride[]) {
  await page.addInitScript((o) => {
    window.__mswTestOverrides = o
  }, overrides)
}

const TAB_LABEL: Partial<Record<Category, string>> = {
  hotel: 'Hotels',
  rental: 'Rentals',
  event: 'Events',
}

// Flights is the default landing tab, so no tab click is needed for it.
export async function openTab(page: Page, category: Category) {
  await page.goto('/')
  const label = TAB_LABEL[category]
  if (label) await page.getByRole('button', { name: label, exact: true }).click()
}

export async function openCustomForm(page: Page, category: Category) {
  await openTab(page, category)
  await page.getByTestId(`${category}-add-custom-button`).click()
  await expect(page.getByTestId(`${category}-custom-form`)).toBeVisible()
}

export async function searchCdgToAus(page: Page) {
  await openTab(page, 'flight')
  await page.getByTestId('flight-from-input').fill('CDG')
  await page.getByTestId('flight-to-input').fill('AUS')
  await page.getByTestId('flight-depart-input').fill('2026-07-30')
  await page.getByTestId('flight-travelers-input').fill('1')
  await page.getByTestId('flight-search-submit').click()
  await expect(page.getByTestId('flight-result-card')).toHaveCount(4)
}

// DAL -> DEN, round trip, depart 2026-11-01 / return 2026-11-07. Unlike searchCdgToAus's
// one-way fixture, these results have no booking_token (departure_token only, mirroring
// real SerpApi round-trip responses - see mocks/data/flights.ts).
export async function searchDalToDenRoundTrip(page: Page) {
  await openTab(page, 'flight')
  await page.getByTestId('flight-from-input').fill('DAL')
  await page.getByTestId('flight-to-input').fill('DEN')
  await page.getByTestId('flight-depart-input').fill('2026-11-01')
  await page.getByTestId('flight-return-input').fill('2026-11-07')
  await page.getByTestId('flight-travelers-input').fill('1')
  await page.getByTestId('flight-search-submit').click()
  await expect(page.getByTestId('flight-result-card')).toHaveCount(3)
}

// AUS -> DEN, round trip, depart 2026-12-01 / return 2026-12-08. Unlike
// searchDalToDenRoundTrip's tokenless fixture, this outbound result carries a real
// departure_token, so "+ Compare" opens the ReturnFlightPicker instead of adding directly.
export async function searchAusToDenRoundTripWithTokens(page: Page) {
  await openTab(page, 'flight')
  await page.getByTestId('flight-from-input').fill('AUS')
  await page.getByTestId('flight-to-input').fill('DEN')
  await page.getByTestId('flight-depart-input').fill('2026-12-01')
  await page.getByTestId('flight-return-input').fill('2026-12-08')
  await page.getByTestId('flight-travelers-input').fill('1')
  await page.getByTestId('flight-search-submit').click()
  await expect(page.getByTestId('flight-result-card')).toHaveCount(1)
}

export async function searchBaliResorts(page: Page) {
  await openTab(page, 'hotel')
  await page.getByTestId('hotel-location-input').fill('Bali Resorts')
  await page.getByTestId('hotel-checkin-input').fill('2026-08-29')
  await page.getByTestId('hotel-checkout-input').fill('2026-08-30')
  await page.getByTestId('hotel-guests-input').fill('2')
  await page.getByTestId('hotel-search-submit').click()
  await expect(page.getByTestId('hotel-result-card')).toHaveCount(3)
}

export async function fillCustomTransport(
  page: Page,
  fields: {
    mode?: string
    from: string
    to: string
    depart: string
    return?: string
    cost?: string
    costUnit?: string
    notes?: string
  },
) {
  if (fields.mode) await page.getByTestId('flight-custom-mode-select').selectOption(fields.mode)
  await page.getByTestId('flight-custom-from-input').fill(fields.from)
  await page.getByTestId('flight-custom-to-input').fill(fields.to)
  await page.getByTestId('flight-custom-depart-input').fill(fields.depart)
  if (fields.return) await page.getByTestId('flight-custom-return-input').fill(fields.return)
  if (fields.cost !== undefined) await page.getByTestId('flight-custom-cost-input').fill(fields.cost)
  if (fields.costUnit !== undefined) await page.getByTestId('flight-custom-cost-unit-input').fill(fields.costUnit)
  if (fields.notes) await page.getByTestId('flight-custom-notes-input').fill(fields.notes)
  await page.getByTestId('flight-custom-save-button').click()
}

export async function fillCustomVehicle(
  page: Page,
  fields: {
    description: string
    pickupLocation?: string
    dropoffLocation?: string
    pickupAt: string // datetime-local value, 'YYYY-MM-DDTHH:mm'
    dropoffAt: string
    cost?: string
    costUnit?: string
    notes?: string
  },
) {
  await page.getByTestId('rental-custom-description-input').fill(fields.description)
  if (fields.pickupLocation) await page.getByTestId('rental-custom-pickup-location-input').fill(fields.pickupLocation)
  if (fields.dropoffLocation)
    await page.getByTestId('rental-custom-dropoff-location-input').fill(fields.dropoffLocation)
  await page.getByTestId('rental-custom-pickup-input').fill(fields.pickupAt)
  await page.getByTestId('rental-custom-dropoff-input').fill(fields.dropoffAt)
  if (fields.cost !== undefined) await page.getByTestId('rental-custom-cost-input').fill(fields.cost)
  if (fields.costUnit !== undefined) await page.getByTestId('rental-custom-cost-unit-input').fill(fields.costUnit)
  if (fields.notes) await page.getByTestId('rental-custom-notes-input').fill(fields.notes)
  await page.getByTestId('rental-custom-save-button').click()
}

export async function fillCustomLodging(
  page: Page,
  fields: {
    name: string
    location?: string
    checkIn: string
    checkOut: string
    cost?: string
    costUnit?: string
    notes?: string
  },
) {
  await page.getByTestId('hotel-custom-name-input').fill(fields.name)
  if (fields.location) await page.getByTestId('hotel-custom-location-input').fill(fields.location)
  await page.getByTestId('hotel-custom-check-in-input').fill(fields.checkIn)
  await page.getByTestId('hotel-custom-check-out-input').fill(fields.checkOut)
  if (fields.cost !== undefined) await page.getByTestId('hotel-custom-cost-input').fill(fields.cost)
  if (fields.costUnit !== undefined) await page.getByTestId('hotel-custom-cost-unit-input').fill(fields.costUnit)
  if (fields.notes) await page.getByTestId('hotel-custom-notes-input').fill(fields.notes)
  await page.getByTestId('hotel-custom-save-button').click()
}
