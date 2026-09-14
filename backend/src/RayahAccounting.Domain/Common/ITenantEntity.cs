namespace RayahAccounting.Domain.Common;

/// <summary>
/// علامة لتمييز الكيانات الخاصة بالمستأجر لعزلها تلقائياً على مستوى EF Core
/// </summary>
public interface ITenantEntity
{
    public string TenantId { get; set; }
}
