# Auth, RBAC, and Tenant Isolation Skeleton

## Request pipeline (backend)
1. Resolve tenant from one of:
- subdomain (`tenant.sangutms.com`)
- header (`X-Tenant-Code`)
- login payload (`tenantCode`) for initial auth
2. Validate subscription/license status from platform DB cache
3. Attach tenant DB connection for request scope
4. Authenticate JWT
5. Authorize permission claim (`module.action`)
6. Execute endpoint logic

## JWT claims (minimum)
- `sub`: user id
- `tenant_id`
- `tenant_code`
- `branch_id` (optional; can be switched)
- `is_admin`
- `permissions`: string array (`consignment.create`, `invoice.post`)

## Permission naming
- `consignment.view`, `consignment.create`, `consignment.edit`, `consignment.cancel`
- `challan.view`, `challan.create`, `challan.payment`
- `invoice.view`, `invoice.create`, `invoice.post`, `invoice.print`
- `receipt.view`, `receipt.create`, `receipt.reverse`
- `report.booking`, `report.lorry_payment`, `report.outstanding`
- `settings.branch`, `settings.location`, `settings.customer`
- `users.manage`, `roles.manage`

## .NET implementation structure
```
src/
  Api/
    Middleware/
      TenantResolutionMiddleware.cs
      LicenseGuardMiddleware.cs
    Authorization/
      PermissionRequirement.cs
      PermissionHandler.cs
  Application/
    Interfaces/
      ITenantContext.cs
      ILicenseService.cs
  Infrastructure/
    Tenancy/
      TenantResolver.cs
      TenantConnectionFactory.cs
    Identity/
      JwtTokenService.cs
```

## Enforcement rules
- If license expired and beyond grace: reject with `402` + code `LICENSE_EXPIRED`
- If consignment quota reached: reject consignment create with `429` + code `QUOTA_EXCEEDED`
- Admin-only APIs: require `is_admin = true` or `users.manage` style permissions

