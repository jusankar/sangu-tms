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
import { TypeaheadInput } from "../components/ui/typeahead-input"
import { TablePagination } from "../components/TablePagination"
import { DateRangePicker } from "../components/ui/DateRangePicker"
import { api } from "../lib/api"
import { formatDate, formatMoney, printReportPdf } from "../lib/reporting"
import type { Branch, Location, Vehicle, VehicleReceipt } from "../types"

export function VehicleStatementReportPage() {
  const [rows, setRows] = useState<VehicleReceipt[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [branchId, setBranchId] = useState("__all__")
  const [vehicleRef, setVehicleRef] = useState("")
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
      const [receipts, branchRows, locationRows, vehicleRows] = await Promise.all([
        api.vehicleReceipts(),
        api.branches(),
        api.locations(),
        api.vehicles(),
      ])
      setRows(receipts)
      setBranches(branchRows)
      setLocations(locationRows)
      setVehicles(vehicleRows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vehicle statement")
    }
  }

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (branchId && branchId !== "__all__" && row.branchId !== branchId) return false
        if (vehicleRef && !isVehicleMatch(row, vehicleRef, vehicles)) return false
        if (fromDate && row.challanDate < fromDate) return false
        if (toDate && row.challanDate > toDate) return false
        return true
      }),
    [rows, branchId, vehicleRef, fromDate, toDate, vehicles]
  )

  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  function onPrint() {
    printReportPdf({
      title: "Vehicle Statement Report",
      filters: [
        { label: "Branch", value: findBranchName(branchId, branches) || "All" },
        { label: "Vehicle", value: vehicleRef || "All" },
        { label: "From Date", value: fromDate ? formatDate(fromDate) : "All" },
        { label: "To Date", value: toDate ? formatDate(toDate) : "All" },
      ],
      columns: [
        { title: "Sl", value: (_, i) => String(i + 1), align: "right" },
        { title: "Branch", value: (r) => findBranchCodeName(r.branchId, branches) },
        { title: "Lorry Hire Number", value: (r) => r.challanNo },
        { title: "Date", value: (r) => formatDate(r.challanDate) },
        { title: "From", value: (r) => findLocationName(r.fromLocationId, locations) },
        { title: "To", value: (r) => findLocationName(r.toLocationId, locations) },
        { title: "Vehicle", value: (r) => findVehicleDisplay(r, vehicles) },
        { title: "Lorry Hire", value: (r) => formatMoney(r.totalHire), align: "right" },
        { title: "Advance", value: (r) => formatMoney(r.advanceAmount), align: "right" },
        { title: "Balance", value: (r) => formatMoney(r.totalHire - r.advanceAmount), align: "right" },
        { title: "Balance At", value: (r) => r.balanceAt || "-" },
      ],
      rows: filteredRows,
    })
  }

  return (
    <section className="panel">
      <div className="consignment-toolbar">
        <div>
          <h2>Vehicle Statement Report</h2>
          <p>Filter lorry hire entries by branch/date/vehicle and print PDF.</p>
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
        <FormField label="Vehicle">
          <TypeaheadInput listId="vehicle-statement-options" options={vehicles.map((v) => v.vehicleNumber)} value={vehicleRef} onChange={(e) => { setVehicleRef(e.target.value); setPage(1) }} />
        </FormField>
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
            <th>Lorry Hire Number</th>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th>Vehicle</th>
            <th>Lorry Hire</th>
            <th>Advance</th>
            <th>Balance</th>
            <th>Balance At</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row, index) => (
            <tr key={row.id}>
              <td className="numeric-cell">{(page - 1) * pageSize + index + 1}</td>
              <td>{findBranchCodeName(row.branchId, branches)}</td>
              <td>{row.challanNo}</td>
              <td>{formatDate(row.challanDate)}</td>
              <td>{findLocationName(row.fromLocationId, locations)}</td>
              <td>{findLocationName(row.toLocationId, locations)}</td>
              <td>{findVehicleDisplay(row, vehicles)}</td>
              <td className="numeric-cell">{formatMoney(row.totalHire)}</td>
              <td className="numeric-cell">{formatMoney(row.advanceAmount)}</td>
              <td className="numeric-cell">{formatMoney(row.totalHire - row.advanceAmount)}</td>
              <td>{row.balanceAt || "-"}</td>
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

function findLocationName(locationId: string | undefined, locations: Location[]): string {
  if (!locationId) return "-"
  return locations.find((x) => x.id === locationId)?.name || "-"
}

function findVehicleDisplay(row: VehicleReceipt, vehicles: Vehicle[]): string {
  if (row.vehicleNo) return row.vehicleNo
  const found = vehicles.find((x) => x.id === row.vehicleId)
  return found?.vehicleNumber || "-"
}

function isVehicleMatch(row: VehicleReceipt, vehicleRef: string, vehicles: Vehicle[]): boolean {
  const needle = vehicleRef.trim().toLowerCase()
  if (!needle) return true
  const direct = row.vehicleNo?.trim().toLowerCase() || ""
  if (direct === needle) return true
  const linked = vehicles.find((x) => x.id === row.vehicleId)?.vehicleNumber?.trim().toLowerCase() || ""
  return linked === needle
}
