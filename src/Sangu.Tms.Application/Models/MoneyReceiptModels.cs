namespace Sangu.Tms.Application.Models;

public sealed class MoneyReceiptCreateModel
{
    public Guid BranchId { get; set; }
    public DateOnly ReceiptDate { get; set; }
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "cash";
    public string? ReferenceNo { get; set; }
}

public sealed class MoneyReceiptViewModel
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public string ReceiptNo { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public DateOnly ReceiptDate { get; set; }
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "cash";
    public string? ReferenceNo { get; set; }
    public string Status { get; set; } = "Posted";
}

