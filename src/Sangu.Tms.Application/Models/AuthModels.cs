namespace Sangu.Tms.Application.Models;

public sealed class LoginRequestModel
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? TenantCode { get; set; }
}

public sealed class LoginResponseModel
{
    public string AccessToken { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public List<string> Permissions { get; set; } = new();
}

public sealed class CurrentUserModel
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public List<string> Permissions { get; set; } = new();
}

