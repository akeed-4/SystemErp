import {Component, inject, signal, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {MatIconModule} from '@angular/material/icon';
import {ErpService} from '../../core/services/erp.service';

export interface BackendFileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: BackendFileNode[];
}

@Component({
  selector: 'app-backend-architecture',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './backend-architecture.component.html',
  styleUrl: './backend-architecture.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackendArchitectureComponent implements OnInit {
  public erpService = inject(ErpService);
  private http = inject(HttpClient);

  public activeTab = signal<'real_files' | 'clean_code' | 'api_tester' | 'csharp_snippets'>('real_files');

  // File explorer signals
  public fileTree = signal<BackendFileNode[]>([]);
  public selectedFilePath = signal<string>('src/RayahAccounting.WebApi/Program.cs');
  public selectedFileContent = signal<string>('');
  public isLoadingFile = signal<boolean>(false);
  public copySuccess = signal<boolean>(false);

  // API Tester signals
  public selectedEndpoint = signal<string>('/api/v1/invoices');
  public apiResponse = signal<string>('اضغط على "إرسال طلب HTTP إلى الخادم" لتجربة استدعاء الـ API مع Tenant-Id...');
  public isLoadingApi = signal<boolean>(false);

  ngOnInit() {
    this.fetchBackendFiles();
    this.loadFileContent(this.selectedFilePath());
  }

  public fetchBackendFiles() {
    this.http.get<{root: string; structure: BackendFileNode[]}>('/api/v1/backend/files').subscribe({
      next: (res) => {
        if (res?.structure?.length) {
          this.fileTree.set(res.structure);
        } else {
          this.setupFallbackTree();
        }
      },
      error: () => {
        this.setupFallbackTree();
      }
    });
  }

  public loadFileContent(path: string) {
    this.selectedFilePath.set(path);
    this.isLoadingFile.set(true);

    this.http.get<{path: string; content: string}>('/api/v1/backend/file-content', {
      params: { path }
    }).subscribe({
      next: (res) => {
        this.selectedFileContent.set(res.content);
        this.isLoadingFile.set(false);
      },
      error: () => {
        this.selectedFileContent.set(`// ملف مسار: backend/${path}\n// يمكنك فحص الكود المصدري الكامل لهذا الملف مباشرة من مجلد /backend على الخادم.`);
        this.isLoadingFile.set(false);
      }
    });
  }

  public copyCurrentCode() {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(this.selectedFileContent()).then(() => {
        this.copySuccess.set(true);
        setTimeout(() => this.copySuccess.set(false), 2000);
      });
    }
  }

  public testApiEndpoint(endpoint: string) {
    this.selectedEndpoint.set(endpoint);
    this.isLoadingApi.set(true);

    const headers = {
      'X-Tenant-Id': this.erpService.activeTenantId(),
    };

    this.http.get(endpoint, {headers}).subscribe({
      next: (res) => {
        this.apiResponse.set(JSON.stringify(res, null, 2));
        this.isLoadingApi.set(false);
      },
      error: (err) => {
        this.apiResponse.set(JSON.stringify({error: err.message, status: err.status}, null, 2));
        this.isLoadingApi.set(false);
      },
    });
  }

  private setupFallbackTree() {
    this.fileTree.set([
      { name: 'RayahAccounting.sln', path: 'RayahAccounting.sln', type: 'file', size: 1850 },
      { name: 'README.md', path: 'README.md', type: 'file', size: 1200 },
      {
        name: 'src',
        path: 'src',
        type: 'directory',
        children: [
          {
            name: 'RayahAccounting.Domain',
            path: 'src/RayahAccounting.Domain',
            type: 'directory',
            children: [
              { name: 'RayahAccounting.Domain.csproj', path: 'src/RayahAccounting.Domain/RayahAccounting.Domain.csproj', type: 'file' },
              {
                name: 'Entities',
                path: 'src/RayahAccounting.Domain/Entities',
                type: 'directory',
                children: [
                  { name: 'Invoice.cs', path: 'src/RayahAccounting.Domain/Entities/Invoice.cs', type: 'file' },
                  { name: 'InvoiceItem.cs', path: 'src/RayahAccounting.Domain/Entities/InvoiceItem.cs', type: 'file' },
                  { name: 'Voucher.cs', path: 'src/RayahAccounting.Domain/Entities/Voucher.cs', type: 'file' },
                  { name: 'Tenant.cs', path: 'src/RayahAccounting.Domain/Entities/Tenant.cs', type: 'file' },
                  { name: 'Account.cs', path: 'src/RayahAccounting.Domain/Entities/Account.cs', type: 'file' },
                  { name: 'Product.cs', path: 'src/RayahAccounting.Domain/Entities/Product.cs', type: 'file' },
                ]
              },
              {
                name: 'Common',
                path: 'src/RayahAccounting.Domain/Common',
                type: 'directory',
                children: [
                  { name: 'BaseEntity.cs', path: 'src/RayahAccounting.Domain/Common/BaseEntity.cs', type: 'file' },
                  { name: 'ITenantEntity.cs', path: 'src/RayahAccounting.Domain/Common/ITenantEntity.cs', type: 'file' },
                ]
              },
              {
                name: 'Enums',
                path: 'src/RayahAccounting.Domain/Enums',
                type: 'directory',
                children: [
                  { name: 'AppEnums.cs', path: 'src/RayahAccounting.Domain/Enums/AppEnums.cs', type: 'file' }
                ]
              }
            ]
          },
          {
            name: 'RayahAccounting.Application',
            path: 'src/RayahAccounting.Application',
            type: 'directory',
            children: [
              { name: 'RayahAccounting.Application.csproj', path: 'src/RayahAccounting.Application/RayahAccounting.Application.csproj', type: 'file' },
              {
                name: 'Costing',
                path: 'src/RayahAccounting.Application/Costing',
                type: 'directory',
                children: [
                  { name: 'MovingAverageCalculator.cs', path: 'src/RayahAccounting.Application/Costing/MovingAverageCalculator.cs', type: 'file' }
                ]
              },
              {
                name: 'Invoices',
                path: 'src/RayahAccounting.Application/Invoices',
                type: 'directory',
                children: [
                  { name: 'InvoiceDtos.cs', path: 'src/RayahAccounting.Application/Invoices/InvoiceDtos.cs', type: 'file' }
                ]
              },
              {
                name: 'Interfaces',
                path: 'src/RayahAccounting.Application/Interfaces',
                type: 'directory',
                children: [
                  { name: 'IApplicationDbContext.cs', path: 'src/RayahAccounting.Application/Interfaces/IApplicationDbContext.cs', type: 'file' },
                  { name: 'ITenantService.cs', path: 'src/RayahAccounting.Application/Interfaces/ITenantService.cs', type: 'file' }
                ]
              }
            ]
          },
          {
            name: 'RayahAccounting.Infrastructure',
            path: 'src/RayahAccounting.Infrastructure',
            type: 'directory',
            children: [
              { name: 'RayahAccounting.Infrastructure.csproj', path: 'src/RayahAccounting.Infrastructure/RayahAccounting.Infrastructure.csproj', type: 'file' },
              {
                name: 'Persistence',
                path: 'src/RayahAccounting.Infrastructure/Persistence',
                type: 'directory',
                children: [
                  { name: 'ApplicationDbContext.cs', path: 'src/RayahAccounting.Infrastructure/Persistence/ApplicationDbContext.cs', type: 'file' }
                ]
              },
              {
                name: 'MultiTenancy',
                path: 'src/RayahAccounting.Infrastructure/MultiTenancy',
                type: 'directory',
                children: [
                  { name: 'TenantResolverMiddleware.cs', path: 'src/RayahAccounting.Infrastructure/MultiTenancy/TenantResolverMiddleware.cs', type: 'file' }
                ]
              },
              {
                name: 'Zatca',
                path: 'src/RayahAccounting.Infrastructure/Zatca',
                type: 'directory',
                children: [
                  { name: 'ZatcaPhase2Service.cs', path: 'src/RayahAccounting.Infrastructure/Zatca/ZatcaPhase2Service.cs', type: 'file' }
                ]
              }
            ]
          },
          {
            name: 'RayahAccounting.WebApi',
            path: 'src/RayahAccounting.WebApi',
            type: 'directory',
            children: [
              { name: 'RayahAccounting.WebApi.csproj', path: 'src/RayahAccounting.WebApi/RayahAccounting.WebApi.csproj', type: 'file' },
              { name: 'Program.cs', path: 'src/RayahAccounting.WebApi/Program.cs', type: 'file' },
              { name: 'appsettings.json', path: 'src/RayahAccounting.WebApi/appsettings.json', type: 'file' },
              {
                name: 'Controllers',
                path: 'src/RayahAccounting.WebApi/Controllers',
                type: 'directory',
                children: [
                  { name: 'InvoicesController.cs', path: 'src/RayahAccounting.WebApi/Controllers/InvoicesController.cs', type: 'file' },
                  { name: 'VouchersController.cs', path: 'src/RayahAccounting.WebApi/Controllers/VouchersController.cs', type: 'file' },
                  { name: 'CostingController.cs', path: 'src/RayahAccounting.WebApi/Controllers/CostingController.cs', type: 'file' },
                  { name: 'ZatcaController.cs', path: 'src/RayahAccounting.WebApi/Controllers/ZatcaController.cs', type: 'file' },
                  { name: 'TenantsController.cs', path: 'src/RayahAccounting.WebApi/Controllers/TenantsController.cs', type: 'file' }
                ]
              }
            ]
          }
        ]
      }
    ]);
  }
}
