using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;
using Sangu.Tms.Infrastructure.Data;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class PostgresCustomerService : ICustomerService
{
    private readonly SanguTmsDbContext _db;

    public PostgresCustomerService(SanguTmsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<CustomerViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Customers
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Code)
            .Select(x => new CustomerViewModel
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                Address = x.Address,
                GstNo = x.GstNo,
                Mobile = x.Mobile,
                CreditDays = x.CreditDays,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CustomerViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        return row is null
            ? null
            : new CustomerViewModel
            {
                Id = row.Id,
                Code = row.Code,
                Name = row.Name,
                Address = row.Address,
                GstNo = row.GstNo,
                Mobile = row.Mobile,
                CreditDays = row.CreditDays,
                IsActive = row.IsActive
            };
    }

    public async Task<CustomerViewModel> CreateAsync(CustomerUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var code = model.Code.Trim();

        var exists = await _db.Customers.AnyAsync(x => !x.IsDeleted && x.Code.ToLower() == code.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Customer code already exists.");

        var entity = new CustomerRecord
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = model.Name.Trim(),
            Address = model.Address?.Trim(),
            GstNo = model.GstNo?.Trim(),
            Mobile = model.Mobile?.Trim(),
            CreditDays = model.CreditDays,
            IsActive = model.IsActive,
            IsDeleted = false
        };

        _db.Customers.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return new CustomerViewModel
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Address = entity.Address,
            GstNo = entity.GstNo,
            Mobile = entity.Mobile,
            CreditDays = entity.CreditDays,
            IsActive = entity.IsActive
        };
    }

    public async Task<CustomerViewModel?> UpdateAsync(Guid id, CustomerUpsertModel model, CancellationToken cancellationToken = default)
    {
        Validate(model);
        var row = await _db.Customers.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (row is null) return null;

        var code = model.Code.Trim();
        var exists = await _db.Customers.AnyAsync(x => x.Id != id && !x.IsDeleted && x.Code.ToLower() == code.ToLower(), cancellationToken);
        if (exists) throw new ArgumentException("Customer code already exists.");

        row.Code = code;
        row.Name = model.Name.Trim();
        row.Address = model.Address?.Trim();
        row.GstNo = model.GstNo?.Trim();
        row.Mobile = model.Mobile?.Trim();
        row.CreditDays = model.CreditDays;
        row.IsActive = model.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        return new CustomerViewModel
        {
            Id = row.Id,
            Code = row.Code,
            Name = row.Name,
            Address = row.Address,
            GstNo = row.GstNo,
            Mobile = row.Mobile,
            CreditDays = row.CreditDays,
            IsActive = row.IsActive
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await _db.Customers.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (row is null) return false;

        row.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static void Validate(CustomerUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Code)) throw new ArgumentException("Code is required.");
        if (string.IsNullOrWhiteSpace(model.Name)) throw new ArgumentException("Name is required.");
        if (model.CreditDays < 0) throw new ArgumentException("Credit days cannot be negative.");
    }
}
