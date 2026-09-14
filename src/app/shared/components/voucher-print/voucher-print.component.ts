import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Voucher, Tenant} from '../../../core/models/erp.models';
import {PrintService} from '../../../core/services/print.service';

@Component({
  selector: 'app-voucher-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voucher-print.component.html',
  styleUrl: './voucher-print.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoucherPrintComponent {
  @Input({required: true}) voucher!: Voucher;
  @Input({required: true}) tenant!: Tenant;
  @Output() close = new EventEmitter<void>();

  private printService = inject(PrintService);

  public printVoucher() {
    this.printService.printElement('printable-voucher-body', `سند_${this.voucher.voucherNumber}`);
  }
}
