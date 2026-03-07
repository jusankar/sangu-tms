using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryCustomerService : ICustomerService
{
    private readonly InMemoryDataStore _store;

    public InMemoryCustomerService(InMemoryDataStore store)
    {
        _store = store;
    }

    public Task<IReadOnlyCollection<CustomerViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyCollection<CustomerViewModel>>(_store.Customers.OrderBy(x => x.Code).ToList());

    public Task<CustomerViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(_store.Customers.FirstOrDefault(x => x.Id == id));

    public Task<CustomerViewModel> CreateAsync(CustomerUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            if (_store.Customers.Any(x => x.Code.Equals(model.Code, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Customer code already exists.");

            var row = new CustomerViewModel
            {
                Id = Guid.NewGuid(),
                Code = model.Code.Trim(),
                Name = model.Name.Trim(),
                Address = model.Address?.Trim(),
                GstNo = model.GstNo?.Trim(),
                Mobile = model.Mobile?.Trim(),
                CreditDays = model.CreditDays,
                IsActive = model.IsActive
            };
            _store.Customers.Add(row);
            return Task.FromResult(row);
        }
    }

    public Task<CustomerViewModel?> UpdateAsync(Guid id, CustomerUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        lock (_store.SyncRoot)
        {
            var row = _store.Customers.FirstOrDefault(x => x.Id == id);
            if (row is null) return Task.FromResult<CustomerViewModel?>(null);
            if (_store.Customers.Any(x => x.Id != id && x.Code.Equals(model.Code, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Customer code already exists.");

            row.Code = model.Code.Trim();
            row.Name = model.Name.Trim();
            row.Address = model.Address?.Trim();
            row.GstNo = model.GstNo?.Trim();
            row.Mobile = model.Mobile?.Trim();
            row.CreditDays = model.CreditDays;
            row.IsActive = model.IsActive;
            return Task.FromResult<CustomerViewModel?>(row);
        }
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_store.SyncRoot)
        {
            var row = _store.Customers.FirstOrDefault(x => x.Id == id);
            if (row is null)
            {
                return Task.FromResult(false);
            }

            _store.Customers.Remove(row);
            return Task.FromResult(true);
        }
    }

    private static void Validate(CustomerUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Code)) throw new ArgumentException("Code is required.");
        if (string.IsNullOrWhiteSpace(model.Name)) throw new ArgumentException("Name is required.");
        if (model.CreditDays < 0) throw new ArgumentException("Credit days cannot be negative.");
    }
}
