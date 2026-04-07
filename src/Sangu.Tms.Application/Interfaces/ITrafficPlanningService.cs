using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface ITrafficPlanningService
{
    Task<TrafficPlanResponseModel> GeneratePlanAsync(TrafficPlanRequestModel request, CancellationToken cancellationToken = default);
}
