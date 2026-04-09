import { useEffect, useRef, useState } from "react"
import { Button } from "../components/ui/button"
import { api } from "../lib/api"
import type { Vehicle, VehicleTrackingData } from "../types"

const POLL_INTERVAL_MS = 5000

type LeafletMap = {
  remove: () => void
  fitBounds: (bounds: unknown, options?: unknown) => void
}

declare global {
  interface Window {
    L?: {
      map: (el: HTMLElement) => LeafletMap
      tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => void }
      polyline: (points: Array<[number, number]>, options?: Record<string, unknown>) => {
        addTo: (map: LeafletMap) => unknown
        getBounds: () => unknown
      }
      marker: (point: [number, number], options?: Record<string, unknown>) => {
        addTo: (map: LeafletMap) => { bindPopup: (html: string) => void }
      }
      divIcon: (options: Record<string, unknown>) => unknown
    }
  }
}

export function TrafficVehicleTrackingPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleNo, setSelectedVehicleNo] = useState("")
  const [tracking, setTracking] = useState<VehicleTrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveMode, setLiveMode] = useState(true)
  const mapRef = useRef<LeafletMap | null>(null)
  const mapHostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadVehicles() {
      try {
        const rows = await api.vehicles()
        if (!mounted) return
        setVehicles(rows)
        if (rows.length > 0) {
          setSelectedVehicleNo((current) => current || rows[0].vehicleNumber)
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load vehicles")
      }
    }
    loadVehicles()
    return () => {
      mounted = false
    }
  }, [])

  async function refreshTracking() {
    if (!selectedVehicleNo) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.vehicleTracking(selectedVehicleNo)
      setTracking(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch vehicle tracking")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedVehicleNo) return
    refreshTracking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleNo])

  useEffect(() => {
    if (!liveMode || !selectedVehicleNo) return
    const timer = window.setInterval(() => {
      refreshTracking()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode, selectedVehicleNo])

  useEffect(() => {
    const L = window.L
    const host = mapHostRef.current
    if (!L || !host || !tracking || tracking.route.length === 0) return

    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = L.map(host)
    mapRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    const routePoints = tracking.route.map((point) => [point.latitude, point.longitude] as [number, number])
    const routeLine = L.polyline(routePoints, { color: "#0ea5e9", weight: 5, opacity: 0.9 })
    routeLine.addTo(map)

    const origin = tracking.route[0]
    const destination = tracking.route[tracking.route.length - 1]
    L.marker([origin.latitude, origin.longitude]).addTo(map).bindPopup(`Origin: ${tracking.fromLocation}`)
    L.marker([destination.latitude, destination.longitude]).addTo(map).bindPopup(`Destination: ${tracking.toLocation}`)

    const truckIcon = L.divIcon({
      html: '<div style="font-size:20px;line-height:20px;">🚚</div>',
      className: "tracking-truck-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    L.marker(
      [tracking.currentPosition.latitude, tracking.currentPosition.longitude],
      { icon: truckIcon }
    ).addTo(map).bindPopup(
      tracking.isGpsAvailable
        ? `Live GPS: ${tracking.currentPosition.latitude.toFixed(5)}, ${tracking.currentPosition.longitude.toFixed(5)}`
        : "GPS not available. Showing estimated location on route."
    )

    map.fitBounds(routeLine.getBounds(), { padding: [24, 24] })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [tracking])

  return (
    <section className="panel vehicle-tracking-page">
      <div className="vehicle-tracking-header">
        <div>
          <h2>Vehicle Tracking</h2>
          <p>Actual route map from latest lorry hire (From/To) with live GPS device position.</p>
        </div>
        <div className="vehicle-tracking-actions">
          <select
            value={selectedVehicleNo}
            onChange={(e) => setSelectedVehicleNo(e.target.value)}
            className="vehicle-track-select"
          >
            {vehicles.length === 0 && <option value="">No vehicles found</option>}
            {vehicles.map((v) => (
              <option key={v.id} value={v.vehicleNumber}>
                {v.vehicleNumber}
              </option>
            ))}
          </select>
          <label className="traffic-toggle">
            <input
              type="checkbox"
              checked={liveMode}
              onChange={(e) => setLiveMode(e.target.checked)}
            />
            Live Mode (5s)
          </label>
          <Button type="button" onClick={refreshTracking} disabled={loading || !selectedVehicleNo}>
            {loading ? "Refreshing..." : "Refresh GPS"}
          </Button>
        </div>
      </div>

      {error && <div className="traffic-error">{error}</div>}

      {!tracking ? (
        <div className="traffic-empty">Select a vehicle to start tracking.</div>
      ) : (
        <div className="vehicle-tracking-grid">
          <div className="vehicle-tracking-map">
            <div ref={mapHostRef} className="tracking-map-leaflet-host" />
          </div>
          <div className="vehicle-tracking-info">
            <h3>Tracking Details</h3>
            <div className="vehicle-kpi-grid">
              <Kpi label="Vehicle" value={tracking.vehicleNumber} />
              <Kpi label="Lorry Hire No" value={tracking.challanNo} />
              <Kpi label="Status" value={tracking.status} />
              <Kpi label="Speed" value={`${tracking.speedKmph} km/h`} />
              <Kpi label="GPS Provider" value={tracking.gpsProvider} />
              <Kpi label="Device ID" value={tracking.deviceId} />
              <Kpi label="Last Ping" value={new Date(tracking.lastPingAtUtc).toLocaleString()} />
            </div>
            <div className="vehicle-route-summary">
              <strong>Route</strong>
              <p>
                {tracking.fromLocation} to {tracking.toLocation}
              </p>
              <small>{tracking.routeMessage}</small>
            </div>
            {!tracking.isGpsAvailable ? (
              <div className="traffic-error" style={{ marginTop: 10 }}>
                {tracking.gpsMessage}
              </div>
            ) : (
              <div className="vehicle-route-summary" style={{ marginTop: 10 }}>
                <strong>GPS</strong>
                <p>{tracking.gpsMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="vehicle-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
