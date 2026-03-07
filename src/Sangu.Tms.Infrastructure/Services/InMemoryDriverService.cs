using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryDriverService : IDriverService
{
    private readonly InMemoryDataStore _store;

    public InMemoryDriverService(InMemoryDataStore store)
    {
        _store = store;
    }

    public Task<IReadOnlyCollection<DriverViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyCollection<DriverViewModel>>(_store.Drivers.OrderBy(x => x.Name).ToList());

    public Task<DriverViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(_store.Drivers.FirstOrDefault(x => x.Id == id));

    public Task<DriverViewModel> CreateAsync(DriverUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            if (_store.Drivers.Any(x => x.LicenseNo.Equals(model.LicenseNo, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Driver license already exists.");

            var row = new DriverViewModel
            {
                Id = Guid.NewGuid(),
                Name = model.Name.Trim(),
                LicenseNo = model.LicenseNo.Trim().ToUpperInvariant(),
                DateOfBirth = model.DateOfBirth,
                Address = model.Address?.Trim(),
                BloodGroup = model.BloodGroup?.Trim(),
                Mobile = model.Mobile?.Trim(),
                IsActive = model.IsActive
            };
            _store.Drivers.Add(row);
            return Task.FromResult(row);
        }
    }

    public Task<DriverViewModel?> UpdateAsync(Guid id, DriverUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            var row = _store.Drivers.FirstOrDefault(x => x.Id == id);
            if (row is null) return Task.FromResult<DriverViewModel?>(null);
            if (_store.Drivers.Any(x => x.Id != id && x.LicenseNo.Equals(model.LicenseNo, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Driver license already exists.");

            row.Name = model.Name.Trim();
            row.LicenseNo = model.LicenseNo.Trim().ToUpperInvariant();
            row.DateOfBirth = model.DateOfBirth;
            row.Address = model.Address?.Trim();
            row.BloodGroup = model.BloodGroup?.Trim();
            row.Mobile = model.Mobile?.Trim();
            row.IsActive = model.IsActive;
            return Task.FromResult<DriverViewModel?>(row);
        }
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_store.SyncRoot)
        {
            var row = _store.Drivers.FirstOrDefault(x => x.Id == id);
            if (row is null) return Task.FromResult(false);
            _store.Drivers.Remove(row);
            return Task.FromResult(true);
        }
    }

    private static void Validate(DriverUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Name)) throw new ArgumentException("Driver name is required.");
        if (string.IsNullOrWhiteSpace(model.LicenseNo)) throw new ArgumentException("License number is required.");
    }
}
