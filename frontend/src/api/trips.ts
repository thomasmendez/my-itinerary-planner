import { parseOrThrow } from './client'

export type Trip = {
  id: number
  name: string
  destinations: string[]
  start_date: string | null
  end_date: string | null
  travelers: string[]
  created_at: string
  updated_at: string
}

export type TripInput = {
  name: string
  destinations: string[]
  start_date: string | null
  end_date: string | null
  travelers: string[]
}

export const CONNECTION_ERROR_MESSAGE = "Can't reach the server. Make sure the backend is running to manage trips."

export async function fetchTrips(): Promise<Trip[]> {
  let res: Response
  try {
    res = await fetch('/api/trips')
  } catch {
    // fetch() rejects outright when nothing is listening (backend/container not up) -
    // no HTTP response to read a status from.
    throw new Error(CONNECTION_ERROR_MESSAGE)
  }
  // 502/503/504 mean the proxy in front of the app can't reach the backend, not an
  // application error - worth a clearer message than the raw gateway status.
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new Error(CONNECTION_ERROR_MESSAGE)
  }
  return parseOrThrow(res, 'Fetch trips')
}

export async function createTrip(payload: TripInput): Promise<Trip> {
  const res = await fetch('/api/trips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseOrThrow(res, 'Create trip')
}

export async function updateTrip(id: number, payload: TripInput): Promise<Trip> {
  const res = await fetch(`/api/trips/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseOrThrow(res, 'Update trip')
}

export async function deleteTrip(id: number): Promise<void> {
  const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete trip failed: ${res.status}`)
}
