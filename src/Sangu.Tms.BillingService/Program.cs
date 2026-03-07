var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();
app.MapGet("/health", () => Results.Ok(new { service = "billing", status = "ok" }));
app.MapGet("/api/info", () => Results.Ok(new
{
    service = "billing",
    modules = new[] { "invoice" }
}));

app.Run();
