import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ErpService} from '../../core/services/erp.service';
import {DataGridComponent, DataGridColumn} from '../../shared/components/data-grid/data-grid.component';
import {ProductItem, StockMovement} from '../../core/models/erp.models';

@Component({
  selector: 'app-costing',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  templateUrl: './costing.component.html',
  styleUrl: './costing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostingComponent {
  public erpService = inject(ErpService);

  // Cost Simulator interactive parameters
  public simSelectedProductId = signal<string>('prod-1');
  public simNewQuantity = signal<number>(10);
  public simNewPurchasePrice = signal<number>(15200);

  public productColumns: DataGridColumn<ProductItem>[] = [
    { field: 'sku', caption: 'رمز SKU', width: '120px', sortable: true },
    { field: 'nameAr', caption: 'اسم الصنف', sortable: true },
    { field: 'category', caption: 'التصنيف', width: '130px', sortable: true },
    { field: 'currentStock', caption: 'الرصيد الحالي', width: '100px', format: 'number', alignment: 'center', sortable: true },
    { field: 'averageCost', caption: 'متوسط التكلفة المرجح', format: 'currency', alignment: 'left', sortable: true },
    { field: 'lastPurchaseCost', caption: 'آخر سعر شراء', format: 'currency', alignment: 'left', sortable: true },
    { field: 'sellingPrice', caption: 'سعر البيع', format: 'currency', alignment: 'left', sortable: true },
    {
      field: 'margin',
      caption: 'هامش الربح %',
      width: '100px',
      format: 'badge',
      render: (p: ProductItem) => {
        const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.averageCost) / p.sellingPrice) * 100 : 0;
        return margin.toFixed(1) + '%';
      },
      badgeClass: (_val, p: ProductItem) => {
        const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.averageCost) / p.sellingPrice) * 100 : 0;
        if (margin > 25) return 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold';
        if (margin > 15) return 'bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-xs font-bold';
        return 'bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold';
      }
    }
  ];

  public movementColumns: DataGridColumn<StockMovement>[] = [
    { field: 'date', caption: 'التاريخ', width: '100px', sortable: true },
    { field: 'referenceNumber', caption: 'رقم المرجع', width: '130px', sortable: true },
    { field: 'itemName', caption: 'الصنف', sortable: true },
    {
      field: 'type',
      caption: 'نوع الحركة',
      width: '120px',
      format: 'badge',
      badgeClass: (val) =>
        val === 'in_purchase'
          ? 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-semibold'
          : 'bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-semibold',
    },
    { field: 'quantity', caption: 'الكمية', width: '90px', format: 'number', alignment: 'center', sortable: true },
    { field: 'unitCost', caption: 'تكلفة الوحدة', format: 'currency', alignment: 'left', sortable: true },
    { field: 'remainingStock', caption: 'الرصيد المتبقي', width: '110px', format: 'number', alignment: 'center' },
  ];

  // Simulator computed results
  public simProduct = computed(() => {
    return this.erpService.products().find((p) => p.id === this.simSelectedProductId()) || this.erpService.products()[0];
  });

  public simResult = computed(() => {
    const prod = this.simProduct();
    if (!prod) return { newAvgCost: 0, newStock: 0, diff: 0, newMargin: 0 };

    const oldQty = prod.currentStock;
    const oldAvg = prod.averageCost;
    const addQty = this.simNewQuantity();
    const addPrice = this.simNewPurchasePrice();

    const newStock = oldQty + addQty;
    const totalCostValue = (oldQty * oldAvg) + (addQty * addPrice);
    const newAvgCost = newStock > 0 ? totalCostValue / newStock : addPrice;
    const diff = newAvgCost - oldAvg;
    const newMargin = prod.sellingPrice > 0 ? ((prod.sellingPrice - newAvgCost) / prod.sellingPrice) * 100 : 0;

    return {
      oldAvg,
      oldQty,
      newStock,
      newAvgCost: Math.round(newAvgCost * 100) / 100,
      diff: Math.round(diff * 100) / 100,
      newMargin: Math.round(newMargin * 10) / 10,
    };
  });
}
