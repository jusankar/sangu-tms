using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryReportService : IReportService
{
    private readonly InMemoryDataStore _store;

    public InMemoryReportService(InMemoryDataStore store)
    {
        _store = store;
    }

    public Task<IReadOnlyCollection<BookingReportRow>> GetBookingReportAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default)
    {
        var query = _store.Consignments.AsEnumerable();
        if (fromDate.HasValue) query = query.Where(x => x.BookingDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(x => x.BookingDate <= toDate.Value);

        IReadOnlyCollection<BookingReportRow> rows = query
            .OrderByDescending(x => x.BookingDate)
            .Select(x => new BookingReportRow
            {
                ConsignmentId = x.Id,
                ConsignmentNo = x.ConsignmentNo,
                BookingDate = x.BookingDate,
                FreightAmount = x.FreightAmount,
                Status = x.Status
            })
            .ToList();

        return Task.FromResult(rows);
    }

    public Task<IReadOnlyCollection<LorryPaymentReportRow>> GetLorryPaymentReportAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default)
    {
        var query = _store.Challans.AsEnumerable();
        if (fromDate.HasValue) query = query.Where(x => x.ChallanDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(x => x.ChallanDate <= toDate.Value);

        IReadOnlyCollection<LorryPaymentReportRow> rows = query
            .OrderByDescending(x => x.ChallanDate)
            .Select(x => new LorryPaymentReportRow
            {
                ChallanId = x.Id,
                ChallanNo = x.ChallanNo,
                ChallanDate = x.ChallanDate,
                TotalHire = x.TotalHire,
                PaidAmount = x.PaidAmount,
                OutstandingAmount = x.TotalHire - x.PaidAmount,
                Status = x.Status
            })
            .ToList();

        return Task.FromResult(rows);
    }

    public Task<IReadOnlyCollection<OutstandingReportRow>> GetOutstandingReportAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default)
    {
        var query = _store.Invoices.AsEnumerable();
        if (fromDate.HasValue) query = query.Where(x => x.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(x => x.InvoiceDate <= toDate.Value);

        IReadOnlyCollection<OutstandingReportRow> rows = query
            .OrderByDescending(x => x.InvoiceDate)
            .Select(x => new OutstandingReportRow
            {
                InvoiceId = x.Id,
                InvoiceNo = x.InvoiceNo,
                InvoiceDate = x.InvoiceDate,
                TotalAmount = x.TotalAmount,
                ReceivedAmount = x.ReceivedAmount,
                OutstandingAmount = x.TotalAmount - x.ReceivedAmount,
                Status = x.Status
            })
            .ToList();

        return Task.FromResult(rows);
    }
}

