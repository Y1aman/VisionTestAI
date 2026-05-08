using VisionTestAI.Application.Common.Models;

namespace VisionTestAI.Application.Common.Interfaces;

/// <summary>
/// Identity service abstraction for auth operations.
/// </summary>
public interface IIdentityService
{
    Task<Result<AuthResponseDto>> RegisterAsync(RegisterDto dto, CancellationToken ct = default);
    Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<Result<AuthResponseDto>> RefreshTokenAsync(RefreshTokenDto dto, CancellationToken ct = default);
    Task<Result<UserDto>> GetCurrentUserAsync(string userId, CancellationToken ct = default);
}
