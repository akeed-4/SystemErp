# Rayah Accounting ERP - .NET 9 Clean Architecture Backend

حل متكامل ومؤسسي لإدارة الموارد المحاسبية ومبيعات التجزئة والجملة، متوافق كلياً مع متطلبات **هيئة الزكاة والضريبة والجمارك (ZATCA) - المرحلة الثانية (الربط والتكامل)**.

---

## المعمارية المعيارية (Clean Architecture Structure)

```text
backend/
├── RayahAccounting.sln
└── src/
    ├── RayahAccounting.Domain/            # طبقة الكيانات وقواعد الأعمال المجردة (Enterprise Rules)
    │   ├── Common/                        # BaseEntity & ITenantEntity
    │   ├── Entities/                      # Tenant, Account, Invoice, Voucher, Product
    │   └── Enums/                         # InvoiceType, VoucherType, ZatcaStatus
    │
    ├── RayahAccounting.Application/       # منطق التطبيق وحالات الاستخدام (CQRS / Services)
    │   ├── Interfaces/                    # IApplicationDbContext, ITenantService
    │   ├── Costing/                       # Moving Average Costing Calculator
    │   └── Invoices/                      # DTOs & Commands
    │
    ├── RayahAccounting.Infrastructure/    # البنية التحتية والاتصال الخارجي (EF Core & ZATCA)
    │   ├── Persistence/                   # ApplicationDbContext مع Global Multi-Tenant Filter
    │   ├── MultiTenancy/                  # TenantResolverMiddleware (X-Tenant-Id)
    │   └── Zatca/                         # UBL 2.1 XML Generator, ECDSA Signing & QR Code
    │
    └── RayahAccounting.WebApi/            # طبقة العرض والواجهات البرمجية (RESTful API)
        ├── Controllers/                   # Invoices, Vouchers, Costing, Zatca, Tenants
        ├── Program.cs                     # Dependency Injection & Middleware Pipeline
        └── appsettings.json               # إعدادات قواعد البيانات و ZATCA Portal
```

---

## متطلبات التشغيل (Requirements)
- .NET 9 SDK أو .NET 8 SDK
- SQL Server أو PostgreSQL

## أوامر التشغيل السريع (CLI Commands)

```bash
# الانتقال لمجلد الباك إند
cd backend

# استرجاع حزم NuGet
dotnet restore

# بناء المشروع بالكامل
dotnet build

# تشغيل خادم الـ Web API
dotnet run --project src/RayahAccounting.WebApi
```
