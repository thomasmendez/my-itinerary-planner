import { describe, expect, it } from 'vitest'
import { formatFlightTime, parseSerpApiEventDate, toDate } from './time'

describe('toDate', () => {
  it('parses a bare date (hotel check_in_date/check_out_date) as local midnight, not UTC midnight', () => {
    const date = toDate('2026-08-29')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(7) // August
    expect(date.getDate()).toBe(29)
  })

  it('still parses a space-separated flight datetime as local time', () => {
    const date = toDate('2026-07-30 11:00')
    expect(date.getDate()).toBe(30)
    expect(date.getHours()).toBe(11)
  })
})

describe('formatFlightTime', () => {
  it('returns the raw 24h time as-is', () => {
    expect(formatFlightTime('2026-07-30 11:00', '24h')).toBe('11:00')
  })

  it('converts midnight to 12 AM', () => {
    expect(formatFlightTime('2026-07-30 00:00', '12h')).toBe('12:00 AM')
  })

  it('converts noon to 12 PM', () => {
    expect(formatFlightTime('2026-07-30 12:00', '12h')).toBe('12:00 PM')
  })

  it('converts an afternoon hour to 12h format', () => {
    expect(formatFlightTime('2026-07-30 15:45', '12h')).toBe('3:45 PM')
  })

  it('falls back to the raw string when there is no time component', () => {
    expect(formatFlightTime('not-a-time', '12h')).toBe('not-a-time')
  })
})

// SerpApi's events_results gives free-text "Oct 1" + optional "3:00 PM" with no year
// (google_events was deprecated in August 2026, so this now comes out of a plain
// engine=google search). There's no ISO date/time here to parse,
// only month/day (+ optional hour/minute) against a caller-supplied reference date.
describe('parseSerpApiEventDate', () => {
  it('parses a date + time against the reference year', () => {
    const reference = new Date('2026-08-31T00:00:00')
    expect(parseSerpApiEventDate('Oct 1', '3:00 PM', reference)).toEqual({
      starts_at: '2026-10-01 15:00',
      ends_at: null,
    })
  })

  it('parses a date with no time as a bare date, with no ends_at', () => {
    const reference = new Date('2026-08-31T00:00:00')
    expect(parseSerpApiEventDate('Oct 1', undefined, reference)).toEqual({
      starts_at: '2026-10-01',
      ends_at: null,
    })
  })

  it('keeps the reference year when the event date is still upcoming', () => {
    const reference = new Date('2026-08-31T00:00:00')
    expect(parseSerpApiEventDate('Dec 25', '9:00 AM', reference)).toEqual({
      starts_at: '2026-12-25 09:00',
      ends_at: null,
    })
  })

  it('rolls the year forward when the event date has already passed relative to the reference date', () => {
    const reference = new Date('2026-12-01T00:00:00')
    expect(parseSerpApiEventDate('Oct 1', '3:00 PM', reference)).toEqual({
      starts_at: '2027-10-01 15:00',
      ends_at: null,
    })
  })

  it('falls back to the raw date string when it cannot be parsed', () => {
    const reference = new Date('2026-08-31T00:00:00')
    expect(parseSerpApiEventDate('Ongoing', undefined, reference)).toEqual({
      starts_at: 'Ongoing',
      ends_at: null,
    })
  })
})
