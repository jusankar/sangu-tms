namespace Sangu.Tms.Application.Interfaces;

public interface INumberingService
{
    string NextConsignmentNo();
    string NextChallanNo();
    string NextInvoiceNo();
    string NextReceiptNo();
}

