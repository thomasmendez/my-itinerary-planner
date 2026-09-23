import { test, expect, type Page } from '@playwright/test'
import { openCustomForm } from './helpers'

async function openEventsTab(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Events', exact: true }).click()
}

async function searchAustinEvents(page: Page) {
  await openEventsTab(page)
  await page.getByTestId('event-name-input').fill('Networking')
  await page.getByTestId('event-city-input').fill('Austin')
  await page.getByTestId('event-state-select').selectOption('Texas')
  await page.getByTestId('event-date-start-input').fill('2026-10-01')
  await page.getByTestId('event-date-end-input').fill('2026-10-01')
  await page.getByTestId('event-search-submit').click()
  await expect(page.getByTestId('event-result-card')).toHaveCount(10)
}

async function fillCustomEvent(
  page: Page,
  fields: {
    name: string
    location?: string
    date: string
    startTime: string
    endTime?: string
    attendees?: string
    cost?: string
    costUnit?: string
  },
) {
  await page.getByTestId('event-custom-name-input').fill(fields.name)
  if (fields.location) await page.getByTestId('event-custom-location-input').fill(fields.location)
  await page.getByTestId('event-custom-date-input').fill(fields.date)
  await page.getByTestId('event-custom-start-time-input').fill(fields.startTime)
  if (fields.endTime) await page.getByTestId('event-custom-end-time-input').fill(fields.endTime)
  if (fields.attendees) await page.getByTestId('event-custom-attendees-input').fill(fields.attendees)
  if (fields.cost !== undefined) await page.getByTestId('event-custom-cost-input').fill(fields.cost)
  if (fields.costUnit !== undefined) await page.getByTestId('event-custom-cost-unit-input').fill(fields.costUnit)
}

test('searching Austin for Oct 1 returns 10 events with title/type/date/venue', async ({ page }) => {
  await searchAustinEvents(page)

  await expect(page.getByTestId('event-results-count')).toHaveText('10 results')

  const first = page.getByTestId('event-result-card').first()
  await expect(first.getByTestId('event-result-title')).toHaveText('More Than Networking: Austin Business Mastermind')
  await expect(first.getByTestId('event-result-type')).toHaveText('Business networking')
  await expect(first.getByTestId('event-result-date')).toContainText('Oct 1')
  await expect(first.getByTestId('event-result-venue')).toContainText("Mama Betty's Tex-Mex - Burnet Rd")
})

test('a non-matching search shows no results', async ({ page }) => {
  await openEventsTab(page)
  await page.getByTestId('event-city-input').fill('Denver')
  await page.getByTestId('event-state-select').selectOption('Colorado')
  await page.getByTestId('event-date-start-input').fill('2026-10-01')
  await page.getByTestId('event-date-end-input').fill('2026-10-01')
  await page.getByTestId('event-search-submit').click()

  await expect(page.getByText('No results.')).toBeVisible()
  await expect(page.getByTestId('event-result-card')).toHaveCount(0)
})

test('comparing a search result moves it to Comparing as a candidate, not confirmed', async ({ page }) => {
  await searchAustinEvents(page)

  const cards = page.getByTestId('event-result-card')
  const title = await cards.first().getByTestId('event-result-title').textContent()
  await cards.first().getByTestId('event-result-compare-button').click()

  await expect(cards).toHaveCount(9)
  await expect(page.getByTestId('subtab-events-comparing')).toContainText('1')

  await page.getByTestId('subtab-events-comparing').click()
  const candidate = page.getByTestId('event-candidate-card')
  await expect(candidate).toHaveCount(1)
  await expect(candidate.getByTestId('event-candidate-name')).toHaveText(title ?? '')
  await expect(candidate.getByTestId('event-candidate-datetime')).toHaveText('Oct 1 · 3:00 PM')
})

test('removing a search-sourced candidate returns it to the search results list', async ({ page }) => {
  await searchAustinEvents(page)

  const cards = page.getByTestId('event-result-card')
  const removedTitle = await cards.first().getByTestId('event-result-title').textContent()
  await cards.first().getByTestId('event-result-compare-button').click()
  await expect(cards).toHaveCount(9)

  await page.getByTestId('subtab-events-comparing').click()
  await page.getByTestId('event-candidate-card').first().getByTestId('event-candidate-remove-button').click()

  await page.getByTestId('subtab-events-search').click()
  await expect(cards).toHaveCount(10)
  const titles = await cards.getByTestId('event-result-title').allTextContents()
  expect(titles).toContain(removedTitle)
})

test('the custom event form is hidden until "+ Add custom event" is clicked', async ({ page }) => {
  await openEventsTab(page)

  await expect(page.getByTestId('event-custom-form')).not.toBeVisible()
  await page.getByTestId('event-add-custom-button').click()
  await expect(page.getByTestId('event-custom-form')).toBeVisible()
})

test('the cost unit defaults to "/ event" and $0 is a valid cost', async ({ page }) => {
  await openCustomForm(page, 'event')

  await expect(page.getByTestId('event-custom-cost-unit-input')).toHaveValue('/ event')

  await fillCustomEvent(page, {
    name: 'Free Community Picnic',
    date: '2026-10-01',
    startTime: '12:00',
    cost: '0',
  })
  await page.getByTestId('event-custom-save-button').click()

  await page.getByTestId('subtab-events-comparing').click()
  const candidate = page.getByTestId('event-candidate-card')
  await expect(candidate).toHaveCount(1)
  await expect(candidate.getByTestId('event-candidate-price')).toContainText('$0')
  await expect(candidate.getByTestId('event-candidate-price')).toContainText('/ event')
})

test('"Save as candidate" leaves the custom event in Comparing, unconfirmed', async ({ page }) => {
  await openCustomForm(page, 'event')

  await fillCustomEvent(page, {
    name: 'Team Dinner',
    location: 'Uchi Austin',
    date: '2026-10-01',
    startTime: '19:00',
    endTime: '21:00',
    attendees: '4',
    cost: '85',
  })
  await page.getByTestId('event-custom-save-button').click()

  await expect(page.getByTestId('subtab-events-comparing')).toContainText('1')
  await page.getByTestId('subtab-events-comparing').click()

  const candidate = page.getByTestId('event-candidate-card')
  await expect(candidate).toHaveCount(1)
  await expect(candidate.getByTestId('event-candidate-name')).toHaveText('Team Dinner')
  await expect(candidate.getByTestId('event-candidate-location')).toHaveText('Uchi Austin')
  await expect(candidate.getByTestId('event-candidate-datetime')).toHaveText('Oct 1 · 7:00 PM')
  await expect(page.getByTestId('trip-spend-pending')).not.toHaveText('$0')
})

test('"Add to plan" saves and immediately confirms the custom event, skipping the candidate stage', async ({ page }) => {
  await openCustomForm(page, 'event')

  await fillCustomEvent(page, {
    name: 'Team Dinner',
    location: 'Uchi Austin',
    date: '2026-10-01',
    startTime: '19:00',
    endTime: '21:00',
    cost: '85',
  })
  await page.getByTestId('event-custom-add-to-plan-button').click()

  await expect(page.getByTestId('subtab-events-comparing')).toContainText('0')

  // Events show on the Timeline tab, not the Trip Plan sidebar (critical dates only).
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const entry = page.getByTestId('timeline-entry').filter({ hasText: 'Team Dinner' })
  await expect(entry).toHaveCount(1)
  await expect(entry.getByTestId('timeline-status')).toHaveText('Confirmed')

  await expect(page.getByTestId('trip-spend-events')).toHaveText('$85')
  await expect(page.getByTestId('trip-spend-confirmed')).toContainText('$85')
})

test('confirming a candidate from Comparing moves it into Trip Spend and the Timeline', async ({ page }) => {
  await openCustomForm(page, 'event')

  await fillCustomEvent(page, {
    name: 'Team Dinner',
    location: 'Uchi Austin',
    date: '2026-10-01',
    startTime: '19:00',
    cost: '85',
  })
  await page.getByTestId('event-custom-save-button').click()

  await page.getByTestId('subtab-events-comparing').click()
  await page.getByTestId('event-candidate-card').getByTestId('event-candidate-confirm-button').click()

  await expect(page.getByTestId('event-candidate-card')).toHaveCount(0)
  await expect(page.getByTestId('subtab-events-comparing')).toContainText('0')

  await expect(page.getByTestId('trip-spend-events')).toHaveText('$85')
  await expect(page.getByTestId('trip-spend-confirmed')).toContainText('$85')

  // Events show on the Timeline tab, not the Trip Plan sidebar (critical dates only).
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const entry = page.getByTestId('timeline-entry').filter({ hasText: 'Team Dinner' })
  await expect(entry).toHaveCount(1)
  await expect(entry.getByTestId('timeline-status')).toHaveText('Confirmed')
})

test('removing a custom event candidate clears it without creating a phantom search result', async ({ page }) => {
  await searchAustinEvents(page)

  await page.getByTestId('event-add-custom-button').click()
  await fillCustomEvent(page, {
    name: 'Team Dinner',
    date: '2026-10-01',
    startTime: '19:00',
    cost: '0',
  })
  await page.getByTestId('event-custom-save-button').click()

  await page.getByTestId('subtab-events-comparing').click()
  await page.getByTestId('event-candidate-card').getByTestId('event-candidate-remove-button').click()

  await expect(page.getByTestId('event-candidate-card')).toHaveCount(0)
  await expect(page.getByTestId('subtab-events-comparing')).toContainText('0')

  await page.getByTestId('subtab-events-search').click()
  await expect(page.getByTestId('event-result-card')).toHaveCount(10)
})

test('event search works with just a city and state', async ({ page }) => {
  await openEventsTab(page)
  await page.getByTestId('event-name-input').fill('')
  await page.getByTestId('event-city-input').fill('Austin')
  await page.getByTestId('event-state-select').selectOption('Texas')
  await page.getByTestId('event-search-submit').click()
  await expect(page.getByTestId('event-result-card')).toHaveCount(10)
})
