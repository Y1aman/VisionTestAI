using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VisionTestAI.Domain.Interfaces;
using VisionTestAI.Infrastructure.Data;

namespace VisionTestAI.Api.Middleware;

/// <summary>
/// Resolves tenant context from JWT claims for every authenticated request.
/// </summary>
public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantIdClaim = context.User.FindFirst("tenantId")?.Value;
            var tenantSlug = context.User.FindFirst("tenantSlug")?.Value ?? "";
            var plan = context.User.FindFirst("plan")?.Value ?? "free";

            if (Guid.TryParse(tenantIdClaim, out var tenantId))
            {
                tenantContext.SetTenant(tenantId, tenantSlug, plan);
            }
        }

        await _next(context);
    }
}
