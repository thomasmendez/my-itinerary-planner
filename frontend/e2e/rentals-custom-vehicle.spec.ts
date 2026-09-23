import { test, expect } from '@playwright/test'
import { openTab, openCustomForm, fillCustomVehicle } from './helpers'

test('the Rentals tab has no search form, only a blurb and the custom vehicle form', async ({ page }) => {
  await openTab(page, 'rental')

  await expect(page.getByTestId('rental-search-blurb')).toBeVisible()
  await expect(page.getByTestId('rental-add-custom-button')).toBeVisible()
})

test('the custom vehicle form is hidden until "+ Add custom vehicle" is clicked', async ({ page }) => {
  await openTab(page, 'rental')

  await expect(page.getByTestId('rental-custom-form')).not.toBeVisible()
  await page.getByTestId('rental-add-custom-button').click()
  await expect(page.getByTestId('rental-custom-form')).toBeVisible()
})

test('saving a custom vehicle entry adds it to the Comparing tab', async ({ page }) => {
  await openCustomForm(page, 'rental')

  await fillCustomVehicle(page, {
    description: 'Rented SUV from Enterprise',
    pickupLocation: 'Denver Airport (DEN)',
    dropoffLocation: 'Denver Airport (DEN)',
    pickupAt: '2026-09-10T10:00',
    dropoffAt: '2026-09-15T10:00',
    cost: '320',
    notes: 'Booked via Enterprise app',
  })

  await expect(page.getByTestId('subtab-rentals-comparing')).toContainText('1')
  await page.getByTestId('subtab-rentals-comparing').click()

  const candidate = page.getByTestId('rental-candidate-card')
  await expect(candidate).toHaveCount(1)
  await expect(candidate.getByTestId('rental-candidate-description')).toHaveText('Rented SUV from Enterprise')
  await expect(candidate.getByTestId('rental-candidate-pickup-location')).toHaveText('Denver Airport (DEN)')
  await expect(candidate.getByTestId('rental-candidate-dates')).toHaveText('2026-09-10 10:00 to 2026-09-15 10:00')
  await expect(candidate.getByTestId('rental-candidate-price')).toContainText('$320')
  await expect(candidate.getByTestId('rental-candidate-price')).toContainText('/ rental')
  await expect(candidate.getByTestId('rental-candidate-snapshot')).toContainText('Price as of')
})

test('leaving Cost blank saves the candidate at $0, not hidden from Comparing', async ({ page }) => {
  await openCustomForm(page, 'rental')

  await fillCustomVehicle(page, {
    description: "Borrowing Dad's car",
    pickupLocation: 'Denver Airport (DEN)',
    pickupAt: '2026-09-10T10:00',
    dropoffAt: '2026-09-15T10:00',
  })

  await page.getByTestId('subtab-rentals-comparing').click()
  const candidate = page.getByTestId('rental-candidate-card')
  await expect(candidate).toHaveCount(1)
  await expect(candidate.getByTestId('rental-candidate-price')).toContainText('$0')
})

test('the cost unit defaults to "/ rental" and can be overridden', async ({ page }) => {
  await openCustomForm(page, 'rental')

  await expect(page.getByTestId('rental-custom-cost-unit-input')).toHaveValue('/ rental')

  await fillCustomVehicle(page, {
    description: 'Weekend Jeep rental',
    pickupLocation: 'Denver Airport (DEN)',
    pickupAt: '2026-09-10T10:00',
    dropoffAt: '2026-09-12T10:00',
    cost: '150',
    costUnit: '/ day',
  })

  await page.getByTestId('subtab-rentals-comparing').click()
  await expect(page.getByTestId('rental-candidate-card').getByTestId('rental-candidate-price')).toContainText(
    '/ day',
  )
})

test('confirming a custom vehicle candidate moves it into confirmed Trip Spend', async ({ page }) => {
  await openCustomForm(page, 'rental')

  await fillCustomVehicle(page, {
    description: 'Rented SUV from Enterprise',
    pickupLocation: 'Denver Airport (DEN)',
    pickupAt: '2026-09-10T10:00',
    dropoffAt: '2026-09-15T10:00',
    cost: '320',
  })

  await page.getByTestId('subtab-rentals-comparing').click()
  await page.getByTestId('rental-candidate-card').getByTestId('rental-candidate-confirm-button').click()

  await expect(page.getByTestId('rental-candidate-card')).toHaveCount(0)
  await expect(page.getByTestId('subtab-rentals-comparing')).toContainText('0')

  await expect(page.getByTestId('trip-spend-rental')).toHaveText('$320')
  await expect(page.getByTestId('trip-spend-confirmed')).toHaveText('$320')
  await expect(page.getByTestId('trip-spend-pending')).toHaveText('$0')
})

test('removing a custom vehicle candidate clears it from Comparing', async ({ page }) => {
  await openCustomForm(page, 'rental')

  await fillCustomVehicle(page, {
    description: 'Rented SUV from Enterprise',
    pickupLocation: 'Denver Airport (DEN)',
    pickupAt: '2026-09-10T10:00',
    dropoffAt: '2026-09-15T10:00',
    cost: '320',
  })

  await page.getByTestId('subtab-rentals-comparing').click()
  await page.getByTestId('rental-candidate-card').getByTestId('rental-candidate-remove-button').click()

  await expect(page.getByTestId('rental-candidate-card')).toHaveCount(0)
  await expect(page.getByTestId('subtab-rentals-comparing')).toContainText('0')
})
