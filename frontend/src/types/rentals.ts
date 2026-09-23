// Rentals are custom-entry only there's no SearchRentalOption

export type CustomRentalOption = {
  source: 'custom'
  description: string
  pickup_location: string
  dropoff_location?: string
  pickup_at: string // ISO-8601 UTC-offset datetime, e.g. '2026-09-10T10:00:00+00:00'
  dropoff_at: string
  price: number
  cost_unit: string
  notes?: string
  booking_token: string
}

export type RentalCandidate = CustomRentalOption & {
  savedAt: string
  savedRentalId: number
}

export type CustomRentalInput = {
  description: string
  pickupLocation: string
  dropoffLocation?: string
  pickupAt: string // datetime-local value, 'YYYY-MM-DDTHH:mm'
  dropoffAt: string
  price?: number
  costUnit?: string
  notes?: string
}
