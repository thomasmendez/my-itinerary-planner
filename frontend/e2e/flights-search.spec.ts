import { test, expect } from '@playwright/test'

test('searching CDG to AUS on 07/30/2026 returns 4 flights sorted by price', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('flight-from-input').fill('CDG')
  await page.getByTestId('flight-to-input').fill('AUS')
  await page.getByTestId('flight-depart-input').fill('2026-07-30')
  await page.getByTestId('flight-return-input').fill('')
  await page.getByTestId('flight-travelers-input').fill('1')
  await page.getByTestId('flight-search-submit').click()

  await expect(page.getByTestId('flight-results-count')).toHaveText('4 results · sorted by price')

  const cards = page.getByTestId('flight-result-card')
  await expect(cards).toHaveCount(4)

  const prices = await cards.getByTestId('flight-result-price').allTextContents()
  const values = prices.map((p) => Number(p.replace('$', '')))
  expect(values).toEqual([1650, 2200, 2227, 2242])
  expect(values).toEqual([...values].sort((a, b) => a - b))

  const routes = await cards.getByTestId('flight-result-route').allTextContents()
  for (const route of routes) {
    expect(route).toBe('CDG to AUS')
  }
})

test('a non-matching search shows no results', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('flight-from-input').fill('JFK')
  await page.getByTestId('flight-to-input').fill('LAX')
  await page.getByTestId('flight-depart-input').fill('2026-07-30')
  await page.getByTestId('flight-search-submit').click()

  await expect(page.getByText('No results.')).toBeVisible()
  await expect(page.getByTestId('flight-result-card')).toHaveCount(0)
})

test('comparing a search result removes it from the search results list', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('flight-from-input').fill('CDG')
  await page.getByTestId('flight-to-input').fill('AUS')
  await page.getByTestId('flight-depart-input').fill('2026-07-30')
  await page.getByTestId('flight-travelers-input').fill('1')
  await page.getByTestId('flight-search-submit').click()

  const cards = page.getByTestId('flight-result-card')
  await expect(cards).toHaveCount(4)

  const removedPrice = await cards.first().getByTestId('flight-result-price').textContent()
  await cards.first().getByTestId('flight-result-compare-button').click()

  await expect(cards).toHaveCount(3)
  await expect(page.getByTestId('flight-results-count')).toHaveText('3 results · sorted by price')
  const remainingPrices = await cards.getByTestId('flight-result-price').allTextContents()
  expect(remainingPrices).not.toContain(removedPrice)
})

test('flight result details include the flight date, not just times', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('flight-from-input').fill('CDG')
  await page.getByTestId('flight-to-input').fill('AUS')
  await page.getByTestId('flight-depart-input').fill('2026-07-30')
  await page.getByTestId('flight-search-submit').click()

  await expect(page.getByTestId('flight-result-detail').first()).toContainText('Jul 30')
})

test('typing a city name suggests its airport code from the dropdown', async ({ page }) => {
  await page.goto('/')

  const fromInput = page.getByTestId('flight-from-input')
  await fromInput.fill('Austin')

  const options = page.locator('#airport-options option')
  await expect(options.filter({ hasText: 'Austin' })).toHaveAttribute('value', 'AUS')
})

test('time format defaults to 24h and switching to 12h updates result times', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('flight-time-format-select')).toHaveValue('24h')

  await page.getByTestId('flight-from-input').fill('CDG')
  await page.getByTestId('flight-to-input').fill('AUS')
  await page.getByTestId('flight-depart-input').fill('2026-07-30')
  await page.getByTestId('flight-search-submit').click()

  await expect(page.getByTestId('flight-result-detail').first()).toContainText('11:00')

  await page.getByTestId('flight-time-format-select').selectOption('12h')
  await expect(page.getByTestId('flight-result-detail').first()).toContainText('11:00 AM')
})

// only meaningful in live mode (VITE_MOCKING=false) 
// needs its own run configuration to enable.

// test('depart date defaults to today when running against the live API', async ({ page }) => {
//   await page.goto('/')
//   const today = new Date().toISOString().slice(0, 10)
//   await expect(page.getByTestId('flight-depart-input')).toHaveValue(today)
//   await expect(page.getByTestId('flight-depart-input')).toHaveAttribute('min', today)
// })
