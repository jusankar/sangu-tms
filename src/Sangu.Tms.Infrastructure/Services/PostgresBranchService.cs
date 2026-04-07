using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresBranchService : IBranchService
{
    private readonly SanguTmsDbContext _db;

    public PostgresBranchService(SanguTmsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<BranchViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Branches
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Code)
            .Select(x => new BranchViewModel
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                Address = x.Address,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<BranchViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Branches.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        return row is null
            ? null
            : new BranchViewModel
            {
                Id = row.Id,
                Code = row.Code,
                Name = row.Name,
                Address = row.Address,
                IsActive = row.IsActive
            };
    }

    public async Task<BranchViewModel> CreateAsync(BranchUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var code = model.Code.Trim();

        var exists = await _db.Branches.AnyAsync(x => !x.IsDeleted && x.Code.ToLower() == code.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Branch code already exists.");

        var entity = new BranchRecord
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = model.Name.Trim(),
            Address = model.Address?.Trim(),
            IsActive = model.IsActive,
            IsDeleted = false
        };

        _db.Branches.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return new BranchViewModel
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Address = entity.Address,
            IsActive = entity.IsActive
        };
    }

    public async Task<BranchViewModel?> UpdateAsync(Guid id, BranchUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var row = await _db.Branches.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (row is null) return null;

        var code = model.Code.Trim();
        var exists = await _db.Branches.AnyAsync(x => x.Id != id && !x.IsDeleted && x.Code.ToLower() == code.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Branch code already exists.");

        row.Code = code;
        row.Name = model.Name.Trim();
        row.Address = model.Address?.Trim();
        row.IsActive = model.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        return new BranchViewModel
        {
            Id = row.Id,
            Code = row.Code,
            Name = row.Name,
            Address = row.Address,
            IsActive = row.IsActive
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Branches.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (row is null) return false;

        row.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static void Validate(BranchUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Code)) throw new ArgumentException("Code is required.");
        if (string.IsNullOrWhiteSpace(model.Name)) throw new ArgumentException("Name is required.");
    }
}
