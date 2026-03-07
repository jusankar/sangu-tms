using Sangu.Tms.Application.Interfaces;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryLicenseService : ILicenseService
{
    private const int ConsignmentLimitPerPeriod = 100;
    private readonly InMemoryDataStore _store;

    public InMemoryLicenseService(InMemoryDataStore store)
    {
        _store = store;
    }

    public Task<bool> IsTenantActiveAsync(string tenantCode, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }

    public Task<bool> CanCreateConsignmentAsync(string tenantCode, CancellationToken cancellationToken = default)
    {
        var periodStart = new DateOnly(DateTime.Today.Year, DateTime.Today.Month, 1);
        var count = _store.Consignments.Count(x => x.BookingDate >= periodStart);
        return Task.FromResult(count < ConsignmentLimitPerPeriod);
    }
}

