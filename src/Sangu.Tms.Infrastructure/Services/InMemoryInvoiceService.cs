using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryInvoiceService : IInvoiceService
{
    private readonly InMemoryDataStore _store;
    private readonly INumberingService _numberingService;

    public InMemoryInvoiceService(InMemoryDataStore store, INumberingService numberingService)
    {
        _store = store;
        _numberingService = numberingService;
    }

    public Task<IReadOnlyCollection<InvoiceViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<InvoiceViewModel> rows = _store.Invoices
            .OrderByDescending(x => x.InvoiceDate)
            .ToList();
        return Task.FromResult(rows);
    }

    public Task<InvoiceViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_store.Invoices.FirstOrDefault(x => x.Id == id));
    }

    public Task<InvoiceViewModel> CreateAsync(InvoiceCreateModel model, CancellationToken cancellationToken = default)
    {
        if (model.BranchId == Guid.Empty) throw new ArgumentException("Branch is required.");
        if (model.ConsignmentId == Guid.Empty) throw new ArgumentException("Consignment is required.");
        if (model.TotalAmount <= 0) throw new ArgumentException("Total amount must be greater than zero.");
        if (model.TaxableAmount < 0 || model.GstAmount < 0) throw new ArgumentException("Tax amounts cannot be negative.");
        if (model.TaxableAmount + model.GstAmount != model.TotalAmount) throw new ArgumentException("Total amount must equal taxable + GST.");

        lock (_store.SyncRoot)
        {
            var consignmentExists = _store.Consignments.Any(x => x.Id == model.ConsignmentId);
            if (!consignmentExists) throw new ArgumentException("Consignment not found for invoice.");

            if (model.ChallanIds.Count > 0)
            {
                var invalidChallan = _store.Challans.Any(x =>
                    model.ChallanIds.Contains(x.Id) &&
                    x.Consignments.All(line => line.ConsignmentId != model.ConsignmentId));
                if (invalidChallan) throw new ArgumentException("All challans must include the selected consignment.");

                var missingChallans = model.ChallanIds.Any(id => _store.Challans.All(c => c.Id != id));
                if (missingChallans) throw new ArgumentException("One or more challans were not found.");
            }

            var invoice = new InvoiceViewModel
            {
                Id = Guid.NewGuid(),
                InvoiceNo = ResolveInvoiceNo(model.InvoiceNo),
                BranchId = model.BranchId,
                InvoiceDate = model.InvoiceDate,
                ConsignmentId = model.ConsignmentId,
                ChallanIds = model.ChallanIds.Distinct().ToList(),
                TaxableAmount = model.TaxableAmount,
                GstAmount = model.GstAmount,
                TotalAmount = model.TotalAmount,
                DueDate = model.DueDate,
                ReceivedAmount = 0,
                Status = "Posted"
            };

            _store.Invoices.Add(invoice);
            return Task.FromResult(invoice);
        }
    }

    private string ResolveInvoiceNo(string? requestedNo)
    {
        var invoiceNo = string.IsNullOrWhiteSpace(requestedNo) ? _numberingService.NextInvoiceNo() : requestedNo.Trim();
        if (_store.Invoices.Any(x => x.InvoiceNo.Equals(invoiceNo, StringComparison.OrdinalIgnoreCase)))
            throw new ArgumentException("Invoice number already exists.");
        return invoiceNo;
    }
}
