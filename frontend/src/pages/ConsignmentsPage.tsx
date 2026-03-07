import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"
import type { Consignment, ConsignmentUpsert, Vehicle } from "../types"

type BranchOption = { id: string; code: string; name: string; address?: string; isActive: boolean }
type CustomerOption = {
  id: string
  code: string
  name: string
  address?: string
  gstNo?: string
  mobile?: string
  creditDays: number
  isActive: boolean
}
type LocationOption = { id: string; code: string; name: string; stateName?: string; isActive: boolean }
type TabKey = "form" | "list"

type ConsignmentFormState = {
  branchId: string
  bookingDate: string
  customerId: string
  fromLocationName: string
  toLocationName: string
  consignorName: string
  consignorAddress: string
  consigneeName: string
  consigneeAddress: string
  consignorGstNo: string
  consigneeGstNo: string
  deliveryOfficeAddress: string
  gstPayableBy: string
  vehicleNo: string
  privateMarkNo: string
  packages: string
  goodsDescription: string
  actualWeight: string
  chargedWeight: string
  ratePerQuintal: string
  basicFreight: string
  stCharge: string
  gstAmount: string
  hamaliCharge: string
  doorDeliveryCharge: string
  advancePaid: string
  collectionCharge: string
  paymentBasis: string
  invoiceNo: string
  invoiceDate: string
  remarks: string
}

export function ConsignmentsPage() {
  const [rows, setRows] = useState<Consignment[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [tab, setTab] = useState<TabKey>("form")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [form, setForm] = useState<ConsignmentFormState>(emptyForm())

  useEffect(() => {
    void loadAll()
  }, [])

  const basicFreightCalculated = useMemo(
    () => toAmount(form.packages) * toAmount(form.ratePerQuintal),
    [form.packages, form.ratePerQuintal]
  )

  const freightAmount = useMemo(() => {
    const totalCharges =
      basicFreightCalculated +
      toAmount(form.stCharge) +
      toAmount(form.gstAmount) +
      toAmount(form.hamaliCharge) +
      toAmount(form.doorDeliveryCharge) +
      toAmount(form.collectionCharge)
    return totalCharges - toAmount(form.advancePaid)
  }, [
    form.advancePaid,
    basicFreightCalculated,
    form.collectionCharge,
    form.doorDeliveryCharge,
    form.gstAmount,
    form.hamaliCharge,
    form.stCharge,
  ])

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  async function loadAll() {
    setLoading(true)
    setError("")
    try {
      const [consignments, branchRows, customerRows, locationRows, vehicleRows] = await Promise.all([
        api.consignments(),
        api.branches(),
        api.customers(),
        api.locations(),
        api.vehicles(),
      ])
      setRows(consignments)
      setBranches(branchRows)
      setCustomers(customerRows)
      setLocations(locationRows)
      setVehicles(vehicleRows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load consignments")
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")

    const fromLocationId = findLocationId(form.fromLocationName, locations)
    const toLocationId = findLocationId(form.toLocationName, locations)
    const errors = validateConsignmentForm(form, fromLocationId, toLocationId)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = toPayload(form, freightAmount, fromLocationId!, toLocationId!, basicFreightCalculated)

    try {
      if (editingId) {
        await api.updateConsignment(editingId, payload)
        setMessage("Consignment updated.")
      } else {
        await api.createConsignment(payload)
        setMessage("Consignment created.")
      }
      await loadAll()
      onReset()
      setTab("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save consignment")
    }
  }

  function onEdit(row: Consignment) {
    setEditingId(row.id)
    setFieldErrors({})
    setTab("form")
    setForm({
      branchId: row.branchId,
      bookingDate: row.bookingDate,
      customerId: row.customerId,
      fromLocationName: toLocationRefValue(locations.find((x) => x.id === row.fromLocationId)),
      toLocationName: toLocationRefValue(locations.find((x) => x.id === row.toLocationId)),
      consignorName: row.consignorName || "",
      consignorAddress: row.consignorAddress || "",
      consigneeName: row.consigneeName || "",
      consigneeAddress: row.consigneeAddress || "",
      consignorGstNo: row.consignorGstNo || "",
      consigneeGstNo: row.consigneeGstNo || "",
      deliveryOfficeAddress: row.deliveryOfficeAddress || "",
      gstPayableBy: row.gstPayableBy || "Transport Agency",
      vehicleNo: row.vehicleNo || "",
      privateMarkNo: row.privateMarkNo || "",
      packages: String(row.packages ?? 0),
      goodsDescription: row.goodsDescription || "",
      actualWeight: (row.actualWeight ?? 0).toFixed(3),
      chargedWeight: (row.chargedWeight ?? 0).toFixed(3),
      ratePerQuintal: String(row.ratePerQuintal ?? 0),
      basicFreight: String(row.basicFreight ?? 0),
      stCharge: String(row.stCharge ?? 0),
      gstAmount: String(row.gstAmount ?? 0),
      hamaliCharge: String(row.hamaliCharge ?? 0),
      doorDeliveryCharge: String(row.doorDeliveryCharge ?? 0),
      advancePaid: String(row.advancePaid ?? 0),
      collectionCharge: String(row.collectionCharge ?? 0),
      paymentBasis: row.paymentBasis || "To Pay",
      invoiceNo: row.invoiceNo || "",
      invoiceDate: row.invoiceDate || "",
      remarks: row.remarks || "",
    })
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this consignment?")) return
    setError("")
    setMessage("")
    try {
      await api.deleteConsignment(id)
      setMessage("Consignment deleted.")
      if (editingId === id) onReset()
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete consignment")
    }
  }

  function onReset() {
    setEditingId(null)
    setFieldErrors({})
    setForm((prev) => ({
      ...emptyForm(),
      branchId: prev.branchId,
      customerId: prev.customerId,
      fromLocationName: prev.fromLocationName,
      toLocationName: prev.toLocationName,
    }))
  }

  function onConsignorChange(name: string) {
    setForm((prev) => ({ ...prev, consignorName: name }))
    const customer = findCustomerByName(name, customers)
    if (customer?.address?.trim()) {
      setForm((prev) => ({ ...prev, consignorAddress: customer.address || "" }))
    }
  }

  function onConsigneeChange(name: string) {
    setForm((prev) => ({ ...prev, consigneeName: name }))
    const customer = findCustomerByName(name, customers)
    if (customer?.address?.trim()) {
      setForm((prev) => ({ ...prev, consigneeAddress: customer.address || "" }))
    }
  }

  return (
    <section className="panel consignment-layout">
      <div className="consignment-toolbar">
        <div>
          <h2>Consignment Note</h2>
          <p>Create, update, review and delete consignments from one screen.</p>
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
            <fieldset>
              <legend>Booking And Parties</legend>
              <div className="consignment-fields">
                <label>
                  <span className="label-text">
                    Branch<sup className="required">*</sup>
                  </span>
                  <select value={form.branchId} onChange={(e) => setForm((prev) => ({ ...prev, branchId: e.target.value }))}>
                    <option value="">Select branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.branchId ? <small className="error-text">{fieldErrors.branchId}</small> : null}
                </label>
                <label>
                  <span className="label-text">
                    Booking Date<sup className="required">*</sup>
                  </span>
                  <input type="date" value={form.bookingDate} onChange={(e) => setForm((prev) => ({ ...prev, bookingDate: e.target.value }))} />
                  {fieldErrors.bookingDate ? <small className="error-text">{fieldErrors.bookingDate}</small> : null}
                </label>
                <label>
                  <span className="label-text">
                    Customer<sup className="required">*</sup>
                  </span>
                  <select value={form.customerId} onChange={(e) => setForm((prev) => ({ ...prev, customerId: e.target.value }))}>
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.customerId ? <small className="error-text">{fieldErrors.customerId}</small> : null}
                </label>
                <label>
                  <span className="label-text">
                    Vehicle No<sup className="required">*</sup>
                  </span>
                  <input list="vehicle-no-options" value={form.vehicleNo} onChange={(e) => setForm((prev) => ({ ...prev, vehicleNo: e.target.value }))} />
                  {fieldErrors.vehicleNo ? <small className="error-text">{fieldErrors.vehicleNo}</small> : null}
                </label>
                <label>
                  <span className="label-text">
                    Consignor<sup className="required">*</sup>
                  </span>
                  <input list="customer-name-options" value={form.consignorName} onChange={(e) => onConsignorChange(e.target.value)} />
                  {fieldErrors.consignorName ? <small className="error-text">{fieldErrors.consignorName}</small> : null}
                </label>
                <label>
                  <span className="label-text">
                    Consignee<sup className="required">*</sup>
                  </span>
                  <input list="customer-name-options" value={form.consigneeName} onChange={(e) => onConsigneeChange(e.target.value)} />
                  {fieldErrors.consigneeName ? <small className="error-text">{fieldErrors.consigneeName}</small> : null}
                </label>
                <label className="consignment-wide">
                  Consignor Address
                  <textarea value={form.consignorAddress} onChange={(e) => setForm((prev) => ({ ...prev, consignorAddress: e.target.value }))} />
                </label>
                <label className="consignment-wide">
                  Consignee Address
                  <textarea value={form.consigneeAddress} onChange={(e) => setForm((prev) => ({ ...prev, consigneeAddress: e.target.value }))} />
                </label>
                <label>
                  Consignor GST
                  <input value={form.consignorGstNo} onChange={(e) => setForm((prev) => ({ ...prev, consignorGstNo: e.target.value }))} />
                </label>
                <label>
                  Consignee GST
                  <input value={form.consigneeGstNo} onChange={(e) => setForm((prev) => ({ ...prev, consigneeGstNo: e.target.value }))} />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Route And Delivery</legend>
              <div className="consignment-fields">
                <label>
                  From Location
                  <input list="location-name-options" value={form.fromLocationName} onChange={(e) => setForm((prev) => ({ ...prev, fromLocationName: e.target.value }))} />
                  {fieldErrors.fromLocationName ? <small className="error-text">{fieldErrors.fromLocationName}</small> : null}
                </label>
                <label>
                  To Location
                  <input list="location-name-options" value={form.toLocationName} onChange={(e) => setForm((prev) => ({ ...prev, toLocationName: e.target.value }))} />
                  {fieldErrors.toLocationName ? <small className="error-text">{fieldErrors.toLocationName}</small> : null}
                </label>
                <label className="consignment-wide">
                  Delivery Office Address
                  <textarea
                    value={form.deliveryOfficeAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, deliveryOfficeAddress: e.target.value }))}
                  />
                </label>
                <label>
                  GST Payable By
                  <select value={form.gstPayableBy} onChange={(e) => setForm((prev) => ({ ...prev, gstPayableBy: e.target.value }))}>
                    <option>Transport Agency</option>
                    <option>Consignor</option>
                    <option>Consignee</option>
                    <option>Exempted</option>
                  </select>
                </label>
                <label>
                  Private Mark No
                  <input value={form.privateMarkNo} onChange={(e) => setForm((prev) => ({ ...prev, privateMarkNo: e.target.value }))} />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Goods And Weight</legend>
              <div className="consignment-fields">
                <label>
                  Packages
                  <input type="text" inputMode="numeric" value={form.packages} onChange={(e) => setForm((prev) => ({ ...prev, packages: e.target.value }))} />
                </label>
                <label>
                  Rate Per Qtl
                  <input type="text" inputMode="decimal" value={form.ratePerQuintal} onChange={(e) => setForm((prev) => ({ ...prev, ratePerQuintal: e.target.value }))} />
                </label>
                <label>
                  Actual Weight (3 Decimals)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.actualWeight}
                    onChange={(e) => setForm((prev) => ({ ...prev, actualWeight: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, actualWeight: format3(prev.actualWeight) }))}
                  />
                </label>
                <label>
                  Charged Weight (3 Decimals)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.chargedWeight}
                    onChange={(e) => setForm((prev) => ({ ...prev, chargedWeight: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, chargedWeight: format3(prev.chargedWeight) }))}
                  />
                </label>
                <label className="consignment-wide">
                  Description Of Goods
                  <textarea value={form.goodsDescription} onChange={(e) => setForm((prev) => ({ ...prev, goodsDescription: e.target.value }))} />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Charges And Billing</legend>
              <div className="consignment-fields">
                <label>
                  <span className="label-text">
                    Basic Freight<sup className="required">*</sup>
                  </span>
                  <input className="numeric-input" type="text" inputMode="decimal" value={basicFreightCalculated.toFixed(2)} readOnly />
                  {fieldErrors.basicFreight ? <small className="error-text">{fieldErrors.basicFreight}</small> : null}
                </label>
                <label>
                  S.T. Charge
                  <input type="text" inputMode="decimal" value={form.stCharge} onChange={(e) => setForm((prev) => ({ ...prev, stCharge: e.target.value }))} />
                </label>
                <label>
                  GST
                  <input type="text" inputMode="decimal" value={form.gstAmount} onChange={(e) => setForm((prev) => ({ ...prev, gstAmount: e.target.value }))} />
                </label>
                <label>
                  Hamali
                  <input type="text" inputMode="decimal" value={form.hamaliCharge} onChange={(e) => setForm((prev) => ({ ...prev, hamaliCharge: e.target.value }))} />
                </label>
                <label>
                  Door Delivery Charge
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.doorDeliveryCharge}
                    onChange={(e) => setForm((prev) => ({ ...prev, doorDeliveryCharge: e.target.value }))}
                  />
                </label>
                <label>
                  Collection Charge
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.collectionCharge}
                    onChange={(e) => setForm((prev) => ({ ...prev, collectionCharge: e.target.value }))}
                  />
                </label>
                <label>
                  Advance Paid
                  <input type="text" inputMode="decimal" value={form.advancePaid} onChange={(e) => setForm((prev) => ({ ...prev, advancePaid: e.target.value }))} />
                </label>
                <label>
                  Payment Basis
                  <select value={form.paymentBasis} onChange={(e) => setForm((prev) => ({ ...prev, paymentBasis: e.target.value }))}>
                    <option>To Pay</option>
                    <option>To Be Billed</option>
                    <option>Paid</option>
                  </select>
                </label>
                <label>
                  Invoice No
                  <input value={form.invoiceNo} onChange={(e) => setForm((prev) => ({ ...prev, invoiceNo: e.target.value }))} />
                </label>
                <label>
                  Invoice Date
                  <input type="date" value={form.invoiceDate} onChange={(e) => setForm((prev) => ({ ...prev, invoiceDate: e.target.value }))} />
                </label>
                <label>
                  Final Freight
                  <input value={freightAmount.toFixed(2)} readOnly />
                </label>
                <label className="consignment-wide">
                  Remarks
                  <textarea value={form.remarks} onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))} />
                </label>
              </div>
            </fieldset>
          </div>

          <datalist id="customer-name-options">
            {customers.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          <datalist id="location-name-options">
            {locations.map((l) => (
              <option key={l.id} value={toLocationRefValue(l)} />
            ))}
          </datalist>
          <datalist id="vehicle-no-options">
            {vehicles.map((v) => (
              <option key={v.id} value={v.vehicleNumber} />
            ))}
          </datalist>

          <div className="consignment-actions" style={{ marginTop: 12 }}>
            <button className="btn-primary" type="submit" disabled={loading}>
              {editingId ? "Update Consignment" : "Create Consignment"}
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
                <th>No</th>
                <th>Date</th>
                <th>Consignor</th>
                <th>Consignee</th>
                <th>Route</th>
                <th>Freight</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.consignmentNo}</td>
                  <td>{r.bookingDate}</td>
                  <td>{r.consignorName || "-"}</td>
                  <td>{r.consigneeName || "-"}</td>
                  <td>
                    {findLocationName(r.fromLocationId, locations)} - {findLocationName(r.toLocationId, locations)}
                  </td>
                  <td>Rs. {r.freightAmount.toFixed(2)}</td>
                  <td>{r.status}</td>
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

function emptyForm(): ConsignmentFormState {
  const today = new Date().toISOString().slice(0, 10)
  return {
    branchId: "",
    bookingDate: today,
    customerId: "",
    fromLocationName: "",
    toLocationName: "",
    consignorName: "",
    consignorAddress: "",
    consigneeName: "",
    consigneeAddress: "",
    consignorGstNo: "",
    consigneeGstNo: "",
    deliveryOfficeAddress: "",
    gstPayableBy: "Transport Agency",
    vehicleNo: "",
    privateMarkNo: "",
    packages: "0",
    goodsDescription: "",
    actualWeight: "0.000",
    chargedWeight: "0.000",
    ratePerQuintal: "0",
    basicFreight: "0",
    stCharge: "0",
    gstAmount: "0",
    hamaliCharge: "0",
    doorDeliveryCharge: "0",
    advancePaid: "0",
    collectionCharge: "0",
    paymentBasis: "To Pay",
    invoiceNo: "",
    invoiceDate: "",
    remarks: "",
  }
}

function validateConsignmentForm(
  form: ConsignmentFormState,
  fromLocationId: string | undefined,
  toLocationId: string | undefined
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.branchId) errors.branchId = "Branch is mandatory."
  if (!form.bookingDate) errors.bookingDate = "Booking date is mandatory."
  if (!form.customerId) errors.customerId = "Customer is mandatory."
  if (!form.vehicleNo.trim()) errors.vehicleNo = "Vehicle Number is mandatory."
  if (!form.consignorName.trim()) errors.consignorName = "Consignor is mandatory."
  if (!form.consigneeName.trim()) errors.consigneeName = "Consignee is mandatory."
  if (toAmount(form.packages) * toAmount(form.ratePerQuintal) <= 0) errors.basicFreight = "Basic Freight should be greater than zero."
  if (!fromLocationId) errors.fromLocationName = "Select a valid From location."
  if (!toLocationId) errors.toLocationName = "Select a valid To location."
  if (fromLocationId && toLocationId && fromLocationId === toLocationId) {
    errors.toLocationName = "From and To location cannot be same."
  }
  return errors
}

function toPayload(
  form: ConsignmentFormState,
  freightAmount: number,
  fromLocationId: string,
  toLocationId: string,
  basicFreightCalculated: number
): ConsignmentUpsert {
  return {
    branchId: form.branchId,
    bookingDate: form.bookingDate,
    customerId: form.customerId,
    fromLocationId,
    toLocationId,
    consignorName: form.consignorName.trim(),
    consignorAddress: form.consignorAddress.trim(),
    consigneeName: form.consigneeName.trim(),
    consigneeAddress: form.consigneeAddress.trim(),
    consignorGstNo: form.consignorGstNo.trim(),
    consigneeGstNo: form.consigneeGstNo.trim(),
    deliveryOfficeAddress: form.deliveryOfficeAddress.trim(),
    gstPayableBy: form.gstPayableBy,
    vehicleNo: form.vehicleNo.trim(),
    privateMarkNo: form.privateMarkNo.trim(),
    packages: Math.max(0, Math.floor(toAmount(form.packages))),
    goodsDescription: form.goodsDescription.trim(),
    actualWeight: toWeight(form.actualWeight),
    chargedWeight: toWeight(form.chargedWeight),
    ratePerQuintal: toAmount(form.ratePerQuintal),
    basicFreight: basicFreightCalculated,
    stCharge: toAmount(form.stCharge),
    gstAmount: toAmount(form.gstAmount),
    hamaliCharge: toAmount(form.hamaliCharge),
    doorDeliveryCharge: toAmount(form.doorDeliveryCharge),
    advancePaid: toAmount(form.advancePaid),
    collectionCharge: toAmount(form.collectionCharge),
    paymentBasis: form.paymentBasis,
    invoiceNo: form.invoiceNo.trim(),
    invoiceDate: form.invoiceDate || undefined,
    freightAmount,
    remarks: form.remarks.trim(),
  }
}

function toAmount(value: string): number {
  const cleaned = value.replace(/,/g, "").trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function toWeight(value: string): number {
  return Number(toAmount(value).toFixed(3))
}

function format3(value: string): string {
  return toWeight(value).toFixed(3)
}

function findCustomerByName(name: string, options: CustomerOption[]): CustomerOption | undefined {
  const needle = name.trim().toLowerCase()
  if (!needle) return undefined
  return options.find((option) => option.name.trim().toLowerCase() === needle)
}

function findLocationId(name: string, options: LocationOption[]): string | undefined {
  const needle = name.trim().toLowerCase()
  if (!needle) return undefined
  return options.find((option) => {
    const code = option.code.trim().toLowerCase()
    const label = `${option.code} - ${option.name}`.trim().toLowerCase()
    const locationName = option.name.trim().toLowerCase()
    return locationName === needle || code === needle || label === needle
  })?.id
}

function findLocationName(id: string, options: LocationOption[]): string {
  return options.find((option) => option.id === id)?.name ?? id.slice(0, 8)
}

function toLocationRefValue(location: LocationOption | undefined): string {
  if (!location) return ""
  return `${location.code} - ${location.name}`
}
