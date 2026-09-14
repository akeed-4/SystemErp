using Microsoft.AspNetCore.Mvc;
using RayahAccounting.Domain.Entities;
using RayahAccounting.Infrastructure.Persistence;

namespace RayahAccounting.WebApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SubscriptionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("plans")]
    public IActionResult GetPlans()
    {
        var plans = new[]
        {
            new
            {
                Id = "starter",
                NameAr = "باقة البداية (Starter)",
                NameEn = "Starter Plan",
                PriceMonthly = 199,
                PriceYearly = 1990,
                MaxUsers = 2,
                MaxInvoices = 500,
                MaxBranches = 1,
                ZatcaPhase2 = "مبسطة (B2C)",
                IsPopular = false
            },
            new
            {
                Id = "professional",
                NameAr = "باقة الشركات المتقدمة (Professional)",
                NameEn = "Professional Business Plan",
                PriceMonthly = 499,
                PriceYearly = 4990,
                MaxUsers = 10,
                MaxInvoices = "غير محدود",
                MaxBranches = 3,
                ZatcaPhase2 = "شامل (B2B & B2C)",
                IsPopular = true
            },
            new
            {
                Id = "enterprise",
                NameAr = "باقة المؤسسات والمجموعات (Enterprise)",
                NameEn = "Enterprise Plan",
                PriceMonthly = 999,
                PriceYearly = 9990,
                MaxUsers = "غير محدود",
                MaxInvoices = "غير محدود",
                MaxBranches = "غير محدود",
                ZatcaPhase2 = "اعتماد فوري وربط API",
                IsPopular = false
            }
        };

        return Ok(plans);
    }

    [HttpGet("current")]
    public IActionResult GetCurrentSubscription([FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        return Ok(new
        {
            TenantId = tenantId ?? "tenant-1",
            PlanId = "professional",
            PlanNameAr = "باقة الشركات المتقدمة (Professional)",
            PlanNameEn = "Professional Business Plan",
            BillingCycle = "yearly",
            StartDate = "2026-01-01",
            ExpiryDate = "2027-01-01",
            DaysRemaining = 292,
            Status = "active",
            PaidAmount = 4990,
            PaymentMethod = "Mada",
            Usage = new
            {
                UsersCount = 2,
                MaxUsers = 10,
                InvoicesThisMonth = 48,
                BranchesCount = 1,
                MaxBranches = 3
            }
        });
    }

    [HttpPost("upgrade")]
    public IActionResult UpgradePlan([FromBody] UpgradePlanRequest request, [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        return Ok(new
        {
            Success = true,
            Message = $"تم ترقية اشتراك المنشأة إلى '{request.PlanId}' بنجاح!",
            NewPlanId = request.PlanId,
            BillingCycle = request.BillingCycle,
            TransactionRef = $"TXN-UPG-{Guid.NewGuid().ToString()[..8].ToUpper()}"
        });
    }
}

public class UpgradePlanRequest
{
    public string PlanId { get; set; } = "professional";
    public string BillingCycle { get; set; } = "yearly";
    public string PaymentMethod { get; set; } = "Mada";
}
