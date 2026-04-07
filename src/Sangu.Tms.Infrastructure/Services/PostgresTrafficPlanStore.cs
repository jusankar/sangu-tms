using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresTrafficPlanStore : ITrafficPlanStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly SanguTmsDbContext _db;

    public PostgresTrafficPlanStore(SanguTmsDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> SavePlanAsync(TrafficPlanRequestModel request, TrafficPlanResponseModel response, CancellationToken cancellationToken = default)
    {
        var planId = Guid.NewGuid();

        var plan = new TrafficPlanRecord
        {
            Id = planId,
            RecommendedTrailerType = response.RecommendedTrailerType,
            TotalTrailers = response.TotalTrailers,
            Mode = response.Mode,
            WarningsJson = JsonSerializer.Serialize(response.Warnings, JsonOptions),
            RequestJson = JsonSerializer.Serialize(request, JsonOptions),
            CreatedAt = DateTime.UtcNow
        };

        var trailerRecords = response.Trailers.Select((trailer, index) => new TrafficPlanTrailerRecord
        {
            Id = Guid.NewGuid(),
            PlanId = planId,
            TrailerIndex = index + 1,
            TrailerType = trailer.TrailerType,
            TotalWeight = trailer.TotalWeight,
            TrailerLength = trailer.TrailerLength,
            TrailerWidth = trailer.TrailerWidth,
            TrailerHeight = trailer.TrailerHeight
        }).ToList();

        var itemRecords = response.Trailers.SelectMany((trailer, tIndex) =>
            trailer.Items.Select(item => new TrafficPlanItemRecord
            {
                Id = Guid.NewGuid(),
                TrailerId = trailerRecords[tIndex].Id,
                MaterialId = item.MaterialId,
                Quantity = item.Quantity,
                StackCount = item.StackCount
            })).ToList();

        var placementRecords = response.Trailers.SelectMany((trailer, tIndex) =>
            trailer.Placements.Select(placement => new TrafficPlanPlacementRecord
            {
                Id = Guid.NewGuid(),
                TrailerId = trailerRecords[tIndex].Id,
                MaterialId = placement.MaterialId,
                Quantity = placement.Quantity,
                StackCount = placement.StackCount,
                X = placement.X,
                Y = placement.Y,
                Z = placement.Z,
                Length = placement.Length,
                Width = placement.Width,
                Height = placement.Height,
                Weight = placement.Weight
            })).ToList();

        _db.TrafficPlans.Add(plan);
        await _db.SaveChangesAsync(cancellationToken);

        _db.TrafficPlanTrailers.AddRange(trailerRecords);
        await _db.SaveChangesAsync(cancellationToken);

        _db.TrafficPlanItems.AddRange(itemRecords);
        _db.TrafficPlanPlacements.AddRange(placementRecords);
        await _db.SaveChangesAsync(cancellationToken);

        return planId;
    }

    public async Task<TrafficPlanResponseModel?> GetPlanAsync(Guid planId, CancellationToken cancellationToken = default)
    {
        var plan = await _db.TrafficPlans.AsNoTracking().FirstOrDefaultAsync(x => x.Id == planId, cancellationToken);
        if (plan is null) return null;

        var trailers = await _db.TrafficPlanTrailers
            .AsNoTracking()
            .Where(x => x.PlanId == planId)
            .OrderBy(x => x.TrailerIndex)
            .ToListAsync(cancellationToken);

        var trailerIds = trailers.Select(x => x.Id).ToList();
        var items = trailerIds.Count == 0
            ? new List<TrafficPlanItemRecord>()
            : await _db.TrafficPlanItems.AsNoTracking().Where(x => trailerIds.Contains(x.TrailerId)).ToListAsync(cancellationToken);

        var placements = trailerIds.Count == 0
            ? new List<TrafficPlanPlacementRecord>()
            : await _db.TrafficPlanPlacements.AsNoTracking().Where(x => trailerIds.Contains(x.TrailerId)).ToListAsync(cancellationToken);

        var itemGroups = items.GroupBy(x => x.TrailerId).ToDictionary(x => x.Key, x => x.ToList());
        var placementGroups = placements.GroupBy(x => x.TrailerId).ToDictionary(x => x.Key, x => x.ToList());

        var response = new TrafficPlanResponseModel
        {
            PlanId = plan.Id,
            RecommendedTrailerType = plan.RecommendedTrailerType ?? string.Empty,
            TotalTrailers = plan.TotalTrailers,
            Mode = plan.Mode ?? "heuristic",
            Warnings = string.IsNullOrWhiteSpace(plan.WarningsJson)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(plan.WarningsJson, JsonOptions) ?? new List<string>(),
            Trailers = trailers.Select(trailer => new TrafficTrailerPlanModel
            {
                TrailerType = trailer.TrailerType ?? string.Empty,
                TrailerLength = trailer.TrailerLength,
                TrailerWidth = trailer.TrailerWidth,
                TrailerHeight = trailer.TrailerHeight,
                TotalWeight = trailer.TotalWeight,
                Items = itemGroups.TryGetValue(trailer.Id, out var lines)
                    ? lines.Select(line => new TrafficTrailerItemPlanModel
                    {
                        MaterialId = line.MaterialId,
                        Quantity = line.Quantity,
                        StackCount = line.StackCount
                    }).ToList()
                    : new List<TrafficTrailerItemPlanModel>(),
                Placements = placementGroups.TryGetValue(trailer.Id, out var placementsForTrailer)
                    ? placementsForTrailer.Select(place => new TrafficPlacementModel
                    {
                        MaterialId = place.MaterialId,
                        Quantity = place.Quantity,
                        StackCount = place.StackCount,
                        X = place.X,
                        Y = place.Y,
                        Z = place.Z,
                        Length = place.Length,
                        Width = place.Width,
                        Height = place.Height,
                        Weight = place.Weight
                    }).ToList()
                    : new List<TrafficPlacementModel>()
            }).ToList()
        };

        return response;
    }

    public async Task<IReadOnlyList<TrafficPlanSummaryModel>> ListPlansAsync(int take = 50, CancellationToken cancellationToken = default)
    {
        return await _db.TrafficPlans.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(take)
            .Select(x => new TrafficPlanSummaryModel
            {
                PlanId = x.Id,
                RecommendedTrailerType = x.RecommendedTrailerType ?? string.Empty,
                TotalTrailers = x.TotalTrailers,
                Mode = x.Mode ?? "heuristic",
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
