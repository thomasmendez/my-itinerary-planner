import type { ItemStatus } from '../types/common'
import type { CustomLodgingOption, SearchHotelOption } from '../types/hotels'
import { makeSavedItemApi } from './savedItemApi'

export type SavedHotelStatus = ItemStatus

export type SavedHotel = {
  id: number
  trip_id: number
  status: SavedHotelStatus
  source: 'search' | 'custom'
  name: string
  address: string | null
  check_in_date: string
  check_out_date: string
  price_per_night: number
  rating: number | null
  distance_km: number | null
  latitude: number | null
  longitude: number | null
  raw_payload: SearchHotelOption | CustomLodgingOption
  created_at: string
  overlap_warning: string | null
}

export type SavedHotelCreate = {
  source: 'search' | 'custom'
  name: string
  address: string | null
  check_in_date: string
  check_out_date: string
  price_per_night: number
  rating?: number | null
  distance_km?: number | null
  latitude?: number | null
  longitude?: number | null
  raw_payload: SearchHotelOption | CustomLodgingOption
}

const hotelsApi = makeSavedItemApi<SavedHotel, SavedHotelCreate>('hotels', 'hotel')

export const fetchSavedHotels = hotelsApi.list
export const saveHotel = hotelsApi.save
export const confirmSavedHotel = hotelsApi.confirm
export const deleteSavedHotel = hotelsApi.remove
export const updateSavedHotel = hotelsApi.update
