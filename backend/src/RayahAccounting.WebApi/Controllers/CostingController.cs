using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RayahAccounting.Application.Costing;
using RayahAccounting.Application.Interfaces;
using RayahAccounting.Infrastructure.Persistence;

namespace RayahAccounting.WebApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class CostingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantService _tenantService;

    public CostingController(ApplicationDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCostingSummary()
    {
        var products = await _context.Products.ToListAsync();

        return Ok(new
        {
            TenantId = _tenantService.CurrentTenantId,
            CostingMethod = "Weighted Moving Average (المتوسط المرجح المتحرك)",
            Currency = "SAR",
            Products = products
        });
    }

    [HttpPost("calculate-moving-average")]
    public IActionResult CalculateMovingAverage(
        [FromQuery] decimal currentStock,
        [FromQuery] decimal currentAvgCost,
        [FromQuery] decimal incomingQty,
        [FromQuery] decimal purchasePrice)
    {
        var newCost = MovingAverageCalculator.CalculateNewAverageCost(
            currentStock, currentAvgCost, incomingQty, purchasePrice);

        return Ok(new
        {
            PreviousStock = currentStock,
            PreviousAverageCost = currentAvgCost,
            IncomingQuantity = incomingQty,
            PurchasePrice = purchasePrice,
            NewWeightedAverageCost = newCost,
            NewTotalStock = currentStock + incomingQty
        });
    }
}
