import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-zatca-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zatca-qr.component.html',
  styleUrl: './zatca-qr.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZatcaQrComponent implements AfterViewInit, OnChanges {
  @Input({required: true}) qrData: string = '';
  @Input() size: number = 160;
  @Input() showDetails: boolean = false;

  @ViewChild('qrCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  public copied = signal<boolean>(false);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit() {
    this.renderQr();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['qrData'] && this.canvasRef) {
      this.renderQr();
    }
  }

  public renderQr() {
    if (!this.canvasRef || !this.qrData || !this.isBrowser) return;
    try {
      QRCode.toCanvas(this.canvasRef.nativeElement, this.qrData, {
        width: this.size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (err) {
      console.error('Error rendering ZATCA QR code:', err);
    }
  }

  public copyTlvString() {
    if (!this.qrData) return;
    navigator.clipboard.writeText(this.qrData);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
