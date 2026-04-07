using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresInvoiceService : IInvoiceService
{
    private readonly SanguTmsDbContext _db;
    private readonly INumberingService _numberingService;

    public PostgresInvoiceService(SanguTmsDbContext db, INumberingService numberingService)
    {
        _db = db;
        _numberingService = numberingService;
    }

    public async Task<IReadOnlyCollection<InvoiceViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var invoices = await _db.Invoices
            .AsNoTracking()
            .OrderByDescending(x => x.InvoiceDate)
            .ToListAsync(cancellationToken);

        var invoiceIds = invoices.Select(x => x.Id).ToList();
        var links = invoiceIds.Count == 0
            ? new List<InvoiceChallanRecord>()
            : await _db.InvoiceChallans
                .AsNoTracking()
                .Where(x => invoiceIds.Contains(x.InvoiceId))
                .ToListAsync(cancellationToken);

        var challanMap = links
            .GroupBy(x => x.InvoiceId)
            .ToDictionary(x => x.Key, x => x.Select(v => v.ChallanId).ToList());

        return invoices.Select(x => Map(x, challanMap)).ToList();
    }

    public async Task<InvoiceViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var invoice = await _db.Invoices.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (invoice is null) return null;

        var challanIds = await _db.InvoiceChallans
            .AsNoTracking()
            .Where(x => x.InvoiceId == id)
            .Select(x => x.ChallanId)
            .ToListAsync(cancellationToken);

        var map = new Dictionary<Guid, List<Guid>> { [id] = challanIds };
        return Map(invoice, map);
    }

    public async Task<InvoiceViewModel> CreateAsync(InvoiceCreateModel model, CancellationToken cancellationToken = default)
    {
        if (model.BranchId == Guid.Empty) throw new ArgumentException("Branch is required.");
        if (model.ConsignmentId == Guid.Empty) throw new ArgumentException("Consignment is required.");
        if (model.TotalAmount <= 0) throw new ArgumentException("Total amount must be greater than zero.");
        if (model.TaxableAmount < 0 || model.GstAmount < 0) throw new ArgumentException("Tax amounts cannot be negative.");
        if (model.TaxableAmount + model.GstAmount != model.TotalAmount) throw new ArgumentException("Total amount must equal taxable + GST.");

        var consignmentExists = await _db.Consignments.AnyAsync(x => x.Id == model.ConsignmentId, cancellationToken);
        if (!consignmentExists) throw new ArgumentException("Consignment not found for invoice.");

        var challanIds = model.ChallanIds.Distinct().ToList();
        if (challanIds.Count > 0)
        {
            var existing = await _db.Challans
                .AsNoTracking()
                .Where(x => challanIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);

            if (existing.Count != challanIds.Count)
                throw new ArgumentException("One or more challans were not found.");

            var matches = await _db.ChallanConsignments
                .AsNoTracking()
                .Where(x => challanIds.Contains(x.ChallanId) && x.ConsignmentId == model.ConsignmentId)
                .Select(x => x.ChallanId)
                .Distinct()
                .ToListAsync(cancellationToken);

            if (matches.Count != challanIds.Count)
                throw new ArgumentException("All challans must include the selected consignment.");
        }

        var invoiceNo = await ResolveInvoiceNoAsync(model.InvoiceNo, cancellationToken);

        var invoice = new InvoiceRecord
        {
            Id = Guid.NewGuid(),
            InvoiceNo = invoiceNo,
            BranchId = model.BranchId,
            InvoiceDate = model.InvoiceDate,
            ConsignmentId = model.ConsignmentId,
            TaxableAmount = model.TaxableAmount,
            GstAmount = model.GstAmount,
            TotalAmount = model.TotalAmount,
            ReceivedAmount = 0,
            DueDate = model.DueDate,
            Status = "Posted",
            CreatedAt = DateTime.UtcNow
        };

        _db.Invoices.Add(invoice);

        foreach (var challanId in challanIds)
        {
            _db.InvoiceChallans.Add(new InvoiceChallanRecord
            {
                InvoiceId = invoice.Id,
                ChallanId = challanId
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        var map = new Dictionary<Guid, List<Guid>> { [invoice.Id] = challanIds };
        return Map(invoice, map);
    }

    private async Task<string> ResolveInvoiceNoAsync(string? requestedNo, CancellationToken cancellationToken)
    {
        var invoiceNo = string.IsNullOrWhiteSpace(requestedNo) ? _numberingService.NextInvoiceNo() : requestedNo.Trim();
        var exists = await _db.Invoices.AnyAsync(x => x.InvoiceNo.ToLower() == invoiceNo.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Invoice number already exists.");
        return invoiceNo;
    }

    private static InvoiceViewModel Map(InvoiceRecord invoice, Dictionary<Guid, List<Guid>> challanIds)
    {
        challanIds.TryGetValue(invoice.Id, out var ids);
        ids ??= new List<Guid>();

        return new InvoiceViewModel
        {
            Id = invoice.Id,
            InvoiceNo = invoice.InvoiceNo,
            BranchId = invoice.BranchId,
            InvoiceDate = invoice.InvoiceDate,
            ConsignmentId = invoice.ConsignmentId,
            ChallanIds = ids,
            TaxableAmount = invoice.TaxableAmount,
            GstAmount = invoice.GstAmount,
            TotalAmount = invoice.TotalAmount,
            ReceivedAmount = invoice.ReceivedAmount,
            DueDate = invoice.DueDate,
            Status = invoice.Status
        };
    }
}
