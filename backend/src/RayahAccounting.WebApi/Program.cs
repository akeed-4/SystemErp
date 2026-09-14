using Microsoft.EntityFrameworkCore;
using RayahAccounting.Application.Interfaces;
using RayahAccounting.Infrastructure.MultiTenancy;
using RayahAccounting.Infrastructure.Persistence;
using RayahAccounting.Infrastructure.Zatca;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "نظام الراية المحاسبي - .NET 9 Web API", Version = "v1" });
});

// إعداد خدمة تعدد المستأجرين (Scoped لكل طلب HTTP)
builder.Services.AddScoped<ITenantService, TenantService>();

// إعداد Entity Framework Core مع SQL Server / In-Memory
builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString);
});

// ربط واجهة IApplicationDbContext بقاعدة البيانات
builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

// تسجيل خدمات ZATCA
builder.Services.AddScoped<IZatcaPhase2Service, ZatcaPhase2Service>();

// سياسة CORS للسماح لتطبيق Angular بالاتصال
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Rayah ERP API v1"));
}

app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");

// تطبيق وسيط عزل المستأجرين TenantResolverMiddleware لقراءة ترويسة X-Tenant-Id
app.UseMiddleware<TenantResolverMiddleware>();

app.UseAuthorization();
app.MapControllers();

app.Run();
