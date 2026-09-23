import { test, expect, type Page } from '@playwright/test'
import { searchCdgToAus } from './helpers'

async function confirmByPrice(page: Page, price: string) {
  await page
    .getByTestId('flight-result-card')
    .filter({ hasText: price })
    .getByTestId('flight-result-compare-button')
    .click()
  await page.getByTestId('subtab-flights-comparing').click()
  await page
    .getByTestId('flight-candidate-card')
    .filter({ hasText: price })
    .getByTestId('flight-candidate-confirm-button')
    .click()
  await page.getByTestId('subtab-flights-search').click()
}

test('trip plan is empty with no confirmed items', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('trip-plan-entry')).toHaveCount(0)
  await expect(page.getByText('No confirmed items yet.')).toBeVisible()
})

test('confirming a flight adds a row to the trip plan', async ({ page }) => {
  await searchCdgToAus(page)
  await confirmByPrice(page, '$1650')

  const entries = page.getByTestId('trip-plan-entry')
  await expect(entries).toHaveCount(1)
  await expect(entries.first().getByTestId('trip-plan-icon')).toHaveText('F')
  await expect(entries.first().getByTestId('trip-plan-date')).toHaveText('Jul 30')
  await expect(entries.first().getByTestId('trip-plan-description')).toContainText('CDG to AUS')
  await expect(entries.first().getByTestId('trip-plan-detail')).toContainText('Departs 11:00')
})

test('confirmed flights are listed in chronological order by departure time, not confirm order', async ({ page }) => {
  await searchCdgToAus(page)

  // Confirm the 11:00 departure ($1650) first, then the 09:25 departure ($2242) second —
  // the trip plan should still show the earlier departure first.
  await confirmByPrice(page, '$1650')
  await confirmByPrice(page, '$2242')

  const entries = page.getByTestId('trip-plan-entry')
  await expect(entries).toHaveCount(2)
  await expect(entries.nth(0).getByTestId('trip-plan-detail')).toContainText('Departs 09:25')
  await expect(entries.nth(1).getByTestId('trip-plan-detail')).toContainText('Departs 11:00')
})
