var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();
app.MapGet("/health", () => Results.Ok(new { service = "booking", status = "ok" }));
app.MapGet("/api/info", () => Results.Ok(new
{
    service = "booking",
    modules = new[] { "consignment", "vehicle-receipt" }
}));

app.Run();
