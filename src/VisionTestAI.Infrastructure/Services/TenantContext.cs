using VisionTestAI.Domain.Interfaces;

namespace VisionTestAI.Infrastructure.Services;

/// <summary>
/// Scoped service holding the resolved tenant context for the current request.
/// </summary>
public class TenantContext : ITenantContext
{
    public Guid TenantId { get; private set; }
    public string TenantSlug { get; private set; } = string.Empty;
    public string Plan { get; private set; } = "free";

    public void SetTenant(Guid tenantId, string slug, string plan)
    {
        TenantId = tenantId;
        TenantSlug = slug;
        Plan = plan;
    }
}
