type TablePaginationProps = {
  page: number
  pageSize: number
  totalRows: number
  onPageChange: (nextPage: number) => void
  onPageSizeChange: (nextPageSize: number) => void
}

export function TablePagination({
  page,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(totalRows, page * pageSize)

  return (
    <div className="table-pagination">
      <div>
        Showing {start}-{end} of {totalRows}
      </div>
      <div className="table-pagination-controls">
        <label>
          Rows
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
        <button className="btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">
          Prev
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          className="btn-secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  )
}
