import { test, expect } from '@playwright/test'
import { searchDalToDenRoundTrip } from './helpers'

test('a round-trip search with no booking_token still renders all results with no console key warnings', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await searchDalToDenRoundTrip(page)

  await expect(page.getByTestId('flight-results-count')).toHaveText('3 results · sorted by price')
  expect(consoleErrors.some((text) => text.includes('unique "key" prop'))).toBe(false)
})

test('comparing one tokenless result removes only that one from the search results', async ({ page }) => {
  await searchDalToDenRoundTrip(page)

  const cards = page.getByTestId('flight-result-card')
  const remainingPrices = await cards.allTextContents()
  const comparedPrice = await cards.first().getByTestId('flight-result-price').textContent()
  await cards.first().getByTestId('flight-result-compare-button').click()

  await expect(cards).toHaveCount(2)
  const prices = await cards.getByTestId('flight-result-price').allTextContents()
  expect(prices).not.toContain(comparedPrice)
  // The other two results (also tokenless) must still be there, untouched.
  expect(remainingPrices.length).toBe(3)
})

test('a tokenless candidate appears in the Comparing tab', async ({ page }) => {
  await searchDalToDenRoundTrip(page)

  const firstCard = page.getByTestId('flight-result-card').first()
  const route = await firstCard.getByTestId('flight-result-route').textContent()
  const price = await firstCard.getByTestId('flight-result-price').textContent()
  await firstCard.getByTestId('flight-result-compare-button').click()

  await page.getByTestId('subtab-flights-comparing').click()
  const candidateCards = page.getByTestId('flight-candidate-card')
  await expect(candidateCards).toHaveCount(1)
  await expect(candidateCards.first().getByTestId('flight-candidate-route')).toHaveText(route ?? '')
  await expect(candidateCards.first().getByTestId('flight-candidate-price')).toHaveText(price ?? '')
})

test('a tokenless candidate shows a disabled booking-link button with an explanatory tooltip instead of nothing', async ({ page }) => {
  await searchDalToDenRoundTrip(page)

  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()
  await page.getByTestId('subtab-flights-comparing').click()

  const bookingLink = page.getByTestId('flight-candidate-booking-link')
  await expect(bookingLink).toBeDisabled()
  await expect(bookingLink).toHaveAttribute(
    'title',
    "This result's provider doesn't offer a direct booking link through this search — book on their site directly",
  )
})

test('adding two tokenless candidates does not collide - both show up independently', async ({ page }) => {
  await searchDalToDenRoundTrip(page)

  const cards = page.getByTestId('flight-result-card')
  await cards.nth(0).getByTestId('flight-result-compare-button').click()
  await cards.nth(0).getByTestId('flight-result-compare-button').click()

  await expect(page.getByTestId('subtab-flights-comparing')).toContainText('2')
  await page.getByTestId('subtab-flights-comparing').click()
  await expect(page.getByTestId('flight-candidate-card')).toHaveCount(2)
})

test('removing a tokenless candidate returns exactly it to the search results list', async ({ page }) => {
  await searchDalToDenRoundTrip(page)

  const cards = page.getByTestId('flight-result-card')
  const removedPrice = await cards.first().getByTestId('flight-result-price').textContent()
  await cards.first().getByTestId('flight-result-compare-button').click()
  await expect(cards).toHaveCount(2)

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').first().getByTestId('flight-candidate-remove-button').click()

  await page.getByTestId('subtab-flights-search').click()
  await expect(cards).toHaveCount(3)
  const prices = await cards.getByTestId('flight-result-price').allTextContents()
  expect(prices).toContain(removedPrice)
})

test('confirming a tokenless candidate does not return it to the search results list', async ({ page }) => {
  await searchDalToDenRoundTrip(page)

  const cards = page.getByTestId('flight-result-card')
  const confirmedPrice = await cards.first().getByTestId('flight-result-price').textContent()
  await cards.first().getByTestId('flight-result-compare-button').click()
  await expect(cards).toHaveCount(2)

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').first().getByTestId('flight-candidate-confirm-button').click()

  await page.getByTestId('subtab-flights-search').click()
  await expect(cards).toHaveCount(2)
  const prices = await cards.getByTestId('flight-result-price').allTextContents()
  expect(prices).not.toContain(confirmedPrice)
})
