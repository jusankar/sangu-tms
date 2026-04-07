using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Api.Controllers;

[ApiController]
[Route("api/traffic/vehicle-placement")]
public sealed class TrafficPlanningController : ControllerBase
{
    private readonly ITrafficPlanningService _service;
    private readonly ITrafficPlanStore _store;

    public TrafficPlanningController(ITrafficPlanningService service, ITrafficPlanStore store)
    {
        _service = service;
        _store = store;
    }

    [Authorize(Policy = "perm:traffic.plan")]
    [HttpPost("plan")]
    public async Task<ActionResult<TrafficPlanResponseModel>> CreatePlan(
        [FromBody] TrafficPlanRequestModel request,
        CancellationToken cancellationToken)
    {
        if (request.Materials.Count == 0) return BadRequest(new { error = "At least one material is required." });
        if (request.Trailers.Count == 0) return BadRequest(new { error = "At least one trailer type is required." });

        var result = await _service.GeneratePlanAsync(request, cancellationToken);
        var planId = await _store.SavePlanAsync(request, result, cancellationToken);
        result.PlanId = planId;
        return Ok(result);
    }


    [Authorize(Policy = "perm:traffic.plan")]
    [HttpGet("plan/{planId:guid}")]
    public async Task<ActionResult<TrafficPlanResponseModel>> GetPlan(Guid planId, CancellationToken cancellationToken)
    {
        var plan = await _store.GetPlanAsync(planId, cancellationToken);
        if (plan is null) return NotFound();
        return Ok(plan);
    }

    [Authorize(Policy = "perm:traffic.plan")]
    [HttpGet("plans")]
    public async Task<ActionResult<IReadOnlyList<TrafficPlanSummaryModel>>> ListPlans([FromQuery] int take = 50, CancellationToken cancellationToken = default)
    {
        if (take <= 0) take = 50;
        if (take > 200) take = 200;
        var plans = await _store.ListPlansAsync(take, cancellationToken);
        return Ok(plans);
    }
}



