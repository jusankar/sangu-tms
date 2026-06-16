# Sangu TMS — Frontend

React + TypeScript + Vite frontend for the Sangu TMS 2.0 platform.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Environment

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000` | .NET API base URL |
| `VITE_CHAT_API_BASE_URL` | `http://localhost:5006` | AI chat service URL |

## Default login

- Email: `admin@sangu.local`
- Password: `Admin@123`

## Key modules

| Module | Pages |
|---|---|
| Operations | Consignments, Challans, Invoices, Money Receipts |
| Reports | Booking, Lorry Payment, Outstanding, Vehicle Statement |
| Traffic | Vehicle Placement Board, Vehicle Tracking, Traffic Plan History |
| Masters | Branches, Locations, Customers, Vehicles, Drivers |
| Access Control | Users, Roles & Permissions |
