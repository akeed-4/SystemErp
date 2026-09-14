import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ErpService } from '../../core/services/erp.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Invoice } from '../../core/models/erp.models';
import { InvoicePrintComponent } from '../../shared/components/invoice-print/invoice-print.component';

@Component({
  selector: 'app-sales-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, InvoicePrintComponent],
  template: `
    <div class="space-y-6" [attr.dir]="i18n.currentDir()">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div class="flex items-center gap-2">
            <span class="material-icons text-indigo-600 text-2xl">assignment_return</span>
            <h1 class="text-xl font-black text-slate-900">
              {{ i18n.isArabic() ? 'مرتجع المبيعات والإشعارات الدائنة (ZATCA Credit Notes)' : 'Sales Returns & Credit Notes' }}
            </h1>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            {{ i18n.isArabic() ? 'إدارة مرتجعات الفواتير، تعديل المخزون، وقيود اليومية الآلية وإصدار الإشعارات الدائنة' : 'Manage invoice returns, automated stock adjustments, journal entries & ZATCA credit notes' }}
          </p>
        </div>

        <button
          type="button"
          (click)="openReturnModal()"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          <span class="material-icons text-base">add_circle</span>
          <span>{{ i18n.isArabic() ? 'إصدار مرتجع جديد (إشعار دائن)' : 'Create Return Invoice' }}</span>
        </button>
      </div>

      <!-- Returns List Table / Cards -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between">
          <div class="font-bold text-sm text-slate-800">
            {{ i18n.isArabic() ? 'سجل مرتجعات المبيعات المسجلة' : 'Recorded Sales Returns' }}
          </div>
          <div class="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {{ returnInvoices().length }} {{ i18n.isArabic() ? 'مرتجع' : 'Returns' }}
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-right border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th class="p-3.5">{{ i18n.isArabic() ? 'رقم الإشعار' : 'Return No.' }}</th>
                <th class="p-3.5">{{ i18n.isArabic() ? 'الفاتورة الأصلية' : 'Original Inv.' }}</th>
                <th class="p-3.5">{{ i18n.isArabic() ? 'التاريخ والوقت' : 'Date & Time' }}</th>
                <th class="p-3.5">{{ i18n.isArabic() ? 'العميل' : 'Customer' }}</th>
                <th class="p-3.5">{{ i18n.isArabic() ? 'سبب المرتجع' : 'Return Reason' }}</th>
                <th class="p-3.5 text-center">{{ i18n.isArabic() ? 'إجمالي المرتجع' : 'Grand Total' }}</th>
                <th class="p-3.5 text-center">{{ i18n.isArabic() ? 'حالة زاتكا' : 'ZATCA Status' }}</th>
                <th class="p-3.5 text-center">{{ i18n.isArabic() ? 'الإجراءات' : 'Actions' }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (ret of returnInvoices(); track ret.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="p-3.5 font-mono font-bold text-indigo-600">{{ ret.invoiceNumber }}</td>
                  <td class="p-3.5 font-mono text-slate-700">{{ ret.originalInvoiceNumber || '-' }}</td>
                  <td class="p-3.5 text-slate-500 font-mono text-[11px]">{{ ret.issueDate }} {{ ret.issueTime }}</td>
                  <td class="p-3.5 font-bold text-slate-900">{{ ret.partyName }}</td>
                  <td class="p-3.5 text-slate-600 max-w-[200px] truncate" [title]="ret.returnReason || ''">{{ ret.returnReason || '-' }}</td>
                  <td class="p-3.5 text-center font-bold text-rose-600 font-mono">{{ ret.grandTotal | number:'1.2-2' }} ر.س</td>
                  <td class="p-3.5 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {{ ret.zatcaStatus | uppercase }}
                    </span>
                  </td>
                  <td class="p-3.5 text-center">
                    <button
                      type="button"
                      (click)="selectedInvoiceForPrint.set(ret)"
                      class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span class="material-icons text-sm">print</span>
                      <span>{{ i18n.isArabic() ? 'طباعة الإشعار' : 'Print' }}</span>
                    </button>
                  </td>
                }
              @empty {
                <tr>
                  <td colspan="8" class="p-8 text-center text-slate-400">
                    {{ i18n.isArabic() ? 'لا توجد مرتجعات مبيعات مسجلة حتى الآن' : 'No sales returns recorded yet' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Return Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-icons text-indigo-400">assignment_return</span>
                <h3 class="font-bold text-sm">
                  {{ i18n.isArabic() ? 'إنشاء إشعار دائن (مرتجع مبيعات)' : 'Create Credit Note / Return' }}
                </h3>
              </div>
              <button (click)="showModal.set(false)" class="p-1 rounded-lg text-slate-400 hover:text-white">
                <span class="material-icons text-xl">close</span>
              </button>
            </div>

            <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <!-- Select Original Invoice -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  {{ i18n.isArabic() ? 'اختر الفاتورة الأصلية المراد إرجاعها' : 'Select Original Invoice' }}
                </label>
                <select
                  [(ngModel)]="selectedOriginalInvoiceId"
                  (ngModelChange)="onSelectInvoice($event)"
                  class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">{{ i18n.isArabic() ? '-- اختر الفاتورة الأصلية --' : '-- Select Invoice --' }}</option>
                  @for (inv of availableSalesInvoices(); track inv.id) {
                    <option [value]="inv.id">
                      {{ inv.invoiceNumber }} - {{ inv.partyName }} ({{ inv.grandTotal | number:'1.2-2' }} ر.س) - {{ inv.issueDate }}
                    </option>
                  }
                </select>
              </div>

              @if (activeOriginalInvoice(); as origInv) {
                <!-- Invoice Info Summary -->
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div class="font-bold text-slate-800">{{ origInv.partyName }} ({{ origInv.invoiceNumber }})</div>
                  <div class="text-slate-500">{{ i18n.isArabic() ? 'تاريخ الإصدار' : 'Issue Date' }}: {{ origInv.issueDate }} | {{ i18n.isArabic() ? 'طريقة الدفع' : 'Payment' }}: {{ origInv.paymentMethod }}</div>
                </div>

                <!-- Return Reason -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    {{ i18n.isArabic() ? 'سبب المرتجع (مطلبيات زاتكا)' : 'Return Reason' }}
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="returnReason"
                    class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    [placeholder]="i18n.isArabic() ? 'مثال: عيب صناعة، تلف، أو استرجاع برضا العميل' : 'e.g., Defective item, customer return'"
                  />
                </div>

                <!-- Return Items Selection -->
                <div>
                  <div class="font-bold text-xs text-slate-800 mb-2">
                    {{ i18n.isArabic() ? 'حدد الكميات المراد إرجاعها لكل صنف' : 'Select Quantities to Return' }}
                  </div>
                  <div class="border border-slate-200 rounded-xl overflow-hidden">
                    <table class="w-full text-right text-xs">
                      <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th class="p-2.5">{{ i18n.isArabic() ? 'الصنف' : 'Item' }}</th>
                          <th class="p-2.5 text-center">{{ i18n.isArabic() ? 'الكمية المباعة' : 'Sold Qty' }}</th>
                          <th class="p-2.5 text-center">{{ i18n.isArabic() ? 'كمية المرتجع' : 'Return Qty' }}</th>
                          <th class="p-2.5 text-center">{{ i18n.isArabic() ? 'سعر الوحدة' : 'Unit Price' }}</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        @for (it of returnFormItems(); track it.itemId; let i = $index) {
                          <tr>
                            <td class="p-2.5 font-bold text-slate-900">{{ it.itemName }}</td>
                            <td class="p-2.5 text-center font-mono">{{ it.maxQty }}</td>
                            <td class="p-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                [max]="it.maxQty"
                                [value]="it.quantity"
                                (input)="updateItemQty(i, $any($event.target).value)"
                                class="w-20 px-2 py-1 rounded-lg border border-slate-300 text-center font-mono text-xs"
                              />
                            </td>
                            <td class="p-2.5 text-center font-mono text-indigo-600">{{ it.unitPrice | number:'1.2-2' }} ر.س</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            </div>

            <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                (click)="showModal.set(false)"
                class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                {{ i18n.isArabic() ? 'إلغاء' : 'Cancel' }}
              </button>
              <button
                type="button"
                (click)="submitReturn()"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {{ i18n.isArabic() ? 'اعتماد وإصدار الإشعار الدائن' : 'Issue Credit Note' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Print Dialog Modal -->
      @if (selectedInvoiceForPrint(); as retInv) {
        <app-invoice-print
          [invoice]="retInv"
          [tenant]="erpService.activeTenant()"
          (close)="selectedInvoiceForPrint.set(null)"
        ></app-invoice-print>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnsComponent {
  public erpService = inject(ErpService);
  public i18n = inject(TranslationService);

  public showModal = signal<boolean>(false);
  public selectedOriginalInvoiceId = signal<string>('');
  public returnReason = signal<string>('مرتجع بضاعة برضا العميل ومطابقة الفاتورة');
  public returnFormItems = signal<{ itemId: string; itemName: string; maxQty: number; quantity: number; unitPrice: number; discount: number }[]>([]);
  public selectedInvoiceForPrint = signal<Invoice | null>(null);

  public returnInvoices = computed(() => {
    return this.erpService.invoices().filter((i) => i.isReturn && i.creditDebitNoteType === 'credit_note');
  });

  public availableSalesInvoices = computed(() => {
    return this.erpService.invoices().filter((i) => i.kind === 'sales' && !i.isReturn && i.status === 'posted');
  });

  public activeOriginalInvoice = computed(() => {
    const id = this.selectedOriginalInvoiceId();
    if (!id) return null;
    return this.erpService.invoices().find((i) => i.id === id) || null;
  });

  public openReturnModal() {
    this.selectedOriginalInvoiceId.set('');
    this.returnFormItems.set([]);
    this.showModal.set(true);
  }

  public updateItemQty(index: number, val: any) {
    this.returnFormItems.update((items) => {
      const copy = [...items];
      copy[index] = { ...copy[index], quantity: Number(val) };
      return copy;
    });
  }

  public onSelectInvoice(invId: string) {
    const inv = this.erpService.invoices().find((i) => i.id === invId);
    if (!inv) {
      this.returnFormItems.set([]);
      return;
    }
    const items = inv.items.map((it) => ({
      itemId: it.itemId,
      itemName: it.itemName,
      maxQty: it.quantity,
      quantity: it.quantity, // default return all or adjust
      unitPrice: it.unitPrice,
      discount: it.discount || 0,
    }));
    this.returnFormItems.set(items);
  }

  public submitReturn() {
    const origId = this.selectedOriginalInvoiceId();
    if (!origId) {
      alert('يرجى اختيار الفاتورة الأصلية');
      return;
    }
    const itemsToReturn = this.returnFormItems()
      .filter((it) => it.quantity > 0)
      .map((it) => ({
        itemId: it.itemId,
        quantity: Math.min(it.quantity, it.maxQty),
        unitPrice: it.unitPrice,
        discount: it.discount,
      }));

    if (itemsToReturn.length === 0) {
      alert('يرجى إدخال كمية صحيحة واحدة على الأقل للإرجاع');
      return;
    }

    this.erpService.createInvoiceReturn({
      originalInvoiceId: origId,
      returnReason: this.returnReason(),
      items: itemsToReturn,
      creditDebitNoteType: 'credit_note',
      notes: `إشعار دائن صادر للمرتجع برقم الفاتورة الأصلية`,
    });

    this.showModal.set(false);
  }
}
