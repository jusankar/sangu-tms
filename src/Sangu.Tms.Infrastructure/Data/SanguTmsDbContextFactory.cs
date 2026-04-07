using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Sangu.Tms.Infrastructure.Data;

public sealed class SanguTmsDbContextFactory : IDesignTimeDbContextFactory<SanguTmsDbContext>
{
    public SanguTmsDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();
        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("TenantDb");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Missing ConnectionStrings:TenantDb. Set ConnectionStrings__TenantDb env var.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<SanguTmsDbContext>();
        optionsBuilder.UseNpgsql(connectionString);
        return new SanguTmsDbContext(optionsBuilder.Options);
    }
}
