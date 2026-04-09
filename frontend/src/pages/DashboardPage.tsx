import { useEffect, useMemo, useState } from "react"
import { api } from "../lib/api"
import type { Consignment, Invoice, VehicleReceipt } from "../types"

type WeekPoint = {
  label: string
  range: string
  bookings: number
  bookingAmount: number
  receiptCount: number
  part: number
  balance: number
}

export function DashboardPage() {
  const [bookingRows, setBookingRows] = useState(0)
  const [vehiclePartCount, setVehiclePartCount] = useState(0)
  const [vehicleBalanceCount, setVehicleBalanceCount] = useState(0)
  const [outstandingAmount, setOutstandingAmount] = useState(0)
  const [outstandingCount, setOutstandingCount] = useState(0)
  const [weekly, setWeekly] = useState<WeekPoint[]>([])
  const [statusSplit, setStatusSplit] = useState<{ paid: number; partial: number; pending: number }>({
    paid: 0,
    partial: 0,
    pending: 0,
  })
  const [error, setError] = useState("")

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    setError("")
    try {
      const [consignments, vehicleReceipts, invoices] = await Promise.all([
        api.consignments(),
        api.vehicleReceipts(),
        api.invoices(),
      ])

      const today = new Date()
      const startOfWeek = getWeekStart(today)
      setBookingRows(consignments.filter((x) => new Date(x.bookingDate) >= startOfWeek).length)

      setVehiclePartCount(vehicleReceipts.filter((x) => x.advanceAmount > 0).length)
      setVehicleBalanceCount(vehicleReceipts.filter((x) => x.totalHire - x.advanceAmount > 0.005).length)

      const outstandingRows = invoices.filter((x) => x.totalAmount - x.receivedAmount > 0.005)
      setOutstandingCount(outstandingRows.length)
      setOutstandingAmount(outstandingRows.reduce((sum, x) => sum + (x.totalAmount - x.receivedAmount), 0))

      setWeekly(buildWeeklyTrend(consignments, vehicleReceipts))
      setStatusSplit(buildStatusSplit(invoices))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data")
    }
  }

  const maxBookings = Math.max(...weekly.map((x) => x.bookings), 1)
  const maxBookingAmount = Math.max(...weekly.map((x) => x.bookingAmount), 1)
  const maxPayment = Math.max(...weekly.flatMap((x) => [x.part, x.balance]), 1)
  const totalSplit = Math.max(statusSplit.paid + statusSplit.partial + statusSplit.pending, 1)
  const totalBookingAmount = weekly.reduce((sum, x) => sum + x.bookingAmount, 0)
  const totalPaymentPart = weekly.reduce((sum, x) => sum + x.part, 0)
  const totalPaymentBalance = weekly.reduce((sum, x) => sum + x.balance, 0)
  const latestWeek = weekly[weekly.length - 1]

  const splitLabels = useMemo(
    () => [
      { label: "Paid", value: statusSplit.paid, cls: "dot yellow" },
      { label: "Partly Paid", value: statusSplit.partial, cls: "dot red" },
      { label: "Pending", value: statusSplit.pending, cls: "dot blue" },
    ],
    [statusSplit]
  )

  return (
    <section className="dashboard-shell">
      <div className="dashboard-header panel">
        <h2>Dashboard</h2>
        <p>Bookings, vehicle payments and outstanding in one live operations view.</p>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="dashboard-kpi-grid">
        <article className="kpi-card kpi-yellow">
          <span>Bookings</span>
          <strong>{bookingRows}</strong>
          <small>This week</small>
        </article>
        <article className="kpi-card kpi-red">
          <span>Vehicle Payment - Part</span>
          <strong>{vehiclePartCount}</strong>
          <small>Transactions</small>
        </article>
        <article className="kpi-card kpi-blue">
          <span>Vehicle Payment - Balance</span>
          <strong>{vehicleBalanceCount}</strong>
          <small>Pending clearances</small>
        </article>
        <article className="kpi-card kpi-yellow">
          <span>Outstanding</span>
          <strong>Rs. {outstandingAmount.toFixed(2)}</strong>
          <small>Across {outstandingCount} invoices</small>
        </article>
      </div>

      <div className="dashboard-chart-grid">
        <article className="panel chart-panel">
          <h3>Bookings Trend</h3>
          <div className="chart-metrics">
            <div>
              <span>Total Bookings (7 weeks)</span>
              <strong>{weekly.reduce((sum, x) => sum + x.bookings, 0)}</strong>
            </div>
            <div>
              <span>Total Booking Value</span>
              <strong>Rs. {totalBookingAmount.toFixed(2)}</strong>
            </div>
            <div>
              <span>This Week</span>
              <strong>
                {latestWeek?.bookings ?? 0} bookings | Rs. {(latestWeek?.bookingAmount ?? 0).toFixed(2)}
              </strong>
            </div>
          </div>
          <div className="bar-chart">
            {weekly.map((value) => (
              <div className="bar-wrap" key={value.label} title={`${value.range}\nBookings: ${value.bookings}\nValue: Rs. ${value.bookingAmount.toFixed(2)}`}>
                <div className="bar-caption">{value.bookings}</div>
                <div className="bar bar-booking" style={{ height: `${(value.bookings / maxBookings) * 62}%` }} />
                <div className="bar bar-booking-value" style={{ height: `${(value.bookingAmount / maxBookingAmount) * 38}%` }} />
                <span>{value.label}</span>
              </div>
            ))}
          </div>
          <small className="chart-note">Dark gold = booking count, light gold = booking value intensity.</small>
        </article>

        <article className="panel chart-panel">
          <h3>Vehicle Payments</h3>
          <div className="chart-metrics">
            <div>
              <span>Advance Paid (7 weeks)</span>
              <strong>Rs. {totalPaymentPart.toFixed(2)}</strong>
            </div>
            <div>
              <span>Balance Pending (7 weeks)</span>
              <strong>Rs. {totalPaymentBalance.toFixed(2)}</strong>
            </div>
            <div>
              <span>This Week Receipts</span>
              <strong>{latestWeek?.receiptCount ?? 0}</strong>
            </div>
          </div>
          <div className="bar-chart dual">
            {weekly.map((value) => (
              <div className="bar-wrap dual" key={`pay-${value.label}`} title={`${value.range}\nAdvance: Rs. ${value.part.toFixed(2)}\nBalance: Rs. ${value.balance.toFixed(2)}\nReceipts: ${value.receiptCount}`}>
                <div className="bar-caption">Rs. {(value.part + value.balance).toFixed(0)}</div>
                <div className="bar bar-part" style={{ height: `${(value.part / maxPayment) * 100}%` }} />
                <div className="bar bar-balance" style={{ height: `${(value.balance / maxPayment) * 100}%` }} />
                <span>{value.label}</span>
              </div>
            ))}
          </div>
          <small className="chart-note">Red = advance paid, blue = remaining balance.</small>
        </article>

        <article className="panel chart-panel">
          <h3>Outstanding Split</h3>
          <div className="donut-card">
            <div className="donut-ring" />
            <ul>
              {splitLabels.map((item) => (
                <li key={item.label}>
                  <em className={item.cls} /> {Math.round((item.value / totalSplit) * 100)}% {item.label}
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  )
}

function getWeekStart(date: Date): Date {
  const next = new Date(date)
  const day = next.getDay()
  const diff = day === 0 ? 6 : day - 1
  next.setDate(next.getDate() - diff)
  next.setHours(0, 0, 0, 0)
  return next
}

function buildWeeklyTrend(consignments: Consignment[], receipts: VehicleReceipt[]): WeekPoint[] {
  const points: WeekPoint[] = []
  const now = new Date()
  const currentWeek = getWeekStart(now)

  for (let i = 6; i >= 0; i -= 1) {
    const weekStart = new Date(currentWeek)
    weekStart.setDate(weekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const bookings = consignments.filter((x) => {
      const d = new Date(x.bookingDate)
      return d >= weekStart && d <= weekEnd
    })
    const bookingAmount = bookings.reduce((sum, row) => sum + (row.freightAmount || 0), 0)
    const weekReceipts = receipts.filter((x) => {
      const d = new Date(x.challanDate)
      return d >= weekStart && d <= weekEnd
    })
    const part = weekReceipts.reduce((sum, x) => sum + x.advanceAmount, 0)
    const balance = weekReceipts.reduce((sum, x) => sum + Math.max(0, x.totalHire - x.advanceAmount), 0)

    points.push({
      label: `W${7 - i}`,
      range: `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`,
      bookings: bookings.length,
      bookingAmount,
      receiptCount: weekReceipts.length,
      part,
      balance,
    })
  }

  return points
}

function formatShortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`
}

function buildStatusSplit(invoices: Invoice[]): { paid: number; partial: number; pending: number } {
  return invoices.reduce(
    (acc, row) => {
      const outstanding = row.totalAmount - row.receivedAmount
      if (outstanding <= 0.005) acc.paid += 1
      else if (row.receivedAmount > 0) acc.partial += 1
      else acc.pending += 1
      return acc
    },
    { paid: 0, partial: 0, pending: 0 }
  )
}
