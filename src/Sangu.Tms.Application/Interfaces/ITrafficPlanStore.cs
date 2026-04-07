using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface ITrafficPlanStore
{
    Task<Guid> SavePlanAsync(TrafficPlanRequestModel request, TrafficPlanResponseModel response, CancellationToken cancellationToken = default);
    Task<TrafficPlanResponseModel?> GetPlanAsync(Guid planId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TrafficPlanSummaryModel>> ListPlansAsync(int take = 50, CancellationToken cancellationToken = default);
}
