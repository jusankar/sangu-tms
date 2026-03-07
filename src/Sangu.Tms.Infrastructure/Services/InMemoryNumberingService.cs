using Sangu.Tms.Application.Interfaces;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryNumberingService : INumberingService
{
    private int _consignmentSeq = 1;
    private int _challanSeq = 1;
    private int _invoiceSeq = 1;
    private int _receiptSeq = 1;
    private readonly object _sync = new();

    public string NextConsignmentNo()
    {
        lock (_sync)
        {
            return $"CN/GEN/{DateTime.UtcNow:yyyy}/{_consignmentSeq++:D5}";
        }
    }

    public string NextChallanNo()
    {
        lock (_sync)
        {
            return $"CH/GEN/{DateTime.UtcNow:yyyy}/{_challanSeq++:D5}";
        }
    }

    public string NextInvoiceNo()
    {
        lock (_sync)
        {
            return $"IV/GEN/{DateTime.UtcNow:yyyy}/{_invoiceSeq++:D5}";
        }
    }

    public string NextReceiptNo()
    {
        lock (_sync)
        {
            return $"RC/GEN/{DateTime.UtcNow:yyyy}/{_receiptSeq++:D5}";
        }
    }
}

