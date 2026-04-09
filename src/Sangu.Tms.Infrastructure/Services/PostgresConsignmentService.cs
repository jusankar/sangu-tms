using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresConsignmentService : IConsignmentService
{
    private readonly SanguTmsDbContext _db;
    private readonly INumberingService _numberingService;

    public PostgresConsignmentService(SanguTmsDbContext db, INumberingService numberingService)
    {
        _db = db;
        _numberingService = numberingService;
    }

    public async Task<IReadOnlyCollection<ConsignmentViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _db.Consignments
            .AsNoTracking()
            .OrderByDescending(x => x.BookingDate)
            .ToListAsync(cancellationToken);

        return rows.Select(Map).ToList();
    }

    public async Task<ConsignmentViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Consignments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return row is null ? null : Map(row);
    }

    public async Task<ConsignmentViewModel> CreateAsync(ConsignmentUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);

        var consignmentNo = string.IsNullOrWhiteSpace(model.ConsignmentNo)
            ? _numberingService.NextConsignmentNo()
            : model.ConsignmentNo.Trim();

        var exists = await _db.Consignments
            .AnyAsync(x => x.ConsignmentNo.ToLower() == consignmentNo.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Consignment number already exists.");

        var entity = new ConsignmentRecord
        {
            Id = Guid.NewGuid(),
            ConsignmentNo = consignmentNo,
            BranchId = model.BranchId,
            BookingDate = model.BookingDate,
            CustomerId = model.CustomerId,
            FromLocationId = model.FromLocationId,
            ToLocationId = model.ToLocationId,
            ConsignorName = model.ConsignorName?.Trim(),
            ConsignorAddress = model.ConsignorAddress?.Trim(),
            ConsigneeName = model.ConsigneeName?.Trim(),
            ConsigneeAddress = model.ConsigneeAddress?.Trim(),
            ConsignorGstNo = model.ConsignorGstNo?.Trim(),
            ConsigneeGstNo = model.ConsigneeGstNo?.Trim(),
            DeliveryOfficeAddress = model.DeliveryOfficeAddress?.Trim(),
            GstPayableBy = model.GstPayableBy?.Trim(),
            VehicleNo = model.VehicleNo?.Trim(),
            PrivateMarkNo = model.PrivateMarkNo?.Trim(),
            Packages = model.Packages,
            GoodsDescription = model.GoodsDescription?.Trim(),
            ActualWeight = model.ActualWeight,
            ChargedWeight = model.ChargedWeight,
            RatePerQuintal = model.RatePerQuintal,
            BasicFreight = model.BasicFreight,
            StCharge = model.StCharge,
            GstAmount = model.GstAmount,
            HamaliCharge = model.HamaliCharge,
            DoorDeliveryCharge = model.DoorDeliveryCharge,
            AdvancePaid = model.AdvancePaid,
            CollectionCharge = model.CollectionCharge,
            PaymentBasis = model.PaymentBasis?.Trim(),
            PaymentAt = model.PaymentAt?.Trim(),
            InvoiceNo = model.InvoiceNo?.Trim(),
            InvoiceDate = model.InvoiceDate,
            FreightAmount = model.FreightAmount,
            Status = "Draft",
            Remarks = model.Remarks?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Consignments.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return Map(entity);
    }

    public async Task<ConsignmentViewModel?> UpdateAsync(Guid id, ConsignmentUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);

        var row = await _db.Consignments.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (row is null) return null;

        if (!string.IsNullOrWhiteSpace(model.ConsignmentNo))
        {
            var no = model.ConsignmentNo.Trim();
            var exists = await _db.Consignments
                .AnyAsync(x => x.Id != id && x.ConsignmentNo.ToLower() == no.ToLower(), cancellationToken);
            if (exists) throw new ArgumentException("Consignment number already exists.");
            row.ConsignmentNo = no;
        }

        row.BranchId = model.BranchId;
        row.BookingDate = model.BookingDate;
        row.CustomerId = model.CustomerId;
        row.FromLocationId = model.FromLocationId;
        row.ToLocationId = model.ToLocationId;
        row.ConsignorName = model.ConsignorName?.Trim();
        row.ConsignorAddress = model.ConsignorAddress?.Trim();
        row.ConsigneeName = model.ConsigneeName?.Trim();
        row.ConsigneeAddress = model.ConsigneeAddress?.Trim();
        row.ConsignorGstNo = model.ConsignorGstNo?.Trim();
        row.ConsigneeGstNo = model.ConsigneeGstNo?.Trim();
        row.DeliveryOfficeAddress = model.DeliveryOfficeAddress?.Trim();
        row.GstPayableBy = model.GstPayableBy?.Trim();
        row.VehicleNo = model.VehicleNo?.Trim();
        row.PrivateMarkNo = model.PrivateMarkNo?.Trim();
        row.Packages = model.Packages;
        row.GoodsDescription = model.GoodsDescription?.Trim();
        row.ActualWeight = model.ActualWeight;
        row.ChargedWeight = model.ChargedWeight;
        row.RatePerQuintal = model.RatePerQuintal;
        row.BasicFreight = model.BasicFreight;
        row.StCharge = model.StCharge;
        row.GstAmount = model.GstAmount;
        row.HamaliCharge = model.HamaliCharge;
        row.DoorDeliveryCharge = model.DoorDeliveryCharge;
        row.AdvancePaid = model.AdvancePaid;
        row.CollectionCharge = model.CollectionCharge;
        row.PaymentBasis = model.PaymentBasis?.Trim();
        row.PaymentAt = model.PaymentAt?.Trim();
        row.InvoiceNo = model.InvoiceNo?.Trim();
        row.InvoiceDate = model.InvoiceDate;
        row.FreightAmount = model.FreightAmount;
        row.Remarks = model.Remarks?.Trim();
        row.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Map(row);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Consignments.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (row is null) return false;

        _db.Consignments.Remove(row);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ConsignmentViewModel Map(ConsignmentRecord row)
    {
        return new ConsignmentViewModel
        {
            Id = row.Id,
            ConsignmentNo = row.ConsignmentNo,
            BranchId = row.BranchId,
            BookingDate = row.BookingDate,
            CustomerId = row.CustomerId,
            FromLocationId = row.FromLocationId,
            ToLocationId = row.ToLocationId,
            ConsignorName = row.ConsignorName,
            ConsignorAddress = row.ConsignorAddress,
            ConsigneeName = row.ConsigneeName,
            ConsigneeAddress = row.ConsigneeAddress,
            ConsignorGstNo = row.ConsignorGstNo,
            ConsigneeGstNo = row.ConsigneeGstNo,
            DeliveryOfficeAddress = row.DeliveryOfficeAddress,
            GstPayableBy = row.GstPayableBy,
            VehicleNo = row.VehicleNo,
            PrivateMarkNo = row.PrivateMarkNo,
            Packages = row.Packages,
            GoodsDescription = row.GoodsDescription,
            ActualWeight = row.ActualWeight,
            ChargedWeight = row.ChargedWeight,
            RatePerQuintal = row.RatePerQuintal,
            BasicFreight = row.BasicFreight,
            StCharge = row.StCharge,
            GstAmount = row.GstAmount,
            HamaliCharge = row.HamaliCharge,
            DoorDeliveryCharge = row.DoorDeliveryCharge,
            AdvancePaid = row.AdvancePaid,
            CollectionCharge = row.CollectionCharge,
            PaymentBasis = row.PaymentBasis,
            PaymentAt = row.PaymentAt,
            InvoiceNo = row.InvoiceNo,
            InvoiceDate = row.InvoiceDate,
            FreightAmount = row.FreightAmount,
            Status = row.Status,
            Remarks = row.Remarks
        };
    }

    private static void Validate(ConsignmentUpsertModel model)
    {
        if (model.BranchId == Guid.Empty) throw new ArgumentException("Branch is required.");
        if (model.CustomerId == Guid.Empty) throw new ArgumentException("Customer is required.");
        if (model.FromLocationId == Guid.Empty) throw new ArgumentException("From location is required.");
        if (model.ToLocationId == Guid.Empty) throw new ArgumentException("To location is required.");
        if (model.FromLocationId == model.ToLocationId) throw new ArgumentException("From and To location cannot be the same.");
        if (model.Packages < 0) throw new ArgumentException("Packages cannot be negative.");
        if (model.ActualWeight < 0 || model.ChargedWeight < 0) throw new ArgumentException("Weight cannot be negative.");
        if (model.RatePerQuintal < 0) throw new ArgumentException("Rate per quintal cannot be negative.");
        if (model.BasicFreight < 0 || model.StCharge < 0 || model.GstAmount < 0) throw new ArgumentException("Charges cannot be negative.");
        if (model.HamaliCharge < 0 || model.DoorDeliveryCharge < 0 || model.AdvancePaid < 0 || model.CollectionCharge < 0)
            throw new ArgumentException("Charges cannot be negative.");
        if (model.FreightAmount < 0) throw new ArgumentException("Freight amount cannot be negative.");
        if (model.BookingDate > DateOnly.FromDateTime(DateTime.Today)) throw new ArgumentException("Booking date cannot be in the future.");
    }
}
