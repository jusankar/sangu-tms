using System.Security.Claims;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryAuthService : IAuthService
{
    private readonly InMemoryDataStore _store;

    public InMemoryAuthService(InMemoryDataStore store)
    {
        _store = store;
        SeedDefaultAdmin();
    }

    public Task<LoginResponseModel?> LoginAsync(LoginRequestModel request, CancellationToken cancellationToken = default)
    {
        lock (_store.SyncRoot)
        {
            var user = _store.Users.FirstOrDefault(x =>
                x.Email.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase) && x.IsActive);
            if (user is null) return Task.FromResult<LoginResponseModel?>(null);

            if (!_store.UserPasswords.TryGetValue(user.Id, out var password) ||
                !string.Equals(password, request.Password, StringComparison.Ordinal))
            {
                return Task.FromResult<LoginResponseModel?>(null);
            }

            var permissions = GetUserPermissions(user);
            var token = Guid.NewGuid().ToString("N");
            _store.Tokens[token] = user.Id;

            return Task.FromResult<LoginResponseModel?>(new LoginResponseModel
            {
                AccessToken = token,
                UserId = user.Id,
                FullName = user.FullName,
                IsAdmin = user.IsAdmin,
                Permissions = permissions
            });
        }
    }

    public Task<ClaimsPrincipal?> ValidateTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        lock (_store.SyncRoot)
        {
            if (!_store.Tokens.TryGetValue(token, out var userId))
            {
                return Task.FromResult<ClaimsPrincipal?>(null);
            }

            var user = _store.Users.FirstOrDefault(x => x.Id == userId && x.IsActive);
            if (user is null) return Task.FromResult<ClaimsPrincipal?>(null);

            var permissions = GetUserPermissions(user);
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.FullName),
                new(ClaimTypes.Email, user.Email),
                new("is_admin", user.IsAdmin.ToString().ToLowerInvariant())
            };
            claims.AddRange(permissions.Select(p => new Claim("permission", p)));

            var identity = new ClaimsIdentity(claims, "Bearer");
            var principal = new ClaimsPrincipal(identity);
            return Task.FromResult<ClaimsPrincipal?>(principal);
        }
    }

    public Task<CurrentUserModel?> GetCurrentUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default)
    {
        var idValue = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(idValue, out var userId))
        {
            return Task.FromResult<CurrentUserModel?>(null);
        }

        lock (_store.SyncRoot)
        {
            var user = _store.Users.FirstOrDefault(x => x.Id == userId);
            if (user is null) return Task.FromResult<CurrentUserModel?>(null);

            var response = new CurrentUserModel
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                IsAdmin = user.IsAdmin,
                Permissions = GetUserPermissions(user)
            };
            return Task.FromResult<CurrentUserModel?>(response);
        }
    }

    private List<string> GetUserPermissions(UserViewModel user)
    {
        if (user.IsAdmin)
        {
            return _store.Permissions
                .Select(p => $"{p.ModuleCode}.{p.ActionCode}")
                .Distinct()
                .OrderBy(x => x)
                .ToList();
        }

        var rolePermissionIds = _store.Roles
            .Where(r => user.RoleIds.Contains(r.Id))
            .SelectMany(r => r.PermissionIds)
            .Distinct()
            .ToList();

        return _store.Permissions
            .Where(p => rolePermissionIds.Contains(p.Id))
            .Select(p => $"{p.ModuleCode}.{p.ActionCode}")
            .Distinct()
            .OrderBy(x => x)
            .ToList();
    }

    private void SeedDefaultAdmin()
    {
        lock (_store.SyncRoot)
        {
            if (_store.Users.Count > 0) return;

            var admin = new UserViewModel
            {
                Id = Guid.NewGuid(),
                BranchId = null,
                FullName = "System Admin",
                Email = "admin@sangu.local",
                IsAdmin = true,
                IsActive = true,
                RoleIds = new List<Guid>()
            };
            _store.Users.Add(admin);
            _store.UserPasswords[admin.Id] = "Admin@123";
        }
    }
}
