using Sangu.Tms.Application.Interfaces;

namespace Sangu.Tms.Api.Middleware;

public sealed class LicenseGuardMiddleware
{
    private readonly RequestDelegate _next;

    public LicenseGuardMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context, ILicenseService licenseService)
    {
        var tenantCode = context.Items["TenantCode"]?.ToString() ?? "default";
        var isActive = await licenseService.IsTenantActiveAsync(tenantCode, context.RequestAborted);
        if (!isActive)
        {
            context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
            await context.Response.WriteAsJsonAsync(new { error = "License inactive or expired." }, context.RequestAborted);
            return;
        }

        await _next(context);
    }
}
