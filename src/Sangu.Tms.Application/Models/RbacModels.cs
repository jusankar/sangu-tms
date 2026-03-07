namespace Sangu.Tms.Application.Models;

public sealed class PermissionViewModel
{
    public Guid Id { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string ActionCode { get; set; } = string.Empty;
}

public sealed class RoleUpsertModel
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<Guid> PermissionIds { get; set; } = new();
}

public sealed class RoleViewModel
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<Guid> PermissionIds { get; set; } = new();
}

public sealed class UserUpsertModel
{
    public Guid? BranchId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public bool IsActive { get; set; } = true;
    public List<Guid> RoleIds { get; set; } = new();
}

public sealed class UserViewModel
{
    public Guid Id { get; set; }
    public Guid? BranchId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public bool IsActive { get; set; }
    public List<Guid> RoleIds { get; set; } = new();
}

