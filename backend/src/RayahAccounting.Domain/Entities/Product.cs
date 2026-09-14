using RayahAccounting.Domain.Common;

namespace RayahAccounting.Domain.Entities;

public class Product : BaseEntity, ITenantEntity
{
    public string TenantId { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;             // رمز الصنف
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Unit { get; set; } = "PCS";                   // حبة / متر / طن
    public decimal CurrentStock { get; set; } = 0m;
    public decimal WeightedAverageCost { get; set; } = 0m;      // متوسط التكلفة المرجح المتحرك
    public decimal LastPurchaseCost { get; set; } = 0m;
    public decimal SellingPrice { get; set; } = 0m;
    public decimal MinimumStockAlert { get; set; } = 5m;
    public decimal TotalStockValuation => Math.Round(CurrentStock * WeightedAverageCost, 2);
}
