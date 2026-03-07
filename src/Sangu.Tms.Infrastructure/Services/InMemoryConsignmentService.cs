using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryConsignmentService : IConsignmentService
{
    private readonly InMemoryDataStore _store;
    private readonly INumberingService _numberingService;

    public InMemoryConsignmentService(InMemoryDataStore store, INumberingService numberingService)
    {
        _store = store;
        _numberingService = numberingService;
    }

    public Task<IReadOnlyCollection<ConsignmentViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<ConsignmentViewModel> rows = _store.Consignments
            .OrderByDescending(x => x.BookingDate)
            .ToList();
        return Task.FromResult(rows);
    }

    public Task<ConsignmentViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_store.Consignments.FirstOrDefault(x => x.Id == id));
    }

    public Task<ConsignmentViewModel> CreateAsync(ConsignmentUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);

        ConsignmentViewModel created;
        lock (_store.SyncRoot)
        {
            var consignmentNo = string.IsNullOrWhiteSpace(model.ConsignmentNo)
                ? _numberingService.NextConsignmentNo()
                : model.ConsignmentNo.Trim();
            if (_store.Consignments.Any(x => x.ConsignmentNo.Equals(consignmentNo, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Consignment number already exists.");

            created = new ConsignmentViewModel
            {
                Id = Guid.NewGuid(),
                ConsignmentNo = consignmentNo,
                BranchId = model.BranchId,
                BookingDate = model.BookingDate,
                CustomerId = model.CustomerId,
                FromLocationId = model.FromLocationId,
                ToLocationId = model.ToLocationId,
                ConsignorName = model.ConsignorName,
                ConsignorAddress = model.ConsignorAddress,
                ConsigneeName = model.ConsigneeName,
                ConsigneeAddress = model.ConsigneeAddress,
                ConsignorGstNo = model.ConsignorGstNo,
                ConsigneeGstNo = model.ConsigneeGstNo,
                DeliveryOfficeAddress = model.DeliveryOfficeAddress,
                GstPayableBy = model.GstPayableBy,
                VehicleNo = model.VehicleNo,
                PrivateMarkNo = model.PrivateMarkNo,
                Packages = model.Packages,
                GoodsDescription = model.GoodsDescription,
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
                PaymentBasis = model.PaymentBasis,
                InvoiceNo = model.InvoiceNo,
                InvoiceDate = model.InvoiceDate,
                FreightAmount = model.FreightAmount,
                Status = "Draft",
                Remarks = model.Remarks
            };
            _store.Consignments.Add(created);
        }

        return Task.FromResult(created);
    }

    public Task<ConsignmentViewModel?> UpdateAsync(Guid id, ConsignmentUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);

        lock (_store.SyncRoot)
        {
            var row = _store.Consignments.FirstOrDefault(x => x.Id == id);
            if (row is null)
            {
                return Task.FromResult<ConsignmentViewModel?>(null);
            }
            if (!string.IsNullOrWhiteSpace(model.ConsignmentNo))
            {
                var no = model.ConsignmentNo.Trim();
                if (_store.Consignments.Any(x => x.Id != id && x.ConsignmentNo.Equals(no, StringComparison.OrdinalIgnoreCase)))
                    throw new ArgumentException("Consignment number already exists.");
                row.ConsignmentNo = no;
            }

            row.BranchId = model.BranchId;
            row.BookingDate = model.BookingDate;
            row.CustomerId = model.CustomerId;
            row.FromLocationId = model.FromLocationId;
            row.ToLocationId = model.ToLocationId;
            row.ConsignorName = model.ConsignorName;
            row.ConsignorAddress = model.ConsignorAddress;
            row.ConsigneeName = model.ConsigneeName;
            row.ConsigneeAddress = model.ConsigneeAddress;
            row.ConsignorGstNo = model.ConsignorGstNo;
            row.ConsigneeGstNo = model.ConsigneeGstNo;
            row.DeliveryOfficeAddress = model.DeliveryOfficeAddress;
            row.GstPayableBy = model.GstPayableBy;
            row.VehicleNo = model.VehicleNo;
            row.PrivateMarkNo = model.PrivateMarkNo;
            row.Packages = model.Packages;
            row.GoodsDescription = model.GoodsDescription;
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
            row.PaymentBasis = model.PaymentBasis;
            row.InvoiceNo = model.InvoiceNo;
            row.InvoiceDate = model.InvoiceDate;
            row.FreightAmount = model.FreightAmount;
            row.Remarks = model.Remarks;
            return Task.FromResult<ConsignmentViewModel?>(row);
        }
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_store.SyncRoot)
        {
            var row = _store.Consignments.FirstOrDefault(x => x.Id == id);
            if (row is null)
            {
                return Task.FromResult(false);
            }

            _store.Consignments.Remove(row);
            return Task.FromResult(true);
        }
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
