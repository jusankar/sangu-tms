using System.Security.Claims;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseModel?> LoginAsync(LoginRequestModel request, CancellationToken cancellationToken = default);
    Task<ClaimsPrincipal?> ValidateTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<CurrentUserModel?> GetCurrentUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default);
}

