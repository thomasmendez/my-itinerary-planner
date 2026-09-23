import { test, expect, type Page } from '@playwright/test'
import { mockOverrides, searchAusToDenRoundTripWithTokens } from './helpers'
import type { MockOverride } from '../src/mocks/browser'

// Simulate latency experienced when getting the booking link
async function delayBookingLink(page: Page, delayMs: number) {
  const overrides: MockOverride[] = [
    { method: 'post', path: '/api/search/flights/booking-link', status: 200, body: '{"url":null,"post_data":null}', delayMs },
  ]
  await mockOverrides(page, overrides)
}

test('comparing a tokened round-trip result opens the return flight picker', async ({ page }) => {
  await searchAusToDenRoundTripWithTokens(page)

  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()

  await expect(page.getByTestId('return-flight-picker')).toBeVisible()
  await expect(page.getByTestId('return-flight-option')).toHaveCount(1)
  await expect(page.getByTestId('flight-return-option-route')).toHaveText('DEN to AUS')
})

test('selecting a return flight saves a round-trip candidate with both legs and a booking link', async ({ page }) => {
  await searchAusToDenRoundTripWithTokens(page)

  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()
  await page.getByTestId('return-flight-option').first().getByTestId('return-flight-option-select-button').click()

  await page.getByTestId('subtab-flights-comparing').click()
  const candidateCard = page.getByTestId('flight-candidate-card').first()
  await expect(candidateCard.getByTestId('flight-candidate-route')).toHaveText('AUS to DEN')
  await expect(candidateCard.getByTestId('flight-candidate-return-route')).toHaveText('DEN to AUS')
  await expect(candidateCard.getByTestId('flight-candidate-booking-link')).toBeVisible()
  // Both legs' dates, not just times - depart 2026-12-01, return 2026-12-08 (see mocks/data/flights.ts).
  await expect(candidateCard.getByTestId('flight-candidate-detail')).toContainText('Dec 1')
  await expect(candidateCard.getByTestId('flight-candidate-return-detail')).toContainText('Dec 8')
})

test('the return flight picker keeps the selected departure flight visible for reference', async ({ page }) => {
  await delayBookingLink(page, 1000)
  await searchAusToDenRoundTripWithTokens(page)

  const outboundCard = page.getByTestId('flight-result-card').first()
  const outboundRoute = await outboundCard.getByTestId('flight-result-route').textContent()
  const outboundAirline = await outboundCard.getByTestId('flight-result-airline').textContent()
  const outboundPrice = await outboundCard.getByTestId('flight-result-price').textContent()
  await outboundCard.getByTestId('flight-result-compare-button').click()

  const reference = page.getByTestId('return-flight-picker-outbound-reference')
  await expect(reference).toBeVisible()
  await expect(reference.getByTestId('flight-outbound-reference-route')).toHaveText(outboundRoute ?? '')
  await expect(reference.getByTestId('flight-outbound-reference-airline')).toHaveText(outboundAirline ?? '')
  await expect(page.getByTestId('flight-outbound-reference-price')).toHaveText(outboundPrice ?? '')

  // Still visible while a return flight save is in flight, not just on first render.
  await page.getByTestId('return-flight-option').first().getByTestId('return-flight-option-select-button').click()
  await expect(page.getByTestId('return-flight-picker-saving')).toBeVisible()
  await expect(reference).toBeVisible()
})

test('the return flight picker shows a saving indicator until the round-trip save resolves', async ({ page }) => {
  await delayBookingLink(page, 1000)
  await searchAusToDenRoundTripWithTokens(page)

  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()
  await page.getByTestId('return-flight-option').first().getByTestId('return-flight-option-select-button').click()

  await expect(page.getByTestId('return-flight-picker-saving')).toBeVisible()
  await expect(page.getByTestId('return-flight-option-select-button')).toBeDisabled()

  await expect(page.getByTestId('return-flight-picker')).toHaveCount(0, { timeout: 3000 })
  await page.getByTestId('subtab-flights-comparing').click()
  await expect(page.getByTestId('flight-candidate-card')).toHaveCount(1)
})

test('cancelling the return flight picker returns to the search results', async ({ page }) => {
  await searchAusToDenRoundTripWithTokens(page)

  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()
  await expect(page.getByTestId('return-flight-picker')).toBeVisible()

  await page.getByTestId('return-flight-picker-cancel').click()

  await expect(page.getByTestId('return-flight-picker')).toHaveCount(0)
  await expect(page.getByTestId('flight-result-card')).toHaveCount(1)
})
