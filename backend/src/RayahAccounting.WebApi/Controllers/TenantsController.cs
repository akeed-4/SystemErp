using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RayahAccounting.Infrastructure.Persistence;

namespace RayahAccounting.WebApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TenantsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTenants()
    {
        var tenants = await _context.Tenants
            .Where(t => t.IsActive)
            .Select(t => new
            {
                t.Id,
                t.NameAr,
                t.NameEn,
                t.VatNumber,
                t.CommercialRegistration,
                t.Address
            })
            .ToListAsync();

        return Ok(tenants);
    }
}
