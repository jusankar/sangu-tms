import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"
import type { Location } from "../types"

type TabKey = "form" | "list"

export function LocationsPage() {
  const [rows, setRows] = useState<Location[]>([])
  const [tab, setTab] = useState<TabKey>("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [stateName, setStateName] = useState("")
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
      setRows(await api.locations())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load locations")
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    const errors: Record<string, string> = {}
    if (!code.trim()) errors.code = "Location code is mandatory."
    if (!name.trim()) errors.name = "Location name is mandatory."
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = { code, name, stateName: stateName.trim() || undefined, isActive }
    try {
      if (editingId) {
        await api.updateLocation(editingId, payload)
        setMessage("Location updated.")
      } else {
        await api.createLocation(payload)
        setMessage("Location created.")
      }
      await load()
      onReset()
      setTab("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save location")
    }
  }

  function onEdit(row: Location) {
    setEditingId(row.id)
    setCode(row.code)
    setName(row.name)
    setStateName(row.stateName || "")
    setIsActive(row.isActive)
    setFieldErrors({})
    setTab("form")
  }

  function onReset() {
    setEditingId(null)
    setCode("")
    setName("")
    setStateName("")
    setIsActive(true)
    setFieldErrors({})
  }

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section className="panel consignment-layout">
      <div className="consignment-toolbar">
        <h2>Locations</h2>
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
              Code<sup className="required">*</sup>
            </span>
            <input required value={code} onChange={(e) => setCode(e.target.value)} />
            {fieldErrors.code ? <small className="error-text">{fieldErrors.code}</small> : null}
          </label>
          <label>
            <span className="label-text">
              Name<sup className="required">*</sup>
            </span>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
            {fieldErrors.name ? <small className="error-text">{fieldErrors.name}</small> : null}
          </label>
          <label>
            State
            <input value={stateName} onChange={(e) => setStateName(e.target.value)} />
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
              {editingId ? "Update Location" : "Create Location"}
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
                <th>Code</th>
                <th>Name</th>
                <th>State</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.stateName || "-"}</td>
                  <td>{r.isActive ? "Yes" : "No"}</td>
                  <td>
                    <div className="consignment-table-actions">
                      <button className="btn-secondary" onClick={() => onEdit(r)} type="button">
                        Edit
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
