import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Button } from "../components/ui/button"
import { DatePicker } from "../components/ui/date-picker"
import { FormField } from "../components/ui/form-field"
import { Input } from "../components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { Tabs, TabsTrigger } from "../components/ui/tabs"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"
import { formatDate } from "../lib/reporting"
import type { Driver } from "../types"

type TabKey = "form" | "list"

export function DriversPage() {
  const [rows, setRows] = useState<Driver[]>([])
  const [tab, setTab] = useState<TabKey>("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [licenseNo, setLicenseNo] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [address, setAddress] = useState("")
  const [bloodGroup, setBloodGroup] = useState("")
  const [mobile, setMobile] = useState("")
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
      setRows(await api.drivers())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load drivers")
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = "Driver name is mandatory."
    if (!licenseNo.trim()) errors.licenseNo = "License number is mandatory."
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = {
      name,
      licenseNo,
      dateOfBirth: dateOfBirth || undefined,
      address: address.trim() || undefined,
      bloodGroup: bloodGroup.trim() || undefined,
      mobile: mobile.trim() || undefined,
      isActive,
    }
    try {
      if (editingId) {
        await api.updateDriver(editingId, payload)
        setMessage("Driver updated.")
      } else {
        await api.createDriver(payload)
        setMessage("Driver created.")
      }
      await load()
      onReset()
      setTab("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save driver")
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this driver?")) return
    setError("")
    try {
      await api.deleteDriver(id)
      if (editingId === id) onReset()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete driver")
    }
  }

  function onEdit(row: Driver) {
    setEditingId(row.id)
    setName(row.name)
    setLicenseNo(row.licenseNo)
    setDateOfBirth(row.dateOfBirth || "")
    setAddress(row.address || "")
    setBloodGroup(row.bloodGroup || "")
    setMobile(row.mobile || "")
    setIsActive(row.isActive)
    setFieldErrors({})
    setTab("form")
  }

  function onReset() {
    setEditingId(null)
    setName("")
    setLicenseNo("")
    setDateOfBirth("")
    setAddress("")
    setBloodGroup("")
    setMobile("")
    setIsActive(true)
    setFieldErrors({})
  }

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section className="panel consignment-layout">
      <div className="consignment-toolbar">
        <h2>Drivers</h2>
        <Tabs>
          <TabsTrigger active={tab === "form"} onClick={() => setTab("form")}>
            Form
          </TabsTrigger>
          <TabsTrigger active={tab === "list"} onClick={() => setTab("list")}>
            Listing
          </TabsTrigger>
        </Tabs>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {message ? <div className="panel">{message}</div> : null}

      {tab === "form" ? (
        <form className="module-form" onSubmit={onSubmit}>
          <FormField label="Name" required error={fieldErrors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="License No" required error={fieldErrors.licenseNo}>
            <Input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} />
          </FormField>
          <FormField label="DOB">
            <DatePicker value={dateOfBirth} onChange={setDateOfBirth} />
          </FormField>
          <FormField label="Mobile">
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </FormField>
          <FormField label="Blood Group">
            <Input value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
          </FormField>
          <FormField label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormField>
          <FormField label="Active">
            <Select value={isActive ? "true" : "false"} onValueChange={(v) => setIsActive(v === "true")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="module-form-actions">
            <Button type="submit">
              {editingId ? "Update Driver" : "Create Driver"}
            </Button>
            <Button variant="outline" onClick={onReset} type="button">
              Clear
            </Button>
          </div>
        </form>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>License No</th>
                <th>DOB</th>
                <th>Mobile</th>
                <th>Blood Group</th>
                <th>Address</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.licenseNo}</td>
                  <td>{formatDate(r.dateOfBirth || "")}</td>
                  <td>{r.mobile || "-"}</td>
                  <td>{r.bloodGroup || "-"}</td>
                  <td>{r.address || "-"}</td>
                  <td>{r.isActive ? "Yes" : "No"}</td>
                  <td>
                    <div className="consignment-table-actions">
                      <Button variant="outline" size="sm" onClick={() => onEdit(r)} type="button">
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void onDelete(r.id)} type="button">
                        Delete
                      </Button>
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
