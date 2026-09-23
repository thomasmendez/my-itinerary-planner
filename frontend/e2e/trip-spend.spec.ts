import { test, expect } from '@playwright/test'
import { searchCdgToAus, searchBaliResorts } from './helpers'

const formatPrice = (n: number) => `$${n.toLocaleString('en-US')}`

const priceOf = (text: string | null) => Number((text ?? '').replace(/[$,]/g, ''))

test('trip spend shows $0 across the board with no candidates or confirmed items', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('trip-spend-flights')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-hotel')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-confirmed')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-pending')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-potential')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-snapshot-note')).not.toBeVisible()
  await expect(page.getByText('Total Cost', { exact: true })).toBeVisible()
  await expect(page.getByText('Potential Cost')).not.toBeVisible()
})

test('adding a candidate adds its price to Pending and Potential Cost', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  const price = priceOf(await cards.first().getByTestId('flight-result-price').textContent())
  await cards.first().getByTestId('flight-result-compare-button').click()

  await expect(page.getByTestId('trip-spend-pending')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-potential')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-confirmed')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-flights')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-snapshot-note')).toBeVisible()
  await expect(page.getByText('Potential Cost')).toBeVisible()
})

test('Pending sums all candidates but Potential Cost only counts the cheapest', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  const price0 = priceOf(await cards.first().getByTestId('flight-result-price').textContent())
  await cards.first().getByTestId('flight-result-compare-button').click()
  await expect(cards).toHaveCount(3)

  const price1 = priceOf(await cards.first().getByTestId('flight-result-price').textContent())
  await cards.first().getByTestId('flight-result-compare-button').click()
  await expect(cards).toHaveCount(2)

  await expect(page.getByTestId('trip-spend-pending')).toHaveText(formatPrice(price0 + price1))
  await expect(page.getByTestId('trip-spend-potential')).toHaveText(formatPrice(Math.min(price0, price1)))
})

test('confirming a candidate moves its price from Pending into Confirmed and the Flights breakdown', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  const price = priceOf(await cards.first().getByTestId('flight-result-price').textContent())
  await cards.first().getByTestId('flight-result-compare-button').click()

  await page.getByTestId('subtab-flights-comparing').click()
  await page
    .getByTestId('flight-candidate-card')
    .first()
    .getByTestId('flight-candidate-confirm-button')
    .click()

  await expect(page.getByTestId('trip-spend-flights')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-confirmed')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-pending')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-potential')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-snapshot-note')).not.toBeVisible()
})

test('removing a candidate takes its price back out of Pending and Potential Cost', async ({ page }) => {
  await searchCdgToAus(page)

  const cards = page.getByTestId('flight-result-card')
  await cards.first().getByTestId('flight-result-compare-button').click()
  await expect(cards).toHaveCount(3)
  const price1 = priceOf(await cards.first().getByTestId('flight-result-price').textContent())
  await cards.first().getByTestId('flight-result-compare-button').click()
  await expect(cards).toHaveCount(2)

  await page.getByTestId('subtab-flights-comparing').click()
  await page
    .getByTestId('flight-candidate-card')
    .first()
    .getByTestId('flight-candidate-remove-button')
    .click()

  await expect(page.getByTestId('trip-spend-pending')).toHaveText(formatPrice(price1))
  await expect(page.getByTestId('trip-spend-potential')).toHaveText(formatPrice(price1))
})

test('adding a hotel candidate adds its price to Pending and Potential Cost', async ({ page }) => {
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  const price = priceOf(await cards.first().getByTestId('hotel-result-price').textContent())
  await cards.first().getByTestId('hotel-result-compare-button').click()

  await expect(page.getByTestId('trip-spend-pending')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-potential')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-confirmed')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-hotel')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-snapshot-note')).toBeVisible()
})

test('confirming a hotel candidate moves its price from Pending into Confirmed and the Hotel breakdown', async ({ page }) => {
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  const price = priceOf(await cards.first().getByTestId('hotel-result-price').textContent())
  await cards.first().getByTestId('hotel-result-compare-button').click()

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').first().getByTestId('hotel-candidate-confirm-button').click()

  await expect(page.getByTestId('trip-spend-hotel')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-confirmed')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-pending')).toHaveText('$0')
  await expect(page.getByTestId('trip-spend-potential')).toHaveText(formatPrice(price))
  await expect(page.getByTestId('trip-spend-snapshot-note')).not.toBeVisible()
})

test('removing a hotel candidate takes its price back out of Pending and Potential Cost', async ({ page }) => {
  await searchBaliResorts(page)

  const cards = page.getByTestId('hotel-result-card')
  await cards.first().getByTestId('hotel-result-compare-button').click()
  await expect(cards).toHaveCount(2)
  const price1 = priceOf(await cards.first().getByTestId('hotel-result-price').textContent())
  await cards.first().getByTestId('hotel-result-compare-button').click()
  await expect(cards).toHaveCount(1)

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').first().getByTestId('hotel-candidate-remove-button').click()

  await expect(page.getByTestId('trip-spend-pending')).toHaveText(formatPrice(price1))
  await expect(page.getByTestId('trip-spend-potential')).toHaveText(formatPrice(price1))
})

test('flight and hotel spend combine in Pending, Confirmed, and Potential Cost', async ({ page }) => {
  await searchCdgToAus(page)
  const flightPrice = priceOf(
    await page.getByTestId('flight-result-card').first().getByTestId('flight-result-price').textContent(),
  )
  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()

  // Same page, no reload: switch to Hotels and search there so the flight candidate survives.
  await page.getByRole('button', { name: 'Hotels', exact: true }).click()
  await page.getByTestId('hotel-location-input').fill('Bali Resorts')
  await page.getByTestId('hotel-checkin-input').fill('2026-08-29')
  await page.getByTestId('hotel-checkout-input').fill('2026-08-30')
  await page.getByTestId('hotel-guests-input').fill('2')
  await page.getByTestId('hotel-search-submit').click()
  await expect(page.getByTestId('hotel-result-card')).toHaveCount(3)

  const hotelPrice = priceOf(
    await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-price').textContent(),
  )
  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()

  await expect(page.getByTestId('trip-spend-pending')).toHaveText(formatPrice(flightPrice + hotelPrice))
  await expect(page.getByTestId('trip-spend-potential')).toHaveText(formatPrice(flightPrice + hotelPrice))

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').first().getByTestId('hotel-candidate-confirm-button').click()

  await expect(page.getByTestId('trip-spend-confirmed')).toHaveText(formatPrice(hotelPrice))
  await expect(page.getByTestId('trip-spend-pending')).toHaveText(formatPrice(flightPrice))
  await expect(page.getByTestId('trip-spend-potential')).toHaveText(formatPrice(flightPrice + hotelPrice))
})
