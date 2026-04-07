using System.Text.Json.Serialization;

namespace Sangu.Tms.Application.Models;

public sealed class TrafficMaterialModel
{
    public string Id { get; set; } = string.Empty;
    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }
    public decimal Weight { get; set; }
    [JsonPropertyName("qty")]
    public int Qty { get; set; }
    public bool Stackable { get; set; }
    public int? MaxStack { get; set; }
}

public sealed class TrafficTrailerTypeModel
{
    public string Type { get; set; } = string.Empty;
    public decimal L { get; set; }
    public decimal W { get; set; }
    public decimal H { get; set; }
    public decimal MaxWeight { get; set; }
}

public sealed class TrafficPlanRequestModel
{
    public List<TrafficMaterialModel> Materials { get; set; } = new();
    public List<TrafficTrailerTypeModel> Trailers { get; set; } = new();
    public bool AllowRotation { get; set; } = true;
    public bool AllowStacking { get; set; } = true;
}

public sealed class TrafficTrailerItemPlanModel
{
    public string MaterialId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StackCount { get; set; }
}

public sealed class TrafficPlacementModel
{
    public string MaterialId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StackCount { get; set; }
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public decimal Z { get; set; }
    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }
    public decimal Weight { get; set; }
}

public sealed class TrafficTrailerPlanModel
{
    public string TrailerType { get; set; } = string.Empty;
    public decimal TrailerLength { get; set; }
    public decimal TrailerWidth { get; set; }
    public decimal TrailerHeight { get; set; }
    public decimal TotalWeight { get; set; }
    public List<TrafficTrailerItemPlanModel> Items { get; set; } = new();
    public List<TrafficPlacementModel> Placements { get; set; } = new();
}

public sealed class TrafficPlanResponseModel
{
    public Guid? PlanId { get; set; }
    public string RecommendedTrailerType { get; set; } = string.Empty;
    public int TotalTrailers { get; set; }
    public List<TrafficTrailerPlanModel> Trailers { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public string Mode { get; set; } = "heuristic";
}


public sealed class TrafficPlanSummaryModel
{
    public Guid PlanId { get; set; }
    public string RecommendedTrailerType { get; set; } = string.Empty;
    public int TotalTrailers { get; set; }
    public string Mode { get; set; } = "heuristic";
    public DateTime CreatedAt { get; set; }
}
