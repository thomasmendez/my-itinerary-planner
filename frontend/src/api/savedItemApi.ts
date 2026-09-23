import { parseOrThrow } from './client'

// Generic fetch/save/confirm/delete for the saved_{flights,hotels,rentals,events} endpoints,
// which all share the same trip-scoped CRUD shape
export function makeSavedItemApi<T, TCreate>(segment: string, noun: string) {
  const base = (tripId: number) => `/api/trips/${tripId}/${segment}`

  return {
    async list(tripId: number): Promise<T[]> {
      const res = await fetch(base(tripId))
      return parseOrThrow(res, `Fetch saved ${segment}`)
    },

    async save(tripId: number, payload: TCreate): Promise<T> {
      const res = await fetch(base(tripId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return parseOrThrow(res, `Save ${noun}`)
    },

    async confirm(tripId: number, itemId: number): Promise<T> {
      const res = await fetch(`${base(tripId)}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })
      return parseOrThrow(res, `Confirm ${noun}`)
    },

    // payload is the full TCreate shape (source included but ignored server-side -
    // FastAPI/pydantic drop unknown fields on a PATCH body by default).
    async update(tripId: number, itemId: number, payload: TCreate): Promise<T> {
      const res = await fetch(`${base(tripId)}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return parseOrThrow(res, `Edit ${noun}`)
    },

    async remove(tripId: number, itemId: number): Promise<void> {
      const res = await fetch(`${base(tripId)}/${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Remove ${noun} failed: ${res.status}`)
    },
  }
}
