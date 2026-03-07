using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryVehicleService : IVehicleService
{
    private readonly InMemoryDataStore _store;

    public InMemoryVehicleService(InMemoryDataStore store)
    {
        _store = store;
    }

    public Task<IReadOnlyCollection<VehicleViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyCollection<VehicleViewModel>>(_store.Vehicles.OrderBy(x => x.VehicleNumber).ToList());

    public Task<VehicleViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(_store.Vehicles.FirstOrDefault(x => x.Id == id));

    public Task<VehicleViewModel> CreateAsync(VehicleUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            if (_store.Vehicles.Any(x => x.VehicleNumber.Equals(model.VehicleNumber, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Vehicle number already exists.");

            var row = new VehicleViewModel
            {
                Id = Guid.NewGuid(),
                VehicleNumber = model.VehicleNumber.Trim().ToUpperInvariant(),
                Make = model.Make?.Trim(),
                Type = model.Type?.Trim(),
                ChassisNumber = model.ChassisNumber?.Trim(),
                EngineNumber = model.EngineNumber?.Trim(),
                IsActive = model.IsActive
            };
            _store.Vehicles.Add(row);
            return Task.FromResult(row);
        }
    }

    public Task<VehicleViewModel?> UpdateAsync(Guid id, VehicleUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            var row = _store.Vehicles.FirstOrDefault(x => x.Id == id);
            if (row is null) return Task.FromResult<VehicleViewModel?>(null);
            if (_store.Vehicles.Any(x => x.Id != id && x.VehicleNumber.Equals(model.VehicleNumber, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Vehicle number already exists.");

            row.VehicleNumber = model.VehicleNumber.Trim().ToUpperInvariant();
            row.Make = model.Make?.Trim();
            row.Type = model.Type?.Trim();
            row.ChassisNumber = model.ChassisNumber?.Trim();
            row.EngineNumber = model.EngineNumber?.Trim();
            row.IsActive = model.IsActive;
            return Task.FromResult<VehicleViewModel?>(row);
        }
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_store.SyncRoot)
        {
            var row = _store.Vehicles.FirstOrDefault(x => x.Id == id);
            if (row is null) return Task.FromResult(false);
            _store.Vehicles.Remove(row);
            return Task.FromResult(true);
        }
    }

    private static void Validate(VehicleUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.VehicleNumber)) throw new ArgumentException("Vehicle number is required.");
    }
}
