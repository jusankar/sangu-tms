using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryLocationService : ILocationService
{
    private readonly InMemoryDataStore _store;

    public InMemoryLocationService(InMemoryDataStore store)
    {
        _store = store;
    }

    public Task<IReadOnlyCollection<LocationViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyCollection<LocationViewModel>>(_store.Locations.OrderBy(x => x.Code).ToList());

    public Task<LocationViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(_store.Locations.FirstOrDefault(x => x.Id == id));

    public Task<LocationViewModel> CreateAsync(LocationUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            if (_store.Locations.Any(x => x.Code.Equals(model.Code, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Location code already exists.");

            var row = new LocationViewModel
            {
                Id = Guid.NewGuid(),
                Code = model.Code.Trim(),
                Name = model.Name.Trim(),
                StateName = model.StateName?.Trim(),
                IsActive = model.IsActive
            };
            _store.Locations.Add(row);
            return Task.FromResult(row);
        }
    }

    public Task<LocationViewModel?> UpdateAsync(Guid id, LocationUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            var row = _store.Locations.FirstOrDefault(x => x.Id == id);
            if (row is null) return Task.FromResult<LocationViewModel?>(null);
            if (_store.Locations.Any(x => x.Id != id && x.Code.Equals(model.Code, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Location code already exists.");

            row.Code = model.Code.Trim();
            row.Name = model.Name.Trim();
            row.StateName = model.StateName?.Trim();
            row.IsActive = model.IsActive;
            return Task.FromResult<LocationViewModel?>(row);
        }
    }

    private static void Validate(LocationUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Code)) throw new ArgumentException("Code is required.");
        if (string.IsNullOrWhiteSpace(model.Name)) throw new ArgumentException("Name is required.");
    }
}

