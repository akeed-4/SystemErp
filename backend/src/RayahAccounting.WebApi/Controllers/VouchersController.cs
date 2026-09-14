using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RayahAccounting.Application.Interfaces;
using RayahAccounting.Domain.Entities;
using RayahAccounting.Infrastructure.Persistence;

namespace RayahAccounting.WebApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class VouchersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantService _tenantService;

    public VouchersController(ApplicationDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetVouchers()
    {
        var vouchers = await _context.Vouchers
            .OrderByDescending(v => v.Date)
            .ToListAsync();

        return Ok(new
        {
            TenantId = _tenantService.CurrentTenantId,
            Timestamp = DateTime.UtcNow,
            TotalRecords = vouchers.Count,
            Data = vouchers
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateVoucher([FromBody] Voucher voucher)
    {
        voucher.TenantId = _tenantService.CurrentTenantId;
        _context.Vouchers.Add(voucher);
        await _context.SaveChangesAsync();

        return Ok(voucher);
    }
}
