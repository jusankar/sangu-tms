import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"

type Customer = {
  id: string
  code: string
  name: string
  address?: string
  gstNo?: string
  mobile?: string
  creditDays: number
  isActive: boolean
}
type TabKey = "form" | "list"

export function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([])
  const [tab, setTab] = useState<TabKey>("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [gstNo, setGstNo] = useState("")
  const [mobile, setMobile] = useState("")
  const [creditDays, setCreditDays] = useState("0")
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
      setRows(await api.customers())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers")
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    const errors: Record<string, string> = {}
    if (!code.trim()) errors.code = "Customer code is mandatory."
    if (!name.trim()) errors.name = "Customer name is mandatory."
    if ((Number(creditDays) || 0) < 0) errors.creditDays = "Credit days cannot be negative."
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    const payload = {
      code,
      name,
      address: address.trim() || undefined,
      gstNo: gstNo.trim() || undefined,
      mobile: mobile.trim() || undefined,
      creditDays: Number(creditDays) || 0,
      isActive,
    }
    try {
      if (editingId) {
        await api.updateCustomer(editingId, payload)
        setMessage("Customer updated.")
      } else {
        await api.createCustomer(payload)
        setMessage("Customer created.")
      }
      await load()
      onReset()
      setTab("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save customer")
    }
  }

  function onEdit(row: Customer) {
    setEditingId(row.id)
    setCode(row.code)
    setName(row.name)
    setAddress(row.address || "")
    setGstNo(row.gstNo || "")
    setMobile(row.mobile || "")
    setCreditDays(String(row.creditDays ?? 0))
    setIsActive(row.isActive)
    setFieldErrors({})
    setTab("form")
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this customer?")) return
    setError("")
    try {
      await api.deleteCustomer(id)
      if (editingId === id) onReset()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete customer")
    }
  }

  function onReset() {
    setEditingId(null)
    setCode("")
    setName("")
    setAddress("")
    setGstNo("")
    setMobile("")
    setCreditDays("0")
    setIsActive(true)
    setFieldErrors({})
  }

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section className="panel consignment-layout">
      <div className="consignment-toolbar">
        <h2>Customers</h2>
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
            GST No
            <input value={gstNo} onChange={(e) => setGstNo(e.target.value)} />
          </label>
          <label>
            Mobile
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </label>
          <label>
            Credit Days
            <input
              type="number"
              min="0"
              value={creditDays}
              onChange={(e) => setCreditDays(e.target.value)}
            />
            {fieldErrors.creditDays ? <small className="error-text">{fieldErrors.creditDays}</small> : null}
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
              {editingId ? "Update Customer" : "Create Customer"}
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
                <th>GST</th>
                <th>Mobile</th>
                <th>Credit Days</th>
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
                  <td>{r.gstNo || "-"}</td>
                  <td>{r.mobile || "-"}</td>
                  <td>{r.creditDays}</td>
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
