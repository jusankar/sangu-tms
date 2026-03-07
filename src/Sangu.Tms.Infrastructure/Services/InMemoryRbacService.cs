using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryRbacService : IRbacService
{
    private readonly InMemoryDataStore _store;

    public InMemoryRbacService(InMemoryDataStore store)
    {
        _store = store;
        SeedPermissions();
    }

    public Task<IReadOnlyCollection<PermissionViewModel>> GetPermissionsAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyCollection<PermissionViewModel>>(_store.Permissions.OrderBy(x => x.ModuleCode).ThenBy(x => x.ActionCode).ToList());

    public Task<IReadOnlyCollection<RoleViewModel>> GetRolesAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyCollection<RoleViewModel>>(_store.Roles.OrderBy(x => x.Code).ToList());

    public Task<RoleViewModel?> GetRoleByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(_store.Roles.FirstOrDefault(x => x.Id == id));

    public Task<RoleViewModel> CreateRoleAsync(RoleUpsertModel model, CancellationToken cancellationToken = default)
    {
        ValidateRole(model);
        lock (_store.SyncRoot)
        {
            if (_store.Roles.Any(x => x.Code.Equals(model.Code, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Role code already exists.");
            EnsurePermissionIdsValid(model.PermissionIds);

            var row = new RoleViewModel
            {
                Id = Guid.NewGuid(),
                Code = model.Code.Trim(),
                Name = model.Name.Trim(),
                PermissionIds = model.PermissionIds.Distinct().ToList()
            };
            _store.Roles.Add(row);
            return Task.FromResult(row);
        }
    }

    public Task<RoleViewModel?> UpdateRoleAsync(Guid id, RoleUpsertModel model, CancellationToken cancellationToken = default)
    {
        ValidateRole(model);
        lock (_store.SyncRoot)
        {
            var row = _store.Roles.FirstOrDefault(x => x.Id == id);
            if (row is null) return Task.FromResult<RoleViewModel?>(null);
            if (_store.Roles.Any(x => x.Id != id && x.Code.Equals(model.Code, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Role code already exists.");
            EnsurePermissionIdsValid(model.PermissionIds);

            row.Code = model.Code.Trim();
            row.Name = model.Name.Trim();
            row.PermissionIds = model.PermissionIds.Distinct().ToList();
            return Task.FromResult<RoleViewModel?>(row);
        }
    }

    public Task<IReadOnlyCollection<UserViewModel>> GetUsersAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyCollection<UserViewModel>>(_store.Users.OrderBy(x => x.Email).ToList());

    public Task<UserViewModel?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(_store.Users.FirstOrDefault(x => x.Id == id));

    public Task<UserViewModel> CreateUserAsync(UserUpsertModel model, CancellationToken cancellationToken = default)
    {
        ValidateUser(model);
        lock (_store.SyncRoot)
        {
            if (_store.Users.Any(x => x.Email.Equals(model.Email, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("User email already exists.");
            EnsureRoleIdsValid(model.RoleIds);

            var row = new UserViewModel
            {
                Id = Guid.NewGuid(),
                BranchId = model.BranchId,
                FullName = model.FullName.Trim(),
                Email = model.Email.Trim().ToLowerInvariant(),
                IsAdmin = model.IsAdmin,
                IsActive = model.IsActive,
                RoleIds = model.RoleIds.Distinct().ToList()
            };
            _store.Users.Add(row);
            return Task.FromResult(row);
        }
    }

    public Task<UserViewModel?> UpdateUserAsync(Guid id, UserUpsertModel model, CancellationToken cancellationToken = default)
    {
        ValidateUser(model);
        lock (_store.SyncRoot)
        {
            var row = _store.Users.FirstOrDefault(x => x.Id == id);
            if (row is null) return Task.FromResult<UserViewModel?>(null);
            if (_store.Users.Any(x => x.Id != id && x.Email.Equals(model.Email, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("User email already exists.");
            EnsureRoleIdsValid(model.RoleIds);

            row.BranchId = model.BranchId;
            row.FullName = model.FullName.Trim();
            row.Email = model.Email.Trim().ToLowerInvariant();
            row.IsAdmin = model.IsAdmin;
            row.IsActive = model.IsActive;
            row.RoleIds = model.RoleIds.Distinct().ToList();
            return Task.FromResult<UserViewModel?>(row);
        }
    }

    private void SeedPermissions()
    {
        lock (_store.SyncRoot)
        {
            if (_store.Permissions.Count > 0) return;

            var keys = new[]
            {
                ("consignment", "view"), ("consignment", "create"), ("consignment", "edit"),
                ("challan", "view"), ("challan", "create"), ("challan", "payment"),
                ("invoice", "view"), ("invoice", "create"), ("invoice", "post"),
                ("receipt", "view"), ("receipt", "create"),
                ("report", "booking"), ("report", "lorry_payment"), ("report", "vehicle_payment"), ("report", "outstanding"),
                ("settings", "branch"), ("settings", "location"), ("settings", "customer"), ("settings", "driver"), ("settings", "vehicle"),
                ("users", "manage"), ("roles", "manage")
            };

            foreach (var (moduleCode, actionCode) in keys)
            {
                _store.Permissions.Add(new PermissionViewModel
                {
                    Id = Guid.NewGuid(),
                    ModuleCode = moduleCode,
                    ActionCode = actionCode
                });
            }
        }
    }

    private static void ValidateRole(RoleUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Code)) throw new ArgumentException("Role code is required.");
        if (string.IsNullOrWhiteSpace(model.Name)) throw new ArgumentException("Role name is required.");
    }

    private static void ValidateUser(UserUpsertModel model)
    {
        if (string.IsNullOrWhiteSpace(model.FullName)) throw new ArgumentException("Full name is required.");
        if (string.IsNullOrWhiteSpace(model.Email)) throw new ArgumentException("Email is required.");
    }

    private void EnsurePermissionIdsValid(IEnumerable<Guid> permissionIds)
    {
        var invalid = permissionIds.Any(id => _store.Permissions.All(p => p.Id != id));
        if (invalid) throw new ArgumentException("One or more permission IDs are invalid.");
    }

    private void EnsureRoleIdsValid(IEnumerable<Guid> roleIds)
    {
        var invalid = roleIds.Any(id => _store.Roles.All(r => r.Id != id));
        if (invalid) throw new ArgumentException("One or more role IDs are invalid.");
    }
}
