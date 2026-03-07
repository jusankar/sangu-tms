namespace Sangu.Tms.Application.Models;

public sealed class BookingReportRow
{
    public Guid ConsignmentId { get; set; }
    public string ConsignmentNo { get; set; } = string.Empty;
    public DateOnly BookingDate { get; set; }
    public decimal FreightAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public sealed class LorryPaymentReportRow
{
    public Guid ChallanId { get; set; }
    public string ChallanNo { get; set; } = string.Empty;
    public DateOnly ChallanDate { get; set; }
    public decimal TotalHire { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public sealed class OutstandingReportRow
{
    public Guid InvoiceId { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public DateOnly InvoiceDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal ReceivedAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

