using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresChallanService : IChallanService
{
    private readonly SanguTmsDbContext _db;
    private readonly INumberingService _numberingService;

    public PostgresChallanService(SanguTmsDbContext db, INumberingService numberingService)
    {
        _db = db;
        _numberingService = numberingService;
    }

    public async Task<IReadOnlyCollection<ChallanViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var challans = await _db.Challans
            .AsNoTracking()
            .OrderByDescending(x => x.ChallanDate)
            .ToListAsync(cancellationToken);

        var challanIds = challans.Select(x => x.Id).ToList();
        var consignments = challanIds.Count == 0
            ? new List<ChallanConsignmentRecord>()
            : await _db.ChallanConsignments
                .AsNoTracking()
                .Where(x => challanIds.Contains(x.ChallanId))
                .ToListAsync(cancellationToken);

        var groups = consignments
            .GroupBy(x => x.ChallanId)
            .ToDictionary(x => x.Key, x => x.ToList());

        return challans.Select(x => Map(x, groups)).ToList();
    }

    public async Task<ChallanViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var challan = await _db.Challans.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (challan is null) return null;

        var consignments = await _db.ChallanConsignments
            .AsNoTracking()
            .Where(x => x.ChallanId == id)
            .ToListAsync(cancellationToken);

        var groups = new Dictionary<Guid, List<ChallanConsignmentRecord>> { [id] = consignments };
        return Map(challan, groups);
    }

    public async Task<ChallanViewModel> CreateAsync(ChallanCreateModel model, CancellationToken cancellationToken = default)
    {
        if (model.BranchId == Guid.Empty) throw new ArgumentException("Branch is required.");
        if (model.Consignments is null || model.Consignments.Count == 0) throw new ArgumentException("At least one consignment row is required.");
        if (model.FreightAmount < 0) throw new ArgumentException("Freight amount cannot be negative.");
        if (model.TotalHire < 0) throw new ArgumentException("Total hire cannot be negative.");
        if (model.RefBalance < 0) throw new ArgumentException("Ref balance cannot be negative.");
        if (model.AdvanceAmount < 0) throw new ArgumentException("Advance amount cannot be negative.");

        var consignmentIds = model.Consignments
            .Where(x => x.ConsignmentId.HasValue)
            .Select(x => x.ConsignmentId!.Value)
            .Distinct()
            .ToList();

        if (consignmentIds.Count > 0)
        {
            var existingIds = await _db.Consignments
                .AsNoTracking()
                .Where(x => consignmentIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);

            if (existingIds.Count != consignmentIds.Count)
                throw new ArgumentException("One or more selected consignments were not found.");
        }

        var challanNo = await ResolveChallanNoAsync(model.ChallanNo, cancellationToken);

        var challan = new ChallanRecord
        {
            Id = Guid.NewGuid(),
            ChallanNo = challanNo,
            BranchId = model.BranchId,
            ChallanDate = model.ChallanDate,
            FromLocationId = model.FromLocationId,
            ToLocationId = model.ToLocationId,
            DriverId = model.DriverId,
            VehicleId = model.VehicleId,
            OwnerName = model.OwnerName?.Trim(),
            VehicleNo = model.VehicleNo?.Trim(),
            DriverName = model.DriverName?.Trim(),
            DriverLicenseNo = model.DriverLicenseNo?.Trim(),
            DriverMobile = model.DriverMobile?.Trim(),
            BalanceAt = model.BalanceAt?.Trim(),
            FreightAmount = model.FreightAmount,
            TotalHire = model.TotalHire,
            RefBalance = model.RefBalance,
            AdvanceAmount = model.AdvanceAmount,
            PaidAmount = 0,
            Status = "Open",
            CreatedAt = DateTime.UtcNow
        };

        var lineItems = model.Consignments.Select(x => new ChallanConsignmentRecord
        {
            Id = Guid.NewGuid(),
            ChallanId = challan.Id,
            ConsignmentId = x.ConsignmentId,
            ConsignorName = x.ConsignorName?.Trim(),
            StationName = x.StationName?.Trim(),
            Packages = Math.Max(0, x.Packages),
            LrNo = x.LrNo?.Trim(),
            WeightKg = Math.Max(0, x.WeightKg),
            Description = x.Description?.Trim(),
            FreightAmount = Math.Max(0, x.FreightAmount)
        }).ToList();

        _db.Challans.Add(challan);
        _db.ChallanConsignments.AddRange(lineItems);
        await _db.SaveChangesAsync(cancellationToken);

        var groups = new Dictionary<Guid, List<ChallanConsignmentRecord>> { [challan.Id] = lineItems };
        return Map(challan, groups);
    }

    public async Task<LorryPaymentViewModel?> AddPaymentAsync(Guid challanId, LorryPaymentCreateModel model, CancellationToken cancellationToken = default)
    {
        if (model.Amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (!new[] { "part", "balance" }.Contains(model.PaymentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Payment type must be part or balance.");
        }

        var challan = await _db.Challans.FirstOrDefaultAsync(x => x.Id == challanId, cancellationToken);
        if (challan is null) return null;

        var nextPaid = challan.PaidAmount + model.Amount;
        if (nextPaid > challan.TotalHire) throw new ArgumentException("Payment exceeds total hire.");

        var payment = new LorryPaymentRecord
        {
            Id = Guid.NewGuid(),
            ChallanId = challanId,
            PaymentDate = model.PaymentDate,
            PaymentType = model.PaymentType.ToLowerInvariant(),
            Amount = model.Amount,
            Mode = model.Mode.ToLowerInvariant(),
            ReferenceNo = model.ReferenceNo?.Trim(),
            Notes = model.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        challan.PaidAmount = nextPaid;
        challan.Status = nextPaid == challan.TotalHire ? "Closed" : "Open";
        challan.UpdatedAt = DateTime.UtcNow;

        _db.LorryPayments.Add(payment);
        await _db.SaveChangesAsync(cancellationToken);

        return new LorryPaymentViewModel
        {
            Id = payment.Id,
            ChallanId = payment.ChallanId,
            PaymentDate = payment.PaymentDate,
            PaymentType = payment.PaymentType,
            Amount = payment.Amount,
            Mode = payment.Mode,
            ReferenceNo = payment.ReferenceNo,
            Notes = payment.Notes
        };
    }

    private async Task<string> ResolveChallanNoAsync(string? requestedNo, CancellationToken cancellationToken)
    {
        var challanNo = string.IsNullOrWhiteSpace(requestedNo) ? _numberingService.NextChallanNo() : requestedNo.Trim();
        var exists = await _db.Challans.AnyAsync(x => x.ChallanNo.ToLower() == challanNo.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Lorry receipt number already exists.");
        return challanNo;
    }

    private static ChallanViewModel Map(ChallanRecord challan, Dictionary<Guid, List<ChallanConsignmentRecord>> consignments)
    {
        consignments.TryGetValue(challan.Id, out var lines);
        lines ??= new List<ChallanConsignmentRecord>();

        return new ChallanViewModel
        {
            Id = challan.Id,
            ChallanNo = challan.ChallanNo,
            BranchId = challan.BranchId,
            ChallanDate = challan.ChallanDate,
            FromLocationId = challan.FromLocationId,
            ToLocationId = challan.ToLocationId,
            DriverId = challan.DriverId,
            VehicleId = challan.VehicleId,
            OwnerName = challan.OwnerName,
            VehicleNo = challan.VehicleNo,
            DriverName = challan.DriverName,
            DriverLicenseNo = challan.DriverLicenseNo,
            DriverMobile = challan.DriverMobile,
            BalanceAt = challan.BalanceAt,
            FreightAmount = challan.FreightAmount,
            TotalHire = challan.TotalHire,
            RefBalance = challan.RefBalance,
            AdvanceAmount = challan.AdvanceAmount,
            PaidAmount = challan.PaidAmount,
            Status = challan.Status,
            Consignments = lines.Select(x => new ChallanConsignmentItemViewModel
            {
                ConsignmentId = x.ConsignmentId,
                ConsignorName = x.ConsignorName,
                StationName = x.StationName,
                Packages = x.Packages,
                LrNo = x.LrNo,
                WeightKg = x.WeightKg,
                Description = x.Description,
                FreightAmount = x.FreightAmount
            }).ToList()
        };
    }
}
