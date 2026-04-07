import { useEffect, useMemo, useRef, useState } from "react"
import { api } from "../lib/api"
import { Link, useSearchParams } from "react-router-dom"
import type {
  TrafficMaterial,
  TrafficPlanResponse,
  TrafficTrailerPlan,
  TrafficTrailerType,
} from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

const defaultMaterials: TrafficMaterial[] = [
  { id: "M1", length: 2, width: 1.5, height: 1, weight: 450, qty: 20, stackable: true, maxStack: 3 },
  { id: "M2", length: 3, width: 2, height: 1.2, weight: 700, qty: 10, stackable: false },
]

const defaultTrailers: TrafficTrailerType[] = [
  { type: "20FT", L: 6, W: 2.4, H: 2.4, maxWeight: 20000 },
  { type: "32FT", L: 9.7, W: 2.4, H: 2.4, maxWeight: 25000 },
  { type: "40FT", L: 12, W: 2.4, H: 2.6, maxWeight: 30000 },
]

export function TrafficVehiclePlacementPage() {
  const [materials, setMaterials] = useState<TrafficMaterial[]>(defaultMaterials)
  const [trailers, setTrailers] = useState<TrafficTrailerType[]>(defaultTrailers)
  const [allowRotation, setAllowRotation] = useState(true)
  const [allowStacking, setAllowStacking] = useState(true)
  const [result, setResult] = useState<TrafficPlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [planDrawerOpen, setPlanDrawerOpen] = useState(false)
  const [planSearch, setPlanSearch] = useState("")
  const [planPage, setPlanPage] = useState(1)
  const [plans, setPlans] = useState([] as { planId: string; recommendedTrailerType: string; totalTrailers: number; mode: string; createdAt: string }[])
  const pageSize = 8

  const [searchParams] = useSearchParams()

  useEffect(() => {
    const planId = searchParams.get("planId")
    if (!planId) return

    let mounted = true
    setLoading(true)
    setError(null)
    api
      .trafficPlanById(planId)
      .then((plan) => {
        if (mounted) setResult(normalizePlan(plan))
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load plan")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [searchParams])

    const filteredPlans = useMemo(() => {
    const query = planSearch.trim().toLowerCase()
    if (!query) return plans
    return plans.filter((plan) =>
      plan.planId.toLowerCase().includes(query) ||
      plan.recommendedTrailerType.toLowerCase().includes(query) ||
      plan.mode.toLowerCase().includes(query)
    )
  }, [plans, planSearch])

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize))
  const pagedPlans = filteredPlans.slice((planPage - 1) * pageSize, planPage * pageSize)

  const totalMaterialCount = useMemo(
    () => materials.reduce((sum, item) => sum + (Number.isFinite(item.qty) ? item.qty : 0), 0),
    [materials]
  )

  function exportCsv() {
    if (!result) return
    const rows: string[] = [
      "Trailer,Material,Quantity,StackCount,TotalWeight",
    ]
    result.trailers.forEach((trailer, idx) => {
      trailer.items.forEach((item) => {
        rows.push(
          `${idx + 1} ${trailer.trailerType},${item.materialId},${item.quantity},${item.stackCount},${trailer.totalWeight}`
        )
      })
    })
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `traffic-plan-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    if (!result) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<html><head><title>Traffic Plan</title><style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111827;}
      h1{margin-bottom:8px;}
      table{border-collapse:collapse;width:100%;margin-top:16px;}
      th,td{border:1px solid #e5e7eb;padding:8px;text-align:left;}
      th{background:#f3f4f6;}
    </style></head><body>`)
    win.document.write(`<h1>Traffic Plan</h1>`)
    win.document.write(`<p>Recommended Trailer: ${result.recommendedTrailerType}</p>`)
    win.document.write(`<p>Total Trailers: ${result.totalTrailers}</p>`)
    win.document.write(`<table><thead><tr><th>Trailer</th><th>Material</th><th>Qty</th><th>Stack</th><th>Total Weight</th></tr></thead><tbody>`)
    result.trailers.forEach((trailer, idx) => {
      trailer.items.forEach((item) => {
        win.document.write(`<tr><td>${idx + 1} ${trailer.trailerType}</td><td>${item.materialId}</td><td>${item.quantity}</td><td>${item.stackCount}</td><td>${trailer.totalWeight}</td></tr>`)
      })
    })
    win.document.write(`</tbody></table></body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }
  async function loadPlanList() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.trafficPlanList(200)
      setPlans(data)
      setPlanPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans")
    } finally {
      setLoading(false)
    }
  }

  async function onPlan() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await api.trafficPlan({
        materials,
        trailers,
        allowRotation,
        allowStacking,
      })
      setResult(normalizePlan(response))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan")
    } finally {
      setLoading(false)
    }
  }

  function updateMaterial(idx: number, patch: Partial<TrafficMaterial>) {
    setMaterials((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)))
  }

  function updateTrailer(idx: number, patch: Partial<TrafficTrailerType>) {
    setTrailers((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)))
  }

  return (
    <section className="panel traffic-planner">
      <div className="traffic-header">
        <div>
          <h2>Vehicle Placement Planning</h2>
          <p>Optimize trailer selection and packing using 3D bin packing + weight constraints.</p>
        </div>
        <div className="traffic-actions">
          <label className="traffic-toggle">
            <input
              type="checkbox"
              checked={allowRotation}
              onChange={(event) => setAllowRotation(event.target.checked)}
            />
            Allow rotation
          </label>
          <label className="traffic-toggle">
            <input
              type="checkbox"
              checked={allowStacking}
              onChange={(event) => setAllowStacking(event.target.checked)}
            />
            Allow stacking
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPlanDrawerOpen(true)
              loadPlanList()
            }}
          >
            Load Plan
          </Button>
          <Button type="button" variant="outline" onClick={exportCsv} disabled={!result}>
            Export CSV
          </Button>
          <Button type="button" variant="outline" onClick={exportPdf} disabled={!result}>
            Export PDF
          </Button>
          <Button asChild variant="ghost">
            <Link to="/traffic/vehicle-placement/history">History</Link>
          </Button>
          <Button type="button" onClick={onPlan} disabled={loading}>
            {loading ? "Planning..." : "Calculate Trailer Plan"}
          </Button>
        </div>
      </div>

      {error && <div className="traffic-error">{error}</div>}

      {planDrawerOpen && (
        <div className="traffic-drawer">
          <div className="traffic-drawer-header">
            <div>
              <h3>Load Previous Plan</h3>
              <p>Select a plan to load its placements.</p>
            </div>
            <Button type="button" variant="ghost" onClick={() => setPlanDrawerOpen(false)}>
              Close
            </Button>
          </div>
          <div className="traffic-drawer-controls">
            <Input
              placeholder="Search by Plan Id / Trailer / Mode"
              value={planSearch}
              onChange={(e) => {
                setPlanSearch(e.target.value)
                setPlanPage(1)
              }}
            />
            <div className="traffic-drawer-pagination">
              <Button
                type="button"
                variant="outline"
                disabled={planPage <= 1}
                onClick={() => setPlanPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span>Page {planPage} / {totalPages}</span>
              <Button
                type="button"
                variant="outline"
                disabled={planPage >= totalPages}
                onClick={() => setPlanPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
          <div className="traffic-table traffic-drawer-table">
            <div className="traffic-row traffic-head">
              <span>Created</span>
              <span>Trailer</span>
              <span>Total</span>
              <span>Mode</span>
              <span>Action</span>
            </div>
            {pagedPlans.map((plan) => (
              <div className="traffic-row" key={plan.planId}>
                <span>{new Date(plan.createdAt).toLocaleString()}</span>
                <span>{plan.recommendedTrailerType || "-"}</span>
                <span>{plan.totalTrailers}</span>
                <span>{plan.mode}</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    setLoading(true)
                    setError(null)
                    try {
                      const loaded = await api.trafficPlanById(plan.planId)
                      setResult(normalizePlan(loaded))
                      setPlanDrawerOpen(false)
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to load plan")
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  Load
                </Button>
              </div>
            ))}
            {pagedPlans.length === 0 && (
              <div className="traffic-empty">No plans found.</div>
            )}
          </div>
        </div>
      )}

      <div className="traffic-grid">
        <div className="traffic-panel">
          <h3>Materials ({totalMaterialCount} items)</h3>
          <div className="traffic-table">
            <div className="traffic-row traffic-head">
              <span>ID</span>
              <span>L</span>
              <span>W</span>
              <span>H</span>
              <span>Wt</span>
              <span>Qty</span>
              <span>Stack?</span>
              <span>Max</span>
            </div>
            {materials.map((item, idx) => (
              <div className="traffic-row" key={`${item.id}-${idx}`}>
                <Input value={item.id} onChange={(e) => updateMaterial(idx, { id: e.target.value })} />
                <Input value={item.length} onChange={(e) => updateMaterial(idx, { length: Number(e.target.value) })} />
                <Input value={item.width} onChange={(e) => updateMaterial(idx, { width: Number(e.target.value) })} />
                <Input value={item.height} onChange={(e) => updateMaterial(idx, { height: Number(e.target.value) })} />
                <Input value={item.weight} onChange={(e) => updateMaterial(idx, { weight: Number(e.target.value) })} />
                <Input value={item.qty} onChange={(e) => updateMaterial(idx, { qty: Number(e.target.value) })} />
                <label className="traffic-checkbox">
                  <input
                    type="checkbox"
                    checked={item.stackable}
                    onChange={(e) => updateMaterial(idx, { stackable: e.target.checked })}
                  />
                </label>
                <Input
                  value={item.maxStack ?? ""}
                  onChange={(e) => updateMaterial(idx, { maxStack: Number(e.target.value) || undefined })}
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="traffic-add"
            onClick={() =>
              setMaterials((prev) => [
                ...prev,
                {
                  id: `M${prev.length + 1}`,
                  length: 1,
                  width: 1,
                  height: 1,
                  weight: 100,
                  qty: 1,
                  stackable: false,
                },
              ])
            }
          >
            Add Material
          </Button>
        </div>

        <div className="traffic-panel">
          <h3>Trailer Types</h3>
          <div className="traffic-table">
            <div className="traffic-row traffic-head">
              <span>Type</span>
              <span>L</span>
              <span>W</span>
              <span>H</span>
              <span>Max Wt</span>
            </div>
            {trailers.map((item, idx) => (
              <div className="traffic-row" key={`${item.type}-${idx}`}>
                <Input value={item.type} onChange={(e) => updateTrailer(idx, { type: e.target.value })} />
                <Input value={item.L} onChange={(e) => updateTrailer(idx, { L: Number(e.target.value) })} />
                <Input value={item.W} onChange={(e) => updateTrailer(idx, { W: Number(e.target.value) })} />
                <Input value={item.H} onChange={(e) => updateTrailer(idx, { H: Number(e.target.value) })} />
                <Input value={item.maxWeight} onChange={(e) => updateTrailer(idx, { maxWeight: Number(e.target.value) })} />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="traffic-add"
            onClick={() =>
              setTrailers((prev) => [
                ...prev,
                { type: `T${prev.length + 1}`, L: 6, W: 2.4, H: 2.4, maxWeight: 20000 },
              ])
            }
          >
            Add Trailer Type
          </Button>
        </div>
      </div>

      <div className="traffic-output">
        <div className="traffic-result">
          <h3>Plan Output</h3>
          {result ? (
            <>
              <div className="traffic-summary">
                {result.planId && (
                  <div>
                    <strong>Plan Id:</strong> {result.planId}
                  </div>
                )}
                <div>
                  <strong>Recommended Trailer:</strong> {result.recommendedTrailerType || "-"}
                </div>
                <div>
                  <strong>Total Trailers:</strong> {result.totalTrailers}
                </div>
                <div>
                  <strong>Mode:</strong> {result.mode}
                </div>
              </div>
              {result.warnings?.length > 0 && (
                <div className="traffic-warnings">
                  {result.warnings.map((warn, idx) => (
                    <p key={`${warn}-${idx}`}>{warn}</p>
                  ))}
                </div>
              )}
              <div className="traffic-trailer-list">
                {result.trailers.map((trailer, idx) => (
                  <TrailerCard key={`${trailer.trailerType}-${idx}`} trailer={trailer} index={idx + 1} />
                ))}
              </div>
            </>
          ) : (
            <div className="traffic-empty">Run the plan to see results.</div>
          )}
        </div>
        <div className="traffic-visual">
          <h3>3D Preview</h3>
          {result ? (
            <div className="traffic-stage">
              {result.trailers.slice(0, 1).map((trailer, idx) => (
                <TrafficPreview3D key={idx} trailer={trailer} />
              ))}
            </div>
          ) : (
            <div className="traffic-empty">Preview appears after planning.</div>
          )}
        </div>
      </div>
    </section>
  )
}

function TrailerCard({ trailer, index }: { trailer: TrafficTrailerPlan; index: number }) {
  return (
    <div className="traffic-card">
      <div className="traffic-card-header">
        <strong>Trailer {index}</strong>
        <span>{trailer.trailerType}</span>
      </div>
      <div className="traffic-card-body">
        <div>Total Weight: {Number(trailer.totalWeight ?? 0).toFixed(2)} kg</div>
        <ul>
          {trailer.items.map((item) => (
            <li key={`${item.materialId}-${item.stackCount}`}>
              {item.materialId} × {item.quantity} (stack {item.stackCount})
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function TrafficPreview3D({ trailer }: { trailer: TrafficTrailerPlan }) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth || 420
    const height = mount.clientHeight || 320

    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#0b0f17")

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(
      trailer.trailerLength * 1.2,
      -trailer.trailerWidth * 2.1,
      trailer.trailerHeight * 1.4
    )

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio || 1)

    mount.innerHTML = ""
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(
      trailer.trailerLength / 2,
      trailer.trailerWidth / 2,
      trailer.trailerHeight / 2
    )
    controls.update()

    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambient)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(
      trailer.trailerLength,
      trailer.trailerWidth * 1.5,
      trailer.trailerHeight * 2
    )
    scene.add(dir)

    const trailerGroup = new THREE.Group()
    scene.add(trailerGroup)

    const frame = new THREE.BoxGeometry(
      trailer.trailerLength,
      trailer.trailerWidth,
      trailer.trailerHeight
    )
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(frame),
      new THREE.LineBasicMaterial({ color: 0x6ee7b7 })
    )
    wire.position.set(
      trailer.trailerLength / 2,
      trailer.trailerWidth / 2,
      trailer.trailerHeight / 2
    )
    trailerGroup.add(wire)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(trailer.trailerLength, trailer.trailerWidth),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(trailer.trailerLength / 2, trailer.trailerWidth / 2, 0)
    trailerGroup.add(floor)

    trailer.placements.forEach((placement) => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(placement.length, placement.width, placement.height),
        new THREE.MeshStandardMaterial({
          color: colorFromId(placement.materialId),
          transparent: true,
          opacity: 0.82,
        })
      )
      cube.position.set(
        placement.x + placement.length / 2,
        placement.y + placement.width / 2,
        placement.z + placement.height / 2
      )
      trailerGroup.add(cube)
    })

    let rafId = 0
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      rafId = window.requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      if (!mountRef.current) return
      const nextWidth = mountRef.current.clientWidth || width
      const nextHeight = mountRef.current.clientHeight || height
      renderer.setSize(nextWidth, nextHeight)
      camera.aspect = nextWidth / nextHeight
      camera.updateProjectionMatrix()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.cancelAnimationFrame(rafId)
      controls.dispose()
      renderer.dispose()
      frame.dispose()
    }
  }, [trailer])

  return <div className="traffic-preview-3d" ref={mountRef} />
}

function colorFromId(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return new THREE.Color(`hsl(${hue}, 65%, 55%)`)
}




function normalizePlan(plan: TrafficPlanResponse): TrafficPlanResponse {
  return {
    ...plan,
    trailers: Array.isArray(plan.trailers)
      ? plan.trailers.map((trailer) => ({
          ...trailer,
          items: Array.isArray(trailer.items) ? trailer.items : [],
          placements: Array.isArray(trailer.placements) ? trailer.placements : [],
        }))
      : [],
    warnings: Array.isArray(plan.warnings) ? plan.warnings : [],
    mode: plan.mode || "heuristic",
  }
}






