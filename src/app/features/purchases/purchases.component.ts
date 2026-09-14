import {Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ErpService} from '../../core/services/erp.service';
import {DataGridComponent, DataGridColumn} from '../../shared/components/data-grid/data-grid.component';
import {Invoice, PaymentMethod} from '../../core/models/erp.models';

interface NewPurchaseLine {
  itemId: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchasesComponent {
  public erpService = inject(ErpService);

  public showCreateModal = signal<boolean>(false);
  public selectedInvoice = signal<Invoice | null>(null);

  // New Purchase Form
  public formSupplierName: string = 'شركة التوزيع الكبرى للمعدات التقنية';
  public formSupplierVat: string = '300555666777003';
  public formSupplierInvNumber: string = 'SUP-INV-8874';
  public formPaymentMethod: PaymentMethod = 'bank_transfer';
  public formNotes: string = '';

  public onSupplierSelect(suppId: string) {
    const s = this.erpService.suppliers().find((x) => x.id === suppId);
    if (s) {
      this.formSupplierName = s.nameAr;
      this.formSupplierVat = s.vatNumber || '';
    }
  }

  public formLines: NewPurchaseLine[] = [
    { itemId: 'prod-2', quantity: 10, unitPrice: 4300 },
  ];

  public columns: DataGridColumn<Invoice>[] = [
    { field: 'invoiceNumber', caption: 'رقم الفاتورة', width: '130px', sortable: true },
    { field: 'issueDate', caption: 'تاريخ الشراء', width: '100px', sortable: true },
    { field: 'partyName', caption: 'المورد', sortable: true },
    { field: 'partyVatNumber', caption: 'الرقم الضريبي للمورد', width: '150px' },
    {
      field: 'paymentMethod',
      caption: 'طريقة الدفع',
      width: '110px',
      format: 'badge',
      badgeClass: () => 'bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs',
    },
    { field: 'subtotal', caption: 'المجموع قبل الضريبة', format: 'currency', alignment: 'left', sortable: true },
    { field: 'vatTotal', caption: 'ضريبة المدخلات (15%)', format: 'currency', alignment: 'left', sortable: true },
    { field: 'grandTotal', caption: 'المجموع الإجمالي', format: 'currency', alignment: 'left', sortable: true },
  ];

  public get purchaseInvoices() {
    return this.erpService.invoices().filter((i) => i.kind === 'purchase');
  }

  public get totalPurchasesAmount(): number {
    return this.purchaseInvoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);
  }

  public get totalVatAmount(): number {
    return this.purchaseInvoices.reduce((acc, inv) => acc + (inv.vatTotal || 0), 0);
  }

  public addLine() {
    const prods = this.erpService.products();
    const prod = prods[0];
    this.formLines.push({
      itemId: prod ? prod.id : '',
      quantity: 5,
      unitPrice: prod ? prod.lastPurchaseCost : 100,
    });
  }

  public removeLine(index: number) {
    if (this.formLines.length > 1) {
      this.formLines.splice(index, 1);
    }
  }

  public onProductSelect(index: number, itemId: string) {
    const prod = this.erpService.products().find((p) => p.id === itemId);
    if (prod) {
      this.formLines[index].itemId = itemId;
      this.formLines[index].unitPrice = prod.lastPurchaseCost;
    }
  }

  public get formSubtotal(): number {
    return this.formLines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);
  }

  public get formVat(): number {
    return (this.formSubtotal * 15) / 100;
  }

  public get formGrandTotal(): number {
    return this.formSubtotal + this.formVat;
  }

  // Helpers for line details & cost calculations
  public getProduct(itemId: string) {
    return this.erpService.products().find((p) => p.id === itemId);
  }

  // Preview new moving average cost for a line
  public getPreviewMovingAverage(line: NewPurchaseLine): number {
    const prod = this.getProduct(line.itemId);
    if (!prod) return line.unitPrice;
    const oldStock = prod.currentStock;
    const oldAvg = prod.averageCost;
    const newStock = oldStock + (Number(line.quantity) || 0);
    if (newStock <= 0) return line.unitPrice;
    const unitP = Number(line.unitPrice) || 0;
    const qty = Number(line.quantity) || 0;
    return Math.round((((oldStock * oldAvg) + (qty * unitP)) / newStock) * 100) / 100;
  }

  public getPreviewNewStock(line: NewPurchaseLine): number {
    const prod = this.getProduct(line.itemId);
    if (!prod) return Number(line.quantity) || 0;
    return prod.currentStock + (Number(line.quantity) || 0);
  }

  public getCostDifference(line: NewPurchaseLine): number {
    const prod = this.getProduct(line.itemId);
    if (!prod) return 0;
    const newAvg = this.getPreviewMovingAverage(line);
    return Math.round((newAvg - prod.averageCost) * 100) / 100;
  }

  public savePurchaseInvoice() {
    if (!this.formSupplierName.trim()) {
      alert('يرجى إدخال اسم المورد');
      return;
    }

    this.erpService.createPurchaseInvoice({
      partyName: this.formSupplierName,
      partyVatNumber: this.formSupplierVat,
      invoiceNumber: this.formSupplierInvNumber,
      paymentMethod: this.formPaymentMethod,
      items: this.formLines.map((l) => ({
        itemId: l.itemId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
      notes: this.formNotes,
    });

    this.showCreateModal.set(false);
  }

  public viewInvoiceDetails(inv: Invoice) {
    this.selectedInvoice.set(inv);
  }
}
