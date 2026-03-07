namespace Sangu.Tms.Application.Models;

public sealed class ChallanCreateModel
{
    public Guid BranchId { get; set; }
    public DateOnly ChallanDate { get; set; }
    public Guid? FromLocationId { get; set; }
    public Guid? ToLocationId { get; set; }
    public Guid? DriverId { get; set; }
    public Guid? VehicleId { get; set; }
    public string? OwnerName { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public string? DriverLicenseNo { get; set; }
    public string? DriverMobile { get; set; }
    public string? BalanceAt { get; set; }
    public decimal FreightAmount { get; set; }
    public decimal TotalHire { get; set; }
    public decimal RefBalance { get; set; }
    public decimal AdvanceAmount { get; set; }
    public List<ChallanConsignmentItemCreateModel> Consignments { get; set; } = new();
}

public sealed class ChallanViewModel
{
    public Guid Id { get; set; }
    public string ChallanNo { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public DateOnly ChallanDate { get; set; }
    public Guid? FromLocationId { get; set; }
    public Guid? ToLocationId { get; set; }
    public Guid? DriverId { get; set; }
    public Guid? VehicleId { get; set; }
    public string? OwnerName { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public string? DriverLicenseNo { get; set; }
    public string? DriverMobile { get; set; }
    public string? BalanceAt { get; set; }
    public decimal FreightAmount { get; set; }
    public decimal TotalHire { get; set; }
    public decimal RefBalance { get; set; }
    public decimal AdvanceAmount { get; set; }
    public List<ChallanConsignmentItemViewModel> Consignments { get; set; } = new();
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = "Open";
}

public sealed class ChallanConsignmentItemCreateModel
{
    public Guid? ConsignmentId { get; set; }
    public string? ConsignorName { get; set; }
    public string? StationName { get; set; }
    public int Packages { get; set; }
    public string? LrNo { get; set; }
    public decimal WeightKg { get; set; }
    public string? Description { get; set; }
    public decimal FreightAmount { get; set; }
}

public sealed class ChallanConsignmentItemViewModel
{
    public Guid? ConsignmentId { get; set; }
    public string? ConsignorName { get; set; }
    public string? StationName { get; set; }
    public int Packages { get; set; }
    public string? LrNo { get; set; }
    public decimal WeightKg { get; set; }
    public string? Description { get; set; }
    public decimal FreightAmount { get; set; }
}

public sealed class LorryPaymentCreateModel
{
    public DateOnly PaymentDate { get; set; }
    public string PaymentType { get; set; } = "part";
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "cash";
    public string? ReferenceNo { get; set; }
    public string? Notes { get; set; }
}

public sealed class LorryPaymentViewModel
{
    public Guid Id { get; set; }
    public Guid ChallanId { get; set; }
    public DateOnly PaymentDate { get; set; }
    public string PaymentType { get; set; } = "part";
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "cash";
    public string? ReferenceNo { get; set; }
    public string? Notes { get; set; }
}
