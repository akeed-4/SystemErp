using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RayahAccounting.Domain.Enums;
using RayahAccounting.Infrastructure.Persistence;
using RayahAccounting.Infrastructure.Zatca;

namespace RayahAccounting.WebApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ZatcaController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IZatcaPhase2Service _zatcaService;

    public ZatcaController(ApplicationDbContext context, IZatcaPhase2Service zatcaService)
    {
        _context = context;
        _zatcaService = zatcaService;
    }

    [HttpPost("clearance/{invoiceId}")]
    public async Task<IActionResult> ClearInvoice(string invoiceId)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId);
        if (invoice == null)
            return NotFound(new { Message = "Invoice not found." });

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == invoice.TenantId);
        if (tenant == null)
            return BadRequest(new { Message = "Tenant not found." });

        // إنشاء الهاش والتوقيع الرقمي والـ QR Code
        invoice.InvoiceHashSha256 = _zatcaService.GenerateSha256InvoiceHash(invoice.InvoiceNumber + invoice.GrandTotal);
        invoice.QrCodeTlvBase64 = _zatcaService.GenerateTlvQrCodeBase64(tenant, invoice);

        var complianceResult = await _zatcaService.SubmitInvoiceToZatcaAsync(invoice, tenant);
        invoice.ZatcaStatus = ZatcaPhase2Status.Cleared;
        invoice.ZatcaComplianceReference = complianceResult.ComplianceReference;

        await _context.SaveChangesAsync();

        return Ok(complianceResult);
    }
}
