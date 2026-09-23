import { test, expect } from '@playwright/test'
import { mockOverrides } from './helpers'
import type { MockOverride } from '../src/mocks/browser'

test('header renders the active trip pulled from the backend', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('trip-header-title')).toHaveText('Paris 2026, June 22 - June 29')
})

test('a failed trip fetch on the landing page shows the error and logs it to the console', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // MSW's service worker claims requests before Playwright's page.route() ever sees
  // them, so the override is injected before the app's first script runs instead —
  // see the window.__mswTestOverrides handling in src/mocks/browser.ts.
  const overrides: MockOverride[] = [
    { method: 'get', path: '/api/trips', status: 500, body: 'Internal Server Error' },
  ]
  await mockOverrides(page, overrides)
  await page.goto('/')

  // "/" is the Home landing page (see pages/Home.tsx) - it redirects into the active
  // trip or a create form once trips load, so on a fetch failure it shows a bare error
  // message rather than the trip Header (which only renders on a /trips/:id route).
  await expect(page.getByTestId('home-fetch-error')).toHaveText('Fetch trips failed: 500')
  await expect(page.getByTestId('home-fetch-error')).toHaveClass(/text-red-400/)
  await expect.poll(() => consoleErrors.length).toBeGreaterThan(0)
})

test('a 502 on the landing page shows a connection error instead of the raw gateway status', async ({ page }) => {
  // 502/503/504 mean the backend itself is unreachable (e.g. just started the frontend
  // alone) rather than an application error
  const overrides: MockOverride[] = [
    { method: 'get', path: '/api/trips', status: 502, body: 'Bad Gateway' },
  ]
  await mockOverrides(page, overrides)
  await page.goto('/')

  await expect(page.getByTestId('home-fetch-error')).toHaveText(
    "Can't reach the server. Make sure the backend is running to manage trips.",
  )
})
