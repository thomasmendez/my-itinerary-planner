import { test, expect } from '@playwright/test'
import { searchCdgToAus, openCustomForm, fillCustomTransport } from './helpers'

const MODE_OPTIONS = ['Self-drive', 'Train', 'Bus', 'Ferry', 'Carpool', 'Other']

test('the custom transport form is hidden until "+ Add custom transport" is clicked', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('flight-custom-form')).not.toBeVisible()
  await page.getByTestId('flight-add-custom-button').click()
  await expect(page.getByTestId('flight-custom-form')).toBeVisible()
})

test('the Mode dropdown offers the documented transport modes, not "Plane"', async ({ page }) => {
  await openCustomForm(page, 'flight')

  const options = page.getByTestId('flight-custom-mode-select').locator('option')
  await expect(options).toHaveText(MODE_OPTIONS)
})

test('saving a custom transport entry adds it to the Comparing tab', async ({ page }) => {
  await openCustomForm(page, 'flight')

  await fillCustomTransport(page, {
    mode: 'Ferry',
    from: 'CDG',
    to: 'Calais',
    depart: '2026-07-30T09:00',
    cost: '45',
    notes: 'Direct crossing',
  })

  await expect(page.getByTestId('subtab-flights-comparing')).toContainText('1')
  await page.getByTestId('subtab-flights-comparing').click()

  const candidate = page.getByTestId('flight-candidate-card')
  await expect(candidate).toHaveCount(1)
  await expect(candidate.getByTestId('flight-candidate-mode')).toHaveText('Ferry')
  await expect(candidate.getByTestId('flight-candidate-route')).toHaveText('CDG to Calais')
  await expect(candidate.getByTestId('flight-candidate-price')).toContainText('$45')
  await expect(candidate.getByTestId('flight-candidate-price')).toContainText('/ travel')
  await expect(candidate.getByTestId('flight-candidate-notes')).toHaveText('Direct crossing')
  await expect(candidate.getByTestId('flight-candidate-snapshot')).toContainText('Price as of')
})

test('leaving Cost blank saves the candidate at $0, not hidden from Comparing', async ({ page }) => {
  await openCustomForm(page, 'flight')

  await fillCustomTransport(page, {
    mode: 'Self-drive',
    from: 'CDG',
    to: 'Reims',
    depart: '2026-07-30T09:00',
  })

  await page.getByTestId('subtab-flights-comparing').click()
  const candidate = page.getByTestId('flight-candidate-card')
  await expect(candidate).toHaveCount(1)
  await expect(candidate.getByTestId('flight-candidate-price')).toContainText('$0')
})

test('the cost unit defaults to "/ travel" and can be overridden', async ({ page }) => {
  await openCustomForm(page, 'flight')

  await expect(page.getByTestId('flight-custom-cost-unit-input')).toHaveValue('/ travel')

  await fillCustomTransport(page, {
    mode: 'Self-drive',
    from: 'CDG',
    to: 'Reims',
    depart: '2026-07-30T09:00',
    cost: '60',
    costUnit: '/ gas',
  })

  await page.getByTestId('subtab-flights-comparing').click()
  await expect(page.getByTestId('flight-candidate-card').getByTestId('flight-candidate-price')).toContainText(
    '/ gas',
  )
})

test('a custom transport candidate appears in Comparing alongside a search-sourced candidate', async ({ page }) => {
  await searchCdgToAus(page)
  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()

  await page.getByTestId('flight-add-custom-button').click()
  await fillCustomTransport(page, {
    mode: 'Train',
    from: 'CDG',
    to: 'AUS',
    depart: '2026-07-30T09:00',
    cost: '30',
  })

  await expect(page.getByTestId('subtab-flights-comparing')).toContainText('2')
  await page.getByTestId('subtab-flights-comparing').click()
  await expect(page.getByTestId('flight-candidate-card')).toHaveCount(2)
})

test('confirming both a search result and a custom transport candidate labels Trip Spend "Flights + Other"', async ({ page }) => {
  await searchCdgToAus(page)
  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()

  await page.getByTestId('flight-add-custom-button').click()
  await fillCustomTransport(page, {
    mode: 'Train',
    from: 'CDG',
    to: 'AUS',
    depart: '2026-07-30T09:00',
    cost: '30',
  })

  await page.getByTestId('subtab-flights-comparing').click()
  const cards = page.getByTestId('flight-candidate-card')
  await cards.nth(0).getByTestId('flight-candidate-confirm-button').click()
  await expect(cards).toHaveCount(1)
  await cards.nth(0).getByTestId('flight-candidate-confirm-button').click()
  await expect(cards).toHaveCount(0)

  await expect(page.getByTestId('trip-spend-flights-label')).toHaveText('Flights + Other')
})

test('confirming a custom transport candidate moves it into the trip plan and Trip Spend', async ({ page }) => {
  await openCustomForm(page, 'flight')

  await fillCustomTransport(page, {
    mode: 'Bus',
    from: 'CDG',
    to: 'Lille',
    depart: '2026-07-30T09:00',
    cost: '20',
  })

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').getByTestId('flight-candidate-confirm-button').click()

  await expect(page.getByTestId('flight-candidate-card')).toHaveCount(0)
  await expect(page.getByTestId('subtab-flights-comparing')).toContainText('0')

  const entry = page.getByTestId('trip-plan-entry')
  await expect(entry).toHaveCount(1)
  await expect(entry.getByTestId('trip-plan-icon')).toHaveText('F')
  await expect(entry.getByTestId('trip-plan-description')).toContainText('CDG to Lille')
  await expect(entry.getByTestId('trip-plan-detail')).toContainText('Departs')

  await expect(page.getByTestId('trip-spend-flights')).toHaveText('$20')
  await expect(page.getByTestId('trip-spend-flights-label')).toHaveText('Transportation')
})

test('a confirmed custom transport with a return date shows the return date in the trip plan, not the departure time', async ({ page }) => {
  await openCustomForm(page, 'flight')

  await fillCustomTransport(page, {
    mode: 'Bus',
    from: 'CDG',
    to: 'Lille',
    depart: '2026-07-30T09:00',
    return: '2026-08-05T18:00',
    cost: '20',
  })

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').getByTestId('flight-candidate-confirm-button').click()

  const entry = page.getByTestId('trip-plan-entry')
  await expect(entry).toHaveCount(1)
  await expect(entry.getByTestId('trip-plan-detail')).toHaveText('Return Aug 5')
  await expect(page.getByTestId('trip-spend-confirmed')).toHaveText('$20')
  await expect(page.getByTestId('trip-spend-pending')).toHaveText('$0')
})

test('removing a custom transport candidate clears it from Comparing without creating a phantom search result', async ({ page }) => {
  await searchCdgToAus(page)

  await page.getByTestId('flight-add-custom-button').click()
  await fillCustomTransport(page, {
    mode: 'Carpool',
    from: 'CDG',
    to: 'AUS',
    depart: '2026-07-30T09:00',
    cost: '10',
  })

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').getByTestId('flight-candidate-remove-button').click()

  await expect(page.getByTestId('flight-candidate-card')).toHaveCount(0)
  await expect(page.getByTestId('subtab-flights-comparing')).toContainText('0')

  await page.getByTestId('subtab-flights-search').click()
  await expect(page.getByTestId('flight-result-card')).toHaveCount(4)
})
