import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Invoice, Tenant} from '../../../core/models/erp.models';
import {ZatcaQrComponent} from '../zatca-qr/zatca-qr.component';
import {tafqeetArabic} from '../../../core/utils/tafqeet.util';
import {PrintService} from '../../../core/services/print.service';

@Component({
  selector: 'app-invoice-print',
  standalone: true,
  imports: [CommonModule, ZatcaQrComponent],
  templateUrl: './invoice-print.component.html',
  styleUrl: './invoice-print.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicePrintComponent {
  @Input({required: true}) invoice!: Invoice;
  @Input({required: true}) tenant!: Tenant;

  @Output() close = new EventEmitter<void>();

  private printService = inject(PrintService);

  public printInvoice() {
    this.printService.printElement('printable-invoice-body', `فاتورة_${this.invoice.invoiceNumber}`);
  }

  public get tafqeetTotal(): string {
    return this.invoice ? tafqeetArabic(this.invoice.grandTotal) : '';
  }
}
