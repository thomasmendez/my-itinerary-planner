import { describe, expect, it, vi } from 'vitest'
import type { SavedEventCreate } from '../api/savedEvents'
import type { CustomEventOption, SearchEventOption } from '../types/events'
import { eventResultKey, toSavedEventCreate } from './eventCandidate'

// Fixtures are hand-built from real entries in mocks/data/events.ts's events_results
// (a plain engine=google response — google_events was deprecated by SerpApi in August
// 2026). SerpApi gives no per-event id/token (unlike hotels' property_token) and no
// price at all, and date/time are free text with no year.

const networkingEvent: SearchEventOption = {
  source: 'search',
  title: 'More Than Networking: Austin Business Mastermind',
  type: 'Business networking',
  date: 'Oct 1',
  time: '3:00 PM',
  address: ["Mama Betty's Tex-Mex - Burnet Rd", 'Austin, TX'],
  thumbnail: 'https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/g_pAxin31O8fxTmrfjIMKWysrDMfoq7CtGPGsOaf8vA.jpeg',
}

// ~30% of events_results entries carry no "time" field at all.
const summitEvent: SearchEventOption = {
  source: 'search',
  title: 'The Online Sales & Marketing Summit',
  type: 'Sales and marketing conference',
  date: 'Oct 1',
  address: ['AT&T Hotel and Conference Center', 'West University'],
  thumbnail: 'https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/xmsTUiuBrvHMvyYJ8ttLnr9BCsEb9Lr9tX-jLymZbhg.jpeg',
}

const customOption: CustomEventOption = {
  source: 'custom',
  name: 'Team Dinner',
  location: 'Uchi Austin',
  starts_at: '2026-10-01 19:00',
  ends_at: '2026-10-01 21:00',
  price: 85,
  cost_unit: '/ event',
  booking_token: 'custom-1',
}

describe('eventResultKey', () => {
  it('joins title, date, time, and address into a stable synthetic key', () => {
    expect(eventResultKey(networkingEvent)).toBe(
      "More Than Networking: Austin Business Mastermind|Oct 1|3:00 PM|Mama Betty's Tex-Mex - Burnet Rd,Austin, TX",
    )
  })

  it('leaves the time segment empty when the result has no time', () => {
    expect(eventResultKey(summitEvent)).toBe(
      'The Online Sales & Marketing Summit|Oct 1||AT&T Hotel and Conference Center,West University',
    )
  })
})

describe('toSavedEventCreate', () => {
  it('normalizes a search result: joins the address array into one location string, prices null', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-31T00:00:00'))

    const payload: SavedEventCreate = toSavedEventCreate(networkingEvent)
    expect(payload).toEqual({
      source: 'search',
      name: 'More Than Networking: Austin Business Mastermind',
      location: "Mama Betty's Tex-Mex - Burnet Rd, Austin, TX",
      starts_at: '2026-10-01 15:00',
      ends_at: null,
      price: null,
      raw_payload: networkingEvent,
    })

    vi.useRealTimers()
  })

  it('normalizes a search result with no time as a bare date, with no ends_at', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-31T00:00:00'))

    const payload = toSavedEventCreate(summitEvent)
    expect(payload.starts_at).toBe('2026-10-01')
    expect(payload.ends_at).toBeNull()
    expect(payload.price).toBeNull()

    vi.useRealTimers()
  })

  it('normalizes a custom event entry', () => {
    const payload: SavedEventCreate = toSavedEventCreate(customOption)
    expect(payload).toEqual({
      source: 'custom',
      name: 'Team Dinner',
      location: 'Uchi Austin',
      starts_at: '2026-10-01 19:00',
      ends_at: '2026-10-01 21:00',
      price: 85,
      raw_payload: customOption,
    })
  })

  it('defaults ends_at to null for a point-in-time custom event with no end time', () => {
    const pointInTime: CustomEventOption = { ...customOption, ends_at: undefined, booking_token: 'custom-2' }
    const payload = toSavedEventCreate(pointInTime)
    expect(payload.ends_at).toBeNull()
  })

  it('defaults price to null for a custom event with no cost entered', () => {
    const noCost: CustomEventOption = { ...customOption, price: undefined, booking_token: 'custom-3' }
    const payload = toSavedEventCreate(noCost)
    expect(payload.price).toBeNull()
  })
})
