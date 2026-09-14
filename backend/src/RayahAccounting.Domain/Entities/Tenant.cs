using RayahAccounting.Domain.Common;

namespace RayahAccounting.Domain.Entities;

public class Tenant : BaseEntity
{
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string VatNumber { get; set; } = string.Empty;       // 15 خانة تبدأ وتنتهي بـ 3
    public string CommercialRegistration { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = "Riyadh";
    public string PostalCode { get; set; } = "12345";
    public string BuildingNumber { get; set; } = "1000";
    public bool IsActive { get; set; } = true;
    public string? ZatcaCsidCertificate { get; set; }
    public string? ZatcaCsidSecret { get; set; }
}
