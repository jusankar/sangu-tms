using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryChallanService : IChallanService
{
    private readonly InMemoryDataStore _store;
    private readonly INumberingService _numberingService;

    public InMemoryChallanService(InMemoryDataStore store, INumberingService numberingService)
    {
        _store = store;
        _numberingService = numberingService;
    }

    public Task<IReadOnlyCollection<ChallanViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<ChallanViewModel> rows = _store.Challans
            .OrderByDescending(x => x.ChallanDate)
            .ToList();
        return Task.FromResult(rows);
    }

    public Task<ChallanViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_store.Challans.FirstOrDefault(x => x.Id == id));
    }

    public Task<ChallanViewModel> CreateAsync(ChallanCreateModel model, CancellationToken cancellationToken = default)
    {
        if (model.BranchId == Guid.Empty) throw new ArgumentException("Branch is required.");
        if (model.Consignments is null || model.Consignments.Count == 0) throw new ArgumentException("At least one consignment row is required.");
        if (model.FreightAmount < 0) throw new ArgumentException("Freight amount cannot be negative.");
        if (model.TotalHire < 0) throw new ArgumentException("Total hire cannot be negative.");
        if (model.RefBalance < 0) throw new ArgumentException("Ref balance cannot be negative.");
        if (model.AdvanceAmount < 0) throw new ArgumentException("Advance amount cannot be negative.");

        lock (_store.SyncRoot)
        {
            foreach (var item in model.Consignments.Where(x => x.ConsignmentId.HasValue))
            {
                var consignmentExists = _store.Consignments.Any(x => x.Id == item.ConsignmentId!.Value);
                if (!consignmentExists) throw new ArgumentException("One or more selected consignments were not found.");
            }

            var challan = new ChallanViewModel
            {
                Id = Guid.NewGuid(),
                ChallanNo = _numberingService.NextChallanNo(),
                BranchId = model.BranchId,
                ChallanDate = model.ChallanDate,
                FromLocationId = model.FromLocationId,
                ToLocationId = model.ToLocationId,
                DriverId = model.DriverId,
                VehicleId = model.VehicleId,
                OwnerName = model.OwnerName,
                VehicleNo = model.VehicleNo,
                DriverName = model.DriverName,
                DriverLicenseNo = model.DriverLicenseNo,
                DriverMobile = model.DriverMobile,
                BalanceAt = model.BalanceAt,
                FreightAmount = model.FreightAmount,
                TotalHire = model.TotalHire,
                RefBalance = model.RefBalance,
                AdvanceAmount = model.AdvanceAmount,
                Consignments = model.Consignments.Select(x => new ChallanConsignmentItemViewModel
                {
                    ConsignmentId = x.ConsignmentId,
                    ConsignorName = x.ConsignorName?.Trim(),
                    StationName = x.StationName?.Trim(),
                    Packages = Math.Max(0, x.Packages),
                    LrNo = x.LrNo?.Trim(),
                    WeightKg = Math.Max(0, x.WeightKg),
                    Description = x.Description?.Trim(),
                    FreightAmount = Math.Max(0, x.FreightAmount)
                }).ToList(),
                PaidAmount = 0,
                Status = "Open"
            };

            _store.Challans.Add(challan);
            return Task.FromResult(challan);
        }
    }

    public Task<LorryPaymentViewModel?> AddPaymentAsync(Guid challanId, LorryPaymentCreateModel model, CancellationToken cancellationToken = default)
    {
        if (model.Amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (!new[] { "part", "balance" }.Contains(model.PaymentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Payment type must be part or balance.");
        }

        lock (_store.SyncRoot)
        {
            var challan = _store.Challans.FirstOrDefault(x => x.Id == challanId);
            if (challan is null) return Task.FromResult<LorryPaymentViewModel?>(null);

            var nextPaid = challan.PaidAmount + model.Amount;
            if (nextPaid > challan.TotalHire) throw new ArgumentException("Payment exceeds total hire.");

            var payment = new LorryPaymentViewModel
            {
                Id = Guid.NewGuid(),
                ChallanId = challanId,
                PaymentDate = model.PaymentDate,
                PaymentType = model.PaymentType.ToLowerInvariant(),
                Amount = model.Amount,
                Mode = model.Mode.ToLowerInvariant(),
                ReferenceNo = model.ReferenceNo,
                Notes = model.Notes
            };

            challan.PaidAmount = nextPaid;
            challan.Status = nextPaid == challan.TotalHire ? "Closed" : "Open";

            _store.LorryPayments.Add(payment);
            return Task.FromResult<LorryPaymentViewModel?>(payment);
        }
    }
}
