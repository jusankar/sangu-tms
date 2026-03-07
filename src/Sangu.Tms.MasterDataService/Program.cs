var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();
app.MapGet("/health", () => Results.Ok(new { service = "master-data", status = "ok" }));
app.MapGet("/api/info", () => Results.Ok(new
{
    service = "master-data",
    modules = new[] { "branch", "customer", "location", "driver", "vehicle" }
}));

app.Run();
