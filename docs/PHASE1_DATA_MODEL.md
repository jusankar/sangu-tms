# Phase 1 Data Model (Frozen v1)

## Scope
- Consignment
- Lorry Hire / Challan
- Part + balance payments
- Invoice
- Money Receipt
- Settings masters (branch, location, customer)
- Auth + RBAC (tenant DB)
- License + usage (platform DB)

## Database strategy
- `Platform DB`: tenant registry, plan, subscription, usage counters
- `Tenant DB`: all operational data per customer

## Core business flow
1. Create `consignment`
2. Create `challan` against consignment
3. Record `lorry_payment` (part/balance)
4. Create `invoice` against consignment (+ optional challan links)
5. Create `money_receipt` against invoice

## Invariants
- One consignment can have many challans
- One challan can have many lorry payments
- One consignment can have many invoices
- One invoice can have many money receipts
- `invoice.total_amount` must be >= sum(receipts)
- `challan.total_hire` must be >= sum(lorry_payments)

## Numbering (per tenant + branch + FY)
- Consignment: `CN/{branch}/{fy}/{seq}`
- Challan: `CH/{branch}/{fy}/{seq}`
- Invoice: `IV/{branch}/{fy}/{seq}`
- Receipt: `RC/{branch}/{fy}/{seq}`

## Operational statuses
- Consignment: `Draft`, `Confirmed`, `Closed`, `Cancelled`
- Challan: `Open`, `Closed`, `Cancelled`
- Invoice: `Draft`, `Posted`, `Paid`, `PartiallyPaid`, `Cancelled`
- Receipt: `Posted`, `Reversed`

## Auditing
- Add `created_at`, `created_by`, `updated_at`, `updated_by` on all transactional tables
- Use soft-delete (`is_deleted`) for masters

