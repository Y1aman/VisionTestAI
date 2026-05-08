using Microsoft.AspNetCore.Identity;
using VisionTestAI.Domain.Enums;

namespace VisionTestAI.Domain.Entities;

/// <summary>
/// Application user extending ASP.NET Core Identity with tenant-awareness.
/// </summary>
public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Tester;
    public Guid TenantId { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public string PreferredLanguage { get; set; } = "en"; // en, ar
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
