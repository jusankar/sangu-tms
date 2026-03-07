using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IInvoiceService
{
    Task<IReadOnlyCollection<InvoiceViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<InvoiceViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<InvoiceViewModel> CreateAsync(InvoiceCreateModel model, CancellationToken cancellationToken = default);
}

