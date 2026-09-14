import {Component, inject, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ErpService} from '../../core/services/erp.service';
import {DataGridComponent, DataGridColumn} from '../../shared/components/data-grid/data-grid.component';
import {Invoice, Voucher} from '../../core/models/erp.models';
import {InvoicePrintComponent} from '../../shared/components/invoice-print/invoice-print.component';
import {VoucherPrintComponent} from '../../shared/components/voucher-print/voucher-print.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DataGridComponent,
    InvoicePrintComponent,
    VoucherPrintComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  public erpService = inject(ErpService);

  public selectedInvoice: Invoice | null = null;
  public selectedVoucher: Voucher | null = null;

  public invoiceColumns: DataGridColumn<Invoice>[] = [
    { field: 'invoiceNumber', caption: 'رقم الفاتورة', width: '130px', sortable: true },
    { field: 'issueDate', caption: 'التاريخ', width: '100px', sortable: true },
    { field: 'partyName', caption: 'العميل / المورد', sortable: true },
    {
      field: 'kind',
      caption: 'النوع',
      width: '90px',
      format: 'badge',
      badgeClass: (val) =>
        val === 'sales'
          ? 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-semibold'
          : 'bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-semibold',
    },
    { field: 'grandTotal', caption: 'المبلغ الإجمالي', format: 'currency', alignment: 'left', sortable: true },
    {
      field: 'zatcaStatus',
      caption: 'حالة الهيئة',
      format: 'badge',
      badgeClass: (val) => {
        if (val === 'cleared') return 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold';
        if (val === 'reported') return 'bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-xs font-bold';
        if (val === 'rejected') return 'bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-xs font-bold';
        return 'bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold';
      },
    },
  ];

  public voucherColumns: DataGridColumn<Voucher>[] = [
    { field: 'voucherNumber', caption: 'رقم السند', width: '130px', sortable: true },
    { field: 'date', caption: 'التاريخ', width: '100px', sortable: true },
    {
      field: 'type',
      caption: 'النوع',
      width: '100px',
      format: 'badge',
      badgeClass: (val) =>
        val === 'receipt'
          ? 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold'
          : 'bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-xs font-bold',
    },
    { field: 'partyName', caption: 'الطرف المستلم / المصروف له', sortable: true },
    { field: 'amount', caption: 'المبلغ', format: 'currency', alignment: 'left', sortable: true },
  ];

  public openInvoicePrint(invoice: Invoice) {
    this.selectedInvoice = invoice;
  }

  public openVoucherPrint(voucher: Voucher) {
    this.selectedVoucher = voucher;
  }
}
