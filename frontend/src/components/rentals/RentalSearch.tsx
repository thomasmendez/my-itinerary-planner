import { useState } from 'react'
import { RentalCustomVehicleForm } from './RentalCustomVehicleForm'

export function RentalSearch() {
  const [showCustomForm, setShowCustomForm] = useState(false)

  return (
    <div className="space-y-4">
      <p data-testid="rental-search-blurb" className="text-sm text-faint">
        Rental search isn't available yet — no viable provider was found.
        Add a custom vehicle entry to track a rental booked
        elsewhere.
      </p>
      <button
        data-testid="rental-add-custom-button"
        type="button"
        onClick={() => setShowCustomForm((show) => !show)}
        className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink-soft"
      >
        + Add custom vehicle
      </button>
      {showCustomForm && <RentalCustomVehicleForm onSaved={() => setShowCustomForm(false)} />}
    </div>
  )
}
