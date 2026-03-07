import { Navigate, Route, Routes } from "react-router-dom"
import { RequireAuth } from "./auth/RequireAuth"
import { AppLayout } from "./layout/AppLayout"
import { BranchesPage } from "./pages/BranchesPage"
import { BookingReportPage } from "./pages/BookingReportPage"
import { BillingReportPage } from "./pages/BillingReportPage"
import { ConsignmentsPage } from "./pages/ConsignmentsPage"
import { CustomersPage } from "./pages/CustomersPage"
import { DashboardPage } from "./pages/DashboardPage"
import { DriversPage } from "./pages/DriversPage"
import { InvoicesPage } from "./pages/InvoicesPage"
import { LoginPage } from "./pages/LoginPage"
import { LocationsPage } from "./pages/LocationsPage"
import { MoneyReceiptsPage } from "./pages/MoneyReceiptsPage"
import { OutstandingPage } from "./pages/OutstandingPage"
import { PaymentReportPage } from "./pages/PaymentReportPage"
import { VehicleReceiptsPage } from "./pages/VehicleReceiptsPage"
import { VehicleStatementReportPage } from "./pages/VehicleStatementReportPage"
import { VehiclesPage } from "./pages/VehiclesPage"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/operations/consignments" element={<ConsignmentsPage />} />
          <Route path="/operations/lorry-receipts" element={<VehicleReceiptsPage />} />
          <Route path="/operations/vehicle-receipts" element={<Navigate to="/operations/lorry-receipts" replace />} />
          <Route path="/operations/invoices" element={<InvoicesPage />} />
          <Route path="/operations/payments" element={<MoneyReceiptsPage />} />
          <Route path="/settings/branches" element={<BranchesPage />} />
          <Route path="/settings/customers" element={<CustomersPage />} />
          <Route path="/settings/locations" element={<LocationsPage />} />
          <Route path="/settings/drivers" element={<DriversPage />} />
          <Route path="/settings/vehicles" element={<VehiclesPage />} />
          <Route path="/reports/booking" element={<BookingReportPage />} />
          <Route path="/reports/vehicle-statement" element={<VehicleStatementReportPage />} />
          <Route path="/reports/billing" element={<BillingReportPage />} />
          <Route path="/reports/outstanding" element={<OutstandingPage />} />
          <Route path="/reports/payment" element={<PaymentReportPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
