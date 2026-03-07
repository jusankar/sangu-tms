import { useEffect, useMemo, useState } from "react"
import { TablePagination } from "../components/TablePagination"
import { DateRangePicker } from "../components/ui/DateRangePicker"
import { api } from "../lib/api"
import { formatDate, formatMoney, printReportPdf } from "../lib/reporting"
import type { Branch, Consignment, Customer, Invoice, MoneyReceipt } from "../types"

export function PaymentReportPage() {
  const [rows, setRows] = useState<MoneyReceipt[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [consignments, setConsignments] = useState<Consignment[]>([])
  const [branchId, setBranchId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    void loadAll()
  }, [])

  async function loadAll() {
    setError("")
    try {
      const [receiptRows, branchRows, customerRows, invoiceRows, consignmentRows] = await Promise.all([
        api.receipts(),
        api.branches(),
        api.customers(),
        api.invoices(),
        api.consignments(),
      ])
      setRows(receiptRows)
      setBranches(branchRows)
      setCustomers(customerRows)
      setInvoices(invoiceRows)
      setConsignments(consignmentRows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payment report")
    }
  }

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (branchId && row.branchId !== branchId) return false
        if (fromDate && row.receiptDate < fromDate) return false
        if (toDate && row.receiptDate > toDate) return false
        if (customerId) {
          const invoice = invoices.find((x) => x.id === row.invoiceId)
          const consignment = consignments.find((x) => x.id === invoice?.consignmentId)
          if (!consignment || consignment.customerId !== customerId) return false
        }
        return true
      }),
    [rows, branchId, fromDate, toDate, customerId, invoices, consignments]
  )

  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  function onPrint() {
    printReportPdf({
      title: "Payment Report",
      filters: [
        { label: "Branch", value: findBranchName(branchId, branches) || "All" },
        { label: "Customer", value: findCustomerName(customerId, customers) || "All" },
        { label: "From Date", value: fromDate || "All" },
        { label: "To Date", value: toDate || "All" },
      ],
      columns: [
        { title: "Sl", value: (_, i) => String(i + 1), align: "right" },
        { title: "Branch", value: (r) => findBranchCodeName(r.branchId, branches) },
        { title: "MR Number", value: (r) => r.receiptNo },
        { title: "Date", value: (r) => formatDate(r.receiptDate) },
        { title: "Customer", value: (r) => findReceiptCustomerName(r, invoices, consignments, customers) },
        { title: "Amount", value: (r) => formatMoney(r.amount), align: "right" },
        { title: "Deduction", value: () => formatMoney(0), align: "right" },
        { title: "Total Received", value: (r) => formatMoney(r.amount), align: "right" },
      ],
      rows: filteredRows,
    })
  }

  return (
    <section className="panel">
      <div className="consignment-toolbar">
        <div>
          <h2>Payment Report</h2>
          <p>Filter money receipts by branch/date/customer and print PDF.</p>
        </div>
        <div className="consignment-actions">
          <button className="btn-secondary" type="button" onClick={loadAll}>Refresh</button>
          <button className="btn-primary" type="button" onClick={onPrint}>Download / Print PDF</button>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="report-filters">
        <label>
          Branch
          <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setPage(1) }}>
            <option value="">Select branch...</option>
            {branches.map((row) => (
              <option key={row.id} value={row.id}>{row.code} - {row.name}</option>
            ))}
          </select>
        </label>
        <label>
          Customer
          <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setPage(1) }}>
            <option value="">Select customer...</option>
            {customers.map((row) => (
              <option key={row.id} value={row.id}>{row.code} - {row.name}</option>
            ))}
          </select>
        </label>
        <DateRangePicker
          from={fromDate}
          to={toDate}
          onFromChange={(value) => {
            setFromDate(value)
            setPage(1)
          }}
          onToChange={(value) => {
            setToDate(value)
            setPage(1)
          }}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Sl</th>
            <th>Branch</th>
            <th>MR Number</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Deduction</th>
            <th>Total Received</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row, index) => (
            <tr key={row.id}>
              <td className="numeric-cell">{(page - 1) * pageSize + index + 1}</td>
              <td>{findBranchCodeName(row.branchId, branches)}</td>
              <td>{row.receiptNo}</td>
              <td>{row.receiptDate}</td>
              <td>{findReceiptCustomerName(row, invoices, consignments, customers)}</td>
              <td className="numeric-cell">{formatMoney(row.amount)}</td>
              <td className="numeric-cell">{formatMoney(0)}</td>
              <td className="numeric-cell">{formatMoney(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <TablePagination
        page={page}
        pageSize={pageSize}
        totalRows={filteredRows.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </section>
  )
}

function findBranchCodeName(branchId: string, branches: Branch[]): string {
  const row = branches.find((x) => x.id === branchId)
  return row ? `${row.code} - ${row.name}` : "-"
}

function findBranchName(branchId: string, branches: Branch[]): string {
  return branches.find((x) => x.id === branchId)?.name || ""
}

function findCustomerName(customerId: string, customers: Customer[]): string {
  return customers.find((x) => x.id === customerId)?.name || ""
}

function findReceiptCustomerName(
  receipt: MoneyReceipt,
  invoices: Invoice[],
  consignments: Consignment[],
  customers: Customer[]
): string {
  const invoice = invoices.find((x) => x.id === receipt.invoiceId)
  const consignment = consignments.find((x) => x.id === invoice?.consignmentId)
  return findCustomerName(consignment?.customerId || "", customers) || consignment?.consignorName || "-"
}
