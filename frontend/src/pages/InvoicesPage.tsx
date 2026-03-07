import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"
import type { Branch, Consignment, Customer, Invoice, Vehicle } from "../types"

type TabKey = "form" | "list"
type InvoiceLine = {
  consignmentNo: string
  description: string
  packages: string
  weight: string
  rate: string
  amount: string
  tax: string
}
type FormState = {
  branchId: string
  invoiceDate: string
  dueDate: string
  vehicleNo: string
  billToName: string
  billToAddress: string
  billToMobile: string
}

export function InvoicesPage() {
  const [tab, setTab] = useState<TabKey>("form")
  const [rows, setRows] = useState<Invoice[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [consignments, setConsignments] = useState<Consignment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [form, setForm] = useState<FormState>(emptyForm())
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()])
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
  const totalWeight = useMemo(() => lines.reduce((sum, line) => sum + toAmount(line.weight), 0), [lines])
  const taxableAmount = useMemo(() => lines.reduce((sum, line) => sum + toAmount(line.amount), 0), [lines])
  const taxTotal = useMemo(() => lines.reduce((sum, line) => sum + toAmount(line.tax), 0), [lines])
  const grandTotal = taxableAmount + taxTotal
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  async function loadAll() {
    setLoading(true)
    setError("")
    try {
      const [invoiceRows, branchRows, consignmentRows, customerRows, vehicleRows] = await Promise.all([
        api.invoices(),
        api.branches(),
        api.consignments(),
        api.customers(),
        api.vehicles(),
      ])
      setRows(invoiceRows)
      setBranches(branchRows)
      setConsignments(consignmentRows)
      setCustomers(customerRows)
      setVehicles(vehicleRows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    const primaryConsignmentId = findConsignmentId(lines[0]?.consignmentNo || "", consignments)
    const nonEmptyLines = lines.filter((line) => line.consignmentNo.trim() || line.description.trim() || toAmount(line.amount) > 0)
    const errors = validateInvoiceForm(form, nonEmptyLines, primaryConsignmentId)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await api.createInvoice({
        branchId: form.branchId,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || undefined,
        consignmentId: primaryConsignmentId!,
        challanIds: [],
        taxableAmount,
        gstAmount: taxTotal,
        totalAmount: grandTotal,
      })
      setMessage("Invoice created.")
      onReset()
      await loadAll()
      setTab("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save invoice")
    }
  }

  function onReset() {
    setForm((prev) => ({
      ...emptyForm(),
      branchId: prev.branchId,
      vehicleNo: prev.vehicleNo,
    }))
    setLines([emptyLine()])
    setFieldErrors({})
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()])
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)))
  }

  function updateLine(index: number, patch: Partial<InvoiceLine>) {
    setLines((prev) =>
      prev.map((line, idx) => {
        if (idx !== index) return line
        const next = { ...line, ...patch }
        if (patch.weight !== undefined || patch.rate !== undefined) {
          const weight = toAmount(next.weight)
          const rate = toAmount(next.rate)
          if (Number.isFinite(weight) && Number.isFinite(rate)) {
            next.amount = (weight * rate).toString()
          }
        }
        return next
      })
    )
  }

  function onConsignmentChange(index: number, consignmentNo: string) {
    const consignment = findConsignmentByNo(consignmentNo, consignments)
    if (!consignment) {
      updateLine(index, { consignmentNo })
      return
    }

    const autoAmount = consignment.freightAmount || 0
    const autoPkg = consignment.packages || 0
    const autoWeight = consignment.chargedWeight || consignment.actualWeight || 0
    const autoRate = consignment.ratePerQuintal || (autoPkg > 0 ? autoAmount / autoPkg : 0)
    updateLine(index, {
      consignmentNo: consignment.consignmentNo,
      description: consignment.goodsDescription || "",
      packages: String(autoPkg),
      weight: String(autoWeight),
      rate: String(autoRate),
      amount: String(autoWeight * autoRate),
      tax: "0",
    })

    if (!form.billToName && consignment.consignorName) {
      setForm((prev) => ({
        ...prev,
        billToName: consignment.consignorName || prev.billToName,
        billToAddress: consignment.consignorAddress || prev.billToAddress,
      }))
    }
  }

  function onBillToChange(value: string) {
    const customer = findCustomerByName(value, customers)
    setForm((prev) => ({
      ...prev,
      billToName: value,
      billToAddress: customer?.address || prev.billToAddress,
      billToMobile: customer?.mobile || prev.billToMobile,
    }))
  }

  return (
    <section className="panel consignment-layout">
      <div className="consignment-toolbar">
        <div>
          <h2>Invoice</h2>
          <p>Create invoices with multiple consignments, tax, and running totals.</p>
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
              <legend>Invoice Header</legend>
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
                    Invoice Date<sup className="required">*</sup>
                  </span>
                  <input type="date" value={form.invoiceDate} onChange={(e) => setForm((prev) => ({ ...prev, invoiceDate: e.target.value }))} />
                  {fieldErrors.invoiceDate ? <small className="error-text">{fieldErrors.invoiceDate}</small> : null}
                </label>
                <label>
                  Due Date
                  <input type="date" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
                </label>
                <label>
                  Vehicle No
                  <input list="invoice-vehicle-options" value={form.vehicleNo} onChange={(e) => setForm((prev) => ({ ...prev, vehicleNo: e.target.value }))} />
                </label>
                <label>
                  Bill To
                  <input list="invoice-customer-options" value={form.billToName} onChange={(e) => onBillToChange(e.target.value)} />
                </label>
                <label>
                  Bill To Mobile
                  <input value={form.billToMobile} onChange={(e) => setForm((prev) => ({ ...prev, billToMobile: e.target.value }))} />
                </label>
                <label className="consignment-wide">
                  Bill To Address
                  <textarea value={form.billToAddress} onChange={(e) => setForm((prev) => ({ ...prev, billToAddress: e.target.value }))} />
                </label>
              </div>
            </fieldset>
          </div>

          <fieldset style={{ marginTop: 12 }}>
            <legend>Consignment And Description Rows</legend>
            <table className="lorry-lines-table">
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "34%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "4%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Consignment No</th>
                  <th>Description</th>
                  <th>Pkg.</th>
                  <th>Weight</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Tax</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={`inv-line-${idx}`}>
                    <td>
                      <input list="invoice-consignment-options" value={line.consignmentNo} onChange={(e) => onConsignmentChange(idx, e.target.value)} />
                    </td>
                    <td>
                      <input className="lr-col-wide" value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                    </td>
                    <td>
                      <input value={line.packages} onChange={(e) => updateLine(idx, { packages: e.target.value })} />
                    </td>
                    <td>
                      <input
                        className="numeric-input"
                        value={line.weight}
                        onChange={(e) => updateLine(idx, { weight: e.target.value })}
                        onBlur={() => updateLine(idx, { weight: toWeight(line.weight).toFixed(3) })}
                      />
                    </td>
                    <td>
                      <input
                        className="numeric-input"
                        value={line.rate}
                        onChange={(e) => updateLine(idx, { rate: e.target.value })}
                        onBlur={() => updateLine(idx, { rate: toAmount(line.rate).toFixed(2) })}
                      />
                    </td>
                    <td>
                      <input
                        className="numeric-input"
                        value={line.amount}
                        onChange={(e) => updateLine(idx, { amount: e.target.value })}
                        onBlur={() => updateLine(idx, { amount: toAmount(line.amount).toFixed(2) })}
                      />
                    </td>
                    <td>
                      <input
                        className="numeric-input"
                        value={line.tax}
                        onChange={(e) => updateLine(idx, { tax: e.target.value })}
                        onBlur={() => updateLine(idx, { tax: toAmount(line.tax).toFixed(2) })}
                      />
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
                  <td />
                  <td>{totalPkg.toFixed(0)}</td>
                  <td>{totalWeight.toFixed(3)}</td>
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
                <tr>
                  <td colSpan={5} />
                  <td colSpan={3}>
                    <strong>Total Tax:</strong> {taxTotal.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} />
                  <td colSpan={3}>
                    <strong>Total Amount:</strong> {taxableAmount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} />
                  <td colSpan={3}>
                    <strong>Grand Total:</strong> {grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
            {fieldErrors.lines ? <small className="error-text">{fieldErrors.lines}</small> : null}
            <div style={{ marginTop: 10 }}>
              <button className="btn-secondary" type="button" onClick={addLine}>
                Add Row
              </button>
            </div>
          </fieldset>

          <datalist id="invoice-consignment-options">
            {consignments.map((row) => (
              <option key={row.id} value={row.consignmentNo} />
            ))}
          </datalist>
          <datalist id="invoice-customer-options">
            {customers.map((row) => (
              <option key={row.id} value={row.name} />
            ))}
          </datalist>
          <datalist id="invoice-vehicle-options">
            {vehicles.map((row) => (
              <option key={row.id} value={row.vehicleNumber} />
            ))}
          </datalist>

          <div className="consignment-actions" style={{ marginTop: 12 }}>
            <button className="btn-primary" type="submit" disabled={loading}>
              Create Invoice
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
                <th>Invoice No</th>
                <th>Date</th>
                <th>Taxable</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.invoiceNo}</td>
                  <td>{row.invoiceDate}</td>
                  <td>{row.taxableAmount.toFixed(2)}</td>
                  <td>{row.gstAmount.toFixed(2)}</td>
                  <td>{row.totalAmount.toFixed(2)}</td>
                  <td>{row.receivedAmount.toFixed(2)}</td>
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
    invoiceDate: today,
    dueDate: "",
    vehicleNo: "",
    billToName: "",
    billToAddress: "",
    billToMobile: "",
  }
}

function emptyLine(): InvoiceLine {
  return {
    consignmentNo: "",
    description: "",
    packages: "0",
    weight: "0.000",
    rate: "0.00",
    amount: "0.00",
    tax: "0.00",
  }
}

function validateInvoiceForm(
  form: FormState,
  lines: InvoiceLine[],
  primaryConsignmentId?: string
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.branchId) errors.branchId = "Branch is mandatory."
  if (!form.invoiceDate) errors.invoiceDate = "Invoice date is mandatory."
  if (!primaryConsignmentId) errors.lines = "First row must include a valid consignment number."
  if (lines.length === 0) errors.lines = "At least one consignment row is mandatory."
  return errors
}

function toAmount(value: string): number {
  const cleaned = value.replace(/,/g, "").trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function toWeight(value: string): number {
  return Number(toAmount(value).toFixed(3))
}

function findConsignmentByNo(consignmentNo: string, options: Consignment[]): Consignment | undefined {
  const needle = consignmentNo.trim().toLowerCase()
  if (!needle) return undefined
  return options.find((x) => x.consignmentNo.trim().toLowerCase() === needle)
}

function findConsignmentId(consignmentNo: string, options: Consignment[]): string | undefined {
  return findConsignmentByNo(consignmentNo, options)?.id
}

function findCustomerByName(name: string, options: Customer[]): Customer | undefined {
  const needle = name.trim().toLowerCase()
  if (!needle) return undefined
  return options.find((x) => x.name.trim().toLowerCase() === needle)
}
