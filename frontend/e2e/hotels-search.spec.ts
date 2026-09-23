import { test, expect } from '@playwright/test'
import { openTab } from './helpers'

test('searching Bali Resorts for 2026-08-29 to 2026-08-30 returns 3 hotels sorted by price', async ({ page }) => {
  await openTab(page, 'hotel')

  await page.getByTestId('hotel-location-input').fill('Bali Resorts')
  await page.getByTestId('hotel-checkin-input').fill('2026-08-29')
  await page.getByTestId('hotel-checkout-input').fill('2026-08-30')
  await page.getByTestId('hotel-guests-input').fill('2')
  await page.getByTestId('hotel-search-submit').click()

  await expect(page.getByTestId('hotel-results-count')).toHaveText('3 results · sorted by price')

  const cards = page.getByTestId('hotel-result-card')
  await expect(cards).toHaveCount(3)

  const prices = await cards.getByTestId('hotel-result-price').allTextContents()
  const values = prices.map((p) => Number(p.replace('$', '')))
  expect(values).toEqual([17, 130, 2917])
  expect(values).toEqual([...values].sort((a, b) => a - b))

  const names = await cards.getByTestId('hotel-result-name').allTextContents()
  expect(names).toEqual([
    'The Pandawa Hills Ceningan',
    'Sol by Melia Benoa Bali - All Inclusive',
    'Bvlgari Resort Bali',
  ])
})

test('a non-matching search shows no results', async ({ page }) => {
  await openTab(page, 'hotel')

  await page.getByTestId('hotel-location-input').fill('Paris Hotels')
  await page.getByTestId('hotel-checkin-input').fill('2026-08-29')
  await page.getByTestId('hotel-checkout-input').fill('2026-08-30')
  await page.getByTestId('hotel-search-submit').click()

  await expect(page.getByText('No results.')).toBeVisible()
  await expect(page.getByTestId('hotel-result-card')).toHaveCount(0)
})

test('comparing a search result removes it from the search results list', async ({ page }) => {
  await openTab(page, 'hotel')

  await page.getByTestId('hotel-location-input').fill('Bali Resorts')
  await page.getByTestId('hotel-checkin-input').fill('2026-08-29')
  await page.getByTestId('hotel-checkout-input').fill('2026-08-30')
  await page.getByTestId('hotel-guests-input').fill('2')
  await page.getByTestId('hotel-search-submit').click()

  const cards = page.getByTestId('hotel-result-card')
  await expect(cards).toHaveCount(3)

  const removedPrice = await cards.first().getByTestId('hotel-result-price').textContent()
  await cards.first().getByTestId('hotel-result-compare-button').click()

  await expect(cards).toHaveCount(2)
  await expect(page.getByTestId('hotel-results-count')).toHaveText('2 results · sorted by price')
  const remainingPrices = await cards.getByTestId('hotel-result-price').allTextContents()
  expect(remainingPrices).not.toContain(removedPrice)
})
