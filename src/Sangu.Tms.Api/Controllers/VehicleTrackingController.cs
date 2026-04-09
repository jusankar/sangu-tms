using System.Globalization;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Api.Controllers;

[ApiController]
[Route("api/traffic/vehicle-tracking")]
[Authorize]
public sealed class VehicleTrackingController : ControllerBase
{
    private readonly SanguTmsDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public VehicleTrackingController(
        SanguTmsDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpGet("{vehicleNumber}")]
    [Authorize(Policy = "perm:traffic.plan")]
    public async Task<ActionResult<VehicleTrackingViewModel>> GetByVehicleNumber(
        string vehicleNumber,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(vehicleNumber))
        {
            return BadRequest(new { error = "Vehicle number is required." });
        }

        var normalizedVehicleNo = vehicleNumber.Trim().ToUpperInvariant();
        var vehicle = await _db.Vehicles
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.VehicleNumber.ToUpper() == normalizedVehicleNo)
            .Select(x => new { x.Id, x.VehicleNumber })
            .FirstOrDefaultAsync(cancellationToken);

        if (vehicle is null)
        {
            return NotFound(new { error = $"Vehicle '{normalizedVehicleNo}' not found." });
        }

        var challan = await _db.Challans
            .AsNoTracking()
            .Where(x =>
                (x.VehicleId.HasValue && x.VehicleId == vehicle.Id) ||
                (x.VehicleNo != null && x.VehicleNo.ToUpper() == normalizedVehicleNo))
            .OrderByDescending(x => x.ChallanDate)
            .ThenByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.ChallanNo,
                x.FromLocationId,
                x.ToLocationId
            })
            .FirstOrDefaultAsync(cancellationToken);

        string fromLocationName;
        string toLocationName;
        string? fromState = null;
        string? toState = null;

        if (challan is null)
        {
            return NotFound(new { error = "No lorry hire/challan found for this vehicle." });
        }

        if (!challan.FromLocationId.HasValue || !challan.ToLocationId.HasValue)
        {
            return BadRequest(new { error = "Challan does not contain both From and To locations." });
        }

        var fromLocation = await _db.Locations
            .AsNoTracking()
            .Where(x => x.Id == challan.FromLocationId.Value)
            .Select(x => new { x.Name, x.StateName })
            .FirstOrDefaultAsync(cancellationToken);

        var toLocation = await _db.Locations
            .AsNoTracking()
            .Where(x => x.Id == challan.ToLocationId.Value)
            .Select(x => new { x.Name, x.StateName })
            .FirstOrDefaultAsync(cancellationToken);

        fromLocationName = fromLocation?.Name ?? "Origin";
        toLocationName = toLocation?.Name ?? "Destination";
        fromState = fromLocation?.StateName;
        toState = toLocation?.StateName;

        var http = _httpClientFactory.CreateClient();
        var fromGeo = await GeocodeAsync(http, fromLocationName, fromState, cancellationToken);
        var toGeo = await GeocodeAsync(http, toLocationName, toState, cancellationToken);

        if (fromGeo is null || toGeo is null)
        {
            return BadRequest(new
            {
                error = "Unable to geocode origin/destination. Please maintain proper location names/state."
            });
        }

        var route = await GetRoadRouteAsync(http, fromGeo.Value, toGeo.Value, fromLocationName, toLocationName, cancellationToken);
        var gps = await GetGpsPositionAsync(http, normalizedVehicleNo, cancellationToken);

        var hasGps = gps is not null;
        var current = gps is not null
            ? new TrackingPointViewModel(gps.Value.Latitude, gps.Value.Longitude, "Current Position")
            : EstimateCurrent(route.Route);

        var now = DateTimeOffset.UtcNow;
        var response = new VehicleTrackingViewModel
        {
            VehicleNumber = vehicle.VehicleNumber,
            ChallanNo = challan.ChallanNo,
            GpsProvider = gps?.Provider ?? (_configuration["GpsTracking:ProviderName"] ?? "GPS Device"),
            DeviceId = gps?.DeviceId ?? $"GPS-{vehicle.VehicleNumber.Replace(" ", "-", StringComparison.Ordinal).ToUpper()}",
            Status = hasGps ? "Moving" : "GPS Details Not Available",
            LastPingAtUtc = gps?.LastPingAtUtc ?? now,
            SpeedKmph = gps?.SpeedKmph ?? 0,
            FromLocation = fromLocationName,
            ToLocation = toLocationName,
            Route = route.Route,
            CurrentPosition = current,
            IsGpsAvailable = hasGps,
            GpsMessage = hasGps
                ? "Live GPS data received from integrated device."
                : "GPS details are not available for this vehicle/device at the moment.",
            RouteMessage = route.Message
        };

        return Ok(response);
    }

    private static async Task<(double Latitude, double Longitude)?> GeocodeAsync(
        HttpClient httpClient,
        string locationName,
        string? stateName,
        CancellationToken cancellationToken)
    {
        var query = string.IsNullOrWhiteSpace(stateName)
            ? $"{locationName}, India"
            : $"{locationName}, {stateName}, India";

        var url = $"https://nominatim.openstreetmap.org/search?format=json&limit=1&q={Uri.EscapeDataString(query)}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.UserAgent.ParseAdd("SanguTms/2.0 (vehicle-tracking)");

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.ValueKind != JsonValueKind.Array || doc.RootElement.GetArrayLength() == 0)
        {
            return null;
        }

        var first = doc.RootElement[0];
        var latText = first.GetProperty("lat").GetString();
        var lonText = first.GetProperty("lon").GetString();
        if (!double.TryParse(latText, NumberStyles.Float, CultureInfo.InvariantCulture, out var lat) ||
            !double.TryParse(lonText, NumberStyles.Float, CultureInfo.InvariantCulture, out var lng))
        {
            return null;
        }

        return (lat, lng);
    }

    private static async Task<(List<TrackingPointViewModel> Route, string Message)> GetRoadRouteAsync(
        HttpClient httpClient,
        (double Latitude, double Longitude) from,
        (double Latitude, double Longitude) to,
        string fromLocationName,
        string toLocationName,
        CancellationToken cancellationToken)
    {
        var osrmUrl =
            $"https://router.project-osrm.org/route/v1/driving/{from.Longitude.ToString(CultureInfo.InvariantCulture)},{from.Latitude.ToString(CultureInfo.InvariantCulture)};{to.Longitude.ToString(CultureInfo.InvariantCulture)},{to.Latitude.ToString(CultureInfo.InvariantCulture)}?overview=full&geometries=geojson";
        try
        {
            using var response = await httpClient.GetAsync(osrmUrl, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(body);
                var routes = doc.RootElement.GetProperty("routes");
                if (routes.GetArrayLength() > 0)
                {
                    var coords = routes[0].GetProperty("geometry").GetProperty("coordinates");
                    var result = new List<TrackingPointViewModel>(coords.GetArrayLength());
                    for (var i = 0; i < coords.GetArrayLength(); i++)
                    {
                        var c = coords[i];
                        var lng = c[0].GetDouble();
                        var lat = c[1].GetDouble();
                        var label = i == 0
                            ? fromLocationName
                            : i == coords.GetArrayLength() - 1
                                ? toLocationName
                                : "Route";
                        result.Add(new TrackingPointViewModel(lat, lng, label));
                    }

                    return (result, "Route generated from road network.");
                }
            }
        }
        catch
        {
            // Ignore and fallback below.
        }

        return (
        [
            new TrackingPointViewModel(from.Latitude, from.Longitude, fromLocationName),
            new TrackingPointViewModel(to.Latitude, to.Longitude, toLocationName)
        ], "Road routing unavailable; showing direct path.");
    }

    private async Task<GpsPosition?> GetGpsPositionAsync(
        HttpClient httpClient,
        string vehicleNumber,
        CancellationToken cancellationToken)
    {
        var template = _configuration["GpsTracking:VehiclePositionUrlTemplate"];
        if (string.IsNullOrWhiteSpace(template))
        {
            return null;
        }

        var url = template.Replace("{vehicleNumber}", Uri.EscapeDataString(vehicleNumber), StringComparison.OrdinalIgnoreCase);
        try
        {
            using var response = await httpClient.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (!TryReadDouble(root, "latitude", out var lat) &&
                !TryReadDouble(root, "lat", out lat))
            {
                return null;
            }

            if (!TryReadDouble(root, "longitude", out var lng) &&
                !TryReadDouble(root, "lng", out lng) &&
                !TryReadDouble(root, "lon", out lng))
            {
                return null;
            }

            TryReadInt(root, "speedKmph", out var speed);
            if (speed <= 0)
            {
                TryReadInt(root, "speed", out speed);
            }

            var provider = ReadString(root, "provider") ?? (_configuration["GpsTracking:ProviderName"] ?? "GPS Device");
            var deviceId = ReadString(root, "deviceId") ?? $"GPS-{vehicleNumber}";
            var lastPing = ReadDateTimeOffset(root, "lastPingAtUtc") ?? DateTimeOffset.UtcNow;

            return new GpsPosition(lat, lng, speed, provider, deviceId, lastPing);
        }
        catch
        {
            return null;
        }
    }

    private static TrackingPointViewModel EstimateCurrent(IReadOnlyList<TrackingPointViewModel> route)
    {
        if (route.Count == 0)
        {
            return new TrackingPointViewModel(0, 0, "Current Position");
        }
        if (route.Count == 1)
        {
            return new TrackingPointViewModel(route[0].Latitude, route[0].Longitude, "Current Position");
        }

        var index = route.Count / 2;
        return new TrackingPointViewModel(route[index].Latitude, route[index].Longitude, "Current Position");
    }

    private static bool TryReadDouble(JsonElement root, string propertyName, out double value)
    {
        value = 0;
        if (!root.TryGetProperty(propertyName, out var prop))
        {
            return false;
        }

        if (prop.ValueKind == JsonValueKind.Number)
        {
            value = prop.GetDouble();
            return true;
        }

        if (prop.ValueKind == JsonValueKind.String &&
            double.TryParse(prop.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed))
        {
            value = parsed;
            return true;
        }

        return false;
    }

    private static bool TryReadInt(JsonElement root, string propertyName, out int value)
    {
        value = 0;
        if (!root.TryGetProperty(propertyName, out var prop))
        {
            return false;
        }

        if (prop.ValueKind == JsonValueKind.Number)
        {
            value = prop.GetInt32();
            return true;
        }

        if (prop.ValueKind == JsonValueKind.String &&
            int.TryParse(prop.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed))
        {
            value = parsed;
            return true;
        }

        return false;
    }

    private static string? ReadString(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var prop))
        {
            return null;
        }

        return prop.ValueKind == JsonValueKind.String ? prop.GetString() : prop.ToString();
    }

    private static DateTimeOffset? ReadDateTimeOffset(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var prop))
        {
            return null;
        }

        if (prop.ValueKind == JsonValueKind.String &&
            DateTimeOffset.TryParse(prop.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed))
        {
            return parsed;
        }

        return null;
    }
}

public sealed class VehicleTrackingViewModel
{
    public string VehicleNumber { get; set; } = string.Empty;
    public string ChallanNo { get; set; } = string.Empty;
    public string GpsProvider { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset LastPingAtUtc { get; set; }
    public int SpeedKmph { get; set; }
    public string FromLocation { get; set; } = string.Empty;
    public string ToLocation { get; set; } = string.Empty;
    public bool IsGpsAvailable { get; set; }
    public string GpsMessage { get; set; } = string.Empty;
    public string RouteMessage { get; set; } = string.Empty;
    public List<TrackingPointViewModel> Route { get; set; } = new();
    public TrackingPointViewModel CurrentPosition { get; set; } = new(0, 0, "Current");
}

public sealed record TrackingPointViewModel(double Latitude, double Longitude, string Label);
internal sealed record GpsPosition(double Latitude, double Longitude, int SpeedKmph, string Provider, string DeviceId, DateTimeOffset LastPingAtUtc);

