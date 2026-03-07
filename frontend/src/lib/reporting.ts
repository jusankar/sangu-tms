export type ReportColumn<T> = {
  title: string
  value: (row: T, index: number) => string | number
  align?: "left" | "right" | "center"
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;")
}

export function formatMoney(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00"
}

export function formatDate(value: string): string {
  return value || "-"
}

export function printReportPdf<T>(params: {
  title: string
  filters: Array<{ label: string; value: string }>
  columns: ReportColumn<T>[]
  rows: T[]
}) {
  const popup = window.open("", "_blank", "noopener,noreferrer")
  if (!popup) return

  const generatedAt = new Date().toLocaleString()
  const filtersHtml = params.filters
    .map((x) => `<span><strong>${escapeHtml(x.label)}:</strong> ${escapeHtml(x.value || "All")}</span>`)
    .join("")
  const headerHtml = params.columns.map((x) => `<th>${escapeHtml(x.title)}</th>`).join("")
  const rowHtml = params.rows
    .map((row, idx) => {
      const cells = params.columns
        .map((col) => {
          const raw = String(col.value(row, idx) ?? "")
          const align = col.align ?? "left"
          return `<td style="text-align:${align}">${escapeHtml(raw)}</td>`
        })
        .join("")
      return `<tr>${cells}</tr>`
    })
    .join("")

  popup.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(params.title)}</title>
  <style>
    body{font-family:Segoe UI,Tahoma,sans-serif;padding:18px;color:#111827}
    h1{margin:0 0 8px 0;font-size:20px}
    .meta{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;font-size:12px}
    .stamp{margin:8px 0 12px 0;font-size:12px;color:#475569}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #cbd5e1;padding:6px 8px;vertical-align:top}
    th{background:#f1f5f9;text-align:left}
  </style>
</head>
<body>
  <h1>${escapeHtml(params.title)}</h1>
  <div class="meta">${filtersHtml}</div>
  <div class="stamp">Generated: ${escapeHtml(generatedAt)}</div>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowHtml}</tbody>
  </table>
</body>
</html>`)
  popup.document.close()
  popup.focus()
  setTimeout(() => popup.print(), 200)
}
