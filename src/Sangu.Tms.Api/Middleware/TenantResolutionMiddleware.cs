namespace Sangu.Tms.Api.Middleware;

public sealed class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        var tenantCode = context.Request.Headers["X-Tenant-Code"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(tenantCode))
        {
            context.Items["TenantCode"] = tenantCode;
        }

        await _next(context);
    }
}

