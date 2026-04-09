import { useEffect, useMemo, useState } from "react"
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
import { TypeaheadInput } from "../components/ui/typeahead-input"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"
import { formatDate } from "../lib/reporting"
import type { Branch, Consignment, Driver, Location, Vehicle, VehicleReceipt, VehicleReceiptLineUpsert } from "../types"

type TabKey = "form" | "list"
type ReceiptLine = {
  consignmentNo: string
  description: string
  packages: string
  weightKg: string
}
type FormState = {
  challanNo: string
  branchId: string
  challanDate: string
  fromLocationRef: string
  toLocationRef: string
  ownerName: string
  vehicleRef: string
  driverRef: string
  driverLicenseNo: string
  driverMobile: string
  totalHire: string
  balanceAt: string
  advanceAmount: string
}

export function VehicleReceiptsPage() {
  const [tab, setTab] = useState<TabKey>("form")
  const [rows, setRows] = useState<VehicleReceipt[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [consignments, setConsignments] = useState<Consignment[]>([])
  const [form, setForm] = useState<FormState>(emptyForm())
  const [lines, setLines] = useState<ReceiptLine[]>([emptyLine()])
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    void loadAll()
  }, [])

  const totalPkg = useMemo(() => lines.reduce((sum, line) => sum + toAmount(line.packages), 0), [lines])
  const totalWeight = useMemo(() => lines.reduce((sum, line) => sum + toAmount(line.weightKg), 0), [lines])
  const balanceAmount = useMemo(() => toAmount(form.totalHire) - toAmount(form.advanceAmount), [form.advanceAmount, form.totalHire])
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  async function loadAll() {
    setLoading(true)
    setError("")
    try {
      const [receiptRows, branchRows, locationRows, driverRows, vehicleRows, consignmentRows] = await Promise.all([
        api.vehicleReceipts(),
        api.branches(),
        api.locations(),
        api.drivers(),
        api.vehicles(),
        api.consignments(),
      ])
      setRows(receiptRows)
      setBranches(branchRows)
      setLocations(locationRows)
      setDrivers(driverRows)
      setVehicles(vehicleRows)
      setConsignments(consignmentRows)
      setForm((prev) => ({
        ...prev,
        challanNo: prev.challanNo || nextDocumentNo("CH/GEN", receiptRows.map((x) => x.challanNo)),
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load lorry receipts")
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")

    const selectedDriver = findDriverByRef(form.driverRef, drivers)
    const selectedVehicle = findVehicleByRef(form.vehicleRef, vehicles)
    const fromLocationId = findLocationIdByRef(form.fromLocationRef, locations)
    const toLocationId = findLocationIdByRef(form.toLocationRef, locations)
    const linePayload = linesToPayload(lines, consignments)
    const errors = validateForm(form, linePayload, fromLocationId, toLocationId, rows)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await api.createVehicleReceipt({
        challanNo: form.challanNo.trim() || undefined,
        branchId: form.branchId,
        challanDate: form.challanDate,
        fromLocationId,
        toLocationId,
        driverId: selectedDriver?.id,
        vehicleId: selectedVehicle?.id,
        ownerName: form.ownerName.trim() || undefined,
        vehicleNo: selectedVehicle?.vehicleNumber || form.vehicleRef.trim(),
        driverName: selectedDriver?.name || form.driverRef.trim(),
        driverLicenseNo: form.driverLicenseNo.trim() || undefined,
        driverMobile: form.driverMobile.trim() || undefined,
        freightAmount: 0,
        totalHire: toAmount(form.totalHire),
        refBalance: 0,
        balanceAt: form.balanceAt.trim() || undefined,
        advanceAmount: toAmount(form.advanceAmount),
        consignments: linePayload,
      })
      setMessage("Lorry receipt created.")
      onReset()
      await loadAll()
      setTab("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save lorry receipt")
    }
  }

  function onDriverChange(value: string) {
    const driver = findDriverByRef(value, drivers)
    setForm((prev) => ({
      ...prev,
      driverRef: value,
      driverLicenseNo: driver?.licenseNo || prev.driverLicenseNo,
      driverMobile: driver?.mobile || prev.driverMobile,
    }))
  }

  function onConsignmentNoChange(index: number, value: string) {
    const consignment = findConsignmentByNo(value, consignments)
    if (!consignment) {
      updateLine(index, { consignmentNo: value })
      return
    }
    updateLine(index, {
      consignmentNo: consignment.consignmentNo,
      description: consignment.goodsDescription || "",
      packages: String(consignment.packages ?? 0),
      weightKg: String(consignment.chargedWeight || consignment.actualWeight || 0),
    })
  }

  function onReset() {
    setForm((prev) => ({
      ...emptyForm(),
      challanNo: nextDocumentNo("CH/GEN", rows.map((x) => x.challanNo)),
      branchId: prev.branchId,
      fromLocationRef: prev.fromLocationRef,
      toLocationRef: prev.toLocationRef,
    }))
    setLines([emptyLine()])
    setFieldErrors({})
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()])
  }

  function updateLine(index: number, patch: Partial<ReceiptLine>) {
    setLines((prev) => prev.map((line, idx) => (idx === index ? { ...line, ...patch } : line)))
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)))
  }

  return (
    <section className="panel consignment-layout">
      <div className="consignment-toolbar">
        <div>
          <h2>Lorry Receipt</h2>
          <p>Create hire challans with multiple consignment lines and master lookups.</p>
        </div>
        <div className="consignment-actions">
          <Tabs>
            <TabsTrigger active={tab === "form"} onClick={() => setTab("form")}>
              Form
            </TabsTrigger>
            <TabsTrigger active={tab === "list"} onClick={() => setTab("list")}>
              Listing
            </TabsTrigger>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => void loadAll()} type="button">
            Refresh
          </Button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {message ? <div className="panel">{message}</div> : null}

      {tab === "form" ? (
        <form onSubmit={onSubmit}>
          <div className="consignment-grid">
            <fieldset>
              <legend>Header Details</legend>
              <div className="consignment-fields">
                <FormField label="Lorry Receipt No" required error={fieldErrors.challanNo}>
                  <Input value={form.challanNo} onChange={(e) => setForm((prev) => ({ ...prev, challanNo: e.target.value }))} />
                </FormField>
                <FormField label="Branch" required error={fieldErrors.branchId}>
                  <Select value={form.branchId} onValueChange={(v) => setForm((prev) => ({ ...prev, branchId: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select branch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.code} - {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Date" required error={fieldErrors.challanDate}>
                  <DatePicker value={form.challanDate} onChange={(value) => setForm((prev) => ({ ...prev, challanDate: value }))} />
                </FormField>
                <div className="lorry-header-spacer" aria-hidden="true" />
                <FormField label="From" required error={fieldErrors.fromLocationRef}>
                  <TypeaheadInput listId="location-from-options" options={locations.map((l) => toLocationRefValue(l))} value={form.fromLocationRef} onChange={(e) => setForm((prev) => ({ ...prev, fromLocationRef: e.target.value }))} />
                </FormField>
                <FormField label="To" required error={fieldErrors.toLocationRef}>
                  <TypeaheadInput listId="location-to-options" options={locations.map((l) => toLocationRefValue(l))} value={form.toLocationRef} onChange={(e) => setForm((prev) => ({ ...prev, toLocationRef: e.target.value }))} />
                </FormField>
              </div>
            </fieldset>

            <fieldset>
              <legend>Header Details</legend>
              <div className="consignment-fields">
                <FormField label="Owner Name">
                  <Input value={form.ownerName} onChange={(e) => setForm((prev) => ({ ...prev, ownerName: e.target.value }))} />
                </FormField>
                <FormField label="Vehicle" required error={fieldErrors.vehicleRef}>
                  <TypeaheadInput listId="vehicle-lookup-options" options={vehicles.filter((v) => v.isActive).map((v) => v.vehicleNumber)} value={form.vehicleRef} onChange={(e) => setForm((prev) => ({ ...prev, vehicleRef: e.target.value }))} />
                </FormField>
                <FormField label="Driver" required error={fieldErrors.driverRef}>
                  <TypeaheadInput listId="driver-lookup-options" options={drivers.filter((d) => d.isActive).map((d) => d.name)} value={form.driverRef} onChange={(e) => onDriverChange(e.target.value)} />
                </FormField>
                <FormField label="Driver License No">
                  <Input value={form.driverLicenseNo} onChange={(e) => setForm((prev) => ({ ...prev, driverLicenseNo: e.target.value }))} />
                </FormField>
                <FormField label="Driver Mobile">
                  <Input value={form.driverMobile} onChange={(e) => setForm((prev) => ({ ...prev, driverMobile: e.target.value }))} />
                </FormField>
              </div>
            </fieldset>
          </div>

          <fieldset style={{ marginTop: 12 }}>
            <legend>Consignments</legend>
            <table className="lorry-lines-table">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "45%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Consignment Number</th>
                  <th>Description</th>
                  <th className="numeric-cell">Pkg.</th>
                  <th className="numeric-cell">Weight (3 Decimals)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={`line-${idx}`}>
                    <td>
                      <TypeaheadInput listId={`ch-cn-${idx}`} options={consignments.map((c) => c.consignmentNo)} value={line.consignmentNo} onChange={(e) => onConsignmentNoChange(idx, e.target.value)} className="w-full" />
                    </td>
                    <td>
                      <Input className="lr-col-wide w-full" value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                    </td>
                    <td className="numeric-cell">
                      <Input className="text-right w-full" value={line.packages} onChange={(e) => updateLine(idx, { packages: e.target.value })} />
                    </td>
                    <td className="numeric-cell">
                      <Input className="text-right w-full" value={line.weightKg} onChange={(e) => updateLine(idx, { weightKg: e.target.value })} />
                    </td>
                    <td>
                      <Button variant="destructive" size="sm" onClick={() => removeLine(idx)} type="button">
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  <td><strong>Total</strong></td>
                  <td className="numeric-cell"><strong>{totalPkg.toFixed(0)}</strong></td>
                  <td className="numeric-cell"><strong>{totalWeight.toFixed(3)}</strong></td>
                  <td />
                </tr>
              </tfoot>
            </table>
            {fieldErrors.lines ? <small className="error-text">{fieldErrors.lines}</small> : null}
            <div style={{ marginTop: 10 }}>
              <Button variant="outline" size="sm" onClick={addLine} type="button">
                Add Consignment
              </Button>
            </div>
          </fieldset>

          <div className="consignment-grid lorry-hire-left-wrap" style={{ marginTop: 12 }}>
            <div className="lorry-hire-spacer" />
            <fieldset>
              <legend>Freight And Hire</legend>
              <div className="consignment-fields lorry-hire-row lorry-hire-column">
                <FormField label="Lorry Hire" required error={fieldErrors.totalHire} className="consignment-charge-row">
                  <Input className="text-right" value={form.totalHire} onChange={(e) => setForm((prev) => ({ ...prev, totalHire: e.target.value }))} onBlur={() => setForm((prev) => ({ ...prev, totalHire: toAmount(prev.totalHire).toFixed(2) }))} />
                </FormField>
                <FormField label="Advance" className="consignment-charge-row">
                  <Input className="text-right" value={form.advanceAmount} onChange={(e) => setForm((prev) => ({ ...prev, advanceAmount: e.target.value }))} onBlur={() => setForm((prev) => ({ ...prev, advanceAmount: toAmount(prev.advanceAmount).toFixed(2) }))} />
                </FormField>
                <FormField label="Balance" className="consignment-charge-row">
                  <Input className="text-right bg-muted" value={balanceAmount.toFixed(2)} readOnly />
                </FormField>
                <FormField label="Balance At (Location)" className="consignment-charge-row">
                  <TypeaheadInput listId="balance-at-options" options={branches.map((b) => `${b.code} - ${b.name}`)} value={form.balanceAt} onChange={(e) => setForm((prev) => ({ ...prev, balanceAt: e.target.value }))} />
                </FormField>
              </div>
            </fieldset>
          </div>

          <div className="consignment-actions" style={{ marginTop: 12 }}>
            <Button type="submit" disabled={loading}>
              Create Lorry Receipt
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
                <th>Receipt No</th>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Freight</th>
                <th>Hire</th>
                <th>Lines</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.challanNo}</td>
                  <td>{formatDate(row.challanDate)}</td>
                  <td>{row.vehicleNo || "-"}</td>
                  <td>{row.driverName || "-"}</td>
                  <td>
                    {findLocationNameById(row.fromLocationId, locations)} - {findLocationNameById(row.toLocationId, locations)}
                  </td>
                  <td className="numeric-cell">Rs. {row.freightAmount.toFixed(2)}</td>
                  <td className="numeric-cell">Rs. {row.totalHire.toFixed(2)}</td>
                  <td>{row.consignments.length}</td>
                  <td>{row.status}</td>
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

function emptyForm(): FormState {
  const today = new Date().toISOString().slice(0, 10)
  return {
    challanNo: "",
    branchId: "",
    challanDate: today,
    fromLocationRef: "",
    toLocationRef: "",
    ownerName: "",
    vehicleRef: "",
    driverRef: "",
    driverLicenseNo: "",
    driverMobile: "",
    totalHire: "0.00",
    balanceAt: "",
    advanceAmount: "0.00",
  }
}

function emptyLine(): ReceiptLine {
  return {
    consignmentNo: "",
    description: "",
    packages: "0",
    weightKg: "0",
  }
}

function validateForm(
  form: FormState,
  lines: VehicleReceiptLineUpsert[],
  fromLocationId?: string,
  toLocationId?: string,
  rows: VehicleReceipt[] = []
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.challanNo.trim()) {
    errors.challanNo = "Lorry receipt number is mandatory."
  } else if (rows.some((x) => x.challanNo.trim().toLowerCase() === form.challanNo.trim().toLowerCase())) {
    errors.challanNo = "Lorry receipt number already exists."
  }
  if (!form.branchId) errors.branchId = "Branch is mandatory."
  if (!form.challanDate) errors.challanDate = "Date is mandatory."
  if (!form.vehicleRef.trim()) errors.vehicleRef = "Vehicle is mandatory."
  if (!form.driverRef.trim()) errors.driverRef = "Driver is mandatory."
  if (!fromLocationId) errors.fromLocationRef = "Select a valid From location."
  if (!toLocationId) errors.toLocationRef = "Select a valid To location."
  if (toAmount(form.totalHire) <= 0) errors.totalHire = "Lorry hire should be greater than zero."
  if (lines.length === 0) errors.lines = "At least one consignment row is mandatory."
  return errors
}

function linesToPayload(lines: ReceiptLine[], consignments: Consignment[]): VehicleReceiptLineUpsert[] {
  return lines
    .map((line) => {
      const consignment = findConsignmentByNo(line.consignmentNo, consignments)
      return {
        consignmentId: consignment?.id,
        packages: Math.max(0, Math.floor(toAmount(line.packages))),
        weightKg: Math.max(0, toAmount(line.weightKg)),
        description: line.description.trim() || undefined,
        freightAmount: 0,
      }
    })
    .filter((line) => line.consignmentId !== undefined || line.description || line.packages > 0 || line.weightKg > 0)
}

function findDriverByRef(ref: string, options: Driver[]): Driver | undefined {
  const needle = ref.trim().toLowerCase()
  if (!needle) return undefined
  return options.find((x) => x.name.toLowerCase() === needle)
}

function findVehicleByRef(ref: string, options: Vehicle[]): Vehicle | undefined {
  const needle = ref.trim().toLowerCase()
  if (!needle) return undefined
  return options.find((x) => x.vehicleNumber.toLowerCase() === needle)
}

function findLocationIdByRef(ref: string, options: Location[]): string | undefined {
  const needle = ref.trim().toLowerCase()
  if (!needle) return undefined
  return options.find((x) => x.name.toLowerCase() === needle || x.code.toLowerCase() === needle || toLocationRefValue(x).toLowerCase() === needle)?.id
}

function findLocationNameById(id: string | undefined, options: Location[]): string {
  if (!id) return "-"
  return options.find((x) => x.id === id)?.name || "-"
}

function findConsignmentByNo(consignmentNo: string, options: Consignment[]): Consignment | undefined {
  const needle = consignmentNo.trim().toLowerCase()
  if (!needle) return undefined
  return options.find((x) => x.consignmentNo.trim().toLowerCase() === needle)
}

function toAmount(value: string): number {
  const cleaned = value.replace(/,/g, "").trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function toLocationRefValue(location: Location | undefined): string {
  if (!location) return ""
  return `${location.code} - ${location.name}`
}

function nextDocumentNo(prefix: string, existingNos: string[]): string {
  const year = new Date().getFullYear()
  const start = `${prefix}/${year}/`
  const seq = existingNos
    .filter((no) => no.startsWith(start))
    .map((no) => Number(no.slice(start.length)))
    .filter((n) => Number.isFinite(n))
  const next = (seq.length ? Math.max(...seq) : 0) + 1
  return `${start}${String(next).padStart(5, "0")}`
}
