using RayahAccounting.Domain.Common;
using RayahAccounting.Domain.Enums;

namespace RayahAccounting.Domain.Entities;

public class Voucher : BaseEntity, ITenantEntity
{
    public string TenantId { get; set; } = string.Empty;
    public string VoucherNumber { get; set; } = string.Empty;   // RV-2026-0001 أو PV-2026-0001
    public VoucherType Type { get; set; } = VoucherType.Receipt;
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public string AmountInWordsAr { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;
    public string? ReferenceNumber { get; set; }                // رقم الحوالة أو الشيك
    public string? TreasuryAccountId { get; set; }              // حساب البنك أو الصندوق
    public string? PartyAccountId { get; set; }                 // حساب العميل أو المورد أو المصروف
    public string Description { get; set; } = string.Empty;
    public bool IsPosted { get; set; } = true;
}
