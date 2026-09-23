import { test, expect, type Page } from '@playwright/test'
import { openCustomForm, fillCustomTransport, mockOverrides } from './helpers'
import type { MockOverride } from '../src/mocks/browser'

async function openMapTab(page: Page) {
  await page.getByRole('button', { name: 'Map', exact: true }).click()
}

test('Map tab is empty with no saved items', async ({ page }) => {
  await page.goto('/')
  await openMapTab(page)

  await expect(page.getByText('No locations to show yet.')).toBeVisible()
  await expect(page.getByTestId('map-point-item')).toHaveCount(0)
  await expect(page.getByTestId('map-marker-candidate')).toHaveCount(0)
})

test('a custom transport candidate shows its departure and arrival as candidate markers', async ({ page }) => {
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, { mode: 'Train', from: 'CDG', to: 'AUS', depart: '2026-07-30T09:00', cost: '30' })

  await openMapTab(page)
  await page.getByTestId('map-hide-departures-toggle').uncheck()

  const items = page.getByTestId('map-point-item')
  await expect(items).toHaveCount(2)
  await expect(page.getByTestId('map-point-status').first()).toHaveText('candidate')
  await expect(page.getByTestId('map-marker-candidate')).toHaveCount(2)
  await expect(page.getByTestId('map-marker-confirmed')).toHaveCount(0)
})

test('confirming a candidate updates its map markers to confirmed without duplicating them', async ({ page }) => {
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, { mode: 'Train', from: 'CDG', to: 'AUS', depart: '2026-07-30T09:00', cost: '30' })

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').getByTestId('flight-candidate-confirm-button').click()

  await openMapTab(page)
  await page.getByTestId('map-hide-departures-toggle').uncheck()

  await expect(page.getByTestId('map-point-item')).toHaveCount(2)
  await expect(page.getByTestId('map-point-status').first()).toHaveText('confirmed')
  await expect(page.getByTestId('map-marker-confirmed')).toHaveCount(2)
  await expect(page.getByTestId('map-marker-candidate')).toHaveCount(0)
})

test('departure markers are hidden by default and can be toggled back on', async ({ page }) => {
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, { mode: 'Train', from: 'CDG', to: 'AUS', depart: '2026-07-30T09:00', cost: '30' })

  await openMapTab(page)

  // Sidebar list is unaffected by the toggle - it's the map markers that get filtered.
  await expect(page.getByTestId('map-point-item')).toHaveCount(2)
  await expect(page.getByTestId('map-marker-candidate')).toHaveCount(1)

  await page.getByTestId('map-hide-departures-toggle').uncheck()
  await expect(page.getByTestId('map-marker-candidate')).toHaveCount(2)

  await page.getByTestId('map-hide-departures-toggle').check()
  await expect(page.getByTestId('map-marker-candidate')).toHaveCount(1)
})

test('removing a candidate clears its markers from the map', async ({ page }) => {
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, { mode: 'Train', from: 'CDG', to: 'AUS', depart: '2026-07-30T09:00', cost: '30' })

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').getByTestId('flight-candidate-remove-button').click()

  await openMapTab(page)

  await expect(page.getByTestId('map-point-item')).toHaveCount(0)
  await expect(page.getByText('No locations to show yet.')).toBeVisible()
})

test('the Get Route button stays disabled until at least two points are selected', async ({ page }) => {
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, { mode: 'Train', from: 'CDG', to: 'AUS', depart: '2026-07-30T09:00', cost: '30' })

  await openMapTab(page)

  const button = page.getByTestId('map-get-route-button')
  await expect(button).toBeDisabled()

  const checkboxes = page.getByTestId('map-point-checkbox')
  await checkboxes.nth(0).check()
  await expect(button).toBeDisabled()
  await checkboxes.nth(1).check()
  await expect(button).toBeEnabled()
})

test('a missing ORS API key on the backend shows a config-error banner on the Map tab', async ({ page }) => {
  const overrides: MockOverride[] = [
    {
      method: 'get',
      path: '/api/trips/:tripId/map/points',
      status: 503,
      body: JSON.stringify({ detail: 'Map feature is not configured: set ORS_API_KEY on the server to enable it.' }),
    },
  ]
  await mockOverrides(page, overrides)
  await page.goto('/')
  await openMapTab(page)

  await expect(page.getByTestId('map-error')).toHaveText(
    'Map feature is not configured: set ORS_API_KEY on the server to enable it.',
  )
})

test('an OpenRouteService server-side failure shows an upstream-error banner on the Map tab', async ({ page }) => {
  const overrides: MockOverride[] = [
    {
      method: 'get',
      path: '/api/trips/:tripId/map/points',
      status: 502,
      body: JSON.stringify({ detail: 'OpenRouteService request failed' }),
    },
  ]
  await mockOverrides(page, overrides)
  await page.goto('/')
  await openMapTab(page)

  await expect(page.getByTestId('map-error')).toHaveText('OpenRouteService request failed')
})

test('a missing ORS API key shows a proactive warning under the map even when no ORS call is ever made', async ({ page }) => {
  // Only well-known IATA codes, resolved locally with no ORS call at all (see
  // backend/app/map/service.py::_flight_point) - map/points succeeds and stays untouched,
  // so the reactive `map-error` banner never fires. The warning below the map is the only
  // signal that ORS_API_KEY is unset in this case, sourced from /health instead.
  const overrides: MockOverride[] = [
    { method: 'get', path: '/health', status: 200, body: JSON.stringify({ status: 'ok', ors_configured: false }) },
  ]
  await mockOverrides(page, overrides)
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, { mode: 'Train', from: 'CDG', to: 'AUS', depart: '2026-07-30T09:00', cost: '30' })

  await openMapTab(page)

  await expect(page.getByTestId('map-ors-not-configured-warning')).toBeVisible()
  await expect(page.getByTestId('map-error')).toHaveCount(0)
})

test('a custom hotel with no location does not get a marker and shows a warning in the list', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Hotels', exact: true }).click()
  await page.getByTestId('hotel-add-custom-button').click()
  await page.getByTestId('hotel-custom-name-input').fill('Friends House')
  await page.getByTestId('hotel-custom-check-in-input').fill('2026-08-01')
  await page.getByTestId('hotel-custom-check-out-input').fill('2026-08-03')
  await page.getByTestId('hotel-custom-save-button').click()

  await openMapTab(page)

  await expect(page.getByTestId('map-point-item')).toHaveCount(1)
  await expect(page.getByTestId('map-point-item')).toContainText('Friends House')
  await expect(page.getByTestId('map-marker-candidate')).toHaveCount(0)
  await expect(page.getByTestId('map-point-no-location')).toHaveCount(1)
  await expect(page.getByTestId('map-point-no-location')).toHaveAttribute('title', 'No location provided')
  await expect(page.getByTestId('map-point-checkbox')).toHaveCount(0)
})

test('a custom event with no location does not get a marker and shows a warning in the list', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Events', exact: true }).click()
  await page.getByTestId('event-add-custom-button').click()
  await page.getByTestId('event-custom-name-input').fill('Family Reunion')
  await page.getByTestId('event-custom-date-input').fill('2026-08-01')
  await page.getByTestId('event-custom-start-time-input').fill('12:00')
  await page.getByTestId('event-custom-save-button').click()

  await openMapTab(page)

  await expect(page.getByTestId('map-point-item')).toHaveCount(1)
  await expect(page.getByTestId('map-point-item')).toContainText('Family Reunion')
  await expect(page.getByTestId('map-marker-candidate')).toHaveCount(0)
  await expect(page.getByTestId('map-point-checkbox')).toHaveCount(0)
  await expect(page.getByTestId('map-point-no-location')).toHaveAttribute('title', 'No location provided')
})

test('flights and rentals with no location show a warning instead of a marker', async ({ page }) => {
  // Both real custom forms enforce `required` on their location fields, so a blank
  // location can't be produced through genuine UI interaction - overriding the map
  // points response is the only way to exercise this path for these two source types.
  const points = [
    { source_type: 'saved_flight', source_id: 1, status: 'candidate', label: 'Departure: ???', location: '', latitude: null, longitude: null },
    { source_type: 'saved_rental', source_id: 1, status: 'candidate', label: 'Rental car', location: '', latitude: null, longitude: null },
  ]
  const overrides: MockOverride[] = [
    { method: 'get', path: '/api/trips/:tripId/map/points', status: 200, body: JSON.stringify(points) },
  ]
  await mockOverrides(page, overrides)
  await page.goto('/')
  await openMapTab(page)

  await expect(page.getByTestId('map-point-item')).toHaveCount(2)
  await expect(page.getByTestId('map-marker-candidate')).toHaveCount(0)
  await expect(page.getByTestId('map-point-checkbox')).toHaveCount(0)
  await expect(page.getByTestId('map-point-no-location')).toHaveCount(2)
  for (const warning of await page.getByTestId('map-point-no-location').all()) {
    await expect(warning).toHaveAttribute('title', 'No location provided')
  }
})

test('hovering a marker shows the entry name in a tooltip', async ({ page }) => {
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, { mode: 'Train', from: 'CDG', to: 'AUS', depart: '2026-07-30T09:00', cost: '30' })

  await openMapTab(page)
  await page.getByTestId('map-marker-candidate').first().hover()

  // Departure markers are hidden by default, so the only marker showing is the arrival one.
  await expect(page.locator('.leaflet-tooltip')).toContainText('Arrival: AUS')
})

test('selecting two points and clicking Get Route draws a route with a distance/duration summary', async ({ page }) => {
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, { mode: 'Train', from: 'CDG', to: 'AUS', depart: '2026-07-30T09:00', cost: '30' })

  await openMapTab(page)

  const checkboxes = page.getByTestId('map-point-checkbox')
  await checkboxes.nth(0).check()
  await checkboxes.nth(1).check()
  await page.getByTestId('map-get-route-button').click()

  const summary = page.getByTestId('map-route-summary')
  await expect(summary).toBeVisible()
  await expect(summary).toContainText('mi')
  await expect(summary).toContainText('min')
})

test('checked points show a numbered badge reflecting the order they were checked in', async ({ page }) => {
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, { mode: 'Train', from: 'CDG', to: 'AUS', depart: '2026-07-30T09:00', cost: '30' })

  await openMapTab(page)

  await expect(page.getByTestId('map-order-hint')).toHaveCount(0)

  const checkboxes = page.getByTestId('map-point-checkbox')
  await checkboxes.nth(1).check()
  await checkboxes.nth(0).check()

  // DOM order matches list order (index 0 then index 1), not click order - index 0 was
  // checked second, so its badge reads "2"; index 1 was checked first, so its badge reads "1".
  const badges = page.getByTestId('map-point-order')
  await expect(badges).toHaveCount(2)
  await expect(badges.nth(0)).toHaveText('2')
  await expect(badges.nth(1)).toHaveText('1')
  await expect(page.getByTestId('map-order-hint')).toBeVisible()

  await checkboxes.nth(1).uncheck()
  await expect(badges).toHaveCount(1)
  await expect(badges.nth(0)).toHaveText('1')
})
