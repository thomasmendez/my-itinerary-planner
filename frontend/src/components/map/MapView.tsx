import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loadMapPoints, loadRoute, clearRoute } from '../../store/mapSlice'
import type { MapPoint } from '../../api/map'
import { fetchHealth } from '../../api/health'
import { isMocking } from '../../lib/mocking'

// Leaflet's default marker icon needs its PNGs re-pathed under bundlers; a divIcon with
// embedded markup sidesteps that entirely and doubles as a Playwright hook (data-testid).
// `order` (1-based route position) renders as a numbered badge instead of a plain dot, so
// the map visibly echoes the same "check order = visiting order" the sidebar list shows.
const markerIcon = (status: MapPoint['status'], order?: number) => {
  const testid = status === 'confirmed' ? 'map-marker-confirmed' : 'map-marker-candidate'
  const color = status === 'confirmed' ? 'bg-blue-500' : 'bg-amber-400'
  if (order == null) {
    return L.divIcon({
      className: '',
      html: `<div data-testid="${testid}" class="size-4 rounded-full border-2 border-white shadow ${color}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
  }
  return L.divIcon({
    className: '',
    html: `<div data-testid="${testid}" class="flex size-5 items-center justify-center rounded-full border-2 border-white shadow ${color} text-[10px] font-bold text-white">${order}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// MapContainer's center/zoom only apply on mount - points load asynchronously after that,
// so the view has to be nudged to fit them once they arrive.
function FitToPoints({ locatable }: { locatable: MapPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (locatable.length === 0) return
    const positions = locatable.map((p) => [p.latitude as number, p.longitude as number] as [number, number])
    if (positions.length === 1) map.setView(positions[0], 6)
    else map.fitBounds(positions, { padding: [32, 32] })
  }, [locatable, map])
  return null
}

// matches the "Departure: " label prefix set in backend/app/map/service.py — no
// structured field distinguishes departure from arrival, so this is the cheapest correct check.
const isDeparture = (point: MapPoint) => point.source_type === 'saved_flight' && point.label.startsWith('Departure:')

export function MapView() {
  const dispatch = useAppDispatch()
  const points = useAppSelector((state) => state.map.points)
  const route = useAppSelector((state) => state.map.route)
  const error = useAppSelector((state) => state.map.error)
  const [selected, setSelected] = useState<number[]>([])
  const [hideDepartures, setHideDepartures] = useState(true)
  // Proactive, non-error notice: a trip with only well-known-airport flights never makes an
  // ORS call at all (IATA lookup is local), so `error` above would never fire even though the
  // key is genuinely unset. Checked once via /health rather than derived from map/points.
  const [orsConfigured, setOrsConfigured] = useState(true)

  useEffect(() => {
    dispatch(loadMapPoints())
    dispatch(clearRoute())
    fetchHealth()
      .then((health) => setOrsConfigured(health.ors_configured))
      .catch(() => {})
  }, [dispatch])

  function toggle(index: number) {
    setSelected((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  function getRoute() {
    const routePoints = selected
      .map((i) => points[i])
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({ latitude: p.latitude as number, longitude: p.longitude as number }))
    dispatch(loadRoute(routePoints))
  }

  const locatable = points
    .map((p, index) => ({ ...p, index }))
    .filter((p) => p.latitude != null && p.longitude != null)
    .filter((p) => !hideDepartures || !isDeparture(p))
  const center: [number, number] = locatable[0]
    ? [locatable[0].latitude as number, locatable[0].longitude as number]
    : [0, 0]
  const summary = route?.features[0]?.properties.summary
  const routeLine = route?.features[0]?.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number])

  return (
    <div className="flex flex-col gap-4">
      {isMocking && (
        <p
          data-testid="map-mocked-warning"
          className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-500"
        >
          This frontend is running with mocked data (VITE_MOCKING=true). Map points and routes
          shown here are fixtures — a real map requires the backend to be running and reachable,
          with ORS_API_KEY set.
        </p>
      )}
      {error && (
        <p data-testid="map-error" className="rounded-md border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-4">
        <div className="w-72 shrink-0">
          <div className="mb-3 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400" /> Candidate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" /> Confirmed
            </span>
          </div>

          <label className="mb-3 flex items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              data-testid="map-hide-departures-toggle"
              checked={hideDepartures}
              onChange={(e) => setHideDepartures(e.target.checked)}
            />
            Hide departure markers
          </label>

          {points.length === 0 ? (
            <p className="text-sm text-faint">No locations to show yet.</p>
          ) : (
            <div className="divide-y divide-line-soft">
              {points.map((point, index) => (
                <div key={index} data-testid="map-point-item" className="flex items-center gap-2 py-2">
                  {point.latitude != null && point.longitude != null ? (
                    <span className="relative inline-flex">
                      <input
                        type="checkbox"
                        data-testid="map-point-checkbox"
                        checked={selected.includes(index)}
                        onChange={() => toggle(index)}
                      />
                      {selected.includes(index) && (
                        <span
                          data-testid="map-point-order"
                          className="absolute -right-2 -top-2 flex size-3.5 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white"
                        >
                          {selected.indexOf(index) + 1}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span data-testid="map-point-no-location" title="No location provided" className="text-amber-500">
                      ⚠
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-ink">{point.label}</p>
                    <p data-testid="map-point-status" className="text-xs text-faint">
                      {point.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected.length > 0 && (
            <p data-testid="map-order-hint" className="mt-2 text-xs text-faint">
              Route visits points in the order checked — uncheck and recheck a point to move it to the end.
            </p>
          )}

          <button
            type="button"
            data-testid="map-get-route-button"
            disabled={selected.length < 2}
            onClick={getRoute}
            className="mt-4 w-full rounded-md border border-line-soft px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-40"
          >
            Get Route
          </button>

          {summary && (
            <p data-testid="map-route-summary" className="mt-3 text-sm text-ink">
              {(summary.distance / 1609.34).toFixed(1)} mi · {Math.round(summary.duration / 60)} min
            </p>
          )}
        </div>

        <div className="h-96 flex-1 overflow-hidden rounded-md border border-line-soft">
          <MapContainer center={center} zoom={locatable.length ? 6 : 2} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitToPoints locatable={locatable} />
            {locatable.map((point) => (
              <Marker
                key={`${point.source_type}-${point.source_id}-${point.location}`}
                position={[point.latitude as number, point.longitude as number]}
                icon={markerIcon(point.status, selected.includes(point.index) ? selected.indexOf(point.index) + 1 : undefined)}
              >
                <Tooltip>{point.label}</Tooltip>
              </Marker>
            ))}
            {routeLine && <Polyline positions={routeLine} />}
          </MapContainer>
        </div>
      </div>
      {!orsConfigured && (
        <p
          data-testid="map-ors-not-configured-warning"
          className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-500"
        >
          ORS_API_KEY is not set on the server, so locations can't be geocoded or routed. Set
          ORS_API_KEY in backend/.env to enable the map.
        </p>
      )}
    </div>
  )
}
