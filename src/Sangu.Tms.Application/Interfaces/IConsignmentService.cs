using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IConsignmentService
{
    Task<IReadOnlyCollection<ConsignmentViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ConsignmentViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ConsignmentViewModel> CreateAsync(ConsignmentUpsertModel model, CancellationToken cancellationToken = default);
    Task<ConsignmentViewModel?> UpdateAsync(Guid id, ConsignmentUpsertModel model, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
