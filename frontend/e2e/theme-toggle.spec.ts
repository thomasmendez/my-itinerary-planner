import { test, expect } from '@playwright/test'

test('theme toggle switches to dark mode and persists across reload', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark')

  await page.getByTestId('theme-toggle-button').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByTestId('theme-toggle-button').click()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark')
})
