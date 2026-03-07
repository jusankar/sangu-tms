import { useEffect, useState } from "react"
import { TablePagination } from "../components/TablePagination"
import { api } from "../lib/api"
import type { ReportOutstanding } from "../types"

export function OutstandingPage() {
  const [rows, setRows] = useState<ReportOutstanding[]>([])
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    api
      .outstanding()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load outstanding report"))
  }, [])

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section className="panel">
      <h2>Outstanding Report</h2>
      {error ? <div className="error">{error}</div> : null}
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Date</th>
            <th>Total</th>
            <th>Received</th>
            <th>Outstanding</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((r) => (
            <tr key={r.invoiceId}>
              <td>{r.invoiceNo}</td>
              <td>{r.invoiceDate}</td>
              <td>₹{r.totalAmount.toFixed(2)}</td>
              <td>₹{r.receivedAmount.toFixed(2)}</td>
              <td>₹{r.outstandingAmount.toFixed(2)}</td>
              <td>{r.status}</td>
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
    </section>
  )
}
