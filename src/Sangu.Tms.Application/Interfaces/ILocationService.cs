using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface ILocationService
{
    Task<IReadOnlyCollection<LocationViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<LocationViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LocationViewModel> CreateAsync(LocationUpsertModel model, CancellationToken cancellationToken = default);
    Task<LocationViewModel?> UpdateAsync(Guid id, LocationUpsertModel model, CancellationToken cancellationToken = default);
}

