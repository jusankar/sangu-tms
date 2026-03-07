namespace Sangu.Tms.Application.Interfaces;

public interface ITenantContext
{
    string? TenantCode { get; }
    Guid? TenantId { get; }
    Guid? BranchId { get; }
}

