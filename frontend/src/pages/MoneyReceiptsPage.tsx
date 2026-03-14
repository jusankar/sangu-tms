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
import type { Branch, Consignment, Customer, Invoice, MoneyReceipt } from "../types"

type TabKey = "form" | "list"
type ReceiptLine = {
  invoiceNo: string
  consignmentNo: string
  description: string
  weight: string
  rate: string
  amount: string
  deduction: string
}
type FormState = {
  receiptNo: string
  branchId: string
  receiptDate: string
  customerName: string
  customerAddress: string
  customerMobile: string
  mode: "cash" | "cheque" | "dd" | "online" | "upi"
  receivedAmount: string
  referenceNo: string
  chequeDate: string
  drawnOn: string
}

export function MoneyReceiptsPage() {
  const [tab, setTab] = useState<TabKey>("form")
  const [rows, setRows] = useState<MoneyReceipt[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [consignments, setConsignments] = useState<Consignment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
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

  const totalAmount = useMemo(() => lines.reduce((sum, line) => sum + toAmount(line.amount), 0), [lines])
  const totalDeduction = useMemo(() => lines.reduce((sum, line) => sum + toAmount(line.deduction), 0), [lines])
  const totalPayable = useMemo(() => lines.reduce((sum, line) => sum + (toAmount(line.amount) - toAmount(line.deduction)), 0), [lines])
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  async function loadAll() {
    setLoading(true)
    setError("")
    try {
      const [receiptRows, invoiceRows, consignmentRows, customerRows, branchRows] = await Promise.all([
        api.receipts(),
        api.invoices(),
        api.consignments(),
        api.customers(),
        api.branches(),
      ])
      setRows(receiptRows)
      setInvoices(invoiceRows)
      setConsignments(consignmentRows)
      setCustomers(customerRows)
      setBranches(branchRows)
      setForm((prev) => ({
        ...prev,
        receiptNo: prev.receiptNo || nextDocumentNo("RC/GEN", receiptRows.map((x) => x.receiptNo)),
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load money receipts")
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")

    const invoiceAmounts = computeInvoiceAmountMap(lines, invoices)
    const errors = validateForm(form, lines, totalPayable, invoiceAmounts, rows)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      let index = 0
      for (const [invoiceId, amount] of invoiceAmounts) {
        if (amount <= 0) continue
        await api.createReceiptForInvoice(invoiceId, {
          receiptNo: resolveReceiptNo(form.receiptNo, index),
          branchId: form.branchId,
          receiptDate: form.receiptDate,
          amount,
          mode: form.mode,
          referenceNo: form.referenceNo.trim() || undefined,
        })
        index += 1
      }
      setMessage("Money receipt posted.")
      onReset()
      await loadAll()
      setTab("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post money receipt")
    }
  }

  function onCustomerChange(name: string) {
    const customer = findCustomerByName(name, customers)
    setForm((prev) => ({
      ...prev,
      customerName: name,
      customerAddress: customer?.address || prev.customerAddress,
      customerMobile: customer?.mobile || prev.customerMobile,
    }))
  }

  function onInvoiceChange(index: number, value: string) {
    const invoice = findInvoiceByNo(value, invoices)
    if (!invoice) {
      updateLine(index, { invoiceNo: value })
      return
    }
    const consignment = consignments.find((x) => x.id === invoice.consignmentId)
    updateLine(index, {
      invoiceNo: invoice.invoiceNo,
      consignmentNo: consignment?.consignmentNo || "",
      description: "Bill Amount",
      weight: consignment ? toWeight(consignment.chargedWeight || consignment.actualWeight).toFixed(3) : "0.000",
      rate: consignment ? toAmount(consignment.ratePerQuintal).toFixed(2) : "0.00",
      amount: toAmount(invoice.totalAmount).toFixed(2),
      deduction: "0.00",
    })

    if (!form.customerName && consignment?.consignorName) {
      onCustomerChange(consignment.consignorName)
    }
  }

  function updateLine(index: number, patch: Partial<ReceiptLine>) {
    setLines((prev) =>
      prev.map((line, idx) => {
        if (idx !== index) return line
        const next = { ...line, ...patch }
        if (patch.weight !== undefined || patch.rate !== undefined) {
          const weight = toAmount(next.weight)
          const rate = toAmount(next.rate)
          if (Number.isFinite(weight) && Number.isFinite(rate) && (patch.amount === undefined || patch.amount === line.amount)) {
            next.amount = (weight * rate).toFixed(2)
          }
        }
        return next
      })
    )
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()])
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)))
  }

  function onReset() {
    setForm((prev) => ({
      ...emptyForm(),
      receiptNo: nextDocumentNo("RC/GEN", rows.map((x) => x.receiptNo)),
      branchId: prev.branchId,
    }))
    setLines([emptyLine()])
    setFieldErrors({})
  }

  return (
    <section className="panel consignment-layout">
      <div className="consignment-toolbar">
        <div>
          <h2>Money Receipt</h2>
          <p>Post customer receipts against one or more invoices with deductions.</p>
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
            <fieldset className="consignment-wide">
              <legend>Receipt Header</legend>
              <div className="consignment-fields">
                <FormField label="Receipt No" required error={fieldErrors.receiptNo}>
                  <Input value={form.receiptNo} onChange={(e) => setForm((prev) => ({ ...prev, receiptNo: e.target.value }))} />
                </FormField>
                <FormField label="Branch" required>
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
                <FormField label="Date" required>
                  <DatePicker value={form.receiptDate} onChange={(value) => setForm((prev) => ({ ...prev, receiptDate: value }))} />
                </FormField>
                <FormField label="Customer" required error={fieldErrors.customerName}>
                  <TypeaheadInput listId="customer-options" options={customers.map((c) => c.name)} value={form.customerName} onChange={(e) => onCustomerChange(e.target.value)} />
                </FormField>
                <FormField label="Customer Mobile">
                  <Input value={form.customerMobile} onChange={(e) => setForm((prev) => ({ ...prev, customerMobile: e.target.value }))} />
                </FormField>
                <FormField label="Customer Address" fullWidth>
                  <Textarea value={form.customerAddress} onChange={(e) => setForm((prev) => ({ ...prev, customerAddress: e.target.value }))} />
                </FormField>
                <FormField label="Payment Mode">
                  <Select value={form.mode} onValueChange={(v) => setForm((prev) => ({ ...prev, mode: v as FormState["mode"] }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="dd">DD</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Reference No">
                  <Input value={form.referenceNo} onChange={(e) => setForm((prev) => ({ ...prev, referenceNo: e.target.value }))} />
                </FormField>
                <FormField label="Cheque/DD Date">
                  <DatePicker value={form.chequeDate} onChange={(value) => setForm((prev) => ({ ...prev, chequeDate: value }))} />
                </FormField>
                <FormField label="Drawn On (Bank)">
                  <Input value={form.drawnOn} onChange={(e) => setForm((prev) => ({ ...prev, drawnOn: e.target.value }))} />
                </FormField>
                <FormField label="Received Amount" required error={fieldErrors.receivedAmount}>
                  <Input className="text-right" value={form.receivedAmount} onChange={(e) => setForm((prev) => ({ ...prev, receivedAmount: e.target.value }))} onBlur={() => setForm((prev) => ({ ...prev, receivedAmount: toAmount(prev.receivedAmount).toFixed(2) }))} />
                </FormField>
              </div>
            </fieldset>
          </div>

          <fieldset style={{ marginTop: 12 }}>
            <legend>Invoice Allocation And Deductions</legend>
            <table className="lorry-lines-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Consignment No</th>
                  <th>Description</th>
                  <th>Weight</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Deduction</th>
                  <th>Payable</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const payable = toAmount(line.amount) - toAmount(line.deduction)
                  return (
                    <tr key={`mr-line-${idx}`}>
                      <td>
                        <TypeaheadInput listId={`mr-inv-${idx}`} options={invoices.map((i) => i.invoiceNo)} value={line.invoiceNo} onChange={(e) => onInvoiceChange(idx, e.target.value)} className="w-full" />
                      </td>
                      <td>
                        <Input className="w-full" value={line.consignmentNo} onChange={(e) => updateLine(idx, { consignmentNo: e.target.value })} />
                      </td>
                      <td>
                        <Input className="lr-col-wide w-full" value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                      </td>
                      <td>
                        <Input className="text-right w-full" value={line.weight} onChange={(e) => updateLine(idx, { weight: e.target.value })} onBlur={() => updateLine(idx, { weight: toWeight(line.weight).toFixed(3) })} />
                      </td>
                      <td>
                        <Input className="text-right w-full" value={line.rate} onChange={(e) => updateLine(idx, { rate: e.target.value })} onBlur={() => updateLine(idx, { rate: toAmount(line.rate).toFixed(2) })} />
                      </td>
                      <td>
                        <Input className="text-right w-full" value={line.amount} onChange={(e) => updateLine(idx, { amount: e.target.value })} onBlur={() => updateLine(idx, { amount: toAmount(line.amount).toFixed(2) })} />
                      </td>
                      <td>
                        <Input className="text-right w-full" value={line.deduction} onChange={(e) => updateLine(idx, { deduction: e.target.value })} onBlur={() => updateLine(idx, { deduction: toAmount(line.deduction).toFixed(2) })} />
                      </td>
                      <td className="numeric-cell">{payable.toFixed(2)}</td>
                      <td>
                        <Button variant="destructive" size="sm" type="button" onClick={() => removeLine(idx)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} />
                  <td className="numeric-cell"><strong>{totalAmount.toFixed(2)}</strong></td>
                  <td className="numeric-cell"><strong>{totalDeduction.toFixed(2)}</strong></td>
                  <td className="numeric-cell"><strong>{totalPayable.toFixed(2)}</strong></td>
                  <td />
                </tr>
              </tfoot>
            </table>
            {fieldErrors.lines ? <small className="error-text">{fieldErrors.lines}</small> : null}
            {fieldErrors.amountMatch ? <small className="error-text">{fieldErrors.amountMatch}</small> : null}
            <div style={{ marginTop: 10 }}>
              <Button variant="outline" size="sm" type="button" onClick={addLine}>
                Add Line
              </Button>
            </div>
          </fieldset>

          <div className="consignment-actions" style={{ marginTop: 12 }}>
            <Button type="submit" disabled={loading}>
              Post Money Receipt
            </Button>
            <Button variant="outline" type="button" onClick={onReset}>
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
                <th>Invoice No</th>
                <th>Mode</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.receiptNo}</td>
                  <td>{formatDate(row.receiptDate)}</td>
                  <td>{findInvoiceNoById(row.invoiceId, invoices) || "-"}</td>
                  <td>{row.mode}</td>
                  <td>{row.referenceNo || "-"}</td>
                  <td className="numeric-cell">{row.amount.toFixed(2)}</td>
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
    receiptNo: "",
    branchId: "",
    receiptDate: today,
    customerName: "",
    customerAddress: "",
    customerMobile: "",
    mode: "cash",
    receivedAmount: "0.00",
    referenceNo: "",
    chequeDate: "",
    drawnOn: "",
  }
}

function emptyLine(): ReceiptLine {
  return {
    invoiceNo: "",
    consignmentNo: "",
    description: "",
    weight: "0.000",
    rate: "0.00",
    amount: "0.00",
    deduction: "0.00",
  }
}

function validateForm(
  form: FormState,
  lines: ReceiptLine[],
  totalPayable: number,
  invoiceAmounts: Map<string, number>,
  rows: MoneyReceipt[]
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.receiptNo.trim()) errors.receiptNo = "Receipt number is mandatory."
  if (rows.some((x) => x.receiptNo.trim().toLowerCase() === form.receiptNo.trim().toLowerCase())) {
    errors.receiptNo = "Receipt number already exists."
  }
  if (!form.branchId) errors.branchId = "Branch is mandatory."
  if (!form.receiptDate) errors.receiptDate = "Date is mandatory."
  if (!form.customerName.trim()) errors.customerName = "Customer is mandatory."
  if (lines.every((line) => !line.invoiceNo.trim())) errors.lines = "At least one invoice line is required."
  if (invoiceAmounts.size === 0) errors.lines = "Enter valid invoice number(s)."
  if (toAmount(form.receivedAmount) <= 0) errors.receivedAmount = "Received amount should be greater than zero."
  if (Math.abs(totalPayable - toAmount(form.receivedAmount)) > 0.005) {
    errors.amountMatch = "Total payable must match received amount."
  }
  return errors
}

function computeInvoiceAmountMap(lines: ReceiptLine[], invoices: Invoice[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const line of lines) {
    const invoice = findInvoiceByNo(line.invoiceNo, invoices)
    if (!invoice) continue
    const payable = toAmount(line.amount) - toAmount(line.deduction)
    if (payable <= 0) continue
    map.set(invoice.id, (map.get(invoice.id) || 0) + payable)
  }
  return map
}

function findInvoiceByNo(invoiceNo: string, invoices: Invoice[]): Invoice | undefined {
  const needle = invoiceNo.trim().toLowerCase()
  if (!needle) return undefined
  return invoices.find((row) => row.invoiceNo.trim().toLowerCase() === needle)
}

function findInvoiceNoById(invoiceId: string, invoices: Invoice[]): string | undefined {
  return invoices.find((row) => row.id === invoiceId)?.invoiceNo
}

function findCustomerByName(name: string, customers: Customer[]): Customer | undefined {
  const needle = name.trim().toLowerCase()
  if (!needle) return undefined
  return customers.find((row) => row.name.trim().toLowerCase() === needle)
}

function toAmount(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const cleaned = value.replace(/,/g, "").trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function toWeight(value: string | number): number {
  return Number(toAmount(value).toFixed(3))
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

function resolveReceiptNo(base: string, index: number): string | undefined {
  const trimmed = base.trim()
  if (!trimmed) return undefined
  if (index === 0) return trimmed
  const match = /(.*\/)(\d+)$/.exec(trimmed)
  if (match) {
    const prefix = match[1]
    const seq = Number(match[2]) + index
    return `${prefix}${String(seq).padStart(match[2].length, "0")}`
  }
  return `${trimmed}-${index + 1}`
}
