using Microsoft.EntityFrameworkCore;
using RayahAccounting.Application.Interfaces;
using RayahAccounting.Domain.Common;
using RayahAccounting.Domain.Entities;

namespace RayahAccounting.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ITenantService _tenantService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantService tenantService) : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Voucher> Vouchers => Set<Voucher>();
    public DbSet<Product> Products => Set<Product>();

    IQueryable<Tenant> IApplicationDbContext.Tenants => Tenants;
    IQueryable<Account> IApplicationDbContext.Accounts => Accounts;
    IQueryable<Invoice> IApplicationDbContext.Invoices => Invoices;
    IQueryable<InvoiceItem> IApplicationDbContext.InvoiceItems => InvoiceItems;
    IQueryable<Voucher> IApplicationDbContext.Vouchers => Vouchers;
    IQueryable<Product> IApplicationDbContext.Products => Products;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // تطبيق فلتر تعدد المستأجرين التلقائي (Global Multi-Tenant Query Filter)
        // يعزل بيانات كل شركة/منشأة تلقائياً عن الشركات الأخرى
        modelBuilder.Entity<Account>()
            .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.CurrentTenantId);

        modelBuilder.Entity<Invoice>()
            .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.CurrentTenantId);

        modelBuilder.Entity<InvoiceItem>()
            .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.CurrentTenantId);

        modelBuilder.Entity<Voucher>()
            .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.CurrentTenantId);

        modelBuilder.Entity<Product>()
            .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.CurrentTenantId);

        // إعدادات القيود والأعمدة المالية
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(i => new { i.TenantId, i.InvoiceNumber }).IsUnique();
            entity.Property(i => i.Subtotal).HasPrecision(18, 2);
            entity.Property(i => i.VatTotal).HasPrecision(18, 2);
            entity.Property(i => i.GrandTotal).HasPrecision(18, 2);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // ملء TenantId وتواريخ التدقيق تلقائياً عند الإضافة
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            if (entry.State == EntityState.Added && string.IsNullOrWhiteSpace(entry.Entity.TenantId))
            {
                entry.Entity.TenantId = _tenantService.CurrentTenantId;
            }
        }

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
