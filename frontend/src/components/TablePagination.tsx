import { Button } from "./ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

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
      <div className="text-sm text-muted-foreground">
        Showing {start}-{end} of {totalRows}
      </div>
      <div className="table-pagination-controls">
        <label className="inline-flex items-center gap-2 text-sm">
          Rows
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
