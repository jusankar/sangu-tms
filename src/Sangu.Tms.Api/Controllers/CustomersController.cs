using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public sealed class CustomersController : ControllerBase
{
    private readonly ICustomerService _service;

    public CustomersController(ICustomerService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Policy = "perm:settings.customer")]
    public async Task<ActionResult<IReadOnlyCollection<CustomerViewModel>>> GetAll(CancellationToken cancellationToken)
        => Ok(await _service.GetAllAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "perm:settings.customer")]
    public async Task<ActionResult<CustomerViewModel>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var row = await _service.GetByIdAsync(id, cancellationToken);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    [Authorize(Policy = "perm:settings.customer")]
    public async Task<ActionResult<CustomerViewModel>> Create([FromBody] CustomerUpsertModel model, CancellationToken cancellationToken)
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

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "perm:settings.customer")]
    public async Task<ActionResult<CustomerViewModel>> Update(Guid id, [FromBody] CustomerUpsertModel model, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, model, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "perm:settings.customer")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _service.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
