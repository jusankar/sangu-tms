using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresLicenseService : ILicenseService
{
    private const int ConsignmentLimitPerPeriod = 100;
    private readonly SanguTmsDbContext _db;

    public PostgresLicenseService(SanguTmsDbContext db)
    {
        _db = db;
    }

    public Task<bool> IsTenantActiveAsync(string tenantCode, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }

    public async Task<bool> CanCreateConsignmentAsync(string tenantCode, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var periodStart = new DateOnly(today.Year, today.Month, 1);
        var count = await _db.Consignments.CountAsync(x => x.BookingDate >= periodStart, cancellationToken);
        return count < ConsignmentLimitPerPeriod;
    }
}
