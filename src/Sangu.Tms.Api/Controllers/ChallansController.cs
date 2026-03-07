using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Api.Controllers;

[ApiController]
[Route("api/challans")]
[Authorize]
public sealed class ChallansController : ControllerBase
{
    private readonly IChallanService _service;

    public ChallansController(IChallanService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Policy = "perm:challan.view")]
    public async Task<ActionResult<IReadOnlyCollection<ChallanViewModel>>> GetAll(CancellationToken cancellationToken)
    {
        var rows = await _service.GetAllAsync(cancellationToken);
        return Ok(rows);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "perm:challan.view")]
    public async Task<ActionResult<ChallanViewModel>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var row = await _service.GetByIdAsync(id, cancellationToken);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    [Authorize(Policy = "perm:challan.create")]
    public async Task<ActionResult<ChallanViewModel>> Create([FromBody] ChallanCreateModel model, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _service.CreateAsync(model, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/payments")]
    [Authorize(Policy = "perm:challan.payment")]
    public async Task<ActionResult<LorryPaymentViewModel>> AddPayment(Guid id, [FromBody] LorryPaymentCreateModel model, CancellationToken cancellationToken)
    {
        try
        {
            var payment = await _service.AddPaymentAsync(id, model, cancellationToken);
            return payment is null ? NotFound() : Ok(payment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
