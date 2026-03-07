# Sangu TMS 2.0

Initial project scaffolding, schema, and API contracts for Phase 1.

## Current contents
- `db/platform/schema_v1.sql` - license/subscription metadata DB
- `db/tenant/schema_v1.sql` - operational per-tenant DB
- `contracts/openapi/phase1.yaml` - Phase 1 API contract
- `docs/` - model freeze, tenancy/auth skeleton, implementation checklist
- `src/` - manual .NET clean architecture skeleton

## Prerequisites
- .NET SDK 8.x
- PostgreSQL 15+

## Next action after SDK install
1. Create solution file and add projects:
   - `dotnet new sln -n Sangu.Tms`
   - `dotnet sln add src/Sangu.Tms.Api/Sangu.Tms.Api.csproj`
   - `dotnet sln add src/Sangu.Tms.Application/Sangu.Tms.Application.csproj`
   - `dotnet sln add src/Sangu.Tms.Domain/Sangu.Tms.Domain.csproj`
   - `dotnet sln add src/Sangu.Tms.Infrastructure/Sangu.Tms.Infrastructure.csproj`
2. Restore and build:
   - `dotnet restore`
   - `dotnet build`

## Environment note for this workspace
- This environment blocks access to `C:\Users\Admin\AppData\Roaming\NuGet`.
- Use [scripts/dev-dotnet.ps1](c:\Projects\sangu2\scripts\dev-dotnet.ps1) to run restore/build with local workspace paths.

## Working API slice
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /health`
- `GET /api/info`
- `GET /api/consignments`
- `POST /api/consignments`
- `GET /api/consignments/{id}`
- `PUT /api/consignments/{id}`
- `GET /api/challans`
- `POST /api/challans`
- `POST /api/challans/{id}/payments`
- `GET /api/invoices`
- `POST /api/invoices`
- `POST /api/invoices/{id}/receipts`
- `GET /api/receipts`
- `GET /api/reports/booking`
- `GET /api/reports/lorry-payments`
- `GET /api/reports/outstanding`
- `GET/POST/PUT /api/branches`
- `GET/POST/PUT /api/locations`
- `GET/POST/PUT /api/customers`
- `GET /api/rbac/permissions`
- `GET/POST/PUT /api/rbac/roles`
- `GET/POST/PUT /api/rbac/users`

## Default login (in-memory)
- Email: `admin@sangu.local`
- Password: `Admin@123`

Use `POST /api/auth/login` to get an access token, then click **Authorize** in Swagger and paste:
- `Bearer <accessToken>`

## React frontend setup
- Frontend path: `frontend/`
- Install deps:
  - `cd frontend`
  - `npm install`
- Start dev server:
  - `npm run dev`
- Optional env file:
  - Copy `frontend/.env.example` to `frontend/.env`
