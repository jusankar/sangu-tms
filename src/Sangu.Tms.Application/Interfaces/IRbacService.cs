using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IRbacService
{
    Task<IReadOnlyCollection<PermissionViewModel>> GetPermissionsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<RoleViewModel>> GetRolesAsync(CancellationToken cancellationToken = default);
    Task<RoleViewModel?> GetRoleByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RoleViewModel> CreateRoleAsync(RoleUpsertModel model, CancellationToken cancellationToken = default);
    Task<RoleViewModel?> UpdateRoleAsync(Guid id, RoleUpsertModel model, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<UserViewModel>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<UserViewModel?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserViewModel> CreateUserAsync(UserUpsertModel model, CancellationToken cancellationToken = default);
    Task<UserViewModel?> UpdateUserAsync(Guid id, UserUpsertModel model, CancellationToken cancellationToken = default);
}

