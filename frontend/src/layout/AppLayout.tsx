import {
  ArchiveIcon,
  BarChartIcon,
  ChevronDownIcon,
  ClipboardIcon,
  CubeIcon,
  DashboardIcon,
  ExitIcon,
  FileTextIcon,
  HamburgerMenuIcon,
  HomeIcon,
  IdCardIcon,
  LayersIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  PersonIcon,
  ReaderIcon,
  TableIcon,
} from "@radix-ui/react-icons"
import type { ComponentType } from "react"
import { useState } from "react"
import { Link, NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { ThemeToggle } from "../components/ThemeToggle"

const menuGroups = [
  {
    title: "Dashboard",
    items: [{ to: "/dashboard", label: "Dashboard", icon: DashboardIcon }],
  },
  {
    title: "Modules",
    items: [
      { to: "/operations/consignments", label: "Consignment", icon: ArchiveIcon },
      { to: "/operations/lorry-receipts", label: "Lorry Receipt", icon: ClipboardIcon },
      { to: "/operations/invoices", label: "Invoice", icon: ReaderIcon },
      { to: "/operations/payments", label: "Money Receipt", icon: FileTextIcon },
    ],
  },
  {
    title: "Master Files",
    items: [
      { to: "/settings/branches", label: "Branch", icon: HomeIcon },
      { to: "/settings/customers", label: "Customer", icon: PersonIcon },
      { to: "/settings/locations", label: "Location", icon: MagnifyingGlassIcon },
      { to: "/settings/drivers", label: "Driver", icon: IdCardIcon },
      { to: "/settings/vehicles", label: "Vehicle", icon: CubeIcon },
    ],
  },
  {
    title: "Reports",
    items: [
      { to: "/reports/booking", label: "Booking", icon: TableIcon },
      { to: "/reports/vehicle-statement", label: "Vehicle Statement", icon: LayersIcon },
      { to: "/reports/billing", label: "Billing", icon: IdCardIcon },
      { to: "/reports/outstanding", label: "Outstanding", icon: BarChartIcon },
      { to: "/reports/payment", label: "Payment", icon: Pencil1Icon },
    ],
  },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="header-left">
          <button
            type="button"
            className={sidebarOpen ? "sidebar-toggle-btn active" : "sidebar-toggle-btn"}
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? "Hide left menu" : "Show left menu"}
          >
            <HamburgerMenuIcon />
          </button>
          <Link className="brand" to="/dashboard">
            <img alt="Sangu TMS logo" className="brand-logo" src="/favicon.svg" />
            <div>
              <strong>Sangu TMS</strong>
              <p>Transport ERP</p>
            </div>
          </Link>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <div className="user-box">
            <strong>{user?.fullName}</strong>
            <button onClick={logout} type="button">
              <ExitIcon aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className={sidebarOpen ? "app-body" : "app-body sidebar-hidden"}>
        <aside className="sidebar">
          {menuGroups.map((group) => (
            <details className="nav-accordion" key={group.title} open>
              <summary>
                <span>{group.title}</span>
                <ChevronDownIcon className="accordion-chevron" />
              </summary>
              <nav className="nav">
                {group.items.map((item) => (
                  <MenuLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
                ))}
              </nav>
            </details>
          ))}
        </aside>
        <div className="main">
          <main className="content">
            <div className="content-inner">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function MenuLink({
  icon: Icon,
  label,
  to,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  to: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <Icon aria-hidden="true" className="nav-icon" />
      <span>{label}</span>
    </NavLink>
  )
}
