using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Api.Controllers;

[ApiController]
[Route("api/rbac")]
[Authorize]
public sealed class RbacController : ControllerBase
{
    private readonly IRbacService _service;

    public RbacController(IRbacService service)
    {
        _service = service;
    }

    [HttpGet("permissions")]
    [Authorize(Policy = "perm:roles.manage")]
    public async Task<ActionResult<IReadOnlyCollection<PermissionViewModel>>> Permissions(CancellationToken cancellationToken)
        => Ok(await _service.GetPermissionsAsync(cancellationToken));

    [HttpGet("roles")]
    [Authorize(Policy = "perm:roles.manage")]
    public async Task<ActionResult<IReadOnlyCollection<RoleViewModel>>> Roles(CancellationToken cancellationToken)
        => Ok(await _service.GetRolesAsync(cancellationToken));

    [HttpPost("roles")]
    [Authorize(Policy = "perm:roles.manage")]
    public async Task<ActionResult<RoleViewModel>> CreateRole([FromBody] RoleUpsertModel model, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _service.CreateRoleAsync(model, cancellationToken);
            return Ok(created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("roles/{id:guid}")]
    [Authorize(Policy = "perm:roles.manage")]
    public async Task<ActionResult<RoleViewModel>> UpdateRole(Guid id, [FromBody] RoleUpsertModel model, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _service.UpdateRoleAsync(id, model, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("users")]
    [Authorize(Policy = "perm:users.manage")]
    public async Task<ActionResult<IReadOnlyCollection<UserViewModel>>> Users(CancellationToken cancellationToken)
        => Ok(await _service.GetUsersAsync(cancellationToken));

    [HttpPost("users")]
    [Authorize(Policy = "perm:users.manage")]
    public async Task<ActionResult<UserViewModel>> CreateUser([FromBody] UserUpsertModel model, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _service.CreateUserAsync(model, cancellationToken);
            return Ok(created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("users/{id:guid}")]
    [Authorize(Policy = "perm:users.manage")]
    public async Task<ActionResult<UserViewModel>> UpdateUser(Guid id, [FromBody] UserUpsertModel model, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _service.UpdateUserAsync(id, model, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
