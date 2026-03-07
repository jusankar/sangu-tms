namespace Sangu.Tms.Application.Models;

public sealed class ConsignmentUpsertModel
{
    public Guid BranchId { get; set; }
    public DateOnly BookingDate { get; set; }
    public Guid CustomerId { get; set; }
    public Guid FromLocationId { get; set; }
    public Guid ToLocationId { get; set; }
    public string? ConsignorName { get; set; }
    public string? ConsignorAddress { get; set; }
    public string? ConsigneeName { get; set; }
    public string? ConsigneeAddress { get; set; }
    public string? ConsignorGstNo { get; set; }
    public string? ConsigneeGstNo { get; set; }
    public string? DeliveryOfficeAddress { get; set; }
    public string? GstPayableBy { get; set; }
    public string? VehicleNo { get; set; }
    public string? PrivateMarkNo { get; set; }
    public int Packages { get; set; }
    public string? GoodsDescription { get; set; }
    public decimal ActualWeight { get; set; }
    public decimal ChargedWeight { get; set; }
    public decimal RatePerQuintal { get; set; }
    public decimal BasicFreight { get; set; }
    public decimal StCharge { get; set; }
    public decimal GstAmount { get; set; }
    public decimal HamaliCharge { get; set; }
    public decimal DoorDeliveryCharge { get; set; }
    public decimal AdvancePaid { get; set; }
    public decimal CollectionCharge { get; set; }
    public string? PaymentBasis { get; set; }
    public string? InvoiceNo { get; set; }
    public DateOnly? InvoiceDate { get; set; }
    public decimal FreightAmount { get; set; }
    public string? Remarks { get; set; }
}

public sealed class ConsignmentViewModel
{
    public Guid Id { get; set; }
    public string ConsignmentNo { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public DateOnly BookingDate { get; set; }
    public Guid CustomerId { get; set; }
    public Guid FromLocationId { get; set; }
    public Guid ToLocationId { get; set; }
    public string? ConsignorName { get; set; }
    public string? ConsignorAddress { get; set; }
    public string? ConsigneeName { get; set; }
    public string? ConsigneeAddress { get; set; }
    public string? ConsignorGstNo { get; set; }
    public string? ConsigneeGstNo { get; set; }
    public string? DeliveryOfficeAddress { get; set; }
    public string? GstPayableBy { get; set; }
    public string? VehicleNo { get; set; }
    public string? PrivateMarkNo { get; set; }
    public int Packages { get; set; }
    public string? GoodsDescription { get; set; }
    public decimal ActualWeight { get; set; }
    public decimal ChargedWeight { get; set; }
    public decimal RatePerQuintal { get; set; }
    public decimal BasicFreight { get; set; }
    public decimal StCharge { get; set; }
    public decimal GstAmount { get; set; }
    public decimal HamaliCharge { get; set; }
    public decimal DoorDeliveryCharge { get; set; }
    public decimal AdvancePaid { get; set; }
    public decimal CollectionCharge { get; set; }
    public string? PaymentBasis { get; set; }
    public string? InvoiceNo { get; set; }
    public DateOnly? InvoiceDate { get; set; }
    public decimal FreightAmount { get; set; }
    public string Status { get; set; } = "Draft";
    public string? Remarks { get; set; }
}
