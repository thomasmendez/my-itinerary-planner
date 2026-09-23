import { test, expect, type Page } from '@playwright/test'
import { searchCdgToAus, searchBaliResorts, openCustomForm, fillCustomVehicle, fillCustomLodging, fillCustomTransport } from './helpers'

async function openCalendarTab(page: Page) {
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
}

function calendarDay(page: Page, isoDate: string) {
  return page.locator(`[data-testid="calendar-day"][data-date="${isoDate}"]`)
}

test('Calendar tab is empty with no saved items', async ({ page }) => {
  await page.goto('/')
  await openCalendarTab(page)

  await expect(page.getByTestId('calendar-month-label')).toBeVisible()
  await expect(page.getByTestId('calendar-day-dot')).toHaveCount(0)
  await expect(page.getByTestId('calendar-entry')).toHaveCount(0)
  await expect(page.getByText('No items on the calendar yet.')).toBeVisible()
})

test('adding a flight candidate shows it on the Calendar tab as a candidate', async ({ page }) => {
  await searchCdgToAus(page)
  const firstCard = page.getByTestId('flight-result-card').first()
  await firstCard.getByTestId('flight-result-compare-button').click()

  await openCalendarTab(page)

  // Month/day of the only entry is selected automatically.
  await expect(page.getByTestId('calendar-month-label')).toHaveText('July 2026')
  const dot = calendarDay(page, '2026-07-30').getByTestId('calendar-day-dot')
  await expect(dot).toHaveCount(1)
  await expect(dot).toHaveClass(/bg-amber/)

  const entries = page.getByTestId('calendar-entry')
  await expect(entries).toHaveCount(1)
  await expect(entries.first().getByTestId('calendar-entry-status')).toHaveText('candidate')
  await expect(entries.first().getByTestId('calendar-entry-status')).toHaveClass(/bg-amber/)
  await expect(entries.first().getByTestId('calendar-entry-label')).toContainText('CDG')
  await expect(entries.first().getByTestId('calendar-entry-label')).toContainText('AUS')
  await expect(entries.first().getByTestId('calendar-entry-date')).toHaveText('Jul 30')
})

test('confirming a candidate updates its Calendar entry to confirmed without duplicating it', async ({ page }) => {
  await searchCdgToAus(page)
  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').first().getByTestId('flight-candidate-confirm-button').click()

  await openCalendarTab(page)

  const dot = calendarDay(page, '2026-07-30').getByTestId('calendar-day-dot')
  await expect(dot).toHaveClass(/bg-blue/)

  const entries = page.getByTestId('calendar-entry')
  await expect(entries).toHaveCount(1)
  await expect(entries.first().getByTestId('calendar-entry-status')).toHaveText('confirmed')
  await expect(entries.first().getByTestId('calendar-entry-status')).toHaveClass(/bg-blue/)
})

test('removing a candidate removes it from the Calendar tab', async ({ page }) => {
  await searchCdgToAus(page)
  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()

  await page.getByTestId('subtab-flights-comparing').click()
  await page.getByTestId('flight-candidate-card').first().getByTestId('flight-candidate-remove-button').click()

  await openCalendarTab(page)
  await expect(page.getByTestId('calendar-entry')).toHaveCount(0)
  await expect(page.getByText('No items on the calendar yet.')).toBeVisible()
})

test('a custom transport candidate with a return date shows a dot on each leg day', async ({ page }) => {
  await openCustomForm(page, 'flight')
  await fillCustomTransport(page, {
    mode: 'Train',
    from: 'CDG',
    to: 'AUS',
    depart: '2026-07-30T09:00',
    return: '2026-08-02T09:00',
    cost: '30',
  })

  await openCalendarTab(page)

  await test.step('earliest entry (the departure) is selected by default', async () => {
    await expect(page.getByTestId('calendar-month-label')).toHaveText('July 2026')
    const entries = page.getByTestId('calendar-entry')
    await expect(entries).toHaveCount(1)
    await expect(entries.first().getByTestId('calendar-entry-label')).toContainText('CDG')
    await expect(entries.first().getByTestId('calendar-entry-date')).toHaveText('Jul 30')
  })

  await test.step("both legs' dots are visible without navigating (Aug 2 falls in July's trailing grid days)", async () => {
    await expect(calendarDay(page, '2026-07-30').getByTestId('calendar-day-dot')).toHaveCount(1)
    const returnDot = calendarDay(page, '2026-08-02').getByTestId('calendar-day-dot')
    await expect(returnDot).toHaveCount(1)
    await expect(returnDot).toHaveClass(/bg-amber/)
  })

  await calendarDay(page, '2026-08-02').click()
  const entries = page.getByTestId('calendar-entry')
  await expect(entries).toHaveCount(1)
  await expect(entries.first().getByTestId('calendar-entry-label')).toContainText('AUS')
  await expect(entries.first().getByTestId('calendar-entry-date')).toHaveText('Aug 2')

  await page.getByTestId('calendar-next-month-button').click()
  await expect(page.getByTestId('calendar-month-label')).toHaveText('August 2026')
  await page.getByTestId('calendar-prev-month-button').click()
  await expect(page.getByTestId('calendar-month-label')).toHaveText('July 2026')
})

test('multiple saved candidates on the same day both show as dots and in the day panel', async ({ page }) => {
  await searchCdgToAus(page)
  await page.getByTestId('flight-result-card').nth(0).getByTestId('flight-result-compare-button').click()
  await page.getByTestId('flight-result-card').nth(1).getByTestId('flight-result-compare-button').click()

  await openCalendarTab(page)
  await expect(calendarDay(page, '2026-07-30').getByTestId('calendar-day-dot')).toHaveCount(2)
  await expect(page.getByTestId('calendar-entry')).toHaveCount(2)
})

test('adding a hotel candidate shows it on the Calendar tab, on its check-in day', async ({ page }) => {
  await searchBaliResorts(page)
  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()

  await openCalendarTab(page)

  await expect(page.getByTestId('calendar-month-label')).toHaveText('August 2026')
  const dot = calendarDay(page, '2026-08-29').getByTestId('calendar-day-dot')
  await expect(dot).toHaveCount(1)
  await expect(dot).toHaveClass(/bg-amber/)

  const entries = page.getByTestId('calendar-entry')
  await expect(entries).toHaveCount(1)
  await expect(entries.first().getByTestId('calendar-entry-status')).toHaveText('candidate')
  await expect(entries.first().getByTestId('calendar-entry-status')).toHaveClass(/bg-amber/)
  await expect(entries.first().getByTestId('calendar-entry-date')).toHaveText('Aug 29 – Aug 30')
})

test('confirming a hotel candidate updates its Calendar entry to confirmed without duplicating it', async ({ page }) => {
  await searchBaliResorts(page)
  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').first().getByTestId('hotel-candidate-confirm-button').click()

  await openCalendarTab(page)

  const dot = calendarDay(page, '2026-08-29').getByTestId('calendar-day-dot')
  await expect(dot).toHaveCount(1)
  await expect(dot).toHaveClass(/bg-blue/)

  const entries = page.getByTestId('calendar-entry')
  await expect(entries).toHaveCount(1)
  await expect(entries.first().getByTestId('calendar-entry-status')).toHaveText('confirmed')
  await expect(entries.first().getByTestId('calendar-entry-status')).toHaveClass(/bg-blue/)
})

test('removing a hotel candidate removes it from the Calendar tab', async ({ page }) => {
  await searchBaliResorts(page)
  await page.getByTestId('hotel-result-card').first().getByTestId('hotel-result-compare-button').click()

  await page.getByTestId('subtab-hotels-comparing').click()
  await page.getByTestId('hotel-candidate-card').first().getByTestId('hotel-candidate-remove-button').click()

  await openCalendarTab(page)
  await expect(page.getByTestId('calendar-entry')).toHaveCount(0)
  await expect(page.getByText('No items on the calendar yet.')).toBeVisible()
})

test('a custom rental candidate shows dots on only its pickup and dropoff day', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 })
  await openCustomForm(page, 'rental')
  await fillCustomVehicle(page, {
    description: 'Rented SUV from Enterprise',
    pickupLocation: 'Denver Airport (DEN)',
    pickupAt: '2026-09-01T10:00',
    dropoffAt: '2026-09-04T10:00',
  })

  await openCalendarTab(page)

  await expect(page.getByTestId('calendar-month-label')).toHaveText('September 2026')
  const pickupDot = calendarDay(page, '2026-09-01').getByTestId('calendar-day-dot')
  await expect(pickupDot).toHaveCount(1)
  await expect(pickupDot).toHaveClass(/bg-amber/)
  await expect(calendarDay(page, '2026-09-02').getByTestId('calendar-day-dot')).toHaveCount(0)
  await expect(calendarDay(page, '2026-09-03').getByTestId('calendar-day-dot')).toHaveCount(0)
  const dropoffDot = calendarDay(page, '2026-09-04').getByTestId('calendar-day-dot')
  await expect(dropoffDot).toHaveCount(1)
  await expect(dropoffDot).toHaveClass(/bg-amber/)

  await calendarDay(page, '2026-09-04').click()
  const entries = page.getByTestId('calendar-entry')
  await expect(entries).toHaveCount(1)
  await expect(entries.first().getByTestId('calendar-entry-label')).toHaveText('Rented SUV from Enterprise')
  await expect(entries.first().getByTestId('calendar-entry-date')).toHaveText('Sep 1 – Sep 4')
})

test('a multi-night custom hotel candidate shows dots on only its check-in and check-out day', async ({ page }) => {
  await openCustomForm(page, 'hotel')
  await fillCustomLodging(page, {
    name: 'Beach house rental',
    checkIn: '2026-09-01',
    checkOut: '2026-09-04',
  })

  await openCalendarTab(page)

  await expect(page.getByTestId('calendar-month-label')).toHaveText('September 2026')
  await expect(calendarDay(page, '2026-09-01').getByTestId('calendar-day-dot')).toHaveCount(1)
  await expect(calendarDay(page, '2026-09-02').getByTestId('calendar-day-dot')).toHaveCount(0)
  await expect(calendarDay(page, '2026-09-03').getByTestId('calendar-day-dot')).toHaveCount(0)
  await expect(calendarDay(page, '2026-09-04').getByTestId('calendar-day-dot')).toHaveCount(1)
})

test('selecting a day with no entries shows the empty-day message', async ({ page }) => {
  await searchCdgToAus(page)
  await page.getByTestId('flight-result-card').first().getByTestId('flight-result-compare-button').click()

  await openCalendarTab(page)
  await calendarDay(page, '2026-07-15').click()

  await expect(page.getByTestId('calendar-entry')).toHaveCount(0)
  await expect(page.getByText('No items on this day.')).toBeVisible()
})
