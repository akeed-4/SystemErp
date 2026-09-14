using RayahAccounting.Domain.Common;
using RayahAccounting.Domain.Enums;

namespace RayahAccounting.Domain.Entities;

public class Account : BaseEntity, ITenantEntity
{
    public string TenantId { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;             // e.g., "1101", "4101"
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public AccountCategory Category { get; set; }
    public string? ParentAccountId { get; set; }
    public Account? ParentAccount { get; set; }
    public int Level { get; set; } = 1;
    public decimal DebitBalance { get; set; } = 0m;
    public decimal CreditBalance { get; set; } = 0m;
    public decimal CurrentBalance => (Category == AccountCategory.Assets || Category == AccountCategory.Expenses)
        ? DebitBalance - CreditBalance
        : CreditBalance - DebitBalance;
    public bool IsSubAccount { get; set; } = false;
}
