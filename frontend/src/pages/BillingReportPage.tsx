import { useEffect, useMemo, useState } from "react"
import { TablePagination } from "../components/TablePagination"
import { DateRangePicker } from "../components/ui/DateRangePicker"
import { api } from "../lib/api"
import { formatDate, formatMoney, printReportPdf } from "../lib/reporting"
import type { Branch, Consignment, Customer, Invoice } from "../types"

export function BillingReportPage() {
  const [rows, setRows] = useState<Invoice[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
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
      const [invoiceRows, branchRows, customerRows, consignmentRows] = await Promise.all([
        api.invoices(),
        api.branches(),
        api.customers(),
        api.consignments(),
      ])
      setRows(invoiceRows)
      setBranches(branchRows)
      setCustomers(customerRows)
      setConsignments(consignmentRows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load billing report")
    }
  }

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (branchId && row.branchId !== branchId) return false
        if (fromDate && row.invoiceDate < fromDate) return false
        if (toDate && row.invoiceDate > toDate) return false
        if (customerId) {
          const consignment = consignments.find((x) => x.id === row.consignmentId)
          if (!consignment || consignment.customerId !== customerId) return false
        }
        return true
      }),
    [rows, branchId, fromDate, toDate, customerId, consignments]
  )

  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  function onPrint() {
    printReportPdf({
      title: "Billing Report",
      filters: [
        { label: "Branch", value: findBranchName(branchId, branches) || "All" },
        { label: "Customer", value: findCustomerName(customerId, customers) || "All" },
        { label: "From Date", value: fromDate || "All" },
        { label: "To Date", value: toDate || "All" },
      ],
      columns: [
        { title: "Sl", value: (_, i) => String(i + 1), align: "right" },
        { title: "Branch", value: (r) => findBranchCodeName(r.branchId, branches) },
        { title: "Bill Number", value: (r) => r.invoiceNo },
        {
          title: "Customer",
          value: (r) => {
            const consignment = consignments.find((x) => x.id === r.consignmentId)
            return findCustomerName(consignment?.customerId || "", customers) || consignment?.consignorName || "-"
          },
        },
        { title: "Date", value: (r) => formatDate(r.invoiceDate) },
        {
          title: "Consignment Number",
          value: (r) => consignments.find((x) => x.id === r.consignmentId)?.consignmentNo || "-",
        },
        { title: "Total", value: (r) => formatMoney(r.totalAmount), align: "right" },
      ],
      rows: filteredRows,
    })
  }

  return (
    <section className="panel">
      <div className="consignment-toolbar">
        <div>
          <h2>Billing Report</h2>
          <p>Filter invoices by branch/date/customer and print PDF.</p>
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
            <th>Bill Number</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Consignment Number</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row, index) => {
            const consignment = consignments.find((x) => x.id === row.consignmentId)
            return (
              <tr key={row.id}>
                <td className="numeric-cell">{(page - 1) * pageSize + index + 1}</td>
                <td>{findBranchCodeName(row.branchId, branches)}</td>
                <td>{row.invoiceNo}</td>
                <td>{findCustomerName(consignment?.customerId || "", customers) || consignment?.consignorName || "-"}</td>
                <td>{row.invoiceDate}</td>
                <td>{consignment?.consignmentNo || "-"}</td>
                <td className="numeric-cell">{formatMoney(row.totalAmount)}</td>
              </tr>
            )
          })}
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
