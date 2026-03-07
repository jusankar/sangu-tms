using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Api.Controllers;

[ApiController]
[Route("api/receipts")]
[Authorize]
public sealed class MoneyReceiptsController : ControllerBase
{
    private readonly IMoneyReceiptService _service;

    public MoneyReceiptsController(IMoneyReceiptService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Policy = "perm:receipt.view")]
    public async Task<ActionResult<IReadOnlyCollection<MoneyReceiptViewModel>>> GetAll(CancellationToken cancellationToken)
    {
        var rows = await _service.GetAllAsync(cancellationToken);
        return Ok(rows);
    }
}
