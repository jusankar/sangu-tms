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
import { Textarea } from "../components/ui/textarea"
import { TypeaheadInput } from "../components/ui/typeahead-input"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"
import { formatDate } from "../lib/reporting"
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
  consignmentNo: string
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
  const basicFreightEffective = basicFreightCalculated > 0 ? basicFreightCalculated : toAmount(form.basicFreight)

  const freightAmount = useMemo(() => {
    const totalCharges =
      basicFreightEffective +
      toAmount(form.stCharge) +
      toAmount(form.gstAmount) +
      toAmount(form.hamaliCharge) +
      toAmount(form.doorDeliveryCharge) +
      toAmount(form.collectionCharge)
    return totalCharges - toAmount(form.advancePaid)
  }, [
    form.advancePaid,
    basicFreightEffective,
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
      setForm((prev) => ({
        ...prev,
        consignmentNo: prev.consignmentNo || nextDocumentNo("CN/GEN", consignments.map((x) => x.consignmentNo)),
      }))
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
    const errors = validateConsignmentForm(form, fromLocationId, toLocationId, rows, editingId)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = toPayload(form, freightAmount, fromLocationId!, toLocationId!, basicFreightEffective)

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
      consignmentNo: row.consignmentNo,
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
      consignmentNo: nextDocumentNo("CN/GEN", rows.map((x) => x.consignmentNo)),
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
              <legend>Booking And Parties</legend>
              <div className="consignment-fields">
                <FormField label="Consignment No" required error={fieldErrors.consignmentNo}>
                  <Input
                    id="consignmentNo"
                    value={form.consignmentNo}
                    onChange={(e) => setForm((prev) => ({ ...prev, consignmentNo: e.target.value }))}
                  />
                </FormField>
                <FormField label="Branch" required error={fieldErrors.branchId}>
                  <Select value={form.branchId} onValueChange={(v) => setForm((prev) => ({ ...prev, branchId: v }))}>
                    <SelectTrigger id="branchId" className="w-full">
                      <SelectValue placeholder="Select branch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.code} - {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Booking Date" required error={fieldErrors.bookingDate}>
                  <DatePicker
                    value={form.bookingDate}
                    onChange={(value) => setForm((prev) => ({ ...prev, bookingDate: value }))}
                  />
                </FormField>
                <FormField label="Customer" required error={fieldErrors.customerId}>
                  <Select value={form.customerId} onValueChange={(v) => setForm((prev) => ({ ...prev, customerId: v }))}>
                    <SelectTrigger id="customerId" className="w-full">
                      <SelectValue placeholder="Select customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Vehicle No" required error={fieldErrors.vehicleNo}>
                  <TypeaheadInput
                    listId="vehicle-no-options"
                    options={vehicles.map((v) => v.vehicleNumber)}
                    value={form.vehicleNo}
                    onChange={(e) => setForm((prev) => ({ ...prev, vehicleNo: e.target.value }))}
                  />
                </FormField>
                <FormField label="Consignor" required error={fieldErrors.consignorName}>
                  <TypeaheadInput
                    listId="customer-name-options"
                    options={customers.map((c) => c.name)}
                    value={form.consignorName}
                    onChange={(e) => onConsignorChange(e.target.value)}
                  />
                </FormField>
                <FormField label="Consignee" required error={fieldErrors.consigneeName}>
                  <TypeaheadInput
                    listId="customer-name-options-ee"
                    options={customers.map((c) => c.name)}
                    value={form.consigneeName}
                    onChange={(e) => onConsigneeChange(e.target.value)}
                  />
                </FormField>
                <FormField label="Consignor Address" fullWidth>
                  <Textarea
                    value={form.consignorAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, consignorAddress: e.target.value }))}
                  />
                </FormField>
                <FormField label="Consignee Address" fullWidth>
                  <Textarea
                    value={form.consigneeAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, consigneeAddress: e.target.value }))}
                  />
                </FormField>
                <FormField label="Consignor GST">
                  <Input
                    value={form.consignorGstNo}
                    onChange={(e) => setForm((prev) => ({ ...prev, consignorGstNo: e.target.value }))}
                  />
                </FormField>
                <FormField label="Consignee GST">
                  <Input
                    value={form.consigneeGstNo}
                    onChange={(e) => setForm((prev) => ({ ...prev, consigneeGstNo: e.target.value }))}
                  />
                </FormField>
              </div>
            </fieldset>

            <fieldset>
              <legend>Route And Delivery</legend>
              <div className="consignment-fields">
                <FormField label="From Location" error={fieldErrors.fromLocationName}>
                  <TypeaheadInput
                    listId="location-name-options"
                    options={locations.map((l) => toLocationRefValue(l))}
                    value={form.fromLocationName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fromLocationName: e.target.value }))}
                  />
                </FormField>
                <FormField label="To Location" error={fieldErrors.toLocationName}>
                  <TypeaheadInput
                    listId="location-name-options-to"
                    options={locations.map((l) => toLocationRefValue(l))}
                    value={form.toLocationName}
                    onChange={(e) => setForm((prev) => ({ ...prev, toLocationName: e.target.value }))}
                  />
                </FormField>
                <FormField label="Delivery Office Address" fullWidth>
                  <Textarea
                    value={form.deliveryOfficeAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, deliveryOfficeAddress: e.target.value }))}
                  />
                </FormField>
                <FormField label="GST Payable By">
                  <Select value={form.gstPayableBy} onValueChange={(v) => setForm((prev) => ({ ...prev, gstPayableBy: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transport Agency">Transport Agency</SelectItem>
                      <SelectItem value="Consignor">Consignor</SelectItem>
                      <SelectItem value="Consignee">Consignee</SelectItem>
                      <SelectItem value="Exempted">Exempted</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Private Mark No">
                  <Input
                    value={form.privateMarkNo}
                    onChange={(e) => setForm((prev) => ({ ...prev, privateMarkNo: e.target.value }))}
                  />
                </FormField>
              </div>
            </fieldset>

            <fieldset>
              <legend>Goods And Weight</legend>
              <div className="consignment-fields">
                <FormField label="Packages">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={form.packages}
                    onChange={(e) => setForm((prev) => ({ ...prev, packages: e.target.value }))}
                  />
                </FormField>
                <FormField label="Rate Per Qtl">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.ratePerQuintal}
                    onChange={(e) => setForm((prev) => ({ ...prev, ratePerQuintal: e.target.value }))}
                  />
                </FormField>
                <FormField label="Actual Weight (3 Decimals)">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.actualWeight}
                    onChange={(e) => setForm((prev) => ({ ...prev, actualWeight: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, actualWeight: format3(prev.actualWeight) }))}
                  />
                </FormField>
                <FormField label="Charged Weight (3 Decimals)">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.chargedWeight}
                    onChange={(e) => setForm((prev) => ({ ...prev, chargedWeight: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, chargedWeight: format3(prev.chargedWeight) }))}
                  />
                </FormField>
                <FormField label="Description Of Goods" fullWidth>
                  <Textarea
                    value={form.goodsDescription}
                    onChange={(e) => setForm((prev) => ({ ...prev, goodsDescription: e.target.value }))}
                  />
                </FormField>
              </div>
            </fieldset>

            <fieldset>
              <legend>Charges And Billing</legend>
              <div className="consignment-fields">
                <FormField label="Basic Freight" required error={fieldErrors.basicFreight}>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.basicFreight}
                    placeholder={basicFreightCalculated > 0 ? basicFreightCalculated.toFixed(2) : "0.00"}
                    onChange={(e) => setForm((prev) => ({ ...prev, basicFreight: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, basicFreight: format2(prev.basicFreight) }))}
                    className="text-right"
                  />
                </FormField>
                <FormField label="S.T. Charge">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.stCharge}
                    onChange={(e) => setForm((prev) => ({ ...prev, stCharge: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, stCharge: format2(prev.stCharge) }))}
                    className="text-right"
                  />
                </FormField>
                <FormField label="GST">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.gstAmount}
                    onChange={(e) => setForm((prev) => ({ ...prev, gstAmount: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, gstAmount: format2(prev.gstAmount) }))}
                    className="text-right"
                  />
                </FormField>
                <FormField label="Hamali">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.hamaliCharge}
                    onChange={(e) => setForm((prev) => ({ ...prev, hamaliCharge: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, hamaliCharge: format2(prev.hamaliCharge) }))}
                    className="text-right"
                  />
                </FormField>
                <FormField label="Door Delivery Charge">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.doorDeliveryCharge}
                    onChange={(e) => setForm((prev) => ({ ...prev, doorDeliveryCharge: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, doorDeliveryCharge: format2(prev.doorDeliveryCharge) }))}
                    className="text-right"
                  />
                </FormField>
                <FormField label="Collection Charge">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.collectionCharge}
                    onChange={(e) => setForm((prev) => ({ ...prev, collectionCharge: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, collectionCharge: format2(prev.collectionCharge) }))}
                    className="text-right"
                  />
                </FormField>
                <FormField label="Advance Paid">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.advancePaid}
                    onChange={(e) => setForm((prev) => ({ ...prev, advancePaid: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, advancePaid: format2(prev.advancePaid) }))}
                    className="text-right"
                  />
                </FormField>
                <FormField label="Payment Basis">
                  <Select value={form.paymentBasis} onValueChange={(v) => setForm((prev) => ({ ...prev, paymentBasis: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Pay">To Pay</SelectItem>
                      <SelectItem value="To Be Billed">To Be Billed</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Invoice No">
                  <Input
                    value={form.invoiceNo}
                    onChange={(e) => setForm((prev) => ({ ...prev, invoiceNo: e.target.value }))}
                  />
                </FormField>
                <FormField label="Invoice Date">
                  <DatePicker
                    value={form.invoiceDate}
                    onChange={(value) => setForm((prev) => ({ ...prev, invoiceDate: value }))}
                  />
                </FormField>
                <FormField label="Final Freight">
                  <Input value={freightAmount.toFixed(2)} readOnly className="text-right bg-muted" />
                </FormField>
                <FormField label="Remarks" fullWidth>
                  <Textarea
                    value={form.remarks}
                    onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  />
                </FormField>
              </div>
            </fieldset>
          </div>

          <div className="consignment-actions" style={{ marginTop: 16 }}>
            <Button type="submit" disabled={loading}>
              {editingId ? "Update Consignment" : "Create Consignment"}
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
                  <td>{formatDate(r.bookingDate)}</td>
                  <td>{r.consignorName || "-"}</td>
                  <td>{r.consigneeName || "-"}</td>
                  <td>
                    {findLocationName(r.fromLocationId, locations)} - {findLocationName(r.toLocationId, locations)}
                  </td>
                  <td className="numeric-cell">Rs. {r.freightAmount.toFixed(2)}</td>
                  <td>{r.status}</td>
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

function emptyForm(): ConsignmentFormState {
  const today = new Date().toISOString().slice(0, 10)
  return {
    consignmentNo: "",
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
    basicFreight: "0.00",
    stCharge: "0.00",
    gstAmount: "0.00",
    hamaliCharge: "0.00",
    doorDeliveryCharge: "0.00",
    advancePaid: "0.00",
    collectionCharge: "0.00",
    paymentBasis: "To Pay",
    invoiceNo: "",
    invoiceDate: "",
    remarks: "",
  }
}

function validateConsignmentForm(
  form: ConsignmentFormState,
  fromLocationId: string | undefined,
  toLocationId: string | undefined,
  rows: Consignment[],
  editingId: string | null
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.consignmentNo.trim()) {
    errors.consignmentNo = "Consignment number is mandatory."
  } else if (
    rows.some((x) => x.id !== editingId && x.consignmentNo.trim().toLowerCase() === form.consignmentNo.trim().toLowerCase())
  ) {
    errors.consignmentNo = "Consignment number already exists."
  }
  if (!form.branchId) errors.branchId = "Branch is mandatory."
  if (!form.bookingDate) errors.bookingDate = "Booking date is mandatory."
  if (!form.customerId) errors.customerId = "Customer is mandatory."
  if (!form.vehicleNo.trim()) errors.vehicleNo = "Vehicle Number is mandatory."
  if (!form.consignorName.trim()) errors.consignorName = "Consignor is mandatory."
  if (!form.consigneeName.trim()) errors.consigneeName = "Consignee is mandatory."
  if ((toAmount(form.packages) * toAmount(form.ratePerQuintal) <= 0) && toAmount(form.basicFreight) <= 0) {
    errors.basicFreight = "Basic Freight should be greater than zero."
  }
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
    consignmentNo: form.consignmentNo.trim() || undefined,
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

function format2(value: string): string {
  return toAmount(value).toFixed(2)
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
