using RayahAccounting.Domain.Common;
using RayahAccounting.Domain.Enums;

namespace RayahAccounting.Domain.Entities;

public class Invoice : BaseEntity, ITenantEntity
{
    public string TenantId { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;   // e.g. "INV-2026-0001"
    public string Uuid { get; set; } = Guid.NewGuid().ToString(); // مطلوب لـ ZATCA
    public InvoiceType Type { get; set; } = InvoiceType.StandardTaxInvoice;
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    
    // بيانات الطرف الآخر (العميل أو المورد)
    public string PartyName { get; set; } = string.Empty;
    public string? PartyVatNumber { get; set; }
    public string? PartyCrNumber { get; set; }
    public string? PartyAddress { get; set; }

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();

    public decimal Subtotal { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal VatTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal TotalCost { get; set; }
    public decimal GrossProfit => GrandTotal - VatTotal - TotalCost;

    // حقول المرحلة الثانية من هيئة الزكاة (ZATCA Phase 2)
    public string? PreviousInvoiceHash { get; set; }            // PIH سلسلة الهاش
    public string? InvoiceHashSha256 { get; set; }              // SHA-256 Digest
    public string? DigitalSignatureEcdsa { get; set; }          // التوقيع الرقمي
    public string? QrCodeTlvBase64 { get; set; }                // الباركود المرمز TLV
    public ZatcaPhase2Status ZatcaStatus { get; set; } = ZatcaPhase2Status.Draft;
    public string? ZatcaComplianceReference { get; set; }
}
