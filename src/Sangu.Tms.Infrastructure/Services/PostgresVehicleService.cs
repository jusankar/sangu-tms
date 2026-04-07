using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresVehicleService : IVehicleService
{
    private readonly SanguTmsDbContext _db;

    public PostgresVehicleService(SanguTmsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<VehicleViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Vehicles
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.VehicleNumber)
            .Select(x => new VehicleViewModel
            {
                Id = x.Id,
                VehicleNumber = x.VehicleNumber,
                Make = x.Make,
                Type = x.Type,
                ChassisNumber = x.ChassisNumber,
                EngineNumber = x.EngineNumber,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<VehicleViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Vehicles.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        return row is null
            ? null
            : new VehicleViewModel
            {
                Id = row.Id,
                VehicleNumber = row.VehicleNumber,
                Make = row.Make,
                Type = row.Type,
                ChassisNumber = row.ChassisNumber,
                EngineNumber = row.EngineNumber,
                IsActive = row.IsActive
            };
    }

    public async Task<VehicleViewModel> CreateAsync(VehicleUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var vehicleNo = model.VehicleNumber.Trim().ToUpperInvariant();

        var exists = await _db.Vehicles.AnyAsync(x => !x.IsDeleted && x.VehicleNumber.ToLower() == vehicleNo.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Vehicle number already exists.");

        var entity = new VehicleRecord
        {
            Id = Guid.NewGuid(),
            VehicleNumber = vehicleNo,
            Make = model.Make?.Trim(),
            Type = model.Type?.Trim(),
            ChassisNumber = model.ChassisNumber?.Trim(),
            EngineNumber = model.EngineNumber?.Trim(),
            IsActive = model.IsActive,
            IsDeleted = false
        };

        _db.Vehicles.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return new VehicleViewModel
        {
            Id = entity.Id,
            VehicleNumber = entity.VehicleNumber,
            Make = entity.Make,
            Type = entity.Type,
            ChassisNumber = entity.ChassisNumber,
            EngineNumber = entity.EngineNumber,
            IsActive = entity.IsActive
        };
    }

    public async Task<VehicleViewModel?> UpdateAsync(Guid id, VehicleUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var row = await _db.Vehicles.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (row is null) return null;

        var vehicleNo = model.VehicleNumber.Trim().ToUpperInvariant();
        var exists = await _db.Vehicles.AnyAsync(x => x.Id != id && !x.IsDeleted && x.VehicleNumber.ToLower() == vehicleNo.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Vehicle number already exists.");

        row.VehicleNumber = vehicleNo;
        row.Make = model.Make?.Trim();
        row.Type = model.Type?.Trim();
        row.ChassisNumber = model.ChassisNumber?.Trim();
        row.EngineNumber = model.EngineNumber?.Trim();
        row.IsActive = model.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        return new VehicleViewModel
        {
            Id = row.Id,
            VehicleNumber = row.VehicleNumber,
            Make = row.Make,
            Type = row.Type,
            ChassisNumber = row.ChassisNumber,
            EngineNumber = row.EngineNumber,
            IsActive = row.IsActive
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Vehicles.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (row is null) return false;

        row.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static void Validate(VehicleUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.VehicleNumber)) throw new ArgumentException("Vehicle number is required.");
    }
}
