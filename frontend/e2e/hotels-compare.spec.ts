import { test, expect, type Page } from '@playwright/test'
import { mockOverrides, searchBaliResorts } from './helpers'
import type { MockOverride } from '../src/mocks/browser'

async function delayBookingLink(page: Page, delayMs: number) {
  const overrides: MockOverride[] = [
    { method: 'post', path: '/api/search/hotels/booking-link', status: 200, body: '{"url":null,"address":null}', delayMs },
  ]
  await mockOverrides(page, overrides)
}

test('adding a search result shows it in the Comparing tab', async ({ page }) => {
  await searchBaliResorts(page)

  const firstCard = page.getByTestId('hotel-result-card').first()
  const name = await firstCard.getByTestId('hotel-result-name').textContent()
  const price = await firstCard.getByTestId('hotel-result-price').textContent()
  await firstCard.getByTestId('hotel-result-compare-button').click()

  await expect(page.getByTestId('subtab-hotels-comparing')).toContainText('1')

  await page.getByTestId('subtab-hotels-comparing').click()

  const candidateCards = page.getByTestId('hotel-candidate-card')
  await expect(candidateCards).toHaveCount(1)
  await expect(candidateCards.first().getByTestId('hotel-candidate-name')).toHaveText(name ?? '')
  await expect(candidateCards.first().getByTestId('hotel-candidate-price')).toHaveText(`${price}/night`)
  await expect(page.getByTestId('hotel-candidates-count')).toHaveText('1 candidate · sorted by price')
  await expect(candidateCards.first().getByTestId('hotel-candidate-snapshot')).toContainText('Price as of')
})

test('adding a search result fetches a direct booking link', async ({ page }) => {
  await searchBaliResorts(page)

  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()
  await page.getByTestId('subtab-hotels-comparing').click()

  const bookingLink = page.getByTestId('hotel-candidate-booking-link')
  await expect(bookingLink).toHaveText('Direct Booking Link')
  await expect(bookingLink).toHaveAttribute(
    'href',
    'https://www.hilton.com/en/hotels/dpsbahi-hilton-bali-resort/?SEO_id=GMB-APAC-HI-DPSBAHI',
  )
  await expect(bookingLink).toHaveAttribute('target', '_blank')
})

test('adding a search result shows its address and check-in/check-out times', async ({ page }) => {
  await searchBaliResorts(page)

  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()
  await page.getByTestId('subtab-hotels-comparing').click()

  await expect(page.getByTestId('hotel-candidate-address')).toHaveText(
    'Jl. Raya Nusa Dua Selatan, Benoa, Kec. Kuta Sel., Kabupaten Badung, Bali 80361, Indonesia',
  )
  await expect(page.getByTestId('hotel-candidate-checkin-checkout')).toContainText('Check-in')
  await expect(page.getByTestId('hotel-candidate-checkin-checkout')).toContainText('Check-out')
})

test('a compared result grays out and disables Compare until its save round-trip resolves, and does not duplicate', async ({ page }) => {
  await delayBookingLink(page, 1000)
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  const firstCard = cards.first()
  const compareButton = firstCard.getByTestId('hotel-result-compare-button')
  await compareButton.click()

  // Plain `.count()` / synchronous assertions (not the polling `expect(...).toHaveCount()`
  // form) - we need the state *right now*, well inside the 1s delay, not eventually.
  await page.waitForTimeout(200)
  expect(await cards.count()).toBe(3)
  await expect(compareButton).toBeDisabled()
  await expect(compareButton).toHaveText('Adding to trip…')
  await expect(firstCard).toHaveClass(/opacity-50/)

  await page.getByTestId('subtab-hotels-comparing').click()
  await expect(page.getByTestId('hotel-candidate-card')).toHaveCount(1)

  await page.getByTestId('subtab-hotels-search').click()
  await expect(cards).toHaveCount(2)
})

test('a search-sourced candidate has no Edit button', async ({ page }) => {
  await searchBaliResorts(page)

  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()
  await page.getByTestId('subtab-hotels-comparing').click()

  await expect(page.getByTestId('hotel-candidate-card')).toHaveCount(1)
  await expect(page.getByTestId('hotel-candidate-edit-button')).toHaveCount(0)
})

test('removing a candidate takes it out of the Comparing tab', async ({ page }) => {
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  await cards.nth(0).getByTestId('hotel-result-compare-button').click()
  await cards.nth(1).getByTestId('hotel-result-compare-button').click()

  await page.getByTestId('subtab-hotels-comparing').click()
  const candidateCards = page.getByTestId('hotel-candidate-card')
  await expect(candidateCards).toHaveCount(2)

  await candidateCards.first().getByTestId('hotel-candidate-remove-button').click()

  await expect(candidateCards).toHaveCount(1)
  await expect(page.getByTestId('subtab-hotels-comparing')).toContainText('1')
})

test('confirming a candidate takes it out of the Comparing tab', async ({ page }) => {
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  await cards.nth(0).getByTestId('hotel-result-compare-button').click()

  await page.getByTestId('subtab-hotels-comparing').click()
  const candidateCards = page.getByTestId('hotel-candidate-card')
  await expect(candidateCards).toHaveCount(1)

  await candidateCards.first().getByTestId('hotel-candidate-confirm-button').click()

  await expect(candidateCards).toHaveCount(0)
  await expect(page.getByTestId('subtab-hotels-comparing')).toContainText('0')
})

test('adding two search results both appear in the Comparing tab and the badge counts them', async ({ page }) => {
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  await cards.nth(0).getByTestId('hotel-result-compare-button').click()
  await cards.nth(1).getByTestId('hotel-result-compare-button').click()

  await expect(page.getByTestId('subtab-hotels-comparing')).toContainText('2')

  await page.getByTestId('subtab-hotels-comparing').click()
  await expect(page.getByTestId('hotel-candidate-card')).toHaveCount(2)
})

test('removing a candidate returns it to the search results list', async ({ page }) => {
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  const removedPrice = await cards.first().getByTestId('hotel-result-price').textContent()
  await cards.first().getByTestId('hotel-result-compare-button').click()
  await expect(cards).toHaveCount(2)

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').first().getByTestId('hotel-candidate-remove-button').click()

  await page.getByTestId('subtab-hotels-search').click()
  await expect(cards).toHaveCount(3)
  const prices = await cards.getByTestId('hotel-result-price').allTextContents()
  expect(prices).toContain(removedPrice)
})

test('confirming a candidate does not return it to the search results list', async ({ page }) => {
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  const confirmedPrice = await cards.first().getByTestId('hotel-result-price').textContent()
  await cards.first().getByTestId('hotel-result-compare-button').click()
  await expect(cards).toHaveCount(2)

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').first().getByTestId('hotel-candidate-confirm-button').click()

  await page.getByTestId('subtab-hotels-search').click()
  await expect(cards).toHaveCount(2)
  const prices = await cards.getByTestId('hotel-result-price').allTextContents()
  expect(prices).not.toContain(confirmedPrice)
})

test('candidates are sorted by price regardless of the order they were added', async ({ page }) => {
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  // Fixture is price-ascending (Pandawa $17, Sol $130, Bvlgari $2917); add the
  // most expensive first to prove display order isn't just insertion order.
  await cards.nth(2).getByTestId('hotel-result-compare-button').click()
  await cards.nth(0).getByTestId('hotel-result-compare-button').click()

  await page.getByTestId('subtab-hotels-comparing').click()

  const priceLocator = page.getByTestId('hotel-candidate-price')
  await expect(priceLocator).toHaveCount(2)
  expect(await priceLocator.allTextContents()).toEqual(['$17/night', '$2917/night'])
})

test('search results persist when switching between Search and Comparing tabs', async ({ page }) => {
  await searchBaliResorts(page)

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('subtab-hotels-search').click()

  await expect(page.getByTestId('hotel-result-card')).toHaveCount(3)
  await expect(page.getByTestId('hotel-results-count')).toHaveText('3 results · sorted by price')
})
