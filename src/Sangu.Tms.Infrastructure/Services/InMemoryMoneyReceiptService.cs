using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryMoneyReceiptService : IMoneyReceiptService
{
    private readonly InMemoryDataStore _store;
    private readonly INumberingService _numberingService;

    public InMemoryMoneyReceiptService(InMemoryDataStore store, INumberingService numberingService)
    {
        _store = store;
        _numberingService = numberingService;
    }

    public Task<IReadOnlyCollection<MoneyReceiptViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<MoneyReceiptViewModel> rows = _store.MoneyReceipts
            .OrderByDescending(x => x.ReceiptDate)
            .ToList();
        return Task.FromResult(rows);
    }

    public Task<MoneyReceiptViewModel?> CreateForInvoiceAsync(Guid invoiceId, MoneyReceiptCreateModel model, CancellationToken cancellationToken = default)
    {
        if (model.BranchId == Guid.Empty) throw new ArgumentException("Branch is required.");
        if (model.Amount <= 0) throw new ArgumentException("Receipt amount must be greater than zero.");

        lock (_store.SyncRoot)
        {
            var invoice = _store.Invoices.FirstOrDefault(x => x.Id == invoiceId);
            if (invoice is null) return Task.FromResult<MoneyReceiptViewModel?>(null);

            var outstanding = invoice.TotalAmount - invoice.ReceivedAmount;
            if (model.Amount > outstanding) throw new ArgumentException("Receipt amount cannot exceed invoice outstanding.");

            var receipt = new MoneyReceiptViewModel
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoiceId,
                ReceiptNo = _numberingService.NextReceiptNo(),
                BranchId = model.BranchId,
                ReceiptDate = model.ReceiptDate,
                Amount = model.Amount,
                Mode = model.Mode.ToLowerInvariant(),
                ReferenceNo = model.ReferenceNo,
                Status = "Posted"
            };

            invoice.ReceivedAmount += model.Amount;
            invoice.Status = invoice.ReceivedAmount == invoice.TotalAmount ? "Paid" : "PartiallyPaid";

            _store.MoneyReceipts.Add(receipt);
            return Task.FromResult<MoneyReceiptViewModel?>(receipt);
        }
    }
}

