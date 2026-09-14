import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PrintService {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  /**
   * خدمة معاينة الطباعة الذكية
   * تقوم بأخذ نسخة من العنصر المطلوب، تحويل الـ Canvas (مثل QR Code) إلى صور،
   * ثم طباعتها عبر iframe مخفي لضمان التنسيق في بيئات Iframe (مثل AI Studio)
   */
  public printElement(elementId: string, customTitle: string = 'معاينة الطباعة') {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = document.getElementById(elementId);
    if (!el) {
      console.warn(`PrintService: Element with id '${elementId}' not found.`);
      return;
    }

    // استنساخ العنصر للحفاظ على الأصل
    const clone = el.cloneNode(true) as HTMLElement;
    
    // تحويل Canvas (QR Code) إلى صورة مدعومة في الطباعة
    const originalCanvases = el.querySelectorAll('canvas');
    const clonedCanvases = clone.querySelectorAll('canvas');
    originalCanvases.forEach((canvas, index) => {
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.className = canvas.className;
      clonedCanvases[index].parentNode?.replaceChild(img, clonedCanvases[index]);
    });

    const printContents = clone.innerHTML;
    
    // جلب جميع الأنماط من الصفحة الأصلية للحفاظ على التصميم (Tailwind + Custom)
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');

    // إنشاء iframe مخفي
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html dir="rtl">
          <head>
            <title>${customTitle}</title>
            ${styles}
            <style>
              @media print {
                body, html {
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body class="p-6 md:p-8 bg-white text-slate-900">
            ${printContents}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();

      // Fallback cleanup
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 10000);
    }
  }
}
