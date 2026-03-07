using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryBranchService : IBranchService
{
    private readonly InMemoryDataStore _store;

    public InMemoryBranchService(InMemoryDataStore store)
    {
        _store = store;
    }

    public Task<IReadOnlyCollection<BranchViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyCollection<BranchViewModel>>(_store.Branches.OrderBy(x => x.Code).ToList());

    public Task<BranchViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(_store.Branches.FirstOrDefault(x => x.Id == id));

    public Task<BranchViewModel> CreateAsync(BranchUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            if (_store.Branches.Any(x => x.Code.Equals(model.Code, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Branch code already exists.");

            var row = new BranchViewModel
            {
                Id = Guid.NewGuid(),
                Code = model.Code.Trim(),
                Name = model.Name.Trim(),
                Address = model.Address?.Trim(),
                IsActive = model.IsActive
            };
            _store.Branches.Add(row);
            return Task.FromResult(row);
        }
    }

    public Task<BranchViewModel?> UpdateAsync(Guid id, BranchUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            var row = _store.Branches.FirstOrDefault(x => x.Id == id);
            if (row is null) return Task.FromResult<BranchViewModel?>(null);
            if (_store.Branches.Any(x => x.Id != id && x.Code.Equals(model.Code, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Branch code already exists.");

            row.Code = model.Code.Trim();
            row.Name = model.Name.Trim();
            row.Address = model.Address?.Trim();
            row.IsActive = model.IsActive;
            return Task.FromResult<BranchViewModel?>(row);
        }
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_store.SyncRoot)
        {
            var row = _store.Branches.FirstOrDefault(x => x.Id == id);
            if (row is null)
            {
                return Task.FromResult(false);
            }

            _store.Branches.Remove(row);
            return Task.FromResult(true);
        }
    }

    private static void Validate(BranchUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Code)) throw new ArgumentException("Code is required.");
        if (string.IsNullOrWhiteSpace(model.Name)) throw new ArgumentException("Name is required.");
    }
}
