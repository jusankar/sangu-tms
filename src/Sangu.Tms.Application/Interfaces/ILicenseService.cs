namespace Sangu.Tms.Application.Interfaces;

public interface ILicenseService
{
    Task<bool> IsTenantActiveAsync(string tenantCode, CancellationToken cancellationToken = default);
    Task<bool> CanCreateConsignmentAsync(string tenantCode, CancellationToken cancellationToken = default);
}

