import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"

type Branch = { id: string; code: string; name: string; address?: string; isActive: boolean }
type TabKey = "form" | "list"

export function BranchesPage() {
  const [rows, setRows] = useState<Branch[]>([])
  const [tab, setTab] = useState<TabKey>("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
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
      setRows(await api.branches())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load branches")
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    const errors: Record<string, string> = {}
    if (!code.trim()) errors.code = "Branch code is mandatory."
    if (!name.trim()) errors.name = "Branch name is mandatory."
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      if (editingId) {
        await api.updateBranch(editingId, { code, name, address: address.trim() || undefined, isActive })
        setMessage("Branch updated.")
      } else {
        await api.createBranch({ code, name, address: address.trim() || undefined, isActive })
        setMessage("Branch created.")
      }
      await load()
      onReset()
      setTab("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save branch")
    }
  }

  function onEdit(row: Branch) {
    setEditingId(row.id)
    setCode(row.code)
    setName(row.name)
    setAddress(row.address || "")
    setIsActive(row.isActive)
    setFieldErrors({})
    setTab("form")
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this branch?")) return
    setError("")
    try {
      await api.deleteBranch(id)
      if (editingId === id) onReset()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete branch")
    }
  }

  function onReset() {
    setEditingId(null)
    setCode("")
    setName("")
    setAddress("")
    setIsActive(true)
    setFieldErrors({})
  }

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section className="panel consignment-layout">
      <div className="consignment-toolbar">
        <h2>Branches</h2>
        <div className="page-tabs">
          <button
            className={tab === "form" ? "tab-btn active" : "tab-btn"}
            onClick={() => setTab("form")}
            type="button"
          >
            Form
          </button>
          <button
            className={tab === "list" ? "tab-btn active" : "tab-btn"}
            onClick={() => setTab("list")}
            type="button"
          >
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
            Address
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
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
              {editingId ? "Update Branch" : "Create Branch"}
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
                <th>Address</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.address || "-"}</td>
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
