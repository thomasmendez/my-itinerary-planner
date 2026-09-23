export type TimeFormat = '12h' | '24h'

// Backend datetimes come as either SerpApi-style "YYYY-MM-DD HH:mm" (space-separated,
// flight entries) or full ISO-8601 — replacing the first space covers both.
const BARE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function toDate(isoOrSpaced: string): Date {
  const withT = isoOrSpaced.replace(' ', 'T')
  // A bare "YYYY-MM-DD" (hotel check_in_date/check_out_date carry no time) parses as
  // UTC midnight per the JS Date spec, which rolls back to the previous local day west
  // of UTC. Force local-midnight parsing instead so it lands on the right calendar cell.
  return new Date(BARE_DATE_RE.test(withT) ? `${withT}T00:00:00` : withT)
}

export function formatShortDate(isoOrSpaced: string, opts?: { year?: boolean }): string {
  return toDate(isoOrSpaced).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(opts?.year ? { year: 'numeric' as const } : {}),
  })
}

// SerpApi times look like "2026-07-30 11:00" — always 24h.
export function formatFlightTime(time: string, format: TimeFormat): string {
  const raw = time.split(' ')[1] ?? time
  if (format === '24h') return raw

  const [hStr, mStr] = raw.split(':')
  const hour = Number(hStr)
  if (Number.isNaN(hour)) return raw
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${mStr} ${period}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// SerpApi's events_results gives free-text "Oct 1" + optional "3:00 PM" with no year
// (google_events was deprecated in August 2026, so this now comes out of a plain
// engine=google search). Rolls the year forward if the parsed
// month/day already passed relative to `reference`; falls back to the raw string
// unparsed.
export function parseSerpApiEventDate(
  date: string,
  time: string | undefined,
  reference: Date,
): { starts_at: string; ends_at: null } {
  const match = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(date.trim())
  const month = match ? MONTHS.indexOf(match[1]) : -1
  if (!match || month === -1) return { starts_at: date, ends_at: null }

  const day = Number(match[2])
  const referenceYear = reference.getFullYear()
  let year = referenceYear
  const candidate = new Date(year, month, day)
  if (candidate < new Date(referenceYear, reference.getMonth(), reference.getDate())) year += 1

  const pad = (n: number) => String(n).padStart(2, '0')
  const isoDate = `${year}-${pad(month + 1)}-${pad(day)}`

  const timeMatch = time ? /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim()) : null
  if (!timeMatch) return { starts_at: isoDate, ends_at: null }

  let hour = Number(timeMatch[1]) % 12
  if (timeMatch[3].toUpperCase() === 'PM') hour += 12
  return { starts_at: `${isoDate} ${pad(hour)}:${timeMatch[2]}`, ends_at: null }
}
