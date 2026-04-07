using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresDriverService : IDriverService
{
    private readonly SanguTmsDbContext _db;

    public PostgresDriverService(SanguTmsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<DriverViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Drivers
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new DriverViewModel
            {
                Id = x.Id,
                Name = x.Name,
                LicenseNo = x.LicenseNo,
                DateOfBirth = x.DateOfBirth,
                Address = x.Address,
                BloodGroup = x.BloodGroup,
                Mobile = x.Mobile,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<DriverViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Drivers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        return row is null
            ? null
            : new DriverViewModel
            {
                Id = row.Id,
                Name = row.Name,
                LicenseNo = row.LicenseNo,
                DateOfBirth = row.DateOfBirth,
                Address = row.Address,
                BloodGroup = row.BloodGroup,
                Mobile = row.Mobile,
                IsActive = row.IsActive
            };
    }

    public async Task<DriverViewModel> CreateAsync(DriverUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var licenseNo = model.LicenseNo.Trim().ToUpperInvariant();

        var exists = await _db.Drivers.AnyAsync(x => !x.IsDeleted && x.LicenseNo.ToLower() == licenseNo.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Driver license already exists.");

        var entity = new DriverRecord
        {
            Id = Guid.NewGuid(),
            Name = model.Name.Trim(),
            LicenseNo = licenseNo,
            DateOfBirth = model.DateOfBirth,
            Address = model.Address?.Trim(),
            BloodGroup = model.BloodGroup?.Trim(),
            Mobile = model.Mobile?.Trim(),
            IsActive = model.IsActive,
            IsDeleted = false
        };

        _db.Drivers.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return new DriverViewModel
        {
            Id = entity.Id,
            Name = entity.Name,
            LicenseNo = entity.LicenseNo,
            DateOfBirth = entity.DateOfBirth,
            Address = entity.Address,
            BloodGroup = entity.BloodGroup,
            Mobile = entity.Mobile,
            IsActive = entity.IsActive
        };
    }

    public async Task<DriverViewModel?> UpdateAsync(Guid id, DriverUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var row = await _db.Drivers.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (row is null) return null;

        var licenseNo = model.LicenseNo.Trim().ToUpperInvariant();
        var exists = await _db.Drivers.AnyAsync(x => x.Id != id && !x.IsDeleted && x.LicenseNo.ToLower() == licenseNo.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Driver license already exists.");

        row.Name = model.Name.Trim();
        row.LicenseNo = licenseNo;
        row.DateOfBirth = model.DateOfBirth;
        row.Address = model.Address?.Trim();
        row.BloodGroup = model.BloodGroup?.Trim();
        row.Mobile = model.Mobile?.Trim();
        row.IsActive = model.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        return new DriverViewModel
        {
            Id = row.Id,
            Name = row.Name,
            LicenseNo = row.LicenseNo,
            DateOfBirth = row.DateOfBirth,
            Address = row.Address,
            BloodGroup = row.BloodGroup,
            Mobile = row.Mobile,
            IsActive = row.IsActive
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Drivers.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (row is null) return false;

        row.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static void Validate(DriverUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Name)) throw new ArgumentException("Driver name is required.");
        if (string.IsNullOrWhiteSpace(model.LicenseNo)) throw new ArgumentException("License number is required.");
    }
}
