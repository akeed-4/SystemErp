import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ErpService} from '../../core/services/erp.service';
import {Invoice} from '../../core/models/erp.models';
import {ZatcaQrComponent} from '../../shared/components/zatca-qr/zatca-qr.component';

@Component({
  selector: 'app-zatca-integration',
  standalone: true,
  imports: [CommonModule, FormsModule, ZatcaQrComponent],
  templateUrl: './zatca-integration.component.html',
  styleUrl: './zatca-integration.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZatcaIntegrationComponent {
  public erpService = inject(ErpService);

  public activeTab = signal<'test_send' | 'onboarding' | 'ubl_xml'>('test_send');
  public selectedInvoiceId = signal<string>('');

  // Onboarding parameters
  public zatcaEnv = signal<'simulation' | 'developer' | 'production'>('simulation');
  public otpInput = signal<string>('123456');
  public complianceStatus = signal<string>('تم الحصول على شهادة الامتثال CSID وتفعيل الختم الرقمي');
  public isTestingSubmission = signal<boolean>(false);
  public isXmlCopied = signal<boolean>(false);
  public lastSubmissionResult = signal<{
    status: 'cleared' | 'reported' | 'rejected' | 'warning';
    httpCode: number;
    timestamp: string;
    messages: string[];
    hash: string;
  } | null>(null);

  public salesInvoices = computed(() => {
    return this.erpService.invoices().filter((i) => i.kind === 'sales');
  });

  public currentInvoice = computed(() => {
    const list = this.salesInvoices();
    if (!list.length) return null;
    const found = list.find((i) => i.id === this.selectedInvoiceId());
    return found || list[0];
  });

  public testSendCurrentInvoice() {
    const inv = this.currentInvoice();
    if (!inv) return;

    this.isTestingSubmission.set(true);

    setTimeout(() => {
      const res = this.erpService.simulateZatcaSend(inv.id);
      this.isTestingSubmission.set(false);
      this.lastSubmissionResult.set({
        status: res.status,
        httpCode: 200,
        timestamp: new Date().toISOString(),
        messages: res.messages,
        hash: inv.zatcaHash || '4a7d...39b1',
      });
    }, 700);
  }

  public downloadXml() {
    const inv = this.currentInvoice();
    if (!inv || !inv.zatcaUblXml) return;

    const blob = new Blob([inv.zatcaUblXml], {type: 'application/xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZATCA-UBL-${inv.invoiceNumber}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public copyXmlToClipboard() {
    const inv = this.currentInvoice();
    if (inv && inv.zatcaUblXml) {
      navigator.clipboard.writeText(inv.zatcaUblXml);
      this.isXmlCopied.set(true);
      setTimeout(() => this.isXmlCopied.set(false), 2500);
    }
  }
}
