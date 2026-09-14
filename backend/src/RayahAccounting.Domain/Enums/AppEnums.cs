namespace RayahAccounting.Domain.Enums;

public enum InvoiceType
{
    StandardTaxInvoice = 1,      // فاتورة ضريبية (B2B)
    SimplifiedTaxInvoice = 2,    // فاتورة ضريبية مبسطة (B2C)
    DebitNote = 3,               // إشعار مدين
    CreditNote = 4,              // إشعار دائن
    PurchaseInvoice = 5          // فاتورة مشتريات
}

public enum VoucherType
{
    Receipt = 1,                 // سند قبض
    Payment = 2                  // سند صرف
}

public enum PaymentMethod
{
    Cash = 1,
    BankTransfer = 2,
    Mada = 3,
    CreditCard = 4,
    Cheque = 5
}

public enum AccountCategory
{
    Assets = 1,                  // أصول
    Liabilities = 2,             // خصوم / التزامات
    Equity = 3,                  // حقوق ملكية
    Revenues = 4,                // إيرادات
    Expenses = 5                 // مصروفات
}

public enum ZatcaPhase2Status
{
    Draft = 0,
    Reported = 1,                // إبلاغ (للفواتير المبسطة B2C)
    Cleared = 2,                 // اعتماد / ربط (للفواتير الضريبية B2B)
    Rejected = 3,
    NotApplicable = 4
}
