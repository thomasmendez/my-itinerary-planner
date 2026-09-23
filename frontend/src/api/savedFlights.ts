import type { ItemStatus } from '../types/common'
import type { CustomTransportOption, SearchFlightOption } from '../types/flights'
import { makeSavedItemApi } from './savedItemApi'

export type SavedFlightStatus = ItemStatus

export type SavedFlight = {
  id: number
  trip_id: number
  status: SavedFlightStatus
  source: 'search' | 'custom'
  origin: string
  destination: string
  outbound_departs_at: string
  outbound_arrives_at: string
  return_departs_at: string | null
  return_arrives_at: string | null
  airline: string
  price: number
  duration_minutes: number
  stops: number
  raw_payload: SearchFlightOption | CustomTransportOption
  created_at: string
  overlap_warning: string | null
}

export type SavedFlightCreate = {
  source: 'search' | 'custom'
  origin: string
  destination: string
  outbound_departs_at: string
  outbound_arrives_at: string
  return_departs_at?: string | null
  return_arrives_at?: string | null
  airline: string
  price: number
  duration_minutes: number
  stops: number
  raw_payload: SearchFlightOption | CustomTransportOption
}

const flightsApi = makeSavedItemApi<SavedFlight, SavedFlightCreate>('flights', 'flight')

export const fetchSavedFlights = flightsApi.list
export const saveFlight = flightsApi.save
export const confirmSavedFlight = flightsApi.confirm
export const deleteSavedFlight = flightsApi.remove
export const updateSavedFlight = flightsApi.update
