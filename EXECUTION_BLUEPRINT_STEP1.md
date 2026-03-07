# Sangu TMS 2.0 - Execution Blueprint (Step 1)

## 1) What We Finalized Today
- Product direction: Multi-tenant Transport Management Software (TMS)
- Core business flow: `Consignment -> Lorry Hire/Challan -> Invoice -> Money Receipt`
- Tenant model:
  - One common platform DB for license/subscription/account metadata
  - Separate DB per customer company for operational data
- No file storage dependency in MVP
- Must-have security: authentication + role-based authorization + module/operation permissions

## 2) Navigation & Layout (for Figma screens)
- Left sidebar navigation (desktop)
  - Top: company logo + tenant/company selector
  - Middle: module groups (Dashboard, Operations, Finance, Traffic, Reports, Settings, Admin)
  - Bottom: user profile, branch switch, logout
- Top header
  - Global search, quick-create button, notifications, current financial year, branch filter
- Main content area
  - Breadcrumb + page title + primary action buttons
  - Filters row, data table/cards, context actions
- Footer
  - Version, support link, tenant name, environment badge

## 3) Figma Screen Inventory

### A. Foundation
- Login
- Forgot Password / Reset Password
- Unauthorized page
- Tenant onboarding (admin only)
- Branch selection modal
- Dashboard

### B. Phase 1 - Operations
- Consignment list
- Create/Edit Consignment
- Consignment detail timeline
- Lorry Hire/Challan list
- Create Challan from Consignment
- Part payment entry
- Balance payment closure
- Invoice list
- Create Invoice from Consignment + Challan
- Invoice print layout preview
- Money Receipt list
- Create Money Receipt from Invoice

### C. Reports
- Booking report
- Lorry payment report
- Outstanding report
- Drill-down detail report pages

### D. Settings
- Company profile (name/logo)
- Branch master
- Location master
- Customer master
- Numbering/series settings (Consignment, Challan, Invoice, Receipt)

### E. Security & Access Control
- Users list
- Create/Edit user
- Roles list
- Permissions matrix (module + operation wise)

### F. Commercial Controls (Owner/Super Admin)
- Subscription plans
- Tenant license status
- Usage meter (consignment count)
- Billing history + renewal

### G. Phase 2 Placeholder Screens
- Inter-branch reconciliation list/detail
- Cash book
- Bank book

### H. Phase 3 Placeholder Screens
- Vehicle master
- Driver master
- Vehicle placement board
- Vehicle tracking board
- Loading planner

## 4) Recommended Technology Stack
- Backend: `.NET 8`, `ASP.NET Core`, `EF Core`
- DB:
  - Platform DB: `PostgreSQL` (or SQL Server)
  - Tenant DBs: `PostgreSQL` per tenant (schema identical)
- Frontend: `Next.js (React + TypeScript)`
- UI System: `Tailwind CSS + component primitives`
- Auth: JWT + refresh token, password policy, optional OTP
- Authorization: RBAC + permission claims (module/action level)
- Jobs: background workers for invoice numbering, reminders, usage sync
- Hosting:
  - SaaS: app hosted centrally + isolated DB per tenant
  - Self-hosted: same codebase, customer-managed infra + license validation to platform

## 5) Pricing and License Model

### Suggested commercial model
- Plan basis: `Per company + included users + usage limits`
- Your example can become:
  - Base plan: `INR 1000 / month`
  - Includes: `1 admin + up to 3 users + 100 consignments/month`
  - Add-ons:
    - Extra user: `INR 300/user/month`
    - Extra 100 consignments: `INR 500/month`

### Enforcement controls
- Hard controls:
  - Block new consignment creation when monthly quota exceeded
  - Block login after grace period if subscription expired
- Soft controls:
  - Usage warning at 80% and 95%
  - Renewal reminder notifications

### Billing flow
1. Tenant admin selects plan
2. Payment success activates license
3. Daily usage sync updates license counters
4. Renewal extends validity and resets quota cycle

## 6) Data Model Direction (High-level)
- `Platform DB`
  - Tenants, Plans, Subscriptions, Invoices, Payments, UsageCounters, LicenseEvents
- `Tenant DB`
  - Users, Roles, Permissions
  - Consignments
  - Challans
  - LorryPayments
  - Invoices
  - MoneyReceipts
  - Masters (Branch, Location, Customer, Vehicle, Driver)

## 7) Execution Order (One by One)
1. Finalize UX + screen wireframes (Phase 1 + Security + Settings)
2. Freeze database schema for Phase 1 flow
3. Implement auth + RBAC + tenant resolution middleware
4. Build Consignment module
5. Build Challan and payment module
6. Build Invoice + print layout
7. Build Money Receipt
8. Build reports and outstanding logic
9. Add subscription/license enforcement
10. Package SaaS + self-host deployment options

## 8) Current Artifact
- FigJam IA + flow: https://www.figma.com/online-whiteboard/create-diagram/35354b43-5ae4-45bd-bcb3-33e8bb9485df?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=e980c4f8-8029-435d-ad8d-1ca0ce909ad0

## 9) Next Immediate Step
- Create actual Figma low-fidelity wireframes for these first 8 screens:
  1) Login
  2) Dashboard
  3) Consignment List
  4) Create Consignment
  5) Challan from Consignment
  6) Invoice from Challan
  7) Money Receipt from Invoice
  8) Roles & Permissions Matrix
