var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();
app.MapGet("/health", () => Results.Ok(new { service = "reporting", status = "ok" }));
app.MapGet("/api/info", () => Results.Ok(new
{
    service = "reporting",
    modules = new[] { "booking", "vehicle-statement", "billing", "outstanding", "payment" }
}));

app.Run();
