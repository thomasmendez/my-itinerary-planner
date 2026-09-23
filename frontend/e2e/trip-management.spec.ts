import { test, expect } from '@playwright/test'
import { mockOverrides } from './helpers'
import type { MockOverride } from '../src/mocks/browser'

test('trip list shows the seeded trip with its destination and date range', async ({ page }) => {
  await page.goto('/trips')

  const items = page.getByTestId('trip-list-item')
  await expect(items).toHaveCount(1)
  await expect(items.first()).toContainText('Paris 2026')
  await expect(items.first()).toContainText('CDG')
  await expect(items.first()).toContainText('2026-06-22 – 2026-06-29')
})

test('creating a trip from the trip list navigates into it and lists it', async ({ page }) => {
  await page.goto('/trips')
  await page.getByTestId('new-trip-button').click()
  await page.getByTestId('trip-form-name-input').fill('Tokyo 2027')
  await page.getByTestId('trip-form-start-date-input').fill('2027-03-01')
  await page.getByTestId('trip-form-end-date-input').fill('2027-03-10')
  await page.getByTestId('trip-form-submit-button').click()

  await expect(page).toHaveURL(/\/trips\/\d+$/)
  await expect(page.getByTestId('trip-header-title')).toHaveText('Tokyo 2027, March 1 - March 10')

  await page.getByTestId('my-trips-link').click()
  const items = page.getByTestId('trip-list-item')
  await expect(items).toHaveCount(2)
  await expect(items.filter({ hasText: 'Tokyo 2027' })).toHaveCount(1)
})

test('editing a trip inline in the trip list updates its summary', async ({ page }) => {
  await page.goto('/trips')
  const item = page.getByTestId('trip-list-item').first()
  await item.getByTestId('trip-list-edit-button').click()
  await item.getByTestId('trip-form-name-input').fill('Paris Anniversary Trip')
  await item.getByTestId('trip-form-submit-button').click()

  await expect(item).toContainText('Paris Anniversary Trip')
  await expect(item.getByTestId('trip-form')).toHaveCount(0)
})

test('canceling an inline edit leaves the trip unchanged', async ({ page }) => {
  await page.goto('/trips')
  const item = page.getByTestId('trip-list-item').first()
  await item.getByTestId('trip-list-edit-button').click()
  await item.getByTestId('trip-form-name-input').fill('Should Not Save')
  await item.getByTestId('trip-list-cancel-edit-button').click()

  await expect(item).toContainText('Paris 2026')
  await expect(item).not.toContainText('Should Not Save')
})

test('deleting a trip from the trip list removes it after confirmation', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/trips')

  await page.getByTestId('trip-list-item').first().getByTestId('trip-list-delete-button').click()

  await expect(page.getByTestId('trip-list-item')).toHaveCount(0)
  await expect(page.getByText('No trips yet — create one to get started.')).toBeVisible()
})

test('dismissing the delete confirmation keeps the trip', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.dismiss())
  await page.goto('/trips')

  await page.getByTestId('trip-list-item').first().getByTestId('trip-list-delete-button').click()

  await expect(page.getByTestId('trip-list-item')).toHaveCount(1)
})

test('editing the active trip from the header dialog updates the title', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('edit-trip-button').click()
  await page.getByTestId('edit-trip-dialog').getByTestId('trip-form-name-input').fill('Paris Renamed')
  await page.getByTestId('edit-trip-dialog').getByTestId('trip-form-submit-button').click()

  await expect(page.getByTestId('trip-header-title')).toContainText('Paris Renamed')
  await expect(page.getByTestId('edit-trip-dialog')).toBeHidden()
})

test('deleting the active trip from the header dialog returns to the trip list', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/')

  await page.getByTestId('edit-trip-button').click()
  await page.getByTestId('delete-trip-button').click()

  await expect(page).toHaveURL(/\/trips$/)
  await expect(page.getByTestId('trip-list-item')).toHaveCount(0)
})

test('a 502 fetching the trip list shows a connection error, not the empty-state create form', async ({ page }) => {
  const overrides: MockOverride[] = [
    { method: 'get', path: '/api/trips', status: 502, body: 'Bad Gateway', once: true },
    { method: 'get', path: '/api/trips', status: 502, body: 'Bad Gateway', once: true },
  ]
  await mockOverrides(page, overrides)
  await page.goto('/trips')

  await expect(page.getByTestId('trip-list-fetch-error')).toHaveText(
    "Can't reach the server. Make sure the backend is running to manage trips.",
  )
  await expect(page.getByTestId('new-trip-button')).toBeDisabled()
  await expect(page.getByText('No trips yet — create one to get started.')).toHaveCount(0)
})

test('with no trips, Home shows a create-first-trip form and creating one navigates into it', async ({ page }) => {
  // StrictMode double-invokes Home's mount effect in dev, firing loadTrips() twice before
  // any user interaction - two `once` overrides absorb both, so the real handler (now
  // including the trip this test creates) answers every call after that.
  const overrides: MockOverride[] = [
    { method: 'get', path: '/api/trips', status: 200, body: '[]', once: true },
    { method: 'get', path: '/api/trips', status: 200, body: '[]', once: true },
  ]
  await mockOverrides(page, overrides)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Create your first trip' })).toBeVisible()
  await page.getByTestId('trip-form-name-input').fill('First Trip')
  await page.getByTestId('trip-form-submit-button').click()

  await expect(page).toHaveURL(/\/trips\/\d+$/)
  await expect(page.getByTestId('trip-header-title')).toContainText('First Trip')
})
