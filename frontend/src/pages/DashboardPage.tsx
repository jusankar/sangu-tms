const monthlyBookings = [42, 58, 66, 71, 64, 79, 88]
const vehiclePart = [22, 29, 31, 34, 30, 37, 41]
const vehicleBalance = [12, 16, 19, 14, 15, 18, 20]

export function DashboardPage() {
  const maxBookings = Math.max(...monthlyBookings, 1)
  const maxPayment = Math.max(...vehiclePart, ...vehicleBalance, 1)

  return (
    <section className="dashboard-shell">
      <div className="dashboard-header panel">
        <h2>Dashboard</h2>
        <p>Bookings, vehicle payments and outstanding in one live operations view.</p>
      </div>

      <div className="dashboard-kpi-grid">
        <article className="kpi-card kpi-yellow">
          <span>Bookings</span>
          <strong>88</strong>
          <small>This week</small>
        </article>
        <article className="kpi-card kpi-red">
          <span>Vehicle Payment - Part</span>
          <strong>41</strong>
          <small>Transactions</small>
        </article>
        <article className="kpi-card kpi-blue">
          <span>Vehicle Payment - Balance</span>
          <strong>20</strong>
          <small>Pending clearances</small>
        </article>
        <article className="kpi-card kpi-yellow">
          <span>Outstanding</span>
          <strong>Rs. 3,42,900</strong>
          <small>Across 57 invoices</small>
        </article>
      </div>

      <div className="dashboard-chart-grid">
        <article className="panel chart-panel">
          <h3>Bookings Trend</h3>
          <div className="bar-chart">
            {monthlyBookings.map((value, idx) => (
              <div className="bar-wrap" key={`booking-${idx}`}>
                <div className="bar bar-booking" style={{ height: `${(value / maxBookings) * 100}%` }} />
                <span>W{idx + 1}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel chart-panel">
          <h3>Vehicle Payments</h3>
          <div className="bar-chart dual">
            {vehiclePart.map((value, idx) => (
              <div className="bar-wrap dual" key={`payment-${idx}`}>
                <div className="bar bar-part" style={{ height: `${(value / maxPayment) * 100}%` }} />
                <div
                  className="bar bar-balance"
                  style={{ height: `${(vehicleBalance[idx] / maxPayment) * 100}%` }}
                />
                <span>W{idx + 1}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel chart-panel">
          <h3>Outstanding Split</h3>
          <div className="donut-card">
            <div className="donut-ring" />
            <ul>
              <li>
                <em className="dot yellow" /> 45% Retail
              </li>
              <li>
                <em className="dot red" /> 30% Corporate
              </li>
              <li>
                <em className="dot blue" /> 25% Contract
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>
  )
}
