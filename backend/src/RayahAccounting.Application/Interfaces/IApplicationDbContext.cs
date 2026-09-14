using RayahAccounting.Domain.Entities;

namespace RayahAccounting.Application.Interfaces;

public interface IApplicationDbContext
{
    IQueryable<Tenant> Tenants { get; }
    IQueryable<Account> Accounts { get; }
    IQueryable<Invoice> Invoices { get; }
    IQueryable<InvoiceItem> InvoiceItems { get; }
    IQueryable<Voucher> Vouchers { get; }
    IQueryable<Product> Products { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
