import { test, expect, type Page } from '@playwright/test'
import { mockOverrides, searchCdgToAus } from './helpers'
import type { MockOverride } from '../src/mocks/browser'

// Simulate latency experienced when getting the booking link
async function delayBookingLink(page: Page, delayMs: number) {
  const overrides: MockOverride[] = [
    { method: 'post', path: '/api/search/flights/booking-link', status: 200, body: '{"url":null,"post_data":null}', delayMs },
  ]
  await mockOverrides(page, overrides)
}

test('adding a search result shows it in the Comparing tab', async ({ page }) => {
  await searchCdgToAus(page)

  const firstCard = page.getByTestId('flight-result-card').first()
  const route = await firstCard.getByTestId('flight-result-route').textContent()
  const airline = await firstCard.getByTestId('flight-result-airline').textContent()
  const detail = await firstCard.getByTestId('flight-result-detail').textContent()
  const price = await firstCard.getByTestId('flight-result-price').textContent()
  await firstCard.getByTestId('flight-result-compare-button').click()

  await expect(page.getByTestId('subtab-flights-comparing')).toContainText('1')

  await page.getByTestId('subtab-flights-comparing').click()

  const candidateCards = page.getByTestId('flight-candidate-card')
  await expect(candidateCards).toHaveCount(1)
  await expect(candidateCards.first().getByTestId('flight-candidate-route')).toHaveText(route ?? '')
  await expect(candidateCards.first().getByTestId('flight-candidate-airline')).toHaveText(airline ?? '')
  await expect(candidateCards.first().getByTestId('flight-candidate-detail')).toHaveText(detail ?? '')
  await expect(candidateCards.first().getByTestId('flight-candidate-price')).toHaveText(price ?? '')
  await expect(page.getByTestId('flight-candidates-count')).toHaveText('1 candidate · sorted by price')
  await expect(candidateCards.first().getByTestId('flight-candidate-snapshot')).toContainText('Price as of')
})

test('adding a search result fetches a direct booking link', async ({ page }) => {
  await searchCdgToAus(page)

  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()
  await page.getByTestId('subtab-flights-comparing').click()

  // The fixture carries post_data, so this renders as a submit button inside a POST
  // form (Google's booking redirector requires post_data in the request body
  const bookingLink = page.getByTestId('flight-candidate-booking-link')
  await expect(bookingLink).toHaveText('Direct Booking Link')
  await expect(bookingLink).toHaveAttribute('type', 'submit')
  const form = page.getByTestId('flight-candidate-booking-link-form')
  await expect(form).toHaveAttribute('action', 'https://www.google.com/travel/clk/f')
  await expect(form).toHaveAttribute('method', 'post')
  await expect(form).toHaveAttribute('target', '_blank')
})

test('a compared one-way result grays out and disables Compare until its save round-trip resolves, and does not duplicate', async ({ page }) => {
  await delayBookingLink(page, 1000)
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  const firstCard = cards.first()
  const compareButton = firstCard.getByTestId('flight-result-compare-button')
  await compareButton.click()

  // Plain `.count()` / synchronous assertions (not the polling `expect(...).toHaveCount()`
  // form) - we need the state *right now*, well inside the 1s delay, not eventually.
  await page.waitForTimeout(200)
  expect(await cards.count()).toBe(4)
  await expect(compareButton).toBeDisabled()
  await expect(compareButton).toHaveText('Adding to trip…')
  await expect(firstCard).toHaveClass(/opacity-50/)

  await page.getByTestId('subtab-flights-comparing').click()
  await expect(page.getByTestId('flight-candidate-card')).toHaveCount(1)

  await page.getByTestId('subtab-flights-search').click()
  await expect(cards).toHaveCount(3)
})

test('removing a candidate takes it out of the Comparing tab', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  await cards.nth(0).getByTestId('flight-result-compare-button').click()
  await cards.nth(1).getByTestId('flight-result-compare-button').click()

  await page.getByTestId('subtab-flights-comparing').click()
  const candidateCards = page.getByTestId('flight-candidate-card')
  await expect(candidateCards).toHaveCount(2)

  await candidateCards.first().getByTestId('flight-candidate-remove-button').click()

  await expect(candidateCards).toHaveCount(1)
  await expect(page.getByTestId('subtab-flights-comparing')).toContainText('1')
})

test('confirming a candidate takes it out of the Comparing tab', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  await cards.nth(0).getByTestId('flight-result-compare-button').click()

  await page.getByTestId('subtab-flights-comparing').click()
  const candidateCards = page.getByTestId('flight-candidate-card')
  await expect(candidateCards).toHaveCount(1)

  await candidateCards.first().getByTestId('flight-candidate-confirm-button').click()

  await expect(candidateCards).toHaveCount(0)
  await expect(page.getByTestId('subtab-flights-comparing')).toContainText('0')
})

test('adding two search results both appear in the Comparing tab and the badge counts them', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  await cards.nth(0).getByTestId('flight-result-compare-button').click()
  await cards.nth(1).getByTestId('flight-result-compare-button').click()

  await expect(page.getByTestId('subtab-flights-comparing')).toContainText('2')

  await page.getByTestId('subtab-flights-comparing').click()
  await expect(page.getByTestId('flight-candidate-card')).toHaveCount(2)
})

test('removing a candidate returns it to the search results list', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  const removedPrice = await cards.first().getByTestId('flight-result-price').textContent()
  await cards.first().getByTestId('flight-result-compare-button').click()
  await expect(cards).toHaveCount(3)

  await page.getByTestId('subtab-flights-comparing').click()
  await page
    .getByTestId('flight-candidate-card')
    .first()
    .getByTestId('flight-candidate-remove-button')
    .click()

  await page.getByTestId('subtab-flights-search').click()
  await expect(cards).toHaveCount(4)
  const prices = await cards.getByTestId('flight-result-price').allTextContents()
  expect(prices).toContain(removedPrice)
})

test('confirming a candidate does not return it to the search results list', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  const confirmedPrice = await cards.first().getByTestId('flight-result-price').textContent()
  await cards.first().getByTestId('flight-result-compare-button').click()
  await expect(cards).toHaveCount(3)

  await page.getByTestId('subtab-flights-comparing').click()
  await page
    .getByTestId('flight-candidate-card')
    .first()
    .getByTestId('flight-candidate-confirm-button')
    .click()

  await page.getByTestId('subtab-flights-search').click()
  await expect(cards).toHaveCount(3)
  const prices = await cards.getByTestId('flight-result-price').allTextContents()
  expect(prices).not.toContain(confirmedPrice)
})

test('candidates are sorted by price regardless of the order they were added', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  // Fixture is price-ascending (American $1650, ..., Delta $2242); add the
  // most expensive first to prove display order isn't just insertion order.
  await cards.nth(3).getByTestId('flight-result-compare-button').click()
  await cards.nth(0).getByTestId('flight-result-compare-button').click()

  await page.getByTestId('subtab-flights-comparing').click()

  const priceLocator = page.getByTestId('flight-candidate-price')
  await expect(priceLocator).toHaveCount(2)
  expect(await priceLocator.allTextContents()).toEqual(['$1650', '$2242'])
})

test('search results persist when switching between Search and Comparing tabs', async ({ page }) => {
  await searchCdgToAus(page)

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('subtab-flights-search').click()

  await expect(page.getByTestId('flight-result-card')).toHaveCount(4)
  await expect(page.getByTestId('flight-results-count')).toHaveText('4 results · sorted by price')
})
