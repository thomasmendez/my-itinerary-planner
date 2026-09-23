import type { ItemStatus } from '../types/common'
import type { CalendarSourceType } from './calendar'
import { parseOrThrow } from './client'

export type MapPoint = {
  source_type: CalendarSourceType
  source_id: number
  status: ItemStatus
  label: string
  location: string
  latitude: number | null
  longitude: number | null
}

export type RoutePoint = { latitude: number; longitude: number }

// ORS's GeoJSON directions response, passed through by the backend unmodified.
export type Route = {
  features: Array<{
    geometry: { coordinates: [number, number][] }
    properties: { summary: { distance: number; duration: number } }
  }>
}

export async function fetchMapPoints(tripId: number): Promise<MapPoint[]> {
  const res = await fetch(`/api/trips/${tripId}/map/points`)
  return parseOrThrow(res, 'Fetch map points')
}

export async function fetchMapRoute(tripId: number, points: RoutePoint[]): Promise<Route> {
  const res = await fetch(`/api/trips/${tripId}/map/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
  })
  return parseOrThrow(res, 'Fetch map route')
}
