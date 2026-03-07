namespace Sangu.Tms.Infrastructure.Tenancy;

public static class TenantResolver
{
    public static string? FromHeader(IDictionary<string, string> headers)
    {
        if (headers.TryGetValue("X-Tenant-Code", out var value))
        {
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        return null;
    }
}
