import { useEffect, useMemo, useState } from "react"
import { Button } from "../components/ui/button"
import { FormField } from "../components/ui/form-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { TablePagination } from "../components/TablePagination"
import { DateRangePicker } from "../components/ui/DateRangePicker"
import { api } from "../lib/api"
import { formatDate, formatMoney, printReportPdf } from "../lib/reporting"
import type { Branch, Consignment, Customer, Location } from "../types"

export function BookingReportPage() {
  const [rows, setRows] = useState<Consignment[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [branchId, setBranchId] = useState("__all__")
  const [customerId, setCustomerId] = useState("__all__")
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
      const [consignments, branchRows, customerRows, locationRows] = await Promise.all([
        api.consignments(),
        api.branches(),
        api.customers(),
        api.locations(),
      ])
      setRows(consignments)
      setBranches(branchRows)
      setCustomers(customerRows)
      setLocations(locationRows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load booking report")
    }
  }

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (branchId && branchId !== "__all__" && row.branchId !== branchId) return false
        if (customerId && customerId !== "__all__" && row.customerId !== customerId) return false
        if (fromDate && row.bookingDate < fromDate) return false
        if (toDate && row.bookingDate > toDate) return false
        return true
      }),
    [rows, branchId, customerId, fromDate, toDate]
  )

  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  function onPrint() {
    printReportPdf({
      title: "Booking Report",
      filters: [
        { label: "Branch", value: findBranchName(branchId, branches) || "All" },
        { label: "Customer", value: findCustomerName(customerId, customers) || "All" },
        { label: "From Date", value: fromDate ? formatDate(fromDate) : "All" },
        { label: "To Date", value: toDate ? formatDate(toDate) : "All" },
      ],
      columns: [
        { title: "Sl", value: (_, i) => String(i + 1), align: "right" },
        { title: "Branch", value: (r) => findBranchCodeName(r.branchId, branches) },
        { title: "Consignment Number", value: (r) => r.consignmentNo },
        { title: "Booking Date", value: (r) => formatDate(r.bookingDate) },
        { title: "Customer", value: (r) => findCustomerName(r.customerId, customers) || "-" },
        { title: "Consignor", value: (r) => r.consignorName || "-" },
        { title: "Consignee", value: (r) => r.consigneeName || "-" },
        { title: "From", value: (r) => findLocationName(r.fromLocationId, locations) },
        { title: "To", value: (r) => findLocationName(r.toLocationId, locations) },
        { title: "Final Freight", value: (r) => formatMoney(r.freightAmount), align: "right" },
      ],
      rows: filteredRows,
    })
  }

  return (
    <section className="panel">
      <div className="consignment-toolbar">
        <div>
          <h2>Booking Report</h2>
          <p>Filter bookings and download/print as PDF.</p>
        </div>
        <div className="consignment-actions">
          <Button variant="outline" size="sm" type="button" onClick={loadAll}>Refresh</Button>
          <Button type="button" onClick={onPrint}>Download / Print PDF</Button>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="report-filters">
        <FormField label="Branch">
          <Select value={branchId} onValueChange={(v) => { setBranchId(v); setPage(1) }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {branches.map((row) => (
                <SelectItem key={row.id} value={row.id}>{row.code} - {row.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Customer">
          <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setPage(1) }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {customers.map((row) => (
                <SelectItem key={row.id} value={row.id}>{row.code} - {row.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <DateRangePicker
          from={fromDate}
          to={toDate}
          fromLabel="Booking Date From"
          toLabel="Booking Date To"
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
            <th>Consignment Number</th>
            <th>Booking Date</th>
            <th>Customer</th>
            <th>Consignor</th>
            <th>Consignee</th>
            <th>From</th>
            <th>To</th>
            <th>Final Freight</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row, index) => (
            <tr key={row.id}>
              <td className="numeric-cell">{(page - 1) * pageSize + index + 1}</td>
              <td>{findBranchCodeName(row.branchId, branches)}</td>
              <td>{row.consignmentNo}</td>
              <td>{formatDate(row.bookingDate)}</td>
              <td>{findCustomerName(row.customerId, customers) || "-"}</td>
              <td>{row.consignorName || "-"}</td>
              <td>{row.consigneeName || "-"}</td>
              <td>{findLocationName(row.fromLocationId, locations)}</td>
              <td>{findLocationName(row.toLocationId, locations)}</td>
              <td className="numeric-cell">{formatMoney(row.freightAmount)}</td>
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

function findLocationName(locationId: string, locations: Location[]): string {
  return locations.find((x) => x.id === locationId)?.name || "-"
}
