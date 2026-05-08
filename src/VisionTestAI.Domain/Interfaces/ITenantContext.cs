namespace VisionTestAI.Domain.Interfaces;

/// <summary>
/// Provides the current tenant context resolved from the incoming request.
/// </summary>
public interface ITenantContext
{
    Guid TenantId { get; }
    string TenantSlug { get; }
    string Plan { get; }
    void SetTenant(Guid tenantId, string slug, string plan);
}
