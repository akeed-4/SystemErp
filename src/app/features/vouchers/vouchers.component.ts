import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ErpService} from '../../core/services/erp.service';
import {DataGridComponent, DataGridColumn} from '../../shared/components/data-grid/data-grid.component';
import {Voucher} from '../../core/models/erp.models';
import {VoucherPrintComponent} from '../../shared/components/voucher-print/voucher-print.component';
import {tafqeetArabic} from '../../core/utils/tafqeet.util';

@Component({
  selector: 'app-vouchers',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent, VoucherPrintComponent],
  templateUrl: './vouchers.component.html',
  styleUrl: './vouchers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VouchersComponent {
  public erpService = inject(ErpService);

  public filterType = signal<'all' | 'receipt' | 'payment'>('all');
  public showCreateModal = signal<boolean>(false);
  public selectedVoucher = signal<Voucher | null>(null);

  // New Voucher Form
  public formType: 'receipt' | 'payment' = 'receipt';
  public formAmount: number = 5000;
  public formPartyName: string = 'شركة البناء الحديث';
  public formPartyAccountCode: string = '112'; // العملاء
  public formTreasuryAccountCode: string = '1112'; // بنك الراجحي
  public formPaymentMethod: 'cash' | 'bank_transfer' | 'cheque' = 'bank_transfer';
  public formReferenceNumber: string = 'TRF-102938';
  public formNotes: string = 'دفعة تحت حساب الأعمال المنجزة';
  public formReceivedOrPaidBy: string = 'أحمد السعيد - أمين الصندوق';

  public columns: DataGridColumn<Voucher>[] = [
    { field: 'voucherNumber', caption: 'رقم السند', width: '130px', sortable: true },
    { field: 'date', caption: 'التاريخ', width: '105px', sortable: true },
    {
      field: 'type',
      caption: 'نوع السند',
      width: '110px',
      format: 'badge',
      badgeClass: (val) =>
        val === 'receipt'
          ? 'bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold'
          : 'bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-xs font-bold',
      render: (v: Voucher) => (v.type === 'receipt' ? 'سند قبض' : 'سند صرف'),
    },
    { field: 'partyName', caption: 'الطرف المعني (المستلم / المصروف له)', sortable: true },
    { field: 'amount', caption: 'المبلغ بالأرقام', format: 'currency', alignment: 'left', sortable: true },
    {
      field: 'paymentMethod',
      caption: 'طريقة الدفع',
      width: '110px',
      format: 'badge',
      badgeClass: () => 'bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs',
    },
    { field: 'referenceNumber', caption: 'رقم المرجع / الحوالة', width: '130px' },
  ];

  public filteredVouchers = computed(() => {
    const list = this.erpService.vouchers();
    const filter = this.filterType();
    if (filter === 'all') return list;
    return list.filter((v) => v.type === filter);
  });

  public get liveTafqeet(): string {
    return tafqeetArabic(this.formAmount || 0);
  }

  public openCreateModal(type: 'receipt' | 'payment') {
    this.formType = type;
    if (type === 'receipt') {
      this.formPartyAccountCode = '112'; // العملاء
      this.formNotes = 'سداد دفعة تحت الحساب';
    } else {
      this.formPartyAccountCode = '211'; // الموردين
      this.formNotes = 'صرف دفعة مستحقات للمورد';
    }
    this.showCreateModal.set(true);
  }

  public saveVoucher() {
    if (!this.formPartyName.trim() || !this.formAmount) {
      alert('يرجى تعبئة كافة الحقول الإلزامية');
      return;
    }

    const created = this.erpService.createVoucher({
      type: this.formType,
      amount: this.formAmount,
      partyName: this.formPartyName,
      partyAccountCode: this.formPartyAccountCode,
      treasuryAccountCode: this.formTreasuryAccountCode,
      paymentMethod: this.formPaymentMethod,
      referenceNumber: this.formReferenceNumber,
      notes: this.formNotes,
      receivedOrPaidBy: this.formReceivedOrPaidBy,
    });

    this.showCreateModal.set(false);
    this.selectedVoucher.set(created);
  }

  public openVoucherPrint(v: Voucher) {
    this.selectedVoucher.set(v);
  }
}
