using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IVehicleService
{
    Task<IReadOnlyCollection<VehicleViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<VehicleViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VehicleViewModel> CreateAsync(VehicleUpsertModel model, CancellationToken cancellationToken = default);
    Task<VehicleViewModel?> UpdateAsync(Guid id, VehicleUpsertModel model, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
