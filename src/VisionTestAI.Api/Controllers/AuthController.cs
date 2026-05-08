using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VisionTestAI.Application.Common.Interfaces;
using VisionTestAI.Application.Common.Models;

namespace VisionTestAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IIdentityService _identityService;

    public AuthController(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken ct)
    {
        var result = await _identityService.RegisterAsync(dto, ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { result.Error, result.ErrorAr });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        var result = await _identityService.LoginAsync(dto, ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { result.Error, result.ErrorAr });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto, CancellationToken ct)
    {
        var result = await _identityService.RefreshTokenAsync(dto, ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { result.Error, result.ErrorAr });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId is null) return Unauthorized();

        var result = await _identityService.GetCurrentUserAsync(userId, ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { result.Error, result.ErrorAr });
    }
}
