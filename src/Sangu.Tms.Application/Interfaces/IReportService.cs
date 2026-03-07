using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IReportService
{
    Task<IReadOnlyCollection<BookingReportRow>> GetBookingReportAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<LorryPaymentReportRow>> GetLorryPaymentReportAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<OutstandingReportRow>> GetOutstandingReportAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default);
}

