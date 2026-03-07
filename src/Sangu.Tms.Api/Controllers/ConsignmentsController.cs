using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Api.Controllers;

[ApiController]
[Route("api/consignments")]
[Authorize]
public sealed class ConsignmentsController : ControllerBase
{
    private readonly IConsignmentService _service;
    private readonly ILicenseService _licenseService;

    public ConsignmentsController(IConsignmentService service, ILicenseService licenseService)
    {
        _service = service;
        _licenseService = licenseService;
    }

    [HttpGet]
    [Authorize(Policy = "perm:consignment.view")]
    public async Task<ActionResult<IReadOnlyCollection<ConsignmentViewModel>>> GetAll(CancellationToken cancellationToken)
    {
        var rows = await _service.GetAllAsync(cancellationToken);
        return Ok(rows);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "perm:consignment.view")]
    public async Task<ActionResult<ConsignmentViewModel>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var row = await _service.GetByIdAsync(id, cancellationToken);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    [Authorize(Policy = "perm:consignment.create")]
    public async Task<ActionResult<ConsignmentViewModel>> Create([FromBody] ConsignmentUpsertModel model, CancellationToken cancellationToken)
    {
        try
        {
            var tenantCode = HttpContext.Items["TenantCode"]?.ToString() ?? "default";
            var canCreate = await _licenseService.CanCreateConsignmentAsync(tenantCode, cancellationToken);
            if (!canCreate)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "Consignment quota exceeded for current period." });
            }

            var created = await _service.CreateAsync(model, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "perm:consignment.edit")]
    public async Task<ActionResult<ConsignmentViewModel>> Update(Guid id, [FromBody] ConsignmentUpsertModel model, CancellationToken cancellationToken)
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
    [Authorize(Policy = "perm:consignment.edit")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _service.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
