using RayahAccounting.Domain.Common;

namespace RayahAccounting.Domain.Entities;

public enum SubscriptionPlanType
{
    Starter = 1,      // باقة البداية
    Professional = 2, // باقة الشركات المتقدمة (الأكثر طلباً)
    Enterprise = 3    // باقة المؤسسات والمجموعات
}

public enum BillingCycle
{
    Monthly = 1,
    Yearly = 2
}

public enum SubscriptionStatus
{
    Active = 1,
    Trial = 2,
    Expired = 3,
    Suspended = 4
}

public class Subscription : BaseEntity
{
    public Guid TenantId { get; set; }
    public SubscriptionPlanType PlanType { get; set; }
    public string PlanNameAr { get; set; } = string.Empty;
    public string PlanNameEn { get; set; } = string.Empty;
    public BillingCycle BillingCycle { get; set; }
    public decimal Price { get; set; }
    public decimal VatAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public SubscriptionStatus Status { get; set; }
    public string PaymentMethod { get; set; } = "Mada";
    public string TransactionReference { get; set; } = string.Empty;
    public bool AutoRenew { get; set; } = true;
    public int MaxUsers { get; set; } = 10;
    public int MaxBranches { get; set; } = 3;
    public bool ZatcaPhase2Enabled { get; set; } = true;
}
