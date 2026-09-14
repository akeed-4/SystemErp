using RayahAccounting.Domain.Common;

namespace RayahAccounting.Domain.Entities;

public enum UserRole
{
    Owner = 1,
    GeneralManager = 2,
    ChiefAccountant = 3,
    SalesRep = 4
}

public class User : BaseEntity
{
    public Guid TenantId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Owner;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
}
