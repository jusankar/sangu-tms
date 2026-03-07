using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IDriverService
{
    Task<IReadOnlyCollection<DriverViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<DriverViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DriverViewModel> CreateAsync(DriverUpsertModel model, CancellationToken cancellationToken = default);
    Task<DriverViewModel?> UpdateAsync(Guid id, DriverUpsertModel model, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
