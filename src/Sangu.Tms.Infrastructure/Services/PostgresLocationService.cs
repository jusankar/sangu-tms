using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresLocationService : ILocationService
{
    private readonly SanguTmsDbContext _db;

    public PostgresLocationService(SanguTmsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<LocationViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Locations
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Code)
            .Select(x => new LocationViewModel
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                StateName = x.StateName,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<LocationViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Locations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        return row is null
            ? null
            : new LocationViewModel
            {
                Id = row.Id,
                Code = row.Code,
                Name = row.Name,
                StateName = row.StateName,
                IsActive = row.IsActive
            };
    }

    public async Task<LocationViewModel> CreateAsync(LocationUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var code = model.Code.Trim();

        var exists = await _db.Locations.AnyAsync(x => !x.IsDeleted && x.Code.ToLower() == code.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Location code already exists.");

        var entity = new LocationRecord
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = model.Name.Trim(),
            StateName = model.StateName?.Trim(),
            IsActive = model.IsActive,
            IsDeleted = false
        };

        _db.Locations.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return new LocationViewModel
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            StateName = entity.StateName,
            IsActive = entity.IsActive
        };
    }

    public async Task<LocationViewModel?> UpdateAsync(Guid id, LocationUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var row = await _db.Locations.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (row is null) return null;

        var code = model.Code.Trim();
        var exists = await _db.Locations.AnyAsync(x => x.Id != id && !x.IsDeleted && x.Code.ToLower() == code.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Location code already exists.");

        row.Code = code;
        row.Name = model.Name.Trim();
        row.StateName = model.StateName?.Trim();
        row.IsActive = model.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        return new LocationViewModel
        {
            Id = row.Id,
            Code = row.Code,
            Name = row.Name,
            StateName = row.StateName,
            IsActive = row.IsActive
        };
    }

    private static void Validate(LocationUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Code)) throw new ArgumentException("Code is required.");
        if (string.IsNullOrWhiteSpace(model.Name)) throw new ArgumentException("Name is required.");
    }
}
