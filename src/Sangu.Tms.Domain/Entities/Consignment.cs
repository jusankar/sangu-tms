namespace Sangu.Tms.Domain.Entities;

public sealed class Consignment
{
    public Guid Id { get; set; }
    public string ConsignmentNo { get; set; } = string.Empty;
    public DateOnly BookingDate { get; set; }
    public Guid CustomerId { get; set; }
    public decimal FreightAmount { get; set; }
    public string Status { get; set; } = "Draft";
}

