using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresReportService : IReportService
{
    private readonly SanguTmsDbContext _db;

    public PostgresReportService(SanguTmsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<BookingReportRow>> GetBookingReportAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Consignments.AsNoTracking().AsQueryable();
        if (fromDate.HasValue) query = query.Where(x => x.BookingDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(x => x.BookingDate <= toDate.Value);

        return await query
            .OrderByDescending(x => x.BookingDate)
            .Select(x => new BookingReportRow
            {
                ConsignmentId = x.Id,
                ConsignmentNo = x.ConsignmentNo,
                BookingDate = x.BookingDate,
                FreightAmount = x.FreightAmount,
                Status = x.Status
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<LorryPaymentReportRow>> GetLorryPaymentReportAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Challans.AsNoTracking().AsQueryable();
        if (fromDate.HasValue) query = query.Where(x => x.ChallanDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(x => x.ChallanDate <= toDate.Value);

        return await query
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
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<OutstandingReportRow>> GetOutstandingReportAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Invoices.AsNoTracking().AsQueryable();
        if (fromDate.HasValue) query = query.Where(x => x.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(x => x.InvoiceDate <= toDate.Value);

        return await query
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
            .ToListAsync(cancellationToken);
    }
}
