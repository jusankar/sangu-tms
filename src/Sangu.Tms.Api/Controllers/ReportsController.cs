using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public sealed class ReportsController : ControllerBase
{
    private readonly IReportService _service;

    public ReportsController(IReportService service)
    {
        _service = service;
    }

    [HttpGet("booking")]
    [Authorize(Policy = "perm:report.booking")]
    public async Task<ActionResult<IReadOnlyCollection<BookingReportRow>>> Booking(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken)
    {
        var rows = await _service.GetBookingReportAsync(fromDate, toDate, cancellationToken);
        return Ok(rows);
    }

    [HttpGet("lorry-payments")]
    [Authorize(Policy = "perm:report.lorry_payment")]
    public async Task<ActionResult<IReadOnlyCollection<LorryPaymentReportRow>>> LorryPayments(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken)
    {
        var rows = await _service.GetLorryPaymentReportAsync(fromDate, toDate, cancellationToken);
        return Ok(rows);
    }

    [HttpGet("vehicle-payments")]
    [Authorize(Policy = "perm:report.vehicle_payment")]
    public async Task<ActionResult<IReadOnlyCollection<LorryPaymentReportRow>>> VehiclePayments(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken)
    {
        var rows = await _service.GetLorryPaymentReportAsync(fromDate, toDate, cancellationToken);
        return Ok(rows);
    }

    [HttpGet("outstanding")]
    [Authorize(Policy = "perm:report.outstanding")]
    public async Task<ActionResult<IReadOnlyCollection<OutstandingReportRow>>> Outstanding(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken)
    {
        var rows = await _service.GetOutstandingReportAsync(fromDate, toDate, cancellationToken);
        return Ok(rows);
    }
}
