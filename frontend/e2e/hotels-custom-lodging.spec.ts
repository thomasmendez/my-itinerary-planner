import { test, expect } from '@playwright/test'
import { searchBaliResorts, openTab, openCustomForm, fillCustomLodging } from './helpers'

test('the custom lodging form is hidden until "+ Add custom lodging" is clicked', async ({ page }) => {
  await openTab(page, 'hotel')

  await expect(page.getByTestId('hotel-custom-form')).not.toBeVisible()
  await page.getByTestId('hotel-add-custom-button').click()
  await expect(page.getByTestId('hotel-custom-form')).toBeVisible()
})

test('saving a custom lodging entry adds it to the Comparing tab', async ({ page }) => {
  await openCustomForm(page, 'hotel')

  await fillCustomLodging(page, {
    name: "Staying at Mom's house",
    location: 'Austin, TX',
    checkIn: '2026-08-29',
    checkOut: '2026-08-30',
    cost: '0',
    notes: 'Free stay',
  })

  await expect(page.getByTestId('subtab-hotels-comparing')).toContainText('1')
  await page.getByTestId('subtab-hotels-comparing').click()

  const candidate = page.getByTestId('hotel-candidate-card')
  await expect(candidate).toHaveCount(1)
  await expect(candidate.getByTestId('hotel-candidate-name')).toHaveText("Staying at Mom's house")
  await expect(candidate.getByTestId('hotel-candidate-location')).toHaveText('Austin, TX')
  await expect(candidate.getByTestId('hotel-candidate-dates')).toHaveText('2026-08-29 to 2026-08-30')
  await expect(candidate.getByTestId('hotel-candidate-price')).toContainText('$0')
  await expect(candidate.getByTestId('hotel-candidate-price')).toContainText('/ night')
  await expect(candidate.getByTestId('hotel-candidate-snapshot')).toContainText('Price as of')
})

test('leaving Cost blank saves the candidate at $0, not hidden from Comparing', async ({ page }) => {
  await openCustomForm(page, 'hotel')

  await fillCustomLodging(page, {
    name: 'Friend’s guest room',
    checkIn: '2026-08-29',
    checkOut: '2026-08-30',
  })

  await page.getByTestId('subtab-hotels-comparing').click()
  const candidate = page.getByTestId('hotel-candidate-card')
  await expect(candidate).toHaveCount(1)
  await expect(candidate.getByTestId('hotel-candidate-price')).toContainText('$0')
})

test('the cost unit defaults to "/ night" and can be overridden', async ({ page }) => {
  await openCustomForm(page, 'hotel')

  await expect(page.getByTestId('hotel-custom-cost-unit-input')).toHaveValue('/ night')

  await fillCustomLodging(page, {
    name: 'Beach house rental',
    checkIn: '2026-08-29',
    checkOut: '2026-08-30',
    cost: '600',
    costUnit: '/ week',
  })

  await page.getByTestId('subtab-hotels-comparing').click()
  await expect(page.getByTestId('hotel-candidate-card').getByTestId('hotel-candidate-price')).toContainText(
    '/ week',
  )
})

test('a custom lodging candidate appears in Comparing alongside a search-sourced candidate', async ({ page }) => {
  await searchBaliResorts(page)
  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()

  await page.getByTestId('hotel-add-custom-button').click()
  await fillCustomLodging(page, {
    name: "Staying at Mom's house",
    checkIn: '2026-08-29',
    checkOut: '2026-08-30',
    cost: '0',
  })

  await expect(page.getByTestId('subtab-hotels-comparing')).toContainText('2')
  await page.getByTestId('subtab-hotels-comparing').click()
  await expect(page.getByTestId('hotel-candidate-card')).toHaveCount(2)
})

test('confirming a custom lodging candidate moves it into confirmed Trip Spend', async ({ page }) => {
  await openCustomForm(page, 'hotel')

  await fillCustomLodging(page, {
    name: 'Beach house rental',
    checkIn: '2026-08-29',
    checkOut: '2026-08-30',
    cost: '150',
  })

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').getByTestId('hotel-candidate-confirm-button').click()

  await expect(page.getByTestId('hotel-candidate-card')).toHaveCount(0)
  await expect(page.getByTestId('subtab-hotels-comparing')).toContainText('0')

  await expect(page.getByTestId('trip-spend-hotel')).toHaveText('$150')
  await expect(page.getByTestId('trip-spend-confirmed')).toHaveText('$150')
  await expect(page.getByTestId('trip-spend-pending')).toHaveText('$0')
})

test('editing a candidate pre-fills the form and updates it in place', async ({ page }) => {
  await openCustomForm(page, 'hotel')
  await fillCustomLodging(page, {
    name: "Staying at Mom's house",
    location: 'Austin, TX',
    checkIn: '2026-08-29',
    checkOut: '2026-08-30',
    cost: '0',
  })

  await page.getByTestId('subtab-hotels-comparing').click()
  const candidate = page.getByTestId('hotel-candidate-card')
  await candidate.getByTestId('hotel-candidate-edit-button').click()

  const form = page.getByTestId('hotel-custom-form')
  await expect(form).toBeVisible()
  await expect(page.getByTestId('hotel-custom-name-input')).toHaveValue("Staying at Mom's house")
  await expect(page.getByTestId('hotel-custom-location-input')).toHaveValue('Austin, TX')
  await expect(page.getByTestId('hotel-custom-check-in-input')).toHaveValue('2026-08-29')
  await expect(page.getByTestId('hotel-custom-check-out-input')).toHaveValue('2026-08-30')

  await page.getByTestId('hotel-custom-name-input').fill("Staying at Dad's house")
  await page.getByTestId('hotel-custom-cost-input').fill('50')
  await page.getByTestId('hotel-custom-save-button').click()

  await expect(page.getByTestId('hotel-candidate-card')).toHaveCount(1)
  await expect(page.getByTestId('hotel-candidate-name')).toHaveText("Staying at Dad's house")
  await expect(page.getByTestId('hotel-candidate-price')).toContainText('$50')
})

test('cancelling an edit discards changes and restores the candidate card', async ({ page }) => {
  await openCustomForm(page, 'hotel')
  await fillCustomLodging(page, {
    name: "Staying at Mom's house",
    checkIn: '2026-08-29',
    checkOut: '2026-08-30',
    cost: '0',
  })

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-edit-button').click()
  await page.getByTestId('hotel-custom-name-input').fill('This should not save')
  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page.getByTestId('hotel-custom-form')).not.toBeVisible()
  await expect(page.getByTestId('hotel-candidate-name')).toHaveText("Staying at Mom's house")
})

test('removing a custom lodging candidate clears it from Comparing without creating a phantom search result', async ({ page }) => {
  await searchBaliResorts(page)

  await page.getByTestId('hotel-add-custom-button').click()
  await fillCustomLodging(page, {
    name: "Staying at Mom's house",
    checkIn: '2026-08-29',
    checkOut: '2026-08-30',
    cost: '0',
  })

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').getByTestId('hotel-candidate-remove-button').click()

  await expect(page.getByTestId('hotel-candidate-card')).toHaveCount(0)
  await expect(page.getByTestId('subtab-hotels-comparing')).toContainText('0')

  await page.getByTestId('subtab-hotels-search').click()
  await expect(page.getByTestId('hotel-result-card')).toHaveCount(3)
})
