import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../lib/api"
import type { TrafficPlanSummary } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

export function TrafficPlanHistoryPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<TrafficPlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.trafficPlanList(200)
        if (mounted) {
          setPlans(data)
          setPage(1)
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load plans")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = plans.filter((plan) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      plan.planId.toLowerCase().includes(query) ||
      plan.recommendedTrailerType.toLowerCase().includes(query) ||
      plan.mode.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section className="panel traffic-history">
      <div className="traffic-header">
        <div>
          <h2>Load Previous Plan</h2>
          <p>Review and reopen prior trailer placement runs.</p>
        </div>
      </div>

      {error && <div className="traffic-error">{error}</div>}

      <div className="traffic-panel">
        <div className="traffic-history-controls">
          <Input
            placeholder="Search by Plan Id / Trailer / Mode"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <div className="traffic-drawer-pagination">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="traffic-empty">Loading plans...</div>
        ) : filtered.length === 0 ? (
          <div className="traffic-empty">No saved plans yet.</div>
        ) : (
          <div className="traffic-table traffic-history-table">
            <div className="traffic-row traffic-head">
              <span>Created</span>
              <span>Recommended Trailer</span>
              <span>Total Trailers</span>
              <span>Mode</span>
              <span>Action</span>
            </div>
            {paged.map((plan) => (
              <div className="traffic-row" key={plan.planId}>
                <span>{new Date(plan.createdAt).toLocaleString()}</span>
                <span>{plan.recommendedTrailerType || "-"}</span>
                <span>{plan.totalTrailers}</span>
                <span>{plan.mode}</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/traffic/vehicle-placement?planId=${plan.planId}`)}
                >
                  Load Plan
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
