using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresMoneyReceiptService : IMoneyReceiptService
{
    private readonly SanguTmsDbContext _db;
    private readonly INumberingService _numberingService;

    public PostgresMoneyReceiptService(SanguTmsDbContext db, INumberingService numberingService)
    {
        _db = db;
        _numberingService = numberingService;
    }

    public async Task<IReadOnlyCollection<MoneyReceiptViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _db.MoneyReceipts
            .AsNoTracking()
            .OrderByDescending(x => x.ReceiptDate)
            .ToListAsync(cancellationToken);

        return rows.Select(x => new MoneyReceiptViewModel
        {
            Id = x.Id,
            InvoiceId = x.InvoiceId,
            ReceiptNo = x.ReceiptNo,
            BranchId = x.BranchId,
            ReceiptDate = x.ReceiptDate,
            Amount = x.Amount,
            Mode = x.Mode,
            ReferenceNo = x.ReferenceNo,
            Status = x.Status
        }).ToList();
    }

    public async Task<MoneyReceiptViewModel?> CreateForInvoiceAsync(Guid invoiceId, MoneyReceiptCreateModel model, CancellationToken cancellationToken = default)
    {
        if (model.BranchId == Guid.Empty) throw new ArgumentException("Branch is required.");
        if (model.Amount <= 0) throw new ArgumentException("Receipt amount must be greater than zero.");

        var invoice = await _db.Invoices.FirstOrDefaultAsync(x => x.Id == invoiceId, cancellationToken);
        if (invoice is null) return null;

        var outstanding = invoice.TotalAmount - invoice.ReceivedAmount;
        if (model.Amount > outstanding) throw new ArgumentException("Receipt amount cannot exceed invoice outstanding.");

        var receiptNo = await ResolveReceiptNoAsync(model.ReceiptNo, cancellationToken);

        var receipt = new MoneyReceiptRecord
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoiceId,
            ReceiptNo = receiptNo,
            BranchId = model.BranchId,
            ReceiptDate = model.ReceiptDate,
            Amount = model.Amount,
            Mode = model.Mode.ToLowerInvariant(),
            ReferenceNo = model.ReferenceNo?.Trim(),
            Status = "Posted",
            CreatedAt = DateTime.UtcNow
        };

        invoice.ReceivedAmount += model.Amount;
        invoice.Status = invoice.ReceivedAmount == invoice.TotalAmount ? "Paid" : "PartiallyPaid";
        invoice.UpdatedAt = DateTime.UtcNow;

        _db.MoneyReceipts.Add(receipt);
        await _db.SaveChangesAsync(cancellationToken);

        return new MoneyReceiptViewModel
        {
            Id = receipt.Id,
            InvoiceId = receipt.InvoiceId,
            ReceiptNo = receipt.ReceiptNo,
            BranchId = receipt.BranchId,
            ReceiptDate = receipt.ReceiptDate,
            Amount = receipt.Amount,
            Mode = receipt.Mode,
            ReferenceNo = receipt.ReferenceNo,
            Status = receipt.Status
        };
    }

    private async Task<string> ResolveReceiptNoAsync(string? requestedNo, CancellationToken cancellationToken)
    {
        var receiptNo = string.IsNullOrWhiteSpace(requestedNo) ? _numberingService.NextReceiptNo() : requestedNo.Trim();
        var exists = await _db.MoneyReceipts.AnyAsync(x => x.ReceiptNo.ToLower() == receiptNo.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Money receipt number already exists.");
        return receiptNo;
    }
}
