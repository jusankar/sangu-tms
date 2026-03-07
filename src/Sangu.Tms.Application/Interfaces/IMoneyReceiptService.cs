using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IMoneyReceiptService
{
    Task<IReadOnlyCollection<MoneyReceiptViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<MoneyReceiptViewModel?> CreateForInvoiceAsync(Guid invoiceId, MoneyReceiptCreateModel model, CancellationToken cancellationToken = default);
}

