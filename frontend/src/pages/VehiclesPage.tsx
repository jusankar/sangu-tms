import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"
import type { Vehicle } from "../types"

type TabKey = "form" | "list"

export function VehiclesPage() {
  const [rows, setRows] = useState<Vehicle[]>([])
  const [tab, setTab] = useState<TabKey>("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [make, setMake] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [chassisNumber, setChassisNumber] = useState("")
  const [engineNumber, setEngineNumber] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setError("")
    try {
      setRows(await api.vehicles())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vehicles")
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    const errors: Record<string, string> = {}
    if (!vehicleNumber.trim()) errors.vehicleNumber = "Vehicle number is mandatory."
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = {
      vehicleNumber,
      make: make.trim() || undefined,
      type: vehicleType.trim() || undefined,
      chassisNumber: chassisNumber.trim() || undefined,
      engineNumber: engineNumber.trim() || undefined,
      isActive,
    }

    try {
      if (editingId) {
        await api.updateVehicle(editingId, payload)
        setMessage("Vehicle updated.")
      } else {
        await api.createVehicle(payload)
        setMessage("Vehicle created.")
      }
      await load()
      onReset()
      setTab("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save vehicle")
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this vehicle?")) return
    setError("")
    try {
      await api.deleteVehicle(id)
      if (editingId === id) onReset()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete vehicle")
    }
  }

  function onEdit(row: Vehicle) {
    setEditingId(row.id)
    setVehicleNumber(row.vehicleNumber)
    setMake(row.make || "")
    setVehicleType(row.type || "")
    setChassisNumber(row.chassisNumber || "")
    setEngineNumber(row.engineNumber || "")
    setIsActive(row.isActive)
    setFieldErrors({})
    setTab("form")
  }

  function onReset() {
    setEditingId(null)
    setVehicleNumber("")
    setMake("")
    setVehicleType("")
    setChassisNumber("")
    setEngineNumber("")
    setIsActive(true)
    setFieldErrors({})
  }

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section className="panel consignment-layout">
      <div className="consignment-toolbar">
        <h2>Vehicles</h2>
        <div className="page-tabs">
          <button className={tab === "form" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("form")} type="button">
            Form
          </button>
          <button className={tab === "list" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("list")} type="button">
            Listing
          </button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {message ? <div className="panel">{message}</div> : null}

      {tab === "form" ? (
        <form className="module-form" onSubmit={onSubmit}>
          <label>
            <span className="label-text">
              Vehicle Number<sup className="required">*</sup>
            </span>
            <input required value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
            {fieldErrors.vehicleNumber ? <small className="error-text">{fieldErrors.vehicleNumber}</small> : null}
          </label>
          <label>
            Make
            <input value={make} onChange={(e) => setMake(e.target.value)} />
          </label>
          <label>
            Type
            <input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
          </label>
          <label>
            Chassis Number
            <input value={chassisNumber} onChange={(e) => setChassisNumber(e.target.value)} />
          </label>
          <label>
            Engine Number
            <input value={engineNumber} onChange={(e) => setEngineNumber(e.target.value)} />
          </label>
          <label>
            Active
            <select value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <div className="module-form-actions">
            <button className="btn-primary" type="submit">
              {editingId ? "Update Vehicle" : "Create Vehicle"}
            </button>
            <button className="btn-secondary" onClick={onReset} type="button">
              Clear
            </button>
          </div>
        </form>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Vehicle No</th>
                <th>Make</th>
                <th>Type</th>
                <th>Chassis No</th>
                <th>Engine No</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.vehicleNumber}</td>
                  <td>{r.make || "-"}</td>
                  <td>{r.type || "-"}</td>
                  <td>{r.chassisNumber || "-"}</td>
                  <td>{r.engineNumber || "-"}</td>
                  <td>{r.isActive ? "Yes" : "No"}</td>
                  <td>
                    <div className="consignment-table-actions">
                      <button className="btn-secondary" onClick={() => onEdit(r)} type="button">
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => void onDelete(r.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalRows={rows.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </>
      )}
    </section>
  )
}
