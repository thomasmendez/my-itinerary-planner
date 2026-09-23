import { test, expect } from '@playwright/test'
import { mockOverrides } from './helpers'
import type { MockOverride } from '../src/mocks/browser'

test('chat widget opens, sends a message, and shows the assistant reply', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('chat-messages')).toHaveCount(0)
  await page.getByTestId('chat-open-button').click()

  await page.getByTestId('chat-input').fill('What flights do I have saved?')
  await page.getByTestId('chat-send-button').click()

  await expect(page.getByTestId('chat-messages')).toContainText('What flights do I have saved?')
  await expect(page.getByTestId('chat-messages')).toContainText('Mock reply: this is a stubbed assistant response.')

  await page.getByTestId('chat-close-button').click()
  await expect(page.getByTestId('chat-messages')).toHaveCount(0)
})

test('chat history survives a page refresh and can be cleared', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('chat-open-button').click()
  await page.getByTestId('chat-input').fill('What flights do I have saved?')
  await page.getByTestId('chat-send-button').click()
  await expect(page.getByTestId('chat-messages')).toContainText('What flights do I have saved?')

  await page.reload()
  await page.getByTestId('chat-open-button').click()
  await expect(page.getByTestId('chat-messages')).toContainText('What flights do I have saved?')

  await page.getByTestId('chat-clear-button').click()
  await expect(page.getByTestId('chat-messages')).not.toContainText('What flights do I have saved?')

  await page.reload()
  await page.getByTestId('chat-open-button').click()
  await expect(page.getByTestId('chat-messages')).not.toContainText('What flights do I have saved?')
})

test('a chat API failure shows an error message and keeps the user message that was sent', async ({ page }) => {
  const overrides: MockOverride[] = [{ method: 'post', path: '/api/chat', status: 500, body: 'Internal Server Error' }]
  await mockOverrides(page, overrides)
  await page.goto('/')

  await page.getByTestId('chat-open-button').click()
  await page.getByTestId('chat-input').fill('What flights do I have saved?')
  await page.getByTestId('chat-send-button').click()

  await expect(page.getByTestId('chat-messages')).toContainText('What flights do I have saved?')
  await expect(page.getByTestId('chat-error')).toHaveText('Chat failed: 500')
  await expect(page.getByText('Thinking…')).toHaveCount(0)
})
