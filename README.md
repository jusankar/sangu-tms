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


## Database configuration
Set the connection string in your environment (recommended):
- PowerShell session only:
  - `$env:ConnectionStrings__TenantDb = "Host=localhost;Port=5432;Database=sangu2;Username=postgres;Password=YOUR_PASSWORD"`
- Persist for your user:
  - `[System.Environment]::SetEnvironmentVariable("ConnectionStrings__TenantDb", "Host=localhost;Port=5432;Database=sangu2;Username=postgres;Password=YOUR_PASSWORD", "User")`

## EF Core migrations (optional)
If you want to manage schema changes with EF Core:
1. Create a migration:
   - `dotnet ef migrations add InitialCreate --project src/Sangu.Tms.Infrastructure --startup-project src/Sangu.Tms.Api`
2. Apply to database:
   - `dotnet ef database update --startup-project src/Sangu.Tms.Api`

Note: The repo already includes `db/tenant/schema_v1.sql` for manual setup; choose one workflow.

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

## Chat service (read-only)
- Project: `src/Sangu.Tms.ChatService`
- Endpoint: `POST /api/chat/ask`
- Health: `GET /health` (service `chat`)
- Service generates SQL from user message using AI and executes read-only queries only.
- Service guarantees read-only behavior via SQL safety guard (no insert/update/delete/ddl)
- Required env/config:
  - `OPENAI_API_KEY` (or `OpenAI:ApiKey`)
  - Optional `OpenAI:Model` (default `gpt-4o-mini`)
  - Optional `OpenAI:BaseUrl` (default `https://api.openai.com`)
- Supported query intents:
  - Outstanding amount for customer
  - Booking amount for customer
  - Booking amount for consignment number
  - Lorry hire amount for challan/lorry hire number
  - Payment details for invoice number

### Frontend chat widget
- A floating chat icon is added at the bottom-right for authenticated screens.
- Optional frontend env:
  - `VITE_CHAT_API_BASE_URL=http://localhost:5006`
- Default chat service URL (if env not set): `http://localhost:5006`

## Default login (in-memory)
- Email: `admin@sangu.local`
- Password: `Admin@123`

Use `POST /api/auth/login` to get an access token, then click **Authorize** in Swagger and paste:
- `Bearer <accessToken>`


## Traffic planning service (Python)
This module uses a FastAPI service for 3D packing.

1. Create a virtualenv and install deps:
   - `python -m venv .venv`
   - `.venv\Scripts\activate`
   - `pip install -r services/traffic_packing/requirements.txt`
2. Run the service:
   - `uvicorn services.traffic_packing.main:app --host 0.0.0.0 --port 8002`

The API reads the service URL from `TrafficPackingService:BaseUrl` (defaults to `http://localhost:8002`).

## React frontend setup
- Frontend path: `frontend/`
- Install deps:
  - `cd frontend`
  - `npm install`
- Start dev server:
  - `npm run dev`
- Optional env file:
  - Copy `frontend/.env.example` to `frontend/.env`


