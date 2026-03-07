using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Sangu.Tms.Api.Authentication;
using Sangu.Tms.Api.Authorization;
using Sangu.Tms.Api.Middleware;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);
var corsPolicy = "frontend-dev";

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicy, policy =>
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Sangu TMS API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "Bearer <token>",
        In = ParameterLocation.Header,
        Description = "Enter token returned by /api/auth/login"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddAuthentication("Bearer")
    .AddScheme<AuthenticationSchemeOptions, BearerTokenAuthenticationHandler>("Bearer", _ => { });

builder.Services.AddAuthorization(options =>
{
    var permissions = new[]
    {
        "consignment.view", "consignment.create", "consignment.edit",
        "challan.view", "challan.create", "challan.payment",
        "invoice.view", "invoice.create",
        "receipt.view", "receipt.create",
        "report.booking", "report.lorry_payment", "report.vehicle_payment", "report.outstanding",
        "settings.branch", "settings.location", "settings.customer", "settings.driver", "settings.vehicle",
        "users.manage", "roles.manage"
    };
    foreach (var perm in permissions)
    {
        options.AddPolicy($"perm:{perm}", policy =>
            policy.Requirements.Add(new PermissionRequirement(perm)));
    }
});
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddSingleton<InMemoryDataStore>();
builder.Services.AddSingleton<INumberingService, InMemoryNumberingService>();
builder.Services.AddSingleton<IConsignmentService, InMemoryConsignmentService>();
builder.Services.AddSingleton<IChallanService, InMemoryChallanService>();
builder.Services.AddSingleton<IInvoiceService, InMemoryInvoiceService>();
builder.Services.AddSingleton<IMoneyReceiptService, InMemoryMoneyReceiptService>();
builder.Services.AddSingleton<IReportService, InMemoryReportService>();
builder.Services.AddSingleton<IBranchService, InMemoryBranchService>();
builder.Services.AddSingleton<ILocationService, InMemoryLocationService>();
builder.Services.AddSingleton<ICustomerService, InMemoryCustomerService>();
builder.Services.AddSingleton<IDriverService, InMemoryDriverService>();
builder.Services.AddSingleton<IVehicleService, InMemoryVehicleService>();
builder.Services.AddSingleton<IRbacService, InMemoryRbacService>();
builder.Services.AddSingleton<ILicenseService, InMemoryLicenseService>();
builder.Services.AddSingleton<IAuthService, InMemoryAuthService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(corsPolicy);

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseMiddleware<LicenseGuardMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/info", () => Results.Ok(new
{
    product = "Sangu TMS 2.0",
    module = "Phase 1 bootstrap",
    endpoints = new[]
    {
        "GET /api/consignments",
        "POST /api/auth/login",
        "GET /api/auth/me",
        "POST /api/consignments",
        "GET /api/consignments/{id}",
        "PUT /api/consignments/{id}",
        "GET /api/challans",
        "POST /api/challans",
        "POST /api/challans/{id}/payments",
        "GET /api/invoices",
        "POST /api/invoices",
        "POST /api/invoices/{id}/receipts",
        "GET /api/receipts",
        "GET /api/reports/booking",
        "GET /api/reports/lorry-payments",
        "GET /api/reports/vehicle-payments",
        "GET /api/reports/outstanding",
        "GET /api/branches",
        "GET /api/locations",
        "GET /api/customers",
        "GET /api/drivers",
        "GET /api/vehicles",
        "GET /api/rbac/permissions",
        "GET /api/rbac/roles",
        "GET /api/rbac/users"
    }
}));
app.MapControllers();

app.Run();
