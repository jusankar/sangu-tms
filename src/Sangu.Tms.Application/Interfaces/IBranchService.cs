using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IBranchService
{
    Task<IReadOnlyCollection<BranchViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<BranchViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BranchViewModel> CreateAsync(BranchUpsertModel model, CancellationToken cancellationToken = default);
    Task<BranchViewModel?> UpdateAsync(Guid id, BranchUpsertModel model, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
