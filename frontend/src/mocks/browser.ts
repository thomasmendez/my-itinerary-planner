import { delay, http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import {
  calendarHandlers,
  chatHandlers,
  eventsHandlers,
  flightsHandlers,
  hotelsHandlers,
  mapHandlers,
  savedEventsHandlers,
  savedFlightsHandlers,
  savedHotelsHandlers,
  savedRentalsHandlers,
  tripsHandlers,
} from './handlers'

// VITE_MOCK_TRIPS=false lets /api/trips(/*) fall through to vite's dev proxy (see
// vite.config.ts), which forwards it to a real backend — for testing persistence without
// a SERPAPI_KEY. Saved flights/hotels and their calendar entries are trip-scoped persistence
// too, so they travel with trips. Flight/hotel search stay mocked here regardless; use
// VITE_MOCKING=false (which disables MSW entirely) to hit the real backend's /api/search/*
// instead.
const mockTrips = import.meta.env.VITE_MOCK_TRIPS !== 'false'
export const activeHandlers = mockTrips
  ? [
      ...tripsHandlers,
      ...savedFlightsHandlers,
      ...savedHotelsHandlers,
      ...savedRentalsHandlers,
      ...savedEventsHandlers,
      ...calendarHandlers,
      ...flightsHandlers,
      ...hotelsHandlers,
      ...eventsHandlers,
      ...mapHandlers,
      ...chatHandlers,
    ]
  : [...flightsHandlers, ...hotelsHandlers, ...eventsHandlers, ...chatHandlers]

export const worker = setupWorker(...activeHandlers)

export type MockOverride = {
  method: 'get' | 'post'
  path: string
  status: number
  body: string
  once?: boolean
  // Simulates real network latency, for tests asserting on UI state *before* a response
  // resolves (e.g. an optimistic update) rather than just the eventual settled state.
  delayMs?: number
}

declare global {
  interface Window {
    __mswTestOverrides?: MockOverride[]
  }
}

// Playwright injects window.__mswTestOverrides via addInitScript before this module runs,
// letting a single e2e test force one endpoint to fail. page.route() can't do this: MSW's
// service worker claims requests before Playwright's own network layer ever sees them.
// `once: true` reverts to the real handler after the first match, for tests that only need
// one call overridden (e.g. an initial empty-state fetch) without breaking client-side
// navigation's later calls to the same endpoint.
for (const { method, path, status, body, once, delayMs } of window.__mswTestOverrides ?? []) {
  worker.use(
    http[method](
      path,
      async () => {
        if (delayMs) await delay(delayMs)
        return HttpResponse.text(body, { status })
      },
      { once },
    ),
  )
}
