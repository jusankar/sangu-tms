using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PythonTrafficPlanningService : ITrafficPlanningService
{
    private readonly HttpClient _httpClient;

    public PythonTrafficPlanningService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<TrafficPlanResponseModel> GeneratePlanAsync(TrafficPlanRequestModel request, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PostAsJsonAsync("/optimize", request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Traffic planning service error: {(int)response.StatusCode} {body}");
        }

        var payload = await response.Content.ReadFromJsonAsync<TrafficPlanResponseModel>(cancellationToken: cancellationToken);
        if (payload is null) throw new InvalidOperationException("Traffic planning service returned empty response.");
        return payload;
    }
}
