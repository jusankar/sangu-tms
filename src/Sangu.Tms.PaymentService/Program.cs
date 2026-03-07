var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();
app.MapGet("/health", () => Results.Ok(new { service = "payment", status = "ok" }));
app.MapGet("/api/info", () => Results.Ok(new
{
    service = "payment",
    modules = new[] { "payment", "vehicle-payment" }
}));

app.Run();
