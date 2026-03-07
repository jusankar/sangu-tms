namespace Sangu.Tms.Application.Models;

public sealed class InvoiceCreateModel
{
    public string? InvoiceNo { get; set; }
    public Guid BranchId { get; set; }
    public DateOnly InvoiceDate { get; set; }
    public Guid ConsignmentId { get; set; }
    public List<Guid> ChallanIds { get; set; } = new();
    public decimal TaxableAmount { get; set; }
    public decimal GstAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateOnly? DueDate { get; set; }
}

public sealed class InvoiceViewModel
{
    public Guid Id { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public DateOnly InvoiceDate { get; set; }
    public Guid ConsignmentId { get; set; }
    public List<Guid> ChallanIds { get; set; } = new();
    public decimal TaxableAmount { get; set; }
    public decimal GstAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal ReceivedAmount { get; set; }
    public DateOnly? DueDate { get; set; }
    public string Status { get; set; } = "Draft";
}
