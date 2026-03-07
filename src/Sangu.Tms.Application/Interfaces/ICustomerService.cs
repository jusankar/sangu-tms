using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface ICustomerService
{
    Task<IReadOnlyCollection<CustomerViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CustomerViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CustomerViewModel> CreateAsync(CustomerUpsertModel model, CancellationToken cancellationToken = default);
    Task<CustomerViewModel?> UpdateAsync(Guid id, CustomerUpsertModel model, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
