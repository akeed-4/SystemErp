import {Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ErpService} from '../../core/services/erp.service';
import {DataGridComponent, DataGridColumn} from '../../shared/components/data-grid/data-grid.component';
import {Invoice, PaymentMethod, ZatcaInvoiceType} from '../../core/models/erp.models';
import {InvoicePrintComponent} from '../../shared/components/invoice-print/invoice-print.component';

interface NewInvoiceLine {
  itemId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent, InvoicePrintComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesComponent {
  public erpService = inject(ErpService);

  public showCreateModal = signal<boolean>(false);
  public selectedInvoice = signal<Invoice | null>(null);
  public zatcaTestResult = signal<{ invoiceNumber: string; messages: string[]; status: string } | null>(null);

  // New Invoice Form Model
  public formCustomerName: string = 'شركة التقنية المتحدة';
  public formCustomerVat: string = '310888999000003';
  public formCustomerAddress: string = 'الرياض - حي الملز';
  public formPaymentMethod: PaymentMethod = 'bank_transfer';
  public formInvoiceType: ZatcaInvoiceType = 'simplified';
  public formNotes: string = '';
  public formSendToZatcaTest: boolean = true;

  public onCustomerSelect(custId: string) {
    const cust = this.erpService.customers().find((c) => c.id === custId);
    if (cust) {
      this.formCustomerName = cust.nameAr;
      this.formCustomerVat = cust.vatNumber || '';
      this.formCustomerAddress = [cust.city, cust.district, cust.street].filter(Boolean).join(' - ') || 'المملكة العربية السعودية';
      if (cust.vatNumber) {
        this.formInvoiceType = 'tax_invoice';
      }
    }
  }

  public formLines: NewInvoiceLine[] = [
    { itemId: 'prod-1', quantity: 1, unitPrice: 18900, discount: 0 },
  ];

  public columns: DataGridColumn<Invoice>[] = [
    { field: 'invoiceNumber', caption: 'رقم الفاتورة', width: '130px', sortable: true },
    { field: 'issueDate', caption: 'تاريخ الإصدار', width: '100px', sortable: true },
    { field: 'partyName', caption: 'اسم العميل', sortable: true },
    {
      field: 'invoiceType',
      caption: 'نوع الفاتورة',
      width: '120px',
      format: 'badge',
      badgeClass: (val) =>
        val === 'tax_invoice'
          ? 'bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold'
          : 'bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full text-xs font-semibold',
    },
    {
      field: 'paymentMethod',
      caption: 'طريقة الدفع',
      width: '110px',
      format: 'badge',
      badgeClass: () => 'bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs',
    },
    { field: 'subtotal', caption: 'المجموع قبل الضريبة', format: 'currency', alignment: 'left', sortable: true },
    { field: 'vatTotal', caption: 'الضريبة (15%)', format: 'currency', alignment: 'left', sortable: true },
    { field: 'grandTotal', caption: 'المجموع النهائي', format: 'currency', alignment: 'left', sortable: true },
    {
      field: 'grossProfit',
      caption: 'مجمل الربح',
      format: 'currency',
      alignment: 'left',
      sortable: true,
    },
    {
      field: 'zatcaStatus',
      caption: 'منصة الهيئة',
      format: 'badge',
      badgeClass: (val) => {
        if (val === 'cleared') return 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold';
        if (val === 'reported') return 'bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-xs font-bold';
        if (val === 'rejected') return 'bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-xs font-bold';
        return 'bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold';
      },
    },
  ];

  public get salesInvoices() {
    return this.erpService.invoices().filter((i) => i.kind === 'sales');
  }

  public addLine() {
    const prods = this.erpService.products();
    const prod = prods[0];
    this.formLines.push({
      itemId: prod ? prod.id : '',
      quantity: 1,
      unitPrice: prod ? prod.sellingPrice : 100,
      discount: 0,
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
      this.formLines[index].unitPrice = prod.sellingPrice;
    }
  }

  public get formSubtotal(): number {
    return this.formLines.reduce((acc, line) => acc + (line.quantity * line.unitPrice - (line.discount || 0)), 0);
  }

  public get formVat(): number {
    return (this.formSubtotal * 15) / 100;
  }

  public get formGrandTotal(): number {
    return this.formSubtotal + this.formVat;
  }

  public get formEstimatedProfit(): number {
    const prods = this.erpService.products();
    const totalCost = this.formLines.reduce((acc, line) => {
      const p = prods.find((x) => x.id === line.itemId);
      const cost = p ? p.averageCost : 0;
      return acc + (line.quantity * cost);
    }, 0);
    return this.formSubtotal - totalCost;
  }

  public saveInvoice() {
    if (!this.formCustomerName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }

    const newInv = this.erpService.createSalesInvoice({
      partyName: this.formCustomerName,
      partyVatNumber: this.formCustomerVat,
      partyAddress: this.formCustomerAddress,
      paymentMethod: this.formPaymentMethod,
      invoiceType: this.formInvoiceType,
      items: this.formLines.map((l) => ({
        itemId: l.itemId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discount: l.discount,
      })),
      notes: this.formNotes,
    });

    this.showCreateModal.set(false);

    // If Test Mode is enabled, immediately transmit to ZATCA Test & clearance sandbox
    if (this.formSendToZatcaTest) {
      const res = this.erpService.simulateZatcaSend(newInv.id);
      const updatedInv = this.erpService.invoices().find((i) => i.id === newInv.id) || newInv;
      this.selectedInvoice.set(null); // Don't block with print dialog while test dialog is open
      this.zatcaTestResult.set({
        invoiceNumber: updatedInv.invoiceNumber,
        messages: res.messages,
        status: res.status,
      });
    } else {
      this.selectedInvoice.set(newInv);
    }
  }

  public printInvoice(inv: Invoice) {
    this.selectedInvoice.set(inv);
  }

  public printInvoiceFromTest() {
    const res = this.zatcaTestResult();
    if (res) {
      const inv = this.erpService.invoices().find((i) => i.invoiceNumber === res.invoiceNumber);
      this.zatcaTestResult.set(null);
      if (inv) {
        this.selectedInvoice.set(inv);
      }
    }
  }

  public testZatca(inv: Invoice) {
    const res = this.erpService.simulateZatcaSend(inv.id);
    this.zatcaTestResult.set({
      invoiceNumber: inv.invoiceNumber,
      messages: res.messages,
      status: res.status,
    });
  }
}
