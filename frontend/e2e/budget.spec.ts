import { test, expect } from '@playwright/test'

test('Budget tab shows $0 with no candidates or confirmed items, labeled plain "Total" with nothing pending', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Budget', exact: true }).click()

  await expect(page.getByTestId('budget-confirmed')).toHaveText('$0')
  await expect(page.getByTestId('budget-pending')).toHaveText('$0')
  await expect(page.getByTestId('budget-potential')).toHaveText('$0')
  await expect(page.getByText('Total', { exact: true })).toBeVisible()
  await expect(page.getByText('Potential Total')).not.toBeVisible()
  await expect(page.getByTestId('budget-pie-chart')).toHaveCount(0)
})

test('confirming a flight and leaving a hotel pending splits correctly across summary and category rows', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('flight-from-input').fill('CDG')
  await page.getByTestId('flight-to-input').fill('AUS')
  await page.getByTestId('flight-depart-input').fill('2026-07-30')
  await page.getByTestId('flight-travelers-input').fill('1')
  await page.getByTestId('flight-search-submit').click()
  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()
  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').first().getByTestId('flight-candidate-confirm-button').click()

  await page.getByRole('button', { name: 'Hotels', exact: true }).click()
  await page.getByTestId('hotel-location-input').fill('Bali Resorts')
  await page.getByTestId('hotel-checkin-input').fill('2026-08-29')
  await page.getByTestId('hotel-checkout-input').fill('2026-08-30')
  await page.getByTestId('hotel-guests-input').fill('2')
  await page.getByTestId('hotel-search-submit').click()
  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()

  await page.getByRole('button', { name: 'Budget', exact: true }).click()

  await expect(page.getByText('Potential Total')).toBeVisible()

  const confirmedText = await page.getByTestId('budget-confirmed').textContent()
  const pendingText = await page.getByTestId('budget-pending').textContent()
  const potentialText = await page.getByTestId('budget-potential').textContent()
  const asNumber = (s: string | null) => Number((s ?? '').replace(/[$,]/g, ''))
  const flightRow = page.getByTestId('budget-category-row').filter({ hasText: 'Flights' })
  const hotelRow = page.getByTestId('budget-category-row').filter({ hasText: 'Hotel' })
  const rentalRow = page.getByTestId('budget-category-row').filter({ hasText: 'Rental' })
  const eventsRow = page.getByTestId('budget-category-row').filter({ hasText: 'Events' })

  await test.step('category rows reconcile with the summary strip', async () => {
    await expect(flightRow).toContainText(`${confirmedText} confirmed`)
    await expect(hotelRow).toContainText(`${pendingText} pending`)
    expect(asNumber(confirmedText) + asNumber(pendingText)).toBeGreaterThan(0)
    expect(asNumber(potentialText)).toBeGreaterThanOrEqual(asNumber(confirmedText))
  })

  await test.step('"Review" button only shows for a category with pending money', async () => {
    await expect(flightRow.getByTestId('budget-review-pending-button')).toHaveCount(0)
    await expect(rentalRow.getByTestId('budget-review-pending-button')).toHaveCount(0)
    await expect(eventsRow.getByTestId('budget-review-pending-button')).toHaveCount(0)
  })

  await test.step('a confirmed-only category and a pending-only category each render a single column', async () => {
    await expect(flightRow.getByTestId('budget-item-list-confirmed')).toBeVisible()
    await expect(flightRow.getByTestId('budget-item-list-pending')).toHaveCount(0)
    await expect(hotelRow.getByTestId('budget-item-list-pending')).toBeVisible()
    await expect(hotelRow.getByTestId('budget-item-list-confirmed')).toHaveCount(0)
    await expect(rentalRow.getByTestId('budget-item')).toHaveCount(0)
  })

  await test.step("a single-item category's line price equals its rollup total", async () => {
    await expect(flightRow.getByTestId('budget-item-price')).toHaveText(confirmedText ?? '')
    await expect(hotelRow.getByTestId('budget-item-price')).toHaveText(pendingText ?? '')
  })

  await hotelRow.getByTestId('budget-review-pending-button').click()
  await expect(page.getByTestId('subtab-hotels-comparing')).toHaveClass(/font-semibold/)
  await expect(page.getByTestId('hotel-candidate-card')).toHaveCount(1)

  await test.step('pie chart only shows slices for categories with spend on the table', async () => {
    await page.getByRole('button', { name: 'Budget', exact: true }).click()
    await expect(page.getByTestId('budget-pie-chart')).toBeVisible()
    const legend = page.getByTestId('budget-pie-legend')
    await expect(legend.getByText(/Flights.*%/)).toBeVisible()
    await expect(legend.getByText(/Hotel.*%/)).toBeVisible()
    await expect(legend.getByText(/Rental/)).toHaveCount(0)
    await expect(legend.getByText(/Events/)).toHaveCount(0)
  })
})

test('a category with both a confirmed and a pending item splits its item list into two columns', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('flight-from-input').fill('CDG')
  await page.getByTestId('flight-to-input').fill('AUS')
  await page.getByTestId('flight-depart-input').fill('2026-07-30')
  await page.getByTestId('flight-travelers-input').fill('1')
  await page.getByTestId('flight-search-submit').click()

  const cards = page.getByTestId('flight-result-card')
  await cards.nth(0).getByTestId('flight-result-compare-button').click()
  await cards.nth(1).getByTestId('flight-result-compare-button').click()
  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').first().getByTestId('flight-candidate-confirm-button').click()

  await page.getByRole('button', { name: 'Budget', exact: true }).click()

  const flightRow = page.getByTestId('budget-category-row').filter({ hasText: 'Flights' })
  await expect(flightRow.getByTestId('budget-item-list-confirmed')).toBeVisible()
  await expect(flightRow.getByTestId('budget-item-list-pending')).toBeVisible()
  await expect(flightRow.getByTestId('budget-item-list-confirmed').getByTestId('budget-item')).toHaveCount(1)
  await expect(flightRow.getByTestId('budget-item-list-pending').getByTestId('budget-item')).toHaveCount(1)
})
