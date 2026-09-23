import { test, expect, type Page } from '@playwright/test'

async function addFlightCandidate(page: Page) {
  await page.goto('/')
  await page.getByTestId('flight-from-input').fill('CDG')
  await page.getByTestId('flight-to-input').fill('AUS')
  await page.getByTestId('flight-depart-input').fill('2026-07-30')
  await page.getByTestId('flight-travelers-input').fill('1')
  await page.getByTestId('flight-search-submit').click()
  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()
}

async function confirmFirstCandidate(page: Page) {
  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').first().getByTestId('flight-candidate-confirm-button').click()
  await page.getByTestId('subtab-flights-search').click()
}

async function addRoundTripCustomTransport(page: Page) {
  await page.goto('/')
  await page.getByTestId('flight-add-custom-button').click()
  await page.getByTestId('flight-custom-mode-select').selectOption('Self-drive')
  await page.getByTestId('flight-custom-from-input').fill('Dallas')
  await page.getByTestId('flight-custom-to-input').fill('Austin')
  await page.getByTestId('flight-custom-depart-input').fill('2026-09-30T09:00')
  await page.getByTestId('flight-custom-return-input').fill('2026-10-05T16:30')
  await page.getByTestId('flight-custom-cost-input').fill('60')
  await page.getByTestId('flight-custom-save-button').click()
}

async function addCustomHotel(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Hotels', exact: true }).click()
  await page.getByTestId('hotel-add-custom-button').click()
  await page.getByTestId('hotel-custom-name-input').fill("Staying at Mom's house")
  await page.getByTestId('hotel-custom-check-in-input').fill('2026-09-30')
  await page.getByTestId('hotel-custom-check-out-input').fill('2026-10-05')
  await page.getByTestId('hotel-custom-cost-input').fill('0')
  await page.getByTestId('hotel-custom-save-button').click()
}

async function addCustomRental(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Rentals', exact: true }).click()
  await page.getByTestId('rental-add-custom-button').click()
  await page.getByTestId('rental-custom-description-input').fill('Rented SUV from Enterprise')
  await page.getByTestId('rental-custom-pickup-location-input').fill('Denver Airport (DEN)')
  await page.getByTestId('rental-custom-pickup-input').fill('2026-09-10T10:00')
  await page.getByTestId('rental-custom-dropoff-input').fill('2026-09-15T10:00')
  await page.getByTestId('rental-custom-cost-input').fill('320')
  // dispatchEvent, not click() — the save button sits bottom-right of a full rental
  // form, under the fixed "Ask the trip assistant" button; a real click there would hit
  // whichever one is visually on top. Pre-existing overlap unrelated to this feature
  // (see rentals-custom-vehicle.spec.ts, which hits the same thing with a plain click).
  await page.getByTestId('rental-custom-save-button').dispatchEvent('click')
}

test('Timeline tab is empty with nothing saved', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByTestId('timeline-entry')).toHaveCount(0)
  await expect(page.getByText('Nothing saved yet.')).toBeVisible()
})

test('Timeline lists both a candidate and a confirmed flight with their status', async ({ page }) => {
  await addFlightCandidate(page)
  await page.getByTestId('flight-result-card').nth(1).getByTestId('flight-result-compare-button').click()
  await confirmFirstCandidate(page)

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const entries = page.getByTestId('timeline-entry')
  await expect(entries).toHaveCount(2)
  await expect(page.getByTestId('timeline-status').filter({ hasText: 'Confirmed' })).toHaveCount(1)
  await expect(page.getByTestId('timeline-status').filter({ hasText: 'Candidate' })).toHaveCount(1)
})

test('removing a candidate from Timeline needs no confirmation', async ({ page }) => {
  await addFlightCandidate(page)

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByTestId('timeline-entry')).toHaveCount(1)

  await page.getByTestId('timeline-remove-button').click()
  await expect(page.getByTestId('timeline-entry')).toHaveCount(0)
})

test('removing a confirmed item from Timeline prompts for confirmation, and is undone on dismiss', async ({ page }) => {
  await addFlightCandidate(page)
  await confirmFirstCandidate(page)

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByTestId('timeline-entry')).toHaveCount(1)

  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByTestId('timeline-remove-button').click()
  await expect(page.getByTestId('timeline-entry')).toHaveCount(1)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('timeline-remove-button').click()
  await expect(page.getByTestId('timeline-entry')).toHaveCount(0)
})

test('confirmed flights no longer show in the Trip Plan sidebar after removal from Timeline', async ({ page }) => {
  await addFlightCandidate(page)
  await confirmFirstCandidate(page)
  await expect(page.getByTestId('trip-plan-entry')).toHaveCount(1)

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('timeline-remove-button').click()

  await expect(page.getByTestId('trip-plan-entry')).toHaveCount(0)
})

test('a round-trip custom transport candidate shows departure and return as two Timeline rows', async ({ page }) => {
  await addRoundTripCustomTransport(page)

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const entries = page.getByTestId('timeline-entry')
  await expect(entries).toHaveCount(2)

  await expect(entries.nth(0).getByTestId('timeline-date')).toHaveText('Sep 30')
  await expect(entries.nth(0).getByTestId('timeline-description')).toContainText('Dallas to Austin')
  await expect(entries.nth(0).getByTestId('timeline-detail')).toContainText('Departs')

  await expect(entries.nth(1).getByTestId('timeline-date')).toHaveText('Oct 5')
  await expect(entries.nth(1).getByTestId('timeline-description')).toContainText('Austin to Dallas')
  await expect(entries.nth(1).getByTestId('timeline-detail')).toContainText('Returns')
})

test('removing a round-trip flight from Timeline warns that both legs go together, and is undone on dismiss', async ({ page }) => {
  await addRoundTripCustomTransport(page)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByTestId('timeline-entry')).toHaveCount(2)

  let message = ''
  page.once('dialog', (dialog) => {
    message = dialog.message()
    dialog.dismiss()
  })
  await page.getByTestId('timeline-remove-button').first().click()
  expect(message).toContain('departure (Sep 30)')
  expect(message).toContain('return (Oct 5)')
  await expect(page.getByTestId('timeline-entry')).toHaveCount(2)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('timeline-remove-button').first().click()
  await expect(page.getByTestId('timeline-entry')).toHaveCount(0)
})

test('Timeline rows interleave chronologically across item kinds, not grouped by parent item', async ({ page }) => {
  await addRoundTripCustomTransport(page)

  // Same page, no reload: switch to Events and add the Oct 1 candidate so the
  // round-trip transport candidate survives (see trip-spend.spec.ts for the same pattern).
  await page.getByRole('button', { name: 'Events', exact: true }).click()
  await page.getByTestId('event-name-input').fill('Networking')
  await page.getByTestId('event-city-input').fill('Austin')
  await page.getByTestId('event-state-select').selectOption('Texas')
  await page.getByTestId('event-date-start-input').fill('2026-10-01')
  await page.getByTestId('event-date-end-input').fill('2026-10-01')
  await page.getByTestId('event-search-submit').click()
  await page.getByTestId('event-result-card').first().getByTestId('event-result-compare-button').click()

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const entries = page.getByTestId('timeline-entry')
  await expect(entries).toHaveCount(3)

  await expect(entries.nth(0).getByTestId('timeline-date')).toHaveText('Sep 30')
  await expect(entries.nth(0).getByTestId('timeline-detail')).toContainText('Departs')
  await expect(entries.nth(1).getByTestId('timeline-date')).toHaveText('Oct 1')
  await expect(entries.nth(2).getByTestId('timeline-date')).toHaveText('Oct 5')
  await expect(entries.nth(2).getByTestId('timeline-detail')).toContainText('Returns')
})

test('a custom hotel candidate shows check-in and check-out as two Timeline rows', async ({ page }) => {
  await addCustomHotel(page)

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const entries = page.getByTestId('timeline-entry')
  await expect(entries).toHaveCount(2)

  await expect(entries.nth(0).getByTestId('timeline-date')).toHaveText('Sep 30')
  await expect(entries.nth(0).getByTestId('timeline-detail')).toHaveText('Check-in')
  await expect(entries.nth(1).getByTestId('timeline-date')).toHaveText('Oct 5')
  await expect(entries.nth(1).getByTestId('timeline-detail')).toHaveText('Check-out')
})

test('editing a custom hotel candidate from Timeline updates both check-in and check-out rows', async ({ page }) => {
  await addCustomHotel(page)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()

  await page.getByTestId('timeline-entry').first().getByTestId('timeline-edit-button').click()
  await expect(page.getByTestId('hotel-custom-check-out-input')).toHaveValue('2026-10-05')
  await page.getByTestId('hotel-custom-check-out-input').fill('2026-10-06')
  await page.getByTestId('hotel-custom-save-button').click()

  const entries = page.getByTestId('timeline-entry')
  await expect(entries).toHaveCount(2)
  await expect(entries.nth(1).getByTestId('timeline-date')).toHaveText('Oct 6')
})

test('a confirmed item has no Edit button in Timeline', async ({ page }) => {
  await addCustomHotel(page)
  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').getByTestId('hotel-candidate-confirm-button').click()

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByTestId('timeline-entry')).toHaveCount(2)
  await expect(page.getByTestId('timeline-edit-button')).toHaveCount(0)
})

test('removing a custom hotel candidate from Timeline warns that both check-in and check-out go together', async ({ page }) => {
  await addCustomHotel(page)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()

  let message = ''
  page.once('dialog', (dialog) => {
    message = dialog.message()
    dialog.accept()
  })
  await page.getByTestId('timeline-remove-button').first().click()
  expect(message).toContain('check-in (Sep 30)')
  expect(message).toContain('check-out (Oct 5)')
  await expect(page.getByTestId('timeline-entry')).toHaveCount(0)
})

test('a custom rental candidate shows pickup and drop-off as two Timeline rows', async ({ page }) => {
  await addCustomRental(page)

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const entries = page.getByTestId('timeline-entry')
  await expect(entries).toHaveCount(2)

  await expect(entries.nth(0).getByTestId('timeline-date')).toHaveText('Sep 10')
  await expect(entries.nth(0).getByTestId('timeline-detail')).toHaveText('Pickup')
  await expect(entries.nth(1).getByTestId('timeline-date')).toHaveText('Sep 15')
  await expect(entries.nth(1).getByTestId('timeline-detail')).toHaveText('Drop-off')
})

test('removing a custom rental candidate from Timeline warns that both pickup and drop-off go together', async ({ page }) => {
  await addCustomRental(page)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()

  let message = ''
  page.once('dialog', (dialog) => {
    message = dialog.message()
    dialog.accept()
  })
  await page.getByTestId('timeline-remove-button').first().click()
  expect(message).toContain('pickup (Sep 10)')
  expect(message).toContain('drop-off (Sep 15)')
  await expect(page.getByTestId('timeline-entry')).toHaveCount(0)
})
