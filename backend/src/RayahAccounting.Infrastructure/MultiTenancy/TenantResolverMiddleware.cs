using Microsoft.AspNetCore.Http;
using RayahAccounting.Application.Interfaces;

namespace RayahAccounting.Infrastructure.MultiTenancy;

public class TenantService : ITenantService
{
    public string CurrentTenantId { get; private set; } = "tenant-1";

    public void SetCurrentTenant(string tenantId)
    {
        if (!string.IsNullOrWhiteSpace(tenantId))
        {
            CurrentTenantId = tenantId.Trim();
        }
    }
}

public class TenantResolverMiddleware
{
    private readonly RequestDelegate _next;
    public const string TenantHeaderKey = "X-Tenant-Id";

    public TenantResolverMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
    {
        if (context.Request.Headers.TryGetValue(TenantHeaderKey, out var tenantHeaderValues))
        {
            var tenantId = tenantHeaderValues.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(tenantId))
            {
                tenantService.SetCurrentTenant(tenantId);
            }
        }

        await _next(context);
    }
}
