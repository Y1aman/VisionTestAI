using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using VisionTestAI.Application.Common.Interfaces;
using VisionTestAI.Application.Common.Models;
using VisionTestAI.Domain.Entities;
using VisionTestAI.Domain.Enums;
using VisionTestAI.Infrastructure.Data;

namespace VisionTestAI.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public IdentityService(UserManager<AppUser> userManager, AppDbContext db, IConfiguration config)
    {
        _userManager = userManager;
        _db = db;
        _config = config;
    }

    public async Task<Result<AuthResponseDto>> RegisterAsync(RegisterDto dto, CancellationToken ct = default)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing is not null)
            return Result<AuthResponseDto>.Failure("Email already registered", "البريد الإلكتروني مسجل بالفعل");

        // Create tenant
        var tenant = new Tenant
        {
            Name = dto.TenantName,
            Slug = dto.TenantName.ToLowerInvariant().Replace(" ", "-") + "-" + Guid.NewGuid().ToString("N")[..6],
            Plan = "free", MaxMonthlyTests = 50
        };
        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync(ct);

        var user = new AppUser
        {
            Email = dto.Email, UserName = dto.Email,
            FullName = dto.FullName, TenantId = tenant.Id,
            Role = UserRole.Admin,
            PreferredLanguage = dto.PreferredLanguage
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result<AuthResponseDto>.Failure(errors);
        }

        return await GenerateAuthResponse(user, tenant);
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return Result<AuthResponseDto>.Failure("Invalid credentials", "بيانات الدخول غير صحيحة", 401);

        var tenant = await _db.Tenants.FindAsync(new object[] { user.TenantId }, ct);
        if (tenant is null)
            return Result<AuthResponseDto>.Failure("Tenant not found", "لم يتم العثور على المنظمة", 404);

        return await GenerateAuthResponse(user, tenant);
    }

    public async Task<Result<AuthResponseDto>> RefreshTokenAsync(RefreshTokenDto dto, CancellationToken ct = default)
    {
        var principal = GetPrincipalFromExpiredToken(dto.Token);
        var userId = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId is null)
            return Result<AuthResponseDto>.Failure("Invalid token", "رمز غير صالح", 401);

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null || user.RefreshToken != dto.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return Result<AuthResponseDto>.Failure("Invalid refresh token", "رمز التحديث غير صالح", 401);

        var tenant = await _db.Tenants.FindAsync(new object[] { user.TenantId }, ct);
        return await GenerateAuthResponse(user, tenant!);
    }

    public async Task<Result<UserDto>> GetCurrentUserAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Result<UserDto>.Failure("User not found", "لم يتم العثور على المستخدم", 404);

        var tenant = await _db.Tenants.FindAsync(new object[] { user.TenantId }, ct);
        return Result<UserDto>.Success(new UserDto(
            user.Id, user.Email!, user.FullName, user.Role.ToString(),
            user.TenantId, tenant?.Name ?? "", user.PreferredLanguage));
    }

    private async Task<Result<AuthResponseDto>> GenerateAuthResponse(AppUser user, Tenant tenant)
    {
        var token = GenerateJwtToken(user, tenant);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return Result<AuthResponseDto>.Success(new AuthResponseDto(
            token, refreshToken, DateTime.UtcNow.AddHours(12),
            new UserDto(user.Id, user.Email!, user.FullName, user.Role.ToString(),
                user.TenantId, tenant.Name, user.PreferredLanguage)));
    }

    private string GenerateJwtToken(AppUser user, Tenant tenant)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("tenantId", user.TenantId.ToString()),
            new Claim("tenantSlug", tenant.Slug),
            new Claim("plan", tenant.Plan),
            new Claim("lang", user.PreferredLanguage)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"], audience: _config["Jwt:Audience"],
            claims: claims, expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var validation = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidateAudience = true,
            ValidIssuer = _config["Jwt:Issuer"], ValidAudience = _config["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)),
            ValidateLifetime = false
        };

        var handler = new JwtSecurityTokenHandler();
        try { return handler.ValidateToken(token, validation, out _); }
        catch { return null; }
    }
}
