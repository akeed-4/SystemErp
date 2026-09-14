using RayahAccounting.Domain.Common;

namespace RayahAccounting.Domain.Entities;

public class InvoiceItem : BaseEntity, ITenantEntity
{
    public string TenantId { get; set; } = string.Empty;
    public string InvoiceId { get; set; } = string.Empty;
    public Invoice? Invoice { get; set; }
    public string? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; } = 0m;
    public decimal VatRatePercent { get; set; } = 15m;           // 15% ضريبة القيمة المضافة
    public decimal Subtotal => (Quantity * UnitPrice) - DiscountAmount;
    public decimal VatAmount => Math.Round(Subtotal * (VatRatePercent / 100m), 2);
    public decimal LineTotal => Subtotal + VatAmount;
    public decimal CostPriceAtSale { get; set; } = 0m;           // تكلفة الوحدة لحظة البيع
}
