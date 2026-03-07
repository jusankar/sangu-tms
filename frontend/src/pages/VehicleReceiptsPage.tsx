import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"
import type { Branch, Consignment, Driver, Location, Vehicle, VehicleReceipt, VehicleReceiptLineUpsert } from "../types"

type TabKey = "form" | "list"
type ReceiptLine = {
  consignmentNo: string
  description: string
  packages: string
  weightKg: string
}
type FormState = {
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
    const errors = validateForm(form, linePayload, fromLocationId, toLocationId)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await api.createVehicleReceipt({
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
          <div className="page-tabs">
            <button className={tab === "form" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("form")} type="button">
              Form
            </button>
            <button className={tab === "list" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("list")} type="button">
              Listing
            </button>
          </div>
          <button className="btn-secondary" onClick={() => void loadAll()} type="button">
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {message ? <div className="panel">{message}</div> : null}

      {tab === "form" ? (
        <form onSubmit={onSubmit}>
          <div className="consignment-grid">
            <fieldset className="consignment-wide">
              <legend>Header Details</legend>
              <div className="consignment-fields">
                <label>
                  <span className="label-text">
                    Branch<sup className="required">*</sup>
                  </span>
                  <select value={form.branchId} onChange={(e) => setForm((prev) => ({ ...prev, branchId: e.target.value }))}>
                    <option value="">Select branch...</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.code} - {branch.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.branchId ? <small className="error-text">{fieldErrors.branchId}</small> : null}
                </label>
                <label>
                  <span className="label-text">
                    Date<sup className="required">*</sup>
                  </span>
                  <input type="date" value={form.challanDate} onChange={(e) => setForm((prev) => ({ ...prev, challanDate: e.target.value }))} />
                  {fieldErrors.challanDate ? <small className="error-text">{fieldErrors.challanDate}</small> : null}
                </label>
                <label>
                  <span className="label-text">
                    From<sup className="required">*</sup>
                  </span>
                  <input
                    list="location-lookup-options"
                    value={form.fromLocationRef}
                    onChange={(e) => setForm((prev) => ({ ...prev, fromLocationRef: e.target.value }))}
                  />
                  {fieldErrors.fromLocationRef ? <small className="error-text">{fieldErrors.fromLocationRef}</small> : null}
                </label>
                <label>
                  <span className="label-text">
                    To<sup className="required">*</sup>
                  </span>
                  <input list="location-lookup-options" value={form.toLocationRef} onChange={(e) => setForm((prev) => ({ ...prev, toLocationRef: e.target.value }))} />
                  {fieldErrors.toLocationRef ? <small className="error-text">{fieldErrors.toLocationRef}</small> : null}
                </label>
                <label>
                  Owner Name
                  <input value={form.ownerName} onChange={(e) => setForm((prev) => ({ ...prev, ownerName: e.target.value }))} />
                </label>
                <label>
                  <span className="label-text">
                    Vehicle<sup className="required">*</sup>
                  </span>
                  <input list="vehicle-lookup-options" value={form.vehicleRef} onChange={(e) => setForm((prev) => ({ ...prev, vehicleRef: e.target.value }))} />
                  {fieldErrors.vehicleRef ? <small className="error-text">{fieldErrors.vehicleRef}</small> : null}
                </label>
                <label>
                  <span className="label-text">
                    Driver<sup className="required">*</sup>
                  </span>
                  <input list="driver-lookup-options" value={form.driverRef} onChange={(e) => onDriverChange(e.target.value)} />
                  {fieldErrors.driverRef ? <small className="error-text">{fieldErrors.driverRef}</small> : null}
                </label>
                <label>
                  Driver License No
                  <input value={form.driverLicenseNo} onChange={(e) => setForm((prev) => ({ ...prev, driverLicenseNo: e.target.value }))} />
                </label>
                <label>
                  Driver Mobile
                  <input value={form.driverMobile} onChange={(e) => setForm((prev) => ({ ...prev, driverMobile: e.target.value }))} />
                </label>
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
                  <th>Pkg.</th>
                  <th>Weight Kgs</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={`line-${idx}`}>
                    <td>
                      <input
                        className="lr-col-compact"
                        list="consignment-lookup-options"
                        value={line.consignmentNo}
                        onChange={(e) => onConsignmentNoChange(idx, e.target.value)}
                      />
                    </td>
                    <td>
                      <input className="lr-col-wide" value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                    </td>
                    <td>
                      <input className="lr-col-compact" value={line.packages} onChange={(e) => updateLine(idx, { packages: e.target.value })} />
                    </td>
                    <td>
                      <input className="lr-col-compact" value={line.weightKg} onChange={(e) => updateLine(idx, { weightKg: e.target.value })} />
                    </td>
                    <td>
                      <button className="btn-danger" onClick={() => removeLine(idx)} type="button">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  <td><strong>Total</strong></td>
                  <td><strong>{totalPkg.toFixed(0)}</strong></td>
                  <td><strong>{totalWeight.toFixed(3)}</strong></td>
                  <td />
                </tr>
              </tfoot>
            </table>
            {fieldErrors.lines ? <small className="error-text">{fieldErrors.lines}</small> : null}
            <div style={{ marginTop: 10 }}>
              <button className="btn-secondary" onClick={addLine} type="button">
                Add Consignment
              </button>
            </div>
          </fieldset>

          <fieldset style={{ marginTop: 12 }}>
            <legend>Freight And Hire</legend>
            <div className="consignment-fields lorry-hire-row">
              <label>
                <span className="label-text">
                  Lorry Hire<sup className="required">*</sup>
                </span>
                <input value={form.totalHire} onChange={(e) => setForm((prev) => ({ ...prev, totalHire: e.target.value }))} />
                {fieldErrors.totalHire ? <small className="error-text">{fieldErrors.totalHire}</small> : null}
              </label>
              <label>
                Advance
                <input value={form.advanceAmount} onChange={(e) => setForm((prev) => ({ ...prev, advanceAmount: e.target.value }))} />
              </label>
              <label>
                Balance
                <input value={balanceAmount.toFixed(2)} readOnly />
              </label>
              <label>
                Balance At (Location)
                <input list="location-lookup-options" value={form.balanceAt} onChange={(e) => setForm((prev) => ({ ...prev, balanceAt: e.target.value }))} />
              </label>
            </div>
          </fieldset>

          <datalist id="location-lookup-options">
            {locations.map((location) => (
              <option key={location.id} value={toLocationRefValue(location)} />
            ))}
          </datalist>
          <datalist id="driver-lookup-options">
            {drivers.filter((d) => d.isActive).map((driver) => (
              <option key={driver.id} value={driver.name} />
            ))}
          </datalist>
          <datalist id="vehicle-lookup-options">
            {vehicles.filter((v) => v.isActive).map((vehicle) => (
              <option key={vehicle.id} value={vehicle.vehicleNumber} />
            ))}
          </datalist>
          <datalist id="consignment-lookup-options">
            {consignments.map((consignment) => (
              <option key={consignment.id} value={consignment.consignmentNo} />
            ))}
          </datalist>

          <div className="consignment-actions" style={{ marginTop: 12 }}>
            <button className="btn-primary" type="submit" disabled={loading}>
              Create Lorry Receipt
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
                  <td>{row.challanDate}</td>
                  <td>{row.vehicleNo || "-"}</td>
                  <td>{row.driverName || "-"}</td>
                  <td>
                    {findLocationNameById(row.fromLocationId, locations)} - {findLocationNameById(row.toLocationId, locations)}
                  </td>
                  <td>Rs. {row.freightAmount.toFixed(2)}</td>
                  <td>Rs. {row.totalHire.toFixed(2)}</td>
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
    branchId: "",
    challanDate: today,
    fromLocationRef: "",
    toLocationRef: "",
    ownerName: "",
    vehicleRef: "",
    driverRef: "",
    driverLicenseNo: "",
    driverMobile: "",
    totalHire: "0",
    balanceAt: "",
    advanceAmount: "0",
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
  toLocationId?: string
): Record<string, string> {
  const errors: Record<string, string> = {}
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
