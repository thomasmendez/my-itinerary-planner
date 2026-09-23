import type { ItemStatus } from '../types/common'
import type { CustomEventOption, SearchEventOption } from '../types/events'
import { makeSavedItemApi } from './savedItemApi'

export type SavedEventStatus = ItemStatus

export type SavedEvent = {
  id: number
  trip_id: number
  status: SavedEventStatus
  source: 'search' | 'custom'
  name: string
  location: string | null
  starts_at: string
  ends_at: string | null
  price: number | null
  raw_payload: SearchEventOption | CustomEventOption
  created_at: string
  overlap_warning: string | null
}

export type SavedEventCreate = {
  source: 'search' | 'custom'
  name: string
  location: string | null
  starts_at: string
  ends_at: string | null
  price: number | null
  raw_payload: SearchEventOption | CustomEventOption
}

const eventsApi = makeSavedItemApi<SavedEvent, SavedEventCreate>('events', 'event')

export const fetchSavedEvents = eventsApi.list
export const saveEvent = eventsApi.save
export const confirmSavedEvent = eventsApi.confirm
export const deleteSavedEvent = eventsApi.remove
export const updateSavedEvent = eventsApi.update
