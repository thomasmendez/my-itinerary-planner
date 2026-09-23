import { test, expect, type Page } from '@playwright/test'
import { mockOverrides } from './helpers'
import type { MockOverride } from '../src/mocks/browser'

async function mockHotelSearch(page: Page, properties: unknown[], bookingLink: { url: string | null; address: string | null }) {
  const overrides: MockOverride[] = [
    { method: 'post', path: '/api/search/hotels', status: 200, body: JSON.stringify({ properties }) },
    { method: 'post', path: '/api/search/hotels/booking-link', status: 200, body: JSON.stringify(bookingLink) },
  ]
  await mockOverrides(page, overrides)
  await page.goto('/')
  await page.getByRole('button', { name: 'Hotels', exact: true }).click()
  await page.getByTestId('hotel-location-input').fill('Mustang Island')
  await page.getByTestId('hotel-checkin-input').fill('2026-10-05')
  await page.getByTestId('hotel-checkout-input').fill('2026-10-11')
  await page.getByTestId('hotel-guests-input').fill('2')
  await page.getByTestId('hotel-search-submit').click()
}

const stepsToShore = {
  type: 'vacation rental',
  name: 'Steps to Shore: Condo w/ Balcony in Port Aransas',
  link: 'http://g.rentalsunited.com/gate.aspx?uid=554691&url=1&pid=4148416&lc=google',
  property_token: 'steps-to-shore-token',
  gps_coordinates: { latitude: 27.744863510131836, longitude: -97.127685546875 },
  check_in_time: '4:00 PM',
  check_out_time: '10:00 AM',
  rate_per_night: { lowest: '$198', extracted_lowest: 198 },
  total_rate: { lowest: '$1,188', extracted_lowest: 1188 },
}

const beachfrontCondo = {
  type: 'vacation rental',
  name: 'Beautiful ground floor beachfront condo at Grand Caribbean',
  property_token: 'beachfront-condo-token',
  gps_coordinates: { latitude: 27.76807, longitude: -97.112457 },
  check_in_time: '3:00 PM',
  check_out_time: '11:00 AM',
  rate_per_night: { lowest: '$150', extracted_lowest: 150 },
  total_rate: { lowest: '$900', extracted_lowest: 900 },
}

const noLivePricing = {
  type: 'vacation rental',
  name: 'Unpriced Rental With No Live Availability',
  property_token: 'no-price-token',
  gps_coordinates: { latitude: 27.75, longitude: -97.12 },
  check_in_time: '3:00 PM',
  check_out_time: '11:00 AM',
}

test('a property with no rate_per_night is dropped from results instead of crashing the card', async ({ page }) => {
  await mockHotelSearch(page, [stepsToShore, noLivePricing], { url: null, address: null })

  await expect(page.getByTestId('hotel-result-card')).toHaveCount(1)
  await expect(page.getByTestId('hotel-result-name')).toHaveText(stepsToShore.name)
})

test('when the booking-link lookup returns no url, the search result\'s own link is used', async ({ page }) => {
  await mockHotelSearch(page, [stepsToShore], { url: null, address: null })

  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()
  await page.getByTestId('subtab-hotels-comparing').click()

  const bookingLink = page.getByTestId('hotel-candidate-booking-link')
  await expect(bookingLink).toHaveAttribute('href', stepsToShore.link)
})

test('when neither the booking-link lookup nor the search result has a url, the booking link button is disabled with a tooltip', async ({ page }) => {
  await mockHotelSearch(page, [beachfrontCondo], { url: null, address: null })

  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()
  await page.getByTestId('subtab-hotels-comparing').click()

  const bookingLink = page.getByTestId('hotel-candidate-booking-link')
  await expect(bookingLink).toBeDisabled()
  await expect(bookingLink).toHaveAttribute(
    'title',
    "This result's provider doesn't offer a direct booking link through this search — book on their site directly",
  )
})
