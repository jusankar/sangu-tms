using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Sangu.Tms.ChatService.Services;
using Sangu.Tms.Infrastructure.Data;

DotEnvLoader.LoadIfPresent();

var builder = WebApplication.CreateBuilder(args);
var corsPolicy = "frontend-dev";
var chatServiceUrl = builder.Configuration["ChatService:Url"] ?? "http://127.0.0.1:5006";

builder.WebHost.UseUrls(chatServiceUrl);

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicy, policy =>
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174")
            .AllowAnyHeader()
            .AllowAnyMethod());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sangu TMS Chat API",
        Version = "v1"
    });
});

builder.Services.AddDbContext<SanguTmsDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("TenantDb");
    options
        .UseNpgsql(connectionString)
        .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
});

builder.Services.AddHttpClient<OpenAiSqlGenerator>();
builder.Services.AddScoped<ReadOnlySqlRunner>();
builder.Services.AddScoped<ChatQueryAgent>();

var app = builder.Build();

app.UseCors(corsPolicy);
app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/health", () => Results.Ok(new { service = "chat", status = "ok", mode = "read-only" }));
app.MapGet("/api/info", () => Results.Ok(new
{
    service = "chat",
    mode = "read-only",
    supportedQueries = new[]
    {
        "Outstanding amount for customer",
        "Lorry hire amount for challan/lorry hire number",
        "Booking amount for consignment number",
        "Payment details for invoice number",
        "Booking amount for customer"
    }
}));

app.MapPost("/api/chat/ask", async (ChatRequest request, ChatQueryAgent agent, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Message))
    {
        return Results.BadRequest(new ChatResponse("Please type a question.", false, "invalid_input"));
    }

    var response = await agent.AnswerAsync(request.Message, cancellationToken);
    return Results.Ok(response);
});

app.Run();

public sealed record ChatRequest(string Message);

internal static class DotEnvLoader
{
    public static void LoadIfPresent()
    {
        var envPath = ResolveDotEnvPath();
        if (envPath is null)
        {
            return;
        }

        foreach (var rawLine in File.ReadAllLines(envPath))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }

    private static string? ResolveDotEnvPath()
    {
        // 1) Walk up from current directory until drive root.
        var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, ".env");
            if (File.Exists(candidate))
            {
                return candidate;
            }
            dir = dir.Parent;
        }

        // 2) Fallback: project-relative lookup from app base directory.
        var baseDir = new DirectoryInfo(AppContext.BaseDirectory);
        while (baseDir is not null)
        {
            var candidate = Path.Combine(baseDir.FullName, ".env");
            if (File.Exists(candidate))
            {
                return candidate;
            }
            baseDir = baseDir.Parent;
        }

        return null;
    }
}
