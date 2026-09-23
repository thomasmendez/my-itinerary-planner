import type { ItemStatus } from '../types/common'
import type { CustomRentalOption } from '../types/rentals'
import { makeSavedItemApi } from './savedItemApi'

export type SavedRentalStatus = ItemStatus

export type SavedRental = {
  id: number
  trip_id: number
  status: SavedRentalStatus
  source: 'custom'
  description: string
  pickup_location: string
  pickup_at: string
  dropoff_at: string
  price: number | null
  raw_payload: CustomRentalOption
  created_at: string
  overlap_warning: string | null
}

export type SavedRentalCreate = {
  source: 'custom'
  description: string
  pickup_location: string
  pickup_at: string
  dropoff_at: string
  price: number
  raw_payload: CustomRentalOption
}

const rentalsApi = makeSavedItemApi<SavedRental, SavedRentalCreate>('rentals', 'rental')

export const fetchSavedRentals = rentalsApi.list
export const saveRental = rentalsApi.save
export const confirmSavedRental = rentalsApi.confirm
export const deleteSavedRental = rentalsApi.remove
export const updateSavedRental = rentalsApi.update
