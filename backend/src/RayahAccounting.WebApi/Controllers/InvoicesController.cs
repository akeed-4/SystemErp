using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RayahAccounting.Application.Interfaces;
using RayahAccounting.Application.Invoices;
using RayahAccounting.Domain.Entities;
using RayahAccounting.Infrastructure.Persistence;

namespace RayahAccounting.WebApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantService _tenantService;

    public InvoicesController(ApplicationDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    /// <summary>
    /// جلب الفواتير المعزولة للمستأجر الحالي
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetInvoices()
    {
        var invoices = await _context.Invoices
            .Include(i => i.Items)
            .OrderByDescending(i => i.IssueDate)
            .ToListAsync();

        return Ok(new
        {
            TenantId = _tenantService.CurrentTenantId,
            Timestamp = DateTime.UtcNow,
            TotalRecords = invoices.Count,
            Data = invoices
        });
    }

    /// <summary>
    /// إنشاء فاتورة مبيعات أو مشتريات جديدة
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequestDto dto)
    {
        var invoiceCount = await _context.Invoices.CountAsync();
        var nextNumber = $"INV-{DateTime.UtcNow.Year}-{(invoiceCount + 1):D4}";

        var invoice = new Invoice
        {
            InvoiceNumber = nextNumber,
            Type = dto.Type,
            IssueDate = DateTime.UtcNow,
            PartyName = dto.PartyName,
            PartyVatNumber = dto.PartyVatNumber,
            PartyAddress = dto.PartyAddress,
            TenantId = _tenantService.CurrentTenantId,
        };

        decimal subtotal = 0;
        decimal vatTotal = 0;

        foreach (var item in dto.Items)
        {
            var lineSubtotal = (item.Quantity * item.UnitPrice) - item.DiscountAmount;
            var lineVat = Math.Round(lineSubtotal * (item.VatRatePercent / 100m), 2);

            invoice.Items.Add(new InvoiceItem
            {
                ProductId = item.ProductId,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountAmount = item.DiscountAmount,
                VatRatePercent = item.VatRatePercent,
                TenantId = _tenantService.CurrentTenantId
            });

            subtotal += lineSubtotal;
            vatTotal += lineVat;
        }

        invoice.Subtotal = subtotal;
        invoice.VatTotal = vatTotal;
        invoice.GrandTotal = subtotal + vatTotal;

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInvoices), new { id = invoice.Id }, invoice);
    }
}
