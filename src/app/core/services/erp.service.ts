import {Injectable, signal, computed, inject, PLATFORM_ID} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {isPlatformBrowser} from '@angular/common';
import {FirebaseService} from './firebase.service';
import {
  Tenant,
  Account,
  ProductItem,
  Invoice,
  Voucher,
  JournalEntry,
  StockMovement,
  FinancialStats,
  InvoiceItem,
  ZatcaInvoiceType,
  PaymentMethod,
  Customer,
  Supplier,
  UnitOfMeasure,
  Currency,
  PaymentMethodItem,
  ProductCategory,
  Warehouse
} from '../models/erp.models';
import {generateZatcaTlvBase64, generateSimulatedZatcaSignature} from '../utils/zatca-tlv.util';
import {tafqeetArabic} from '../utils/tafqeet.util';

@Injectable({
  providedIn: 'root',
})
export class ErpService {
  private http = inject(HttpClient);
  private firebaseService = inject(FirebaseService);

  // 1. Tenants List
  private tenantsSignal = signal<Tenant[]>([
    {
      id: 'tenant-1',
      code: 'TENANT-001',
      nameAr: 'شركة الأفق التجارية للتوريدات ذ.م.م',
      nameEn: 'Al-Ofuq Commercial Supplies LLC',
      vatNumber: '310123456700003',
      crNumber: '1010456789',
      address: 'طريق الملك فهد، حي العليا',
      city: 'الرياض',
      country: 'المملكة العربية السعودية',
      phone: '+966 11 456 7890',
      email: 'info@alofuq.com.sa',
      currency: 'SAR',
      financialYearStart: '2026-01-01',
      financialYearEnd: '2026-12-31',
      zatcaConfig: {
        environment: 'simulation',
        complianceStatus: 'compliant',
        csid: 'CSID-PROD-2026-98741-KSA',
        binarySecurityToken: 'MIIBtzCCAVygAwIBAgIUQZ...==',
        secretKey: 'zatca-sec-key-alpha-99',
        solutionName: 'ERP-CleanArch-Zatca-Connector',
        solutionVersion: '2.4.0',
        registeredDevice: 'POS-TERMINAL-RIYADH-01',
        autoSendInvoices: true,
      },
      subscription: {
        planId: 'professional',
        planNameAr: 'باقة الشركات المتقدمة (Professional)',
        planNameEn: 'Professional Business Plan',
        billingCycle: 'yearly',
        startDate: '2026-01-01',
        expiryDate: '2027-01-01',
        status: 'active',
        paidAmount: 4990,
        paymentMethod: 'mada',
        transactionReference: 'TXN-MADA-891024',
      },
    },
    {
      id: 'tenant-2',
      code: 'TENANT-002',
      nameAr: 'مؤسسة النور لحلول التقنية والشبكات',
      nameEn: 'Al-Noor Tech & Network Solutions',
      vatNumber: '310987654300003',
      crNumber: '4030123456',
      address: 'شارع فلسطين، حي الرويس',
      city: 'جدة',
      country: 'المملكة العربية السعودية',
      phone: '+966 12 654 3210',
      email: 'sales@alnoor-tech.com',
      currency: 'SAR',
      financialYearStart: '2026-01-01',
      financialYearEnd: '2026-12-31',
      zatcaConfig: {
        environment: 'sandbox',
        complianceStatus: 'in_progress',
        csid: 'CSID-SANDBOX-112233',
        solutionName: 'ERP-CleanArch-Zatca-Connector',
        solutionVersion: '2.4.0',
        registeredDevice: 'OFFICE-SERVER-JEDDAH',
        autoSendInvoices: false,
      },
      subscription: {
        planId: 'starter',
        planNameAr: 'باقة البداية (Starter)',
        planNameEn: 'Starter Plan',
        billingCycle: 'monthly',
        startDate: '2026-09-01',
        expiryDate: '2026-10-01',
        status: 'active',
        paidAmount: 199,
        paymentMethod: 'credit_card',
        transactionReference: 'TXN-CC-442190',
      },
    },
    {
      id: 'tenant-3',
      code: 'TENANT-003',
      nameAr: 'شركة الرواد للتوزيع والخدمات اللوجستية',
      nameEn: 'Al-Rowad Distribution & Logistics',
      vatNumber: '311456789000003',
      crNumber: '2050987654',
      address: 'طريق الأمير محمد بن فهد',
      city: 'الدمام',
      country: 'المملكة العربية السعودية',
      phone: '+966 13 833 4455',
      email: 'contact@alrowad-logistics.sa',
      currency: 'SAR',
      financialYearStart: '2026-01-01',
      financialYearEnd: '2026-12-31',
      zatcaConfig: {
        environment: 'simulation',
        complianceStatus: 'compliant',
        csid: 'CSID-SIM-889900',
        solutionName: 'ERP-CleanArch-Zatca-Connector',
        solutionVersion: '2.4.0',
        registeredDevice: 'HQ-FINANCE-DAMMAM',
        autoSendInvoices: true,
      },
      subscription: {
        planId: 'enterprise',
        planNameAr: 'باقة المجموعات والمؤسسات (Enterprise)',
        planNameEn: 'Enterprise Corporate Plan',
        billingCycle: 'yearly',
        startDate: '2026-07-01',
        expiryDate: '2027-07-01',
        status: 'active',
        paidAmount: 9990,
        paymentMethod: 'bank_transfer',
        transactionReference: 'TXN-TRF-009988',
      },
    },
  ]);

  // Active Tenant Signal
  private activeTenantIdSignal = signal<string>('tenant-1');

  public readonly activeTenantId = computed(() => this.activeTenantIdSignal());

  public readonly activeTenant = computed(() => {
    const list = this.tenantsSignal();
    const id = this.activeTenantIdSignal();
    return list.find((t) => t.id === id) || list[0];
  });

  public readonly tenants = computed(() => this.tenantsSignal());

  public setActiveTenant(tenantId: string) {
    this.switchTenant(tenantId);
  }

  // 2. Chart of Accounts Signal
  private accountsSignal = signal<Account[]>([
    // الأصول
    { id: 'acc-1', tenantId: 'tenant-1', code: '1', nameAr: 'الأصول', nameEn: 'Assets', type: 'asset', parentCode: null, level: 1, balance: 145000, isDebitNature: true, isSystem: true },
    { id: 'acc-11', tenantId: 'tenant-1', code: '11', nameAr: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', parentCode: '1', level: 2, balance: 145000, isDebitNature: true, isSystem: true },
    { id: 'acc-111', tenantId: 'tenant-1', code: '111', nameAr: 'النقد وما في حكمه (الصندوق والبنك)', nameEn: 'Cash & Cash Equivalents', type: 'asset', parentCode: '11', level: 3, balance: 68500, isDebitNature: true, isSystem: true },
    { id: 'acc-1111', tenantId: 'tenant-1', code: '1111', nameAr: 'الصندوق الرئيسي (كاش)', nameEn: 'Main Cash Register', type: 'asset', parentCode: '111', level: 4, balance: 18500, isDebitNature: true, isSystem: false },
    { id: 'acc-1112', tenantId: 'tenant-1', code: '1112', nameAr: 'مصرف الراجحي - الحساب الجاري', nameEn: 'Al Rajhi Bank Account', type: 'asset', parentCode: '111', level: 4, balance: 50000, isDebitNature: true, isSystem: false },
    { id: 'acc-112', tenantId: 'tenant-1', code: '112', nameAr: 'العملاء والمدينون التجاريون', nameEn: 'Accounts Receivable', type: 'asset', parentCode: '11', level: 3, balance: 34500, isDebitNature: true, isSystem: true },
    { id: 'acc-113', tenantId: 'tenant-1', code: '113', nameAr: 'المخزون السلعي (بضاعة آخر المدة)', nameEn: 'Merchandise Inventory', type: 'asset', parentCode: '11', level: 3, balance: 37500, isDebitNature: true, isSystem: true },
    { id: 'acc-114', tenantId: 'tenant-1', code: '114', nameAr: 'ضريبة القيمة المضافة على المدخلات (مشتريات)', nameEn: 'VAT Input (Recoverable)', type: 'asset', parentCode: '11', level: 3, balance: 4500, isDebitNature: true, isSystem: true },

    // الخصوم
    { id: 'acc-2', tenantId: 'tenant-1', code: '2', nameAr: 'الخصوم والالتزامات', nameEn: 'Liabilities', type: 'liability', parentCode: null, level: 1, balance: 25000, isDebitNature: false, isSystem: true },
    { id: 'acc-21', tenantId: 'tenant-1', code: '21', nameAr: 'الالتزامات المتداولة', nameEn: 'Current Liabilities', type: 'liability', parentCode: '2', level: 2, balance: 25000, isDebitNature: false, isSystem: true },
    { id: 'acc-211', tenantId: 'tenant-1', code: '211', nameAr: 'الموردون والدائنون التجاريون', nameEn: 'Accounts Payable', type: 'liability', parentCode: '21', level: 3, balance: 18000, isDebitNature: false, isSystem: true },
    { id: 'acc-212', tenantId: 'tenant-1', code: '212', nameAr: 'أمانات ضريبة القيمة المضافة (مخرجات المبيعات)', nameEn: 'VAT Output Payable', type: 'liability', parentCode: '21', level: 3, balance: 7000, isDebitNature: false, isSystem: true },

    // حقوق الملكية
    { id: 'acc-3', tenantId: 'tenant-1', code: '3', nameAr: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', parentCode: null, level: 1, balance: 95000, isDebitNature: false, isSystem: true },
    { id: 'acc-31', tenantId: 'tenant-1', code: '31', nameAr: 'رأس المال المدفوع', nameEn: 'Paid-in Capital', type: 'equity', parentCode: '3', level: 2, balance: 80000, isDebitNature: false, isSystem: true },
    { id: 'acc-32', tenantId: 'tenant-1', code: '32', nameAr: 'الأرباح المبقاة والمرحلة', nameEn: 'Retained Earnings', type: 'equity', parentCode: '3', level: 2, balance: 15000, isDebitNature: false, isSystem: true },

    // الإيرادات
    { id: 'acc-4', tenantId: 'tenant-1', code: '4', nameAr: 'الإيرادات', nameEn: 'Revenues', type: 'revenue', parentCode: null, level: 1, balance: 75000, isDebitNature: false, isSystem: true },
    { id: 'acc-41', tenantId: 'tenant-1', code: '41', nameAr: 'إيرادات المبيعات والخدمات', nameEn: 'Sales Revenues', type: 'revenue', parentCode: '4', level: 2, balance: 75000, isDebitNature: false, isSystem: true },
    { id: 'acc-411', tenantId: 'tenant-1', code: '411', nameAr: 'مبيعات المنتجات الخاضعة لضريبة 15%', nameEn: 'Standard Rated Sales (15%)', type: 'revenue', parentCode: '41', level: 3, balance: 75000, isDebitNature: false, isSystem: true },

    // المصروفات
    { id: 'acc-5', tenantId: 'tenant-1', code: '5', nameAr: 'المصروفات والتكاليف', nameEn: 'Expenses', type: 'expense', parentCode: null, level: 1, balance: 50000, isDebitNature: true, isSystem: true },
    { id: 'acc-51', tenantId: 'tenant-1', code: '51', nameAr: 'تكلفة البضاعة المباعة (COGS)', nameEn: 'Cost of Goods Sold', type: 'expense', parentCode: '5', level: 2, balance: 42000, isDebitNature: true, isSystem: true },
    { id: 'acc-511', tenantId: 'tenant-1', code: '511', nameAr: 'تكلفة مشتريات البضاعة المباعة', nameEn: 'Inventory COGS', type: 'expense', parentCode: '51', level: 3, balance: 42000, isDebitNature: true, isSystem: true },
    { id: 'acc-52', tenantId: 'tenant-1', code: '52', nameAr: 'المصروفات التشغيلية والإدارية', nameEn: 'Operating & Admin Expenses', type: 'expense', parentCode: '5', level: 2, balance: 8000, isDebitNature: true, isSystem: true },
    { id: 'acc-521', tenantId: 'tenant-1', code: '521', nameAr: 'إيجارات ومرافق', nameEn: 'Rent & Utilities', type: 'expense', parentCode: '52', level: 3, balance: 5000, isDebitNature: true, isSystem: false },
    { id: 'acc-522', tenantId: 'tenant-1', code: '522', nameAr: 'مصاريف تسويق وضيافة', nameEn: 'Marketing & Hospitality', type: 'expense', parentCode: '52', level: 3, balance: 3000, isDebitNature: true, isSystem: false },
  ]);

  public readonly accounts = computed(() => {
    const tenantId = this.activeTenantIdSignal();
    return this.accountsSignal().filter((a) => a.tenantId === tenantId || a.tenantId === 'tenant-1');
  });

  // 3. Products & Costing Signal
  private productsSignal = signal<ProductItem[]>([
    {
      id: 'prod-1',
      tenantId: 'tenant-1',
      sku: 'PRD-SRV-01',
      barcode: '6281000101',
      nameAr: 'خادم شبكي ديل باور إيدج Enterprise R750',
      nameEn: 'Dell PowerEdge R750 Server',
      category: 'أجهزة وشبكات',
      unit: 'حبة',
      currentStock: 12,
      averageCost: 14500, // متوسط التكلفة المرجح
      lastPurchaseCost: 14800,
      sellingPrice: 18900,
      vatRate: 15,
      minStockLevel: 3,
    },
    {
      id: 'prod-2',
      tenantId: 'tenant-1',
      sku: 'PRD-SWT-02',
      barcode: '6281000102',
      nameAr: 'مفتاح توزيع شبكات سيسكو كاتاليست 48 منفذ PoE',
      nameEn: 'Cisco Catalyst 48-Port PoE Switch',
      category: 'أجهزة وشبكات',
      unit: 'حبة',
      currentStock: 25,
      averageCost: 4200,
      lastPurchaseCost: 4350,
      sellingPrice: 5800,
      vatRate: 15,
      minStockLevel: 5,
    },
    {
      id: 'prod-3',
      tenantId: 'tenant-1',
      sku: 'PRD-UPS-03',
      barcode: '6281000103',
      nameAr: 'وحدة طاقة احتياطية ذكية APC Smart-UPS 3000VA',
      nameEn: 'APC Smart-UPS 3000VA LCD',
      category: 'طاقة وحماية',
      unit: 'حبة',
      currentStock: 18,
      averageCost: 2800,
      lastPurchaseCost: 2750,
      sellingPrice: 3950,
      vatRate: 15,
      minStockLevel: 4,
    },
    {
      id: 'prod-4',
      tenantId: 'tenant-1',
      sku: 'PRD-CAB-04',
      barcode: '6281000104',
      nameAr: 'كيبل ألياف بصرية أحادي الوضع 1000 متر Cat6A',
      nameEn: 'Fiber Optic Cable Roll Cat6A 1000m',
      category: 'مستهلكات وكابلات',
      unit: 'لفة',
      currentStock: 45,
      averageCost: 650,
      lastPurchaseCost: 680,
      sellingPrice: 990,
      vatRate: 15,
      minStockLevel: 10,
    },
    {
      id: 'prod-5',
      tenantId: 'tenant-1',
      sku: 'PRD-CAM-05',
      barcode: '6281000105',
      nameAr: 'كاميرا مراقبة ذكية هيك فيجن 4K مع رؤية ليلية',
      nameEn: 'Hikvision 4K IP Camera PoE',
      category: 'أنظمة أمنية',
      unit: 'حبة',
      currentStock: 60,
      averageCost: 310,
      lastPurchaseCost: 325,
      sellingPrice: 480,
      vatRate: 15,
      minStockLevel: 15,
    },
  ]);

  public readonly products = computed(() => {
    const tenantId = this.activeTenantIdSignal();
    return this.productsSignal().filter((p) => p.tenantId === tenantId || p.tenantId === 'tenant-1');
  });

  // 3.1 Customers Signal (العملاء)
  private customersSignal = signal<Customer[]>([
    {
      id: 'cust-1',
      tenantId: 'tenant-1',
      code: 'CUST-001',
      nameAr: 'شركة الشموخ للتجارة والمقاولات',
      nameEn: 'Al-Shomoukh Trading & Contracting Co.',
      vatNumber: '300123456700003',
      crNumber: '1010887766',
      phone: '+966 50 111 2233',
      email: 'finance@shomoukh.sa',
      contactPerson: 'م. سامي الحربي',
      city: 'الرياض',
      district: 'حي الملز',
      street: 'طريق صلاح الدين الأيوبي',
      buildingNo: '2450',
      postalCode: '12831',
      additionalNo: '7821',
      creditLimit: 150000,
      creditPeriodDays: 60,
      openingBalance: 15000,
      currentBalance: 34500,
      accountCode: '112',
      status: 'active',
      notes: 'عميل رئيسي للمشاريع والشبكات، معتمد بأمر شراء رسمي'
    },
    {
      id: 'cust-2',
      tenantId: 'tenant-1',
      code: 'CUST-002',
      nameAr: 'مؤسسة النخبة للحلول الرقمية',
      nameEn: 'Al-Nokhba Digital Solutions Est.',
      vatNumber: '310554433200003',
      crNumber: '1010332211',
      phone: '+966 55 444 7788',
      email: 'info@nokhba-it.com',
      contactPerson: 'أ. هاني السالم',
      city: 'جدة',
      district: 'حي الروضة',
      street: 'شارع الأمير محمد بن عبد العزيز',
      buildingNo: '4120',
      postalCode: '23432',
      additionalNo: '3412',
      creditLimit: 60000,
      creditPeriodDays: 30,
      openingBalance: 5000,
      currentBalance: 12800,
      accountCode: '112',
      status: 'active',
      notes: 'عميل تقنيات وخدمات استضافة سحابية'
    },
    {
      id: 'cust-3',
      tenantId: 'tenant-1',
      code: 'CUST-003',
      nameAr: 'شركة البناء الحديث للتطوير العقاري',
      nameEn: 'Modern Construction & Real Estate Co.',
      vatNumber: '300998877600003',
      crNumber: '2050112233',
      phone: '+966 53 999 4455',
      email: 'procurement@modernbuild.sa',
      contactPerson: 'م. عبدالله القحطاني',
      city: 'الدمام',
      district: 'حي الشاطئ',
      street: 'طريق الملك عبدالله',
      buildingNo: '1890',
      postalCode: '32414',
      additionalNo: '4509',
      creditLimit: 200000,
      creditPeriodDays: 90,
      openingBalance: 0,
      currentBalance: 24725,
      accountCode: '112',
      status: 'active',
      notes: 'عقود بنية تحتية ومستلزمات مراقبة وأنظمة ذكية'
    },
    {
      id: 'cust-4',
      tenantId: 'tenant-1',
      code: 'CUST-004',
      nameAr: 'عميل نقدي عام (معارض وفروع التجزئة)',
      nameEn: 'General Cash Walk-in Customer',
      vatNumber: '',
      crNumber: '',
      phone: '+966 50 000 0000',
      email: 'cashier@alofuq.com.sa',
      contactPerson: 'كاشير المبيعات اليومية',
      city: 'الرياض',
      district: 'العليا',
      creditLimit: 0,
      creditPeriodDays: 0,
      openingBalance: 0,
      currentBalance: 0,
      accountCode: '1111',
      status: 'active',
      notes: 'حساب مخصص للمبيعات النقدية المباشرة والمبسطة B2C'
    }
  ]);

  public readonly customers = computed(() => {
    const tenantId = this.activeTenantIdSignal();
    return this.customersSignal().filter((c) => c.tenantId === tenantId || c.tenantId === 'tenant-1');
  });

  // 3.2 Suppliers Signal (الموردين)
  private suppliersSignal = signal<Supplier[]>([
    {
      id: 'supp-1',
      tenantId: 'tenant-1',
      code: 'SUPP-001',
      nameAr: 'شركة التوريدات العالمية للأجهزة الإلكترونية',
      nameEn: 'Global Electronics Supplies Co.',
      vatNumber: '310998877600003',
      crNumber: '1010665544',
      phone: '+966 11 222 3344',
      email: 'orders@global-elec.sa',
      contactPerson: 'أ. طارق الشريف',
      city: 'الرياض',
      address: 'المنطقة الصناعية الثانية، مستودع B4',
      bankName: 'بنك الرياض',
      iban: 'SA4420000001234567890123',
      swiftCode: 'RIBLSARI',
      paymentTermsDays: 30,
      openingBalance: 10000,
      currentBalance: 18000,
      accountCode: '211',
      status: 'active',
      notes: 'وكيل رسمي ومعتمد لأجهزة الخوادم والشبكات'
    },
    {
      id: 'supp-2',
      tenantId: 'tenant-1',
      code: 'SUPP-002',
      nameAr: 'مصنع الكابلات والألياف الوطنية',
      nameEn: 'National Cables & Fiber Factory',
      vatNumber: '300223344500003',
      crNumber: '2050445566',
      phone: '+966 13 888 7766',
      email: 'sales@nationalcables.com.sa',
      contactPerson: 'م. بدر الشهري',
      city: 'الجبيل',
      address: 'المدينة الصناعية، شارع 108',
      bankName: 'البنك الأهلي السعودي (SNB)',
      iban: 'SA0310000009876543210987',
      swiftCode: 'NCBKSARI',
      paymentTermsDays: 45,
      openingBalance: 4000,
      currentBalance: 7500,
      accountCode: '211',
      status: 'active',
      notes: 'توريد كابلات الألياف البصرية ومستلزمات التمديد'
    },
    {
      id: 'supp-3',
      tenantId: 'tenant-1',
      code: 'SUPP-003',
      nameAr: 'شركة التقنية المتحدة لأنظمة المراقبة والحماية',
      nameEn: 'United Tech for Security Systems',
      vatNumber: '311887766500003',
      crNumber: '4030778899',
      phone: '+966 12 665 4321',
      email: 'support@unitedtech-sec.sa',
      contactPerson: 'م. رائد المالكي',
      city: 'جدة',
      address: 'طريق المدينة المنورة، مجمع تكنولوجيا الأعمال',
      bankName: 'مصرف الراجحي',
      iban: 'SA5580000201608010123456',
      swiftCode: 'RAJISARI',
      paymentTermsDays: 15,
      openingBalance: 12000,
      currentBalance: 22000,
      accountCode: '211',
      status: 'active',
      notes: 'موزع معتمد لكاميرات المراقبة وأجهزة إنذار الحريق'
    }
  ]);

  public readonly suppliers = computed(() => {
    const tenantId = this.activeTenantIdSignal();
    return this.suppliersSignal().filter((s) => s.tenantId === tenantId || s.tenantId === 'tenant-1');
  });

  // 3.3 Units of Measure Signal (وحدات القياس)
  private unitsSignal = signal<UnitOfMeasure[]>([
    { id: 'uom-1', code: 'PCS', nameAr: 'حبة / قطعة', nameEn: 'Piece', symbol: 'حبة', isBaseUnit: true, conversionFactor: 1, status: 'active' },
    { id: 'uom-2', code: 'BOX', nameAr: 'كرتون (12 حبة)', nameEn: 'Box (12 pcs)', symbol: 'كرتون', isBaseUnit: false, baseUnitCode: 'PCS', conversionFactor: 12, status: 'active' },
    { id: 'uom-3', code: 'DOZ', nameAr: 'درزن (12 حبة)', nameEn: 'Dozen', symbol: 'درزن', isBaseUnit: false, baseUnitCode: 'PCS', conversionFactor: 12, status: 'active' },
    { id: 'uom-4', code: 'PACK', nameAr: 'طقم / باقة متكاملة', nameEn: 'Pack / Set', symbol: 'طقم', isBaseUnit: true, conversionFactor: 1, status: 'active' },
    { id: 'uom-5', code: 'MTR', nameAr: 'متر طولي', nameEn: 'Linear Meter', symbol: 'م', isBaseUnit: true, conversionFactor: 1, status: 'active' },
    { id: 'uom-6', code: 'ROLL', nameAr: 'لفة / رول (1000 متر)', nameEn: 'Roll (1000m)', symbol: 'لفة', isBaseUnit: false, baseUnitCode: 'MTR', conversionFactor: 1000, status: 'active' },
    { id: 'uom-7', code: 'KG', nameAr: 'كيلوجرام', nameEn: 'Kilogram', symbol: 'كجم', isBaseUnit: true, conversionFactor: 1, status: 'active' },
    { id: 'uom-8', code: 'TON', nameAr: 'طن متري (1000 كجم)', nameEn: 'Metric Ton', symbol: 'طن', isBaseUnit: false, baseUnitCode: 'KG', conversionFactor: 1000, status: 'active' },
    { id: 'uom-9', code: 'LTR', nameAr: 'لتر سائل', nameEn: 'Liter', symbol: 'لتر', isBaseUnit: true, conversionFactor: 1, status: 'active' },
  ]);

  public readonly units = computed(() => this.unitsSignal());

  // 3.4 Currencies Signal (العملات وأسعار الصرف)
  private currenciesSignal = signal<Currency[]>([
    { id: 'cur-1', code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', symbol: 'ر.س', isBaseCurrency: true, exchangeRate: 1.0, decimalPlaces: 2, lastUpdated: '2026-09-14', status: 'active' },
    { id: 'cur-2', code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', symbol: '$', isBaseCurrency: false, exchangeRate: 3.7500, decimalPlaces: 2, lastUpdated: '2026-09-14', status: 'active' },
    { id: 'cur-3', code: 'EUR', nameAr: 'يورو أوروبي', nameEn: 'Euro', symbol: '€', isBaseCurrency: false, exchangeRate: 4.0850, decimalPlaces: 2, lastUpdated: '2026-09-14', status: 'active' },
    { id: 'cur-4', code: 'AED', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham', symbol: 'د.إ', isBaseCurrency: false, exchangeRate: 1.0210, decimalPlaces: 2, lastUpdated: '2026-09-14', status: 'active' },
    { id: 'cur-5', code: 'KWD', nameAr: 'دينار كويتي', nameEn: 'Kuwaiti Dinar', symbol: 'د.ك', isBaseCurrency: false, exchangeRate: 12.2450, decimalPlaces: 3, lastUpdated: '2026-09-14', status: 'active' },
    { id: 'cur-6', code: 'GBP', nameAr: 'جنيه إسترليني', nameEn: 'British Pound', symbol: '£', isBaseCurrency: false, exchangeRate: 4.8620, decimalPlaces: 2, lastUpdated: '2026-09-14', status: 'active' },
  ]);

  public readonly currencies = computed(() => this.currenciesSignal());

  // 3.5 Payment Methods Signal (طرق الدفع والتحصيل)
  private paymentMethodsSignal = signal<PaymentMethodItem[]>([
    {
      id: 'pm-1',
      code: 'cash',
      nameAr: 'نقداً (صندوق الكاشير الرئيسي)',
      nameEn: 'Cash on Hand',
      type: 'cash',
      linkedAccountCode: '1111',
      linkedAccountName: 'الصندوق الرئيسي (كاش)',
      icon: 'payments',
      requiresReference: false,
      status: 'active'
    },
    {
      id: 'pm-2',
      code: 'pos_mada',
      nameAr: 'شبكة / مدى (نقاط البيع الإلكترونية Mada)',
      nameEn: 'Mada POS / Debit Card',
      type: 'card',
      linkedAccountCode: '1112',
      linkedAccountName: 'مصرف الراجحي - الحساب الجاري',
      icon: 'contactless',
      commissionPercent: 0.8,
      requiresReference: true,
      status: 'active'
    },
    {
      id: 'pm-3',
      code: 'credit_card',
      nameAr: 'بطاقة ائتمانية (Visa / MasterCard)',
      nameEn: 'Credit Card',
      type: 'card',
      linkedAccountCode: '1112',
      linkedAccountName: 'مصرف الراجحي - الحساب الجاري',
      icon: 'credit_card',
      commissionPercent: 1.75,
      requiresReference: true,
      status: 'active'
    },
    {
      id: 'pm-4',
      code: 'bank_transfer',
      nameAr: 'تحويل بنكي مباشر (سريع / IBAN)',
      nameEn: 'Bank Wire Transfer',
      type: 'bank',
      linkedAccountCode: '1112',
      linkedAccountName: 'مصرف الراجحي - الحساب الجاري',
      icon: 'account_balance',
      requiresReference: true,
      status: 'active'
    },
    {
      id: 'pm-5',
      code: 'cheque',
      nameAr: 'شيك مصرفي مقاصة',
      nameEn: 'Bank Cheque',
      type: 'cheque',
      linkedAccountCode: '111',
      linkedAccountName: 'النقد وما في حكمه (شيكات)',
      icon: 'receipt_long',
      requiresReference: true,
      status: 'active'
    },
    {
      id: 'pm-6',
      code: 'credit',
      nameAr: 'آجل (على الحساب - ذمم مدينة/دائنة)',
      nameEn: 'On Account / Credit Term',
      type: 'credit',
      linkedAccountCode: '112',
      linkedAccountName: 'العملاء والمدينون التجاريون',
      icon: 'assignment_ind',
      requiresReference: false,
      status: 'active'
    },
  ]);

  public readonly paymentMethods = computed(() => this.paymentMethodsSignal());

  // 3.6 Product Categories (فئات الأصناف)
  private categoriesSignal = signal<ProductCategory[]>([
    { id: 'cat-1', code: 'CAT-NET', nameAr: 'أجهزة وشبكات وخوادم', nameEn: 'Servers & Networking', itemCount: 15, description: 'خوادم المؤسسات، مبدلات سيسكو، ملحقات مراكز البيانات' },
    { id: 'cat-2', code: 'CAT-PWR', nameAr: 'طاقة وحماية كهربائية', nameEn: 'Power & UPS Systems', itemCount: 8, description: 'وحدات الطاقة غير المنقطعة UPS والمولدات الاحتياطية' },
    { id: 'cat-3', code: 'CAT-CAB', nameAr: 'مستهلكات وكابلات وبنية تحتية', nameEn: 'Cabling & Infrastructure', itemCount: 42, description: 'كابلات الفايبر والألياف البصرية، كابلات الشبكة والموصلات' },
    { id: 'cat-4', code: 'CAT-SEC', nameAr: 'أنظمة أمنية ومراقبة ذكية', nameEn: 'Security & Surveillance', itemCount: 24, description: 'كاميرات المراقبة IP وأجهزة التسجيل NVR وأنظمة الدخول' },
    { id: 'cat-5', code: 'CAT-PC', nameAr: 'أجهزة حاسب آلي ومحطات عمل', nameEn: 'Computers & Workstations', itemCount: 19, description: 'حواسيب مكتبية ومحمولة ومحطات عمل جرافيك' },
    { id: 'cat-6', code: 'CAT-SW', nameAr: 'برمجيات ورخص سحابية', nameEn: 'Software & Licenses', itemCount: 6, description: 'أنظمة التشغيل السحابية وحزم الحماية الإلكترونية' },
  ]);

  public readonly categories = computed(() => this.categoriesSignal());

  // 3.7 Warehouses (المستودعات ومواقع التخزين)
  private warehousesSignal = signal<Warehouse[]>([
    {
      id: 'wh-1',
      tenantId: 'tenant-1',
      code: 'WH-MAIN',
      nameAr: 'المستودع المركزي الرئيسي - الرياض',
      nameEn: 'Central Warehouse - Riyadh',
      location: 'الرياض، حي السلي اللوجستي، مجمع 14',
      managerName: 'م. خالد المنصور',
      phone: '+966 11 333 4455',
      isDefault: true,
      status: 'active'
    },
    {
      id: 'wh-2',
      tenantId: 'tenant-1',
      code: 'WH-WEST',
      nameAr: 'مستودع المنطقة الغربية - جدة',
      nameEn: 'Western Region Warehouse - Jeddah',
      location: 'جدة، حي الخمرة، بجوار ميناء جدة الإسلامي',
      managerName: 'أ. عادل الزهراني',
      phone: '+966 12 777 8899',
      isDefault: false,
      status: 'active'
    },
    {
      id: 'wh-3',
      tenantId: 'tenant-1',
      code: 'WH-EAST',
      nameAr: 'مستودع المنطقة الشرقية - الدمام',
      nameEn: 'Eastern Region Warehouse - Dammam',
      location: 'الدمام، طريق الميناء، مجمع الظهران للمستودعات',
      managerName: 'أ. فهد القحطاني',
      phone: '+966 13 444 5566',
      isDefault: false,
      status: 'active'
    }
  ]);

  public readonly warehouses = computed(() => {
    const tenantId = this.activeTenantIdSignal();
    return this.warehousesSignal().filter((w) => w.tenantId === tenantId || w.tenantId === 'tenant-1');
  });

  // 4. Invoices Signal (Sales & Purchases)
  private invoicesSignal = signal<Invoice[]>([
    {
      id: 'inv-101',
      tenantId: 'tenant-1',
      kind: 'sales',
      invoiceNumber: 'INV-2026-0001',
      uuid: '7d3c0bb2-6fa1-4dc7-a3b0-0b31e9c8a11a',
      issueDate: '2026-09-12',
      issueTime: '10:30:00',
      invoiceType: 'simplified',
      partyName: 'شركة البناء الحديث للتطوير العقاري',
      partyVatNumber: '310999888777003',
      paymentMethod: 'bank_transfer',
      items: [
        {
          id: 'item-1',
          itemId: 'prod-1',
          itemName: 'خادم شبكي ديل باور إيدج Enterprise R750',
          sku: 'PRD-SRV-01',
          unit: 'حبة',
          quantity: 2,
          unitPrice: 18900,
          unitCost: 14500,
          discount: 800,
          vatRate: 15,
          vatAmount: 5550,
          totalBeforeVat: 37000,
          totalAfterVat: 42550,
        },
        {
          id: 'item-2',
          itemId: 'prod-2',
          itemName: 'مفتاح توزيع شبكات سيسكو كاتاليست 48 منفذ PoE',
          sku: 'PRD-SWT-02',
          unit: 'حبة',
          quantity: 1,
          unitPrice: 5800,
          unitCost: 4200,
          discount: 0,
          vatRate: 15,
          vatAmount: 870,
          totalBeforeVat: 5800,
          totalAfterVat: 6670,
        }
      ],
      subtotal: 42800,
      discountTotal: 800,
      vatTotal: 6420,
      grandTotal: 49220,
      totalCost: 33200,
      grossProfit: 9600,
      status: 'posted',
      zatcaStatus: 'cleared',
      zatcaHash: '4a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      zatcaQrCode: '',
      zatcaValidationMessages: ['تم التدقيق والمطابقة مع متطلبات هيئة الزكاة والضريبة (Clearence Passed)'],
      journalEntryId: 'je-101',
      notes: 'تم التسليم والتركيب وفق أمر التوريد المعتمد',
    },
    {
      id: 'inv-102',
      tenantId: 'tenant-1',
      kind: 'sales',
      invoiceNumber: 'INV-2026-0002',
      uuid: 'a8b9c0d1-e2f3-4a5b-6c7d-8e9f0a1b2c3d',
      issueDate: '2026-09-13',
      issueTime: '14:15:00',
      invoiceType: 'tax_invoice',
      partyName: 'مجموعة المدى للاستشارات الهندسية',
      partyVatNumber: '310444555666003',
      partyAddress: 'الرياض - طريق التخصصي',
      paymentMethod: 'credit',
      items: [
        {
          id: 'item-3',
          itemId: 'prod-3',
          itemName: 'وحدة طاقة احتياطية ذكية APC Smart-UPS 3000VA',
          sku: 'PRD-UPS-03',
          unit: 'حبة',
          quantity: 3,
          unitPrice: 3950,
          unitCost: 2800,
          discount: 350,
          vatRate: 15,
          vatAmount: 1725,
          totalBeforeVat: 11500,
          totalAfterVat: 13225,
        }
      ],
      subtotal: 11500,
      discountTotal: 350,
      vatTotal: 1725,
      grandTotal: 13225,
      totalCost: 8400,
      grossProfit: 3100,
      status: 'posted',
      zatcaStatus: 'reported',
      zatcaHash: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
      zatcaValidationMessages: ['تم الإبلاغ بنجاح إلى منصة فاتورة (Reported Successfully)'],
      journalEntryId: 'je-102',
      notes: 'دفع آجل خلال 30 يوماً',
    },
    {
      id: 'inv-pur-201',
      tenantId: 'tenant-1',
      kind: 'purchase',
      invoiceNumber: 'PUR-2026-0085',
      uuid: '4f5e6d7c-8b9a-0123-4567-89abcdef0123',
      issueDate: '2026-09-10',
      issueTime: '09:00:00',
      invoiceType: 'tax_invoice',
      partyName: 'مؤسسة الوكيل المعتمد للتقنية الحديثة',
      partyVatNumber: '300111222333003',
      paymentMethod: 'bank_transfer',
      items: [
        {
          id: 'pur-item-1',
          itemId: 'prod-1',
          itemName: 'خادم شبكي ديل باور إيدج Enterprise R750',
          sku: 'PRD-SRV-01',
          unit: 'حبة',
          quantity: 5,
          unitPrice: 14800,
          unitCost: 14800,
          discount: 0,
          vatRate: 15,
          vatAmount: 11100,
          totalBeforeVat: 74000,
          totalAfterVat: 85100,
        }
      ],
      subtotal: 74000,
      discountTotal: 0,
      vatTotal: 11100,
      grandTotal: 85100,
      totalCost: 74000,
      grossProfit: 0,
      status: 'posted',
      zatcaStatus: 'cleared',
      journalEntryId: 'je-pur-201',
      notes: 'شراء دفعة خوادم معتمدة بضمان الوكيل',
    }
  ]);

  public readonly invoices = computed(() => {
    const tenantId = this.activeTenantIdSignal();
    return this.invoicesSignal().filter((inv) => inv.tenantId === tenantId || inv.tenantId === 'tenant-1');
  });

  // 5. Vouchers Signal (Receipt & Payment)
  private vouchersSignal = signal<Voucher[]>([
    {
      id: 'vouch-1',
      tenantId: 'tenant-1',
      voucherNumber: 'RCV-2026-0012',
      type: 'receipt', // سند قبض
      date: '2026-09-13',
      amount: 25000,
      amountInWordsAr: 'فقط خمسة وعشرون ألف ريالاً سعودياً لا غير',
      partyName: 'شركة البناء الحديث للتطوير العقاري',
      partyAccountCode: '112', // حساب العملاء
      treasuryAccountCode: '1112', // حساب بنك الراجحي
      paymentMethod: 'bank_transfer',
      referenceNumber: 'TRF-9874102',
      notes: 'دفعة نقدية تحت حساب فاتورة المبيعات رقم INV-2026-0001',
      journalEntryId: 'je-vouch-1',
      receivedOrPaidBy: 'أحمد السعيد - المحاسب العام',
    },
    {
      id: 'vouch-2',
      tenantId: 'tenant-1',
      voucherNumber: 'PAY-2026-0008',
      type: 'payment', // سند صرف
      date: '2026-09-12',
      amount: 15000,
      amountInWordsAr: 'فقط خمسة عشر ألف ريالاً سعودياً لا غير',
      partyName: 'مؤسسة الوكيل المعتمد للتقنية الحديثة',
      partyAccountCode: '211', // حساب الموردين
      treasuryAccountCode: '1112', // بنك الراجحي
      paymentMethod: 'bank_transfer',
      referenceNumber: 'TRF-665544',
      notes: 'سداد جزء من مستحقات فاتورة الشراء رقم PUR-2026-0085',
      journalEntryId: 'je-vouch-2',
      receivedOrPaidBy: 'فهد العتيبي - أمين الصندوق',
    },
    {
      id: 'vouch-3',
      tenantId: 'tenant-1',
      voucherNumber: 'PAY-2026-0009',
      type: 'payment', // سند صرف
      date: '2026-09-14',
      amount: 3200,
      amountInWordsAr: 'فقط ثلاثة آلاف ومئتان ريالاً سعودياً لا غير',
      partyName: 'شركة الكهرباء والمياه الوطنية',
      partyAccountCode: '521', // مصاريف ومرافق
      treasuryAccountCode: '1111', // الصندوق الرئيسي
      paymentMethod: 'cash',
      referenceNumber: 'REC-BILL-901',
      notes: 'سداد فواتير الكهرباء والإنترنت لمقر الشركة لشهر سبتمبر',
      journalEntryId: 'je-vouch-3',
      receivedOrPaidBy: 'فهد العتيبي - أمين الصندوق',
    }
  ]);

  public readonly vouchers = computed(() => {
    const tenantId = this.activeTenantIdSignal();
    return this.vouchersSignal().filter((v) => v.tenantId === tenantId || v.tenantId === 'tenant-1');
  });

  // 6. Journal Entries Signal (قيود اليومية التلقائية)
  private journalEntriesSignal = signal<JournalEntry[]>([
    {
      id: 'je-101',
      tenantId: 'tenant-1',
      entryNumber: 'JV-2026-0101',
      date: '2026-09-12',
      description: 'إثبات مبيعات فاتورة رقم INV-2026-0001 وإثبات تكلفة البضاعة المباعة والمخزون',
      referenceType: 'sales',
      referenceNumber: 'INV-2026-0001',
      totalDebit: 82420,
      totalCredit: 82420,
      isBalanced: true,
      createdAt: '2026-09-12 10:30',
      lines: [
        { id: 'jl-1', accountCode: '1112', accountName: 'مصرف الراجحي - الحساب الجاري', debit: 49220, credit: 0, notes: 'تحصيل قيمة الفاتورة' },
        { id: 'jl-2', accountCode: '411', accountName: 'مبيعات المنتجات الخاضعة لضريبة 15%', debit: 0, credit: 42800, notes: 'إيراد المبيعات' },
        { id: 'jl-3', accountCode: '212', accountName: 'أمانات ضريبة القيمة المضافة (مخرجات)', debit: 0, credit: 6420, notes: 'ضريبة المخرجات 15%' },
        { id: 'jl-4', accountCode: '511', accountName: 'تكلفة مشتريات البضاعة المباعة (COGS)', debit: 33200, credit: 0, notes: 'تكلفة البضاعة المباعة وفق متوسط التكلفة' },
        { id: 'jl-5', accountCode: '113', accountName: 'المخزون السلعي (بضاعة آخر المدة)', debit: 0, credit: 33200, notes: 'تخفيض المخزون بتكلفة البضاعة' },
      ]
    },
    {
      id: 'je-pur-201',
      tenantId: 'tenant-1',
      entryNumber: 'JV-2026-0085',
      date: '2026-09-10',
      description: 'إثبات مشتريات بضاعة فاتورة رقم PUR-2026-0085 وتحديث المخزون ومتوسط التكلفة',
      referenceType: 'purchase',
      referenceNumber: 'PUR-2026-0085',
      totalDebit: 85100,
      totalCredit: 85100,
      isBalanced: true,
      createdAt: '2026-09-10 09:00',
      lines: [
        { id: 'jl-p1', accountCode: '113', accountName: 'المخزون السلعي (بضاعة آخر المدة)', debit: 74000, credit: 0, notes: 'إضافة المشتريات للمخزون' },
        { id: 'jl-p2', accountCode: '114', accountName: 'ضريبة القيمة المضافة على المدخلات', debit: 11100, credit: 0, notes: 'ضريبة المشتريات المستردة 15%' },
        { id: 'jl-p3', accountCode: '211', accountName: 'الموردون والدائنون التجاريون', debit: 0, credit: 85100, notes: 'استحقاق للمورد' },
      ]
    },
    {
      id: 'je-vouch-1',
      tenantId: 'tenant-1',
      entryNumber: 'JV-2026-0012',
      date: '2026-09-13',
      description: 'إثبات سند قبض رقم RCV-2026-0012 من العميل شركة البناء الحديث',
      referenceType: 'receipt_voucher',
      referenceNumber: 'RCV-2026-0012',
      totalDebit: 25000,
      totalCredit: 25000,
      isBalanced: true,
      createdAt: '2026-09-13 11:00',
      lines: [
        { id: 'jl-v1', accountCode: '1112', accountName: 'مصرف الراجحي - الحساب الجاري', debit: 25000, credit: 0, notes: 'إيداع بنكي' },
        { id: 'jl-v2', accountCode: '112', accountName: 'العملاء والمدينون التجاريون', debit: 0, credit: 25000, notes: 'سداد من حساب العميل' },
      ]
    }
  ]);

  public readonly journalEntries = computed(() => {
    const tenantId = this.activeTenantIdSignal();
    return this.journalEntriesSignal().filter((j) => j.tenantId === tenantId || j.tenantId === 'tenant-1');
  });

  // 7. Stock Movements Signal
  private stockMovementsSignal = signal<StockMovement[]>([
    {
      id: 'sm-1',
      tenantId: 'tenant-1',
      itemId: 'prod-1',
      itemName: 'خادم شبكي ديل باور إيدج Enterprise R750',
      date: '2026-09-10',
      type: 'in_purchase',
      quantity: 5,
      unitCost: 14800,
      referenceNumber: 'PUR-2026-0085',
      remainingStock: 14,
    },
    {
      id: 'sm-2',
      tenantId: 'tenant-1',
      itemId: 'prod-1',
      itemName: 'خادم شبكي ديل باور إيدج Enterprise R750',
      date: '2026-09-12',
      type: 'out_sales',
      quantity: 2,
      unitCost: 14500,
      unitPrice: 18900,
      referenceNumber: 'INV-2026-0001',
      remainingStock: 12,
    }
  ]);

  public readonly stockMovements = computed(() => {
    const tenantId = this.activeTenantIdSignal();
    return this.stockMovementsSignal().filter((sm) => sm.tenantId === tenantId || sm.tenantId === 'tenant-1');
  });

  // Financial Stats computed
  public readonly financialStats = computed<FinancialStats>(() => {
    const invs = this.invoices();
    const vchs = this.vouchers();
    const prods = this.products();

    let totalSales = 0;
    let totalPurchases = 0;
    let cogsTotal = 0;
    let outputVat = 0;
    let inputVat = 0;

    for (const inv of invs) {
      if (inv.status !== 'cancelled') {
        if (inv.kind === 'sales') {
          totalSales += inv.subtotal;
          outputVat += inv.vatTotal;
          cogsTotal += inv.totalCost;
        } else if (inv.kind === 'purchase') {
          totalPurchases += inv.subtotal;
          inputVat += inv.vatTotal;
        }
      }
    }

    let totalReceipts = 0;
    let totalPayments = 0;
    for (const v of vchs) {
      if (v.type === 'receipt') totalReceipts += v.amount;
      else totalPayments += v.amount;
    }

    const inventoryValuation = prods.reduce((sum, p) => sum + (p.currentStock * p.averageCost), 0);
    const netProfit = totalSales - cogsTotal - 8000; // deducting operating expenses
    const netVatPayable = outputVat - inputVat;

    return {
      totalSales,
      totalPurchases,
      totalReceipts,
      totalPayments,
      cogsTotal,
      cogs: cogsTotal,
      operatingExpenses: 8000,
      todayDate: '2026-09-14',
      netProfit,
      inventoryValuation,
      outputVat,
      inputVat,
      netVatPayable,
      cashAndBankBalance: 68500 + totalReceipts - totalPayments,
      receivablesBalance: 34500 + (totalSales * 1.15) - totalReceipts,
      payablesBalance: 18000 + (totalPurchases * 1.15) - totalPayments,
    };
  });

  constructor() {
    // Generate QR codes for initial sales invoices
    this.refreshAllQrCodes();
    this.syncWithBackendAndFirestore();
  }

  // Multi-Tenant Switcher
  public switchTenant(tenantId: string) {
    this.activeTenantIdSignal.set(tenantId);
    this.refreshAllQrCodes();
  }

  public addTenant(tenantData: Partial<Tenant>): Tenant {
    const current = this.tenantsSignal();
    const newId = `tenant-${current.length + 1}`;
    const newTenant: Tenant = {
      id: newId,
      code: `TENANT-00${current.length + 1}`,
      nameAr: tenantData.nameAr || 'شركة جديدة',
      nameEn: tenantData.nameEn || 'New Tenant Corp',
      vatNumber: tenantData.vatNumber || '310000000000003',
      crNumber: tenantData.crNumber || '1010000000',
      address: tenantData.address || 'شارع الملك عبدالعزيز',
      city: tenantData.city || 'الرياض',
      country: 'المملكة العربية السعودية',
      phone: tenantData.phone || '+966 11 000 0000',
      email: tenantData.email || 'info@newtenant.com',
      currency: 'SAR',
      financialYearStart: '2026-01-01',
      financialYearEnd: '2026-12-31',
      zatcaConfig: {
        environment: 'sandbox',
        complianceStatus: 'in_progress',
        csid: `CSID-SANDBOX-${Math.floor(100000 + Math.random() * 900000)}`,
        solutionName: 'ERP-CleanArch-Zatca-Connector',
        solutionVersion: '2.4.0',
        registeredDevice: 'DEVICE-PRIMARY',
        autoSendInvoices: false,
      },
      subscription: tenantData.subscription,
    };
    this.tenantsSignal.set([...current, newTenant]);
    this.activeTenantIdSignal.set(newId);

    // إنشاء شجرة حسابات أولية معزولة للمستأجر الجديد تلقائياً
    this.initializeTenantAccounts(newId);

    return newTenant;
  }

  public updateTenantSubscription(tenantId: string, subscription: any) {
    this.tenantsSignal.update((list) =>
      list.map((t) => (t.id === tenantId ? { ...t, subscription } : t))
    );
  }

  private initializeTenantAccounts(tenantId: string) {
    const baseAccounts: Account[] = [
      { id: `acc-1-${tenantId}`, tenantId, code: '1', nameAr: 'الأصول', nameEn: 'Assets', type: 'asset', parentCode: null, level: 1, balance: 50000, isDebitNature: true, isSystem: true },
      { id: `acc-1111-${tenantId}`, tenantId, code: '1111', nameAr: 'الصندوق الرئيسي (كاش)', nameEn: 'Main Cash Register', type: 'asset', parentCode: '1', level: 2, balance: 10000, isDebitNature: true, isSystem: false },
      { id: `acc-1112-${tenantId}`, tenantId, code: '1112', nameAr: 'الحساب البنكي الجاري', nameEn: 'Bank Account', type: 'asset', parentCode: '1', level: 2, balance: 40000, isDebitNature: true, isSystem: false },
      { id: `acc-112-${tenantId}`, tenantId, code: '112', nameAr: 'العملاء والمدينون', nameEn: 'Accounts Receivable', type: 'asset', parentCode: '1', level: 2, balance: 0, isDebitNature: true, isSystem: true },
      { id: `acc-113-${tenantId}`, tenantId, code: '113', nameAr: 'المخزون السلعي', nameEn: 'Inventory', type: 'asset', parentCode: '1', level: 2, balance: 0, isDebitNature: true, isSystem: true },
      { id: `acc-114-${tenantId}`, tenantId, code: '114', nameAr: 'ضريبة القيمة المضافة على المدخلات', nameEn: 'VAT Input', type: 'asset', parentCode: '1', level: 2, balance: 0, isDebitNature: true, isSystem: true },
      { id: `acc-2-${tenantId}`, tenantId, code: '2', nameAr: 'الخصوم والالتزامات', nameEn: 'Liabilities', type: 'liability', parentCode: null, level: 1, balance: 0, isDebitNature: false, isSystem: true },
      { id: `acc-211-${tenantId}`, tenantId, code: '211', nameAr: 'الموردون والدائنون', nameEn: 'Accounts Payable', type: 'liability', parentCode: '2', level: 2, balance: 0, isDebitNature: false, isSystem: true },
      { id: `acc-212-${tenantId}`, tenantId, code: '212', nameAr: 'أمانات ضريبة القيمة المضافة', nameEn: 'VAT Output Payable', type: 'liability', parentCode: '2', level: 2, balance: 0, isDebitNature: false, isSystem: true },
      { id: `acc-3-${tenantId}`, tenantId, code: '3', nameAr: 'حقوق الملكية ورأس المال', nameEn: 'Equity', type: 'equity', parentCode: null, level: 1, balance: 50000, isDebitNature: false, isSystem: true },
      { id: `acc-4-${tenantId}`, tenantId, code: '4', nameAr: 'الإيرادات والمبيعات', nameEn: 'Revenues', type: 'revenue', parentCode: null, level: 1, balance: 0, isDebitNature: false, isSystem: true },
      { id: `acc-411-${tenantId}`, tenantId, code: '411', nameAr: 'مبيعات المنتجات الخاضعة لضريبة 15%', nameEn: 'Sales 15%', type: 'revenue', parentCode: '4', level: 2, balance: 0, isDebitNature: false, isSystem: true },
      { id: `acc-5-${tenantId}`, tenantId, code: '5', nameAr: 'المصروفات والتكاليف', nameEn: 'Expenses', type: 'expense', parentCode: null, level: 1, balance: 0, isDebitNature: true, isSystem: true },
      { id: `acc-511-${tenantId}`, tenantId, code: '511', nameAr: 'تكلفة البضاعة المباعة (COGS)', nameEn: 'Cost of Goods Sold', type: 'expense', parentCode: '5', level: 2, balance: 0, isDebitNature: true, isSystem: true },
    ];
    this.accountsSignal.update((list) => [...list, ...baseAccounts]);
  }

  // QR Code generator for ZATCA
  public generateInvoiceQrCode(invoice: Invoice, tenant: Tenant): string {
    const isoDateTime = `${invoice.issueDate}T${invoice.issueTime || '12:00:00'}Z`;
    const sig = generateSimulatedZatcaSignature(invoice.invoiceNumber, invoice.grandTotal, invoice.issueDate);

    const base64Tlv = generateZatcaTlvBase64({
      sellerName: tenant.nameAr,
      vatNumber: tenant.vatNumber,
      timestamp: isoDateTime,
      invoiceTotal: invoice.grandTotal.toFixed(2),
      vatTotal: invoice.vatTotal.toFixed(2),
      invoiceHash: invoice.zatcaHash || sig.hash,
      digitalSignature: sig.signature,
      publicKey: sig.publicKey,
    });
    return base64Tlv;
  }

  private refreshAllQrCodes() {
    const tenant = this.activeTenant();
    this.invoicesSignal.update((list) =>
      list.map((inv) => {
        if (!inv.zatcaQrCode && inv.kind === 'sales') {
          return {
            ...inv,
            zatcaQrCode: this.generateInvoiceQrCode(inv, tenant),
          };
        }
        return inv;
      })
    );
  }

  // Cost Price & Inventory Calculation Logic
  public updateProductCosting(itemId: string, purchasedQty: number, purchaseUnitPrice: number) {
    this.productsSignal.update((list) =>
      list.map((prod) => {
        if (prod.id === itemId) {
          const oldStock = prod.currentStock;
          const oldAvgCost = prod.averageCost;
          const newStock = oldStock + purchasedQty;

          // Moving Average Formula: ((Old Qty * Old Cost) + (Purchased Qty * Purchase Price)) / Total Qty
          let newAvgCost = oldAvgCost;
          if (newStock > 0) {
            newAvgCost = ((oldStock * oldAvgCost) + (purchasedQty * purchaseUnitPrice)) / newStock;
          }

          return {
            ...prod,
            currentStock: newStock,
            averageCost: Math.round(newAvgCost * 100) / 100,
            lastPurchaseCost: purchaseUnitPrice,
          };
        }
        return prod;
      })
    );
  }

  // Deduct Inventory on Sale
  public deductProductStockOnSale(itemId: string, soldQty: number) {
    this.productsSignal.update((list) =>
      list.map((prod) => {
        if (prod.id === itemId) {
          return {
            ...prod,
            currentStock: Math.max(0, prod.currentStock - soldQty),
          };
        }
        return prod;
      })
    );
  }

  // Create Sales Invoice with Auto Ledger and ZATCA QR
  public createSalesInvoice(dto: {
    partyName: string;
    partyVatNumber?: string;
    partyCrNumber?: string;
    partyAddress?: string;
    paymentMethod: PaymentMethod;
    invoiceType: ZatcaInvoiceType;
    items: { itemId: string; quantity: number; unitPrice: number; discount?: number }[];
    notes?: string;
  }): Invoice {
    const tenant = this.activeTenant();
    const prods = this.products();
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];
    const invCount = this.invoicesSignal().filter((i) => i.kind === 'sales').length + 1;
    const invNumber = `INV-2026-${String(invCount).padStart(4, '0')}`;
    const uuid = crypto.randomUUID ? crypto.randomUUID() : `inv-uuid-${Date.now()}`;

    let subtotal = 0;
    let discountTotal = 0;
    let vatTotal = 0;
    let totalCost = 0;

    const invoiceItems: InvoiceItem[] = dto.items.map((it, idx) => {
      const prod = prods.find((p) => p.id === it.itemId) || prods[0];
      const discount = it.discount || 0;
      const totalBefore = (it.quantity * it.unitPrice) - discount;
      const vatRate = prod.vatRate || 15;
      const vat = (totalBefore * vatRate) / 100;
      const totalAfter = totalBefore + vat;
      const costForLine = it.quantity * prod.averageCost;

      subtotal += totalBefore;
      discountTotal += discount;
      vatTotal += vat;
      totalCost += costForLine;

      // Deduct stock
      this.deductProductStockOnSale(prod.id, it.quantity);

      // Record stock movement
      this.stockMovementsSignal.update((movements) => [
        {
          id: `sm-${Date.now()}-${idx}`,
          tenantId: tenant.id,
          itemId: prod.id,
          itemName: prod.nameAr,
          date: today,
          type: 'out_sales',
          quantity: it.quantity,
          unitCost: prod.averageCost,
          unitPrice: it.unitPrice,
          referenceNumber: invNumber,
          remainingStock: Math.max(0, prod.currentStock - it.quantity),
        },
        ...movements,
      ]);

      return {
        id: `inv-it-${Date.now()}-${idx}`,
        itemId: prod.id,
        itemName: prod.nameAr,
        sku: prod.sku,
        unit: prod.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unitCost: prod.averageCost,
        discount: discount,
        vatRate: vatRate,
        vatAmount: vat,
        totalBeforeVat: totalBefore,
        totalAfterVat: totalAfter,
      };
    });

    const grandTotal = subtotal + vatTotal;
    const grossProfit = subtotal - totalCost;

    const sig = generateSimulatedZatcaSignature(invNumber, grandTotal, today);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      tenantId: tenant.id,
      kind: 'sales',
      invoiceNumber: invNumber,
      uuid: uuid,
      issueDate: today,
      issueTime: time,
      invoiceType: dto.invoiceType,
      partyName: dto.partyName,
      partyVatNumber: dto.partyVatNumber,
      partyCrNumber: dto.partyCrNumber,
      partyAddress: dto.partyAddress,
      paymentMethod: dto.paymentMethod,
      items: invoiceItems,
      subtotal,
      discountTotal,
      vatTotal,
      grandTotal,
      totalCost,
      grossProfit,
      status: 'posted',
      zatcaStatus: tenant.zatcaConfig.autoSendInvoices ? 'cleared' : 'not_submitted',
      zatcaHash: sig.hash,
      zatcaValidationMessages: tenant.zatcaConfig.autoSendInvoices ? ['تم إرسال الفاتورة والاعتماد الفوري من منصة هيئة الزكاة'] : [],
      notes: dto.notes,
    };

    newInvoice.zatcaQrCode = this.generateInvoiceQrCode(newInvoice, tenant);

    // Create Automatic Journal Entry
    const jvNumber = `JV-2026-S${String(invCount).padStart(4, '0')}`;
    const debitAccountCode = dto.paymentMethod === 'credit' ? '112' : '1112'; // المدينون أو البنك
    const debitAccountName = dto.paymentMethod === 'credit' ? 'العملاء والمدينون التجاريون' : 'مصرف الراجحي - الحساب الجاري';

    const journalEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      tenantId: tenant.id,
      entryNumber: jvNumber,
      date: today,
      description: `إثبات مبيعات فاتورة رقم ${invNumber} (${dto.partyName}) وتكلفة البضاعة المباعة`,
      referenceType: 'sales',
      referenceNumber: invNumber,
      totalDebit: grandTotal + totalCost,
      totalCredit: grandTotal + totalCost,
      isBalanced: true,
      createdAt: `${today} ${time}`,
      lines: [
        { id: `jl-s1-${Date.now()}`, accountCode: debitAccountCode, accountName: debitAccountName, debit: grandTotal, credit: 0, notes: `قيد استحقاق الفاتورة ${dto.paymentMethod}` },
        { id: `jl-s2-${Date.now()}`, accountCode: '411', accountName: 'مبيعات المنتجات الخاضعة لضريبة 15%', debit: 0, credit: subtotal, notes: 'إيراد المبيعات' },
        { id: `jl-s3-${Date.now()}`, accountCode: '212', accountName: 'أمانات ضريبة القيمة المضافة (مخرجات)', debit: 0, credit: vatTotal, notes: 'ضريبة القيمة المضافة المستحقة 15%' },
        { id: `jl-s4-${Date.now()}`, accountCode: '511', accountName: 'تكلفة مشتريات البضاعة المباعة (COGS)', debit: totalCost, credit: 0, notes: 'تكلفة البضاعة المباعة وفق متوسط التكلفة' },
        { id: `jl-s5-${Date.now()}`, accountCode: '113', accountName: 'المخزون السلعي (بضاعة آخر المدة)', debit: 0, credit: totalCost, notes: 'تخفيض المخزون بتكلفة البضاعة المباعة' },
      ],
    };

    newInvoice.journalEntryId = journalEntry.id;

    // Update signals
    this.journalEntriesSignal.update((entries) => [journalEntry, ...entries]);
    this.invoicesSignal.update((invs) => [newInvoice, ...invs]);

    // Live Remote Persistence & Firestore Sync
    this.persistInvoiceRemote(newInvoice, journalEntry);

    return newInvoice;
  }

  // Create Purchase Invoice with Moving Average Cost Re-calculation & Auto Ledger
  public createPurchaseInvoice(dto: {
    partyName: string;
    partyVatNumber?: string;
    invoiceNumber?: string;
    paymentMethod: PaymentMethod;
    items: { itemId: string; quantity: number; unitPrice: number }[];
    notes?: string;
  }): Invoice {
    const tenant = this.activeTenant();
    const prods = this.products();
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];
    const purCount = this.invoicesSignal().filter((i) => i.kind === 'purchase').length + 1;
    const invNumber = dto.invoiceNumber || `PUR-2026-${String(purCount).padStart(4, '0')}`;
    const uuid = crypto.randomUUID ? crypto.randomUUID() : `pur-uuid-${Date.now()}`;

    let subtotal = 0;
    let vatTotal = 0;

    const invoiceItems: InvoiceItem[] = dto.items.map((it, idx) => {
      const prod = prods.find((p) => p.id === it.itemId) || prods[0];
      const totalBefore = it.quantity * it.unitPrice;
      const vatRate = 15;
      const vat = (totalBefore * vatRate) / 100;
      const totalAfter = totalBefore + vat;

      subtotal += totalBefore;
      vatTotal += vat;

      // Update Moving Average Cost in Product Catalog
      this.updateProductCosting(prod.id, it.quantity, it.unitPrice);

      // Record Stock Movement
      this.stockMovementsSignal.update((movements) => [
        {
          id: `sm-pur-${Date.now()}-${idx}`,
          tenantId: tenant.id,
          itemId: prod.id,
          itemName: prod.nameAr,
          date: today,
          type: 'in_purchase',
          quantity: it.quantity,
          unitCost: it.unitPrice,
          referenceNumber: invNumber,
          remainingStock: prod.currentStock + it.quantity,
        },
        ...movements,
      ]);

      return {
        id: `pur-it-${Date.now()}-${idx}`,
        itemId: prod.id,
        itemName: prod.nameAr,
        sku: prod.sku,
        unit: prod.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unitCost: it.unitPrice,
        discount: 0,
        vatRate: vatRate,
        vatAmount: vat,
        totalBeforeVat: totalBefore,
        totalAfterVat: totalAfter,
      };
    });

    const grandTotal = subtotal + vatTotal;

    const newInvoice: Invoice = {
      id: `pur-${Date.now()}`,
      tenantId: tenant.id,
      kind: 'purchase',
      invoiceNumber: invNumber,
      uuid: uuid,
      issueDate: today,
      issueTime: time,
      invoiceType: 'tax_invoice',
      partyName: dto.partyName,
      partyVatNumber: dto.partyVatNumber,
      paymentMethod: dto.paymentMethod,
      items: invoiceItems,
      subtotal,
      discountTotal: 0,
      vatTotal,
      grandTotal,
      totalCost: subtotal,
      grossProfit: 0,
      status: 'posted',
      zatcaStatus: 'cleared',
      notes: dto.notes,
    };

    // Automatic Purchase Journal Entry
    const jvNumber = `JV-2026-P${String(purCount).padStart(4, '0')}`;
    const creditAccountCode = dto.paymentMethod === 'credit' ? '211' : '1112'; // الموردون أو البنك
    const creditAccountName = dto.paymentMethod === 'credit' ? 'الموردون والدائنون التجاريون' : 'مصرف الراجحي - الحساب الجاري';

    const journalEntry: JournalEntry = {
      id: `je-pur-${Date.now()}`,
      tenantId: tenant.id,
      entryNumber: jvNumber,
      date: today,
      description: `إثبات مشتريات بضاعة فاتورة رقم ${invNumber} (${dto.partyName}) وإدخالها للمخزون`,
      referenceType: 'purchase',
      referenceNumber: invNumber,
      totalDebit: grandTotal,
      totalCredit: grandTotal,
      isBalanced: true,
      createdAt: `${today} ${time}`,
      lines: [
        { id: `jl-p1-${Date.now()}`, accountCode: '113', accountName: 'المخزون السلعي (بضاعة آخر المدة)', debit: subtotal, credit: 0, notes: 'إضافة المشتريات للمخزون بالقيمة التكليفية' },
        { id: `jl-p2-${Date.now()}`, accountCode: '114', accountName: 'ضريبة القيمة المضافة على المدخلات (مشتريات)', debit: vatTotal, credit: 0, notes: 'ضريبة المشتريات المستردة 15%' },
        { id: `jl-p3-${Date.now()}`, accountCode: creditAccountCode, accountName: creditAccountName, debit: 0, credit: grandTotal, notes: `استحقاق المورد أو الدفع من ${creditAccountName}` },
      ],
    };

    newInvoice.journalEntryId = journalEntry.id;

    this.journalEntriesSignal.update((entries) => [journalEntry, ...entries]);
    this.invoicesSignal.update((invs) => [newInvoice, ...invs]);

    // Live Remote Persistence & Firestore Sync
    this.persistInvoiceRemote(newInvoice, journalEntry);

    return newInvoice;
  }

  // Create Voucher (Receipt سند قبض or Payment سند صرف)
  public createVoucher(dto: {
    type: 'receipt' | 'payment';
    amount: number;
    partyName: string;
    partyAccountCode: string;
    treasuryAccountCode: string;
    paymentMethod: 'cash' | 'bank_transfer' | 'cheque';
    referenceNumber?: string;
    notes: string;
    receivedOrPaidBy: string;
  }): Voucher {
    const tenant = this.activeTenant();
    const today = new Date().toISOString().split('T')[0];
    const count = this.vouchersSignal().filter((v) => v.type === dto.type).length + 1;
    const prefix = dto.type === 'receipt' ? 'RCV' : 'PAY';
    const voucherNumber = `${prefix}-2026-${String(count).padStart(4, '0')}`;
    const tafqeet = tafqeetArabic(dto.amount);

    const accounts = this.accountsSignal();
    const partyAcc = accounts.find((a) => a.code === dto.partyAccountCode) || { nameAr: dto.partyName };
    const treasuryAcc = accounts.find((a) => a.code === dto.treasuryAccountCode) || { nameAr: 'الصندوق / البنك' };

    const newVoucher: Voucher = {
      id: `vouch-${Date.now()}`,
      tenantId: tenant.id,
      voucherNumber,
      type: dto.type,
      date: today,
      amount: dto.amount,
      amountInWordsAr: tafqeet,
      partyName: dto.partyName,
      partyAccountCode: dto.partyAccountCode,
      treasuryAccountCode: dto.treasuryAccountCode,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      notes: dto.notes,
      receivedOrPaidBy: dto.receivedOrPaidBy,
    };

    // Auto Journal Entry for Voucher
    const jvNumber = `JV-2026-V${String(count).padStart(4, '0')}`;
    let lines = [];
    if (dto.type === 'receipt') {
      // سند قبض: من حـ/ الصندوق أو البنك إلى حـ/ الطرف المقبوض منه (عميل)
      lines = [
        { id: `vl-1-${Date.now()}`, accountCode: dto.treasuryAccountCode, accountName: treasuryAcc.nameAr, debit: dto.amount, credit: 0, notes: `استلام مبلغ ${dto.notes}` },
        { id: `vl-2-${Date.now()}`, accountCode: dto.partyAccountCode, accountName: partyAcc.nameAr, debit: 0, credit: dto.amount, notes: `سداد من ${dto.partyName}` },
      ];
    } else {
      // سند صرف: من حـ/ الطرف المصروف له (مورد أو مصروف) إلى حـ/ الصندوق أو البنك
      lines = [
        { id: `vl-1-${Date.now()}`, accountCode: dto.partyAccountCode, accountName: partyAcc.nameAr, debit: dto.amount, credit: 0, notes: `صرف لـ ${dto.partyName} - ${dto.notes}` },
        { id: `vl-2-${Date.now()}`, accountCode: dto.treasuryAccountCode, accountName: treasuryAcc.nameAr, debit: 0, credit: dto.amount, notes: `صرف من حساب ${treasuryAcc.nameAr}` },
      ];
    }

    const journalEntry: JournalEntry = {
      id: `je-vouch-${Date.now()}`,
      tenantId: tenant.id,
      entryNumber: jvNumber,
      date: today,
      description: `إثبات ${dto.type === 'receipt' ? 'سند قبض' : 'سند صرف'} رقم ${voucherNumber} (${dto.partyName})`,
      referenceType: dto.type === 'receipt' ? 'receipt_voucher' : 'payment_voucher',
      referenceNumber: voucherNumber,
      totalDebit: dto.amount,
      totalCredit: dto.amount,
      isBalanced: true,
      createdAt: `${today} ${new Date().toTimeString().split(' ')[0]}`,
      lines,
    };

    newVoucher.journalEntryId = journalEntry.id;

    this.journalEntriesSignal.update((entries) => [journalEntry, ...entries]);
    this.vouchersSignal.update((vchs) => [newVoucher, ...vchs]);

    // Live Remote Persistence & Firestore Sync
    this.persistVoucherRemote(newVoucher, journalEntry);

    return newVoucher;
  }

  // ZATCA Fatoora Simulator: Send/Validate Invoice
  public simulateZatcaSend(invoiceId: string): {
    success: boolean;
    status: 'cleared' | 'reported' | 'rejected' | 'warning';
    messages: string[];
    hash: string;
    ublXml: string;
    qrCodeBase64: string;
  } {
    const inv = this.invoicesSignal().find((i) => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');
    const tenant = this.activeTenant();

    const sig = generateSimulatedZatcaSignature(inv.invoiceNumber, inv.grandTotal, inv.issueDate);
    const qrCode = this.generateInvoiceQrCode(inv, tenant);

    const isTaxInvoice = inv.invoiceType === 'tax_invoice';
    const status: 'cleared' | 'reported' = isTaxInvoice ? 'cleared' : 'reported';

    const messages = [
      `[ZATCA 200 OK] تم التحقق من البنية الهيكلية للفاتورة بنجاح وفق UBL 2.1 XML`,
      `التشفير والتوقيع الرقمي (ECDSA secp256k1): صالح ومعتمد`,
      `الختم التشفيري (Cryptographic Stamp): ${tenant.zatcaConfig.csid}`,
      `هاش الفاتورة (Invoice Hash): ${sig.hash.substring(0, 20)}...`,
      isTaxInvoice
        ? `حالة الاعتماد (Clearance Status): CLEARED - تم اعتماد الفاتورة الضريبية القياسية`
        : `حالة الإبلاغ (Reporting Status): REPORTED - تم استلام الفاتورة المبسطة بنجاح`,
    ];

    const ublXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${inv.invoiceNumber}</cbc:ID>
  <cbc:UUID>${inv.uuid}</cbc:UUID>
  <cbc:IssueDate>${inv.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${inv.issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0100000">${inv.invoiceType === 'tax_invoice' ? '388' : '388'}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${tenant.currency}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${tenant.crNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${tenant.vatNumber}</cbc:CompanyID>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${tenant.nameAr}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${inv.vatTotal.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${inv.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${inv.grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${inv.grandTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    // Update invoice record
    this.invoicesSignal.update((list) =>
      list.map((item) =>
        item.id === invoiceId
          ? {
              ...item,
              zatcaStatus: status,
              zatcaHash: sig.hash,
              zatcaQrCode: qrCode,
              zatcaUblXml: ublXml,
              zatcaValidationMessages: messages,
            }
          : item
      )
    );

    return {
      success: true,
      status,
      messages,
      hash: sig.hash,
      ublXml,
      qrCodeBase64: qrCode,
    };
  }

  // Add Account to Tree
  public addAccount(data: { code: string; nameAr: string; nameEn: string; type: Account['type']; parentCode: string | null; isDebitNature: boolean }) {
    const tenant = this.activeTenant();
    const accounts = this.accountsSignal();
    const parent = accounts.find((a) => a.code === data.parentCode);
    const level = parent ? parent.level + 1 : 1;

    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      tenantId: tenant.id,
      code: data.code,
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      type: data.type,
      parentCode: data.parentCode,
      level,
      balance: 0,
      isDebitNature: data.isDebitNature,
      isSystem: false,
    };

    this.accountsSignal.set([...accounts, newAcc]);
    return newAcc;
  }

  // ==========================================
  // 1. CUSTOMERS MANAGEMENT (إدارة العملاء)
  // ==========================================
  public addCustomer(data: Omit<Customer, 'id' | 'tenantId' | 'currentBalance'> & { openingBalance?: number }) {
    const tenant = this.activeTenant();
    const currentList = this.customersSignal();
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      tenantId: tenant.id,
      openingBalance: Number(data.openingBalance || 0),
      currentBalance: Number(data.openingBalance || 0),
      status: data.status || 'active'
    };
    this.customersSignal.set([newCust, ...currentList]);
    this.persistCustomerRemote(newCust);
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>) {
    this.customersSignal.update((list) =>
      list.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          this.persistCustomerRemote(updated);
          return updated;
        }
        return c;
      })
    );
  }

  public deleteCustomer(id: string) {
    this.customersSignal.update((list) => list.filter((c) => c.id !== id));
    this.firebaseService.removeDocument(`tenants/${this.activeTenant().id}/customers`, id);
  }

  // ==========================================
  // 2. SUPPLIERS MANAGEMENT (إدارة الموردين)
  // ==========================================
  public addSupplier(data: Omit<Supplier, 'id' | 'tenantId' | 'currentBalance'> & { openingBalance?: number }) {
    const tenant = this.activeTenant();
    const currentList = this.suppliersSignal();
    const newSupp: Supplier = {
      ...data,
      id: `supp-${Date.now()}`,
      tenantId: tenant.id,
      openingBalance: Number(data.openingBalance || 0),
      currentBalance: Number(data.openingBalance || 0),
      status: data.status || 'active'
    };
    this.suppliersSignal.set([newSupp, ...currentList]);
    this.persistSupplierRemote(newSupp);
    return newSupp;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>) {
    this.suppliersSignal.update((list) =>
      list.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          this.persistSupplierRemote(updated);
          return updated;
        }
        return s;
      })
    );
  }

  public deleteSupplier(id: string) {
    this.suppliersSignal.update((list) => list.filter((s) => s.id !== id));
    this.firebaseService.removeDocument(`tenants/${this.activeTenant().id}/suppliers`, id);
  }

  // ==========================================
  // 3. PRODUCTS & ITEMS MANAGEMENT (الأصناف)
  // ==========================================
  public addProduct(data: Omit<ProductItem, 'id' | 'tenantId'>) {
    const tenant = this.activeTenant();
    const currentList = this.productsSignal();
    const newProd: ProductItem = {
      ...data,
      id: `prod-${Date.now()}`,
      tenantId: tenant.id,
      currentStock: Number(data.currentStock || 0),
      averageCost: Number(data.averageCost || data.lastPurchaseCost || 0),
      lastPurchaseCost: Number(data.lastPurchaseCost || 0),
      sellingPrice: Number(data.sellingPrice || 0),
      vatRate: Number(data.vatRate ?? 15),
      minStockLevel: Number(data.minStockLevel || 1),
    };
    this.productsSignal.set([newProd, ...currentList]);
    this.persistProductRemote(newProd);
    return newProd;
  }

  public updateProduct(id: string, updates: Partial<ProductItem>) {
    this.productsSignal.update((list) =>
      list.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          this.persistProductRemote(updated);
          return updated;
        }
        return p;
      })
    );
  }

  public deleteProduct(id: string) {
    this.productsSignal.update((list) => list.filter((p) => p.id !== id));
    this.firebaseService.removeDocument(`tenants/${this.activeTenant().id}/products`, id);
  }

  // ==========================================
  // 4. UNITS OF MEASURE (وحدات القياس)
  // ==========================================
  public addUnit(data: Omit<UnitOfMeasure, 'id'>) {
    const currentList = this.unitsSignal();
    const newUnit: UnitOfMeasure = {
      ...data,
      id: `uom-${Date.now()}`,
      conversionFactor: Number(data.conversionFactor || 1),
      status: data.status || 'active'
    };
    this.unitsSignal.set([...currentList, newUnit]);
    return newUnit;
  }

  public updateUnit(id: string, updates: Partial<UnitOfMeasure>) {
    this.unitsSignal.update((list) =>
      list.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
  }

  public deleteUnit(id: string) {
    this.unitsSignal.update((list) => list.filter((u) => u.id !== id));
  }

  // ==========================================
  // 5. CURRENCIES & EXCHANGE RATES (العملات)
  // ==========================================
  public addCurrency(data: Omit<Currency, 'id' | 'lastUpdated'>) {
    const currentList = this.currenciesSignal();
    const newCur: Currency = {
      ...data,
      id: `cur-${Date.now()}`,
      exchangeRate: Number(data.exchangeRate || 1),
      decimalPlaces: Number(data.decimalPlaces || 2),
      lastUpdated: new Date().toISOString().split('T')[0],
      status: data.status || 'active'
    };
    this.currenciesSignal.set([...currentList, newCur]);
    return newCur;
  }

  public updateCurrency(id: string, updates: Partial<Currency>) {
    this.currenciesSignal.update((list) =>
      list.map((c) => (c.id === id ? { ...c, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : c))
    );
  }

  public updateExchangeRate(code: string, newRate: number) {
    this.currenciesSignal.update((list) =>
      list.map((c) => (c.code === code ? { ...c, exchangeRate: newRate, lastUpdated: new Date().toISOString().split('T')[0] } : c))
    );
  }

  public convertCurrency(amount: number, fromCode: string, toCode: string): number {
    const list = this.currenciesSignal();
    const fromCur = list.find((c) => c.code === fromCode);
    const toCur = list.find((c) => c.code === toCode);
    if (!fromCur || !toCur) return amount;

    // Convert from source to Base Currency (SAR), then to target currency
    const amountInBase = amount * fromCur.exchangeRate;
    return amountInBase / toCur.exchangeRate;
  }

  // ==========================================
  // 6. PAYMENT METHODS (طرق الدفع)
  // ==========================================
  public addPaymentMethod(data: Omit<PaymentMethodItem, 'id'>) {
    const currentList = this.paymentMethodsSignal();
    const newPm: PaymentMethodItem = {
      ...data,
      id: `pm-${Date.now()}`,
      status: data.status || 'active'
    };
    this.paymentMethodsSignal.set([...currentList, newPm]);
    return newPm;
  }

  public updatePaymentMethod(id: string, updates: Partial<PaymentMethodItem>) {
    this.paymentMethodsSignal.update((list) =>
      list.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }

  public deletePaymentMethod(id: string) {
    this.paymentMethodsSignal.update((list) => list.filter((p) => p.id !== id));
  }

  // ==========================================
  // 7. CATEGORIES & WAREHOUSES
  // ==========================================
  public addCategory(data: Omit<ProductCategory, 'id' | 'itemCount'>) {
    const currentList = this.categoriesSignal();
    const newCat: ProductCategory = {
      ...data,
      id: `cat-${Date.now()}`,
      itemCount: 0
    };
    this.categoriesSignal.set([...currentList, newCat]);
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<ProductCategory>) {
    this.categoriesSignal.update((list) =>
      list.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  public addWarehouse(data: Omit<Warehouse, 'id' | 'tenantId'>) {
    const tenant = this.activeTenant();
    const currentList = this.warehousesSignal();
    const newWh: Warehouse = {
      ...data,
      id: `wh-${Date.now()}`,
      tenantId: tenant.id,
      status: data.status || 'active'
    };
    this.warehousesSignal.set([...currentList, newWh]);
    return newWh;
  }

  public updateWarehouse(id: string, updates: Partial<Warehouse>) {
    this.warehousesSignal.update((list) =>
      list.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  }

  private platformId = inject(PLATFORM_ID);

  // ==========================================
  // 8. REAL BACKEND REST API & FIRESTORE SYNC
  // ==========================================
  private syncWithBackendAndFirestore() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // 1. Load data from Express Backend API
    this.http.get<{ success: boolean; data: Invoice[] }>('/api/v1/invoices').subscribe({
      next: (res) => {
        if (res?.data && res.data.length > 0) {
          const current = this.invoicesSignal();
          const existingIds = new Set(current.map((i) => i.id));
          const newItems = res.data.filter((i) => !existingIds.has(i.id));
          if (newItems.length > 0) {
            this.invoicesSignal.set([...newItems, ...current]);
          }
        }
      },
      error: (err) => {
        console.debug('Backend sync invoices check completed:', err?.status || 'offline');
      },
    });

    this.http.get<{ success: boolean; data: Voucher[] }>('/api/v1/vouchers').subscribe({
      next: (res) => {
        if (res?.data && res.data.length > 0) {
          const current = this.vouchersSignal();
          const existingIds = new Set(current.map((v) => v.id));
          const newItems = res.data.filter((v) => !existingIds.has(v.id));
          if (newItems.length > 0) {
            this.vouchersSignal.set([...newItems, ...current]);
          }
        }
      },
      error: (err) => {
        console.debug('Backend sync vouchers check completed:', err?.status || 'offline');
      },
    });

    this.http.get<{ success: boolean; data: Customer[] }>('/api/v1/customers').subscribe({
      next: (res) => {
        if (res?.data && res.data.length > 0) {
          const current = this.customersSignal();
          const existingIds = new Set(current.map((c) => c.id));
          const newItems = res.data.filter((c) => !existingIds.has(c.id));
          if (newItems.length > 0) {
            this.customersSignal.set([...newItems, ...current]);
          }
        }
      },
      error: (err) => {
        console.debug('Backend sync customers check completed:', err?.status || 'offline');
      },
    });

    this.http.get<{ success: boolean; data: Supplier[] }>('/api/v1/suppliers').subscribe({
      next: (res) => {
        if (res?.data && res.data.length > 0) {
          const current = this.suppliersSignal();
          const existingIds = new Set(current.map((s) => s.id));
          const newItems = res.data.filter((s) => !existingIds.has(s.id));
          if (newItems.length > 0) {
            this.suppliersSignal.set([...newItems, ...current]);
          }
        }
      },
      error: (err) => {
        console.debug('Backend sync suppliers check completed:', err?.status || 'offline');
      },
    });

    this.http.get<{ success: boolean; data: ProductItem[] }>('/api/v1/products').subscribe({
      next: (res) => {
        if (res?.data && res.data.length > 0) {
          const current = this.productsSignal();
          const existingIds = new Set(current.map((p) => p.id));
          const newItems = res.data.filter((p) => !existingIds.has(p.id));
          if (newItems.length > 0) {
            this.productsSignal.set([...newItems, ...current]);
          }
        }
      },
      error: (err) => {
        console.debug('Backend sync products check completed:', err?.status || 'offline');
      },
    });

    // 2. Real-time Subscription to Firestore collections
    const activeId = this.activeTenantIdSignal();
    this.firebaseService.subscribeToCollection<Invoice>(`tenants/${activeId}/invoices`, (remoteInvoices) => {
      if (remoteInvoices && remoteInvoices.length > 0) {
        const current = this.invoicesSignal();
        const merged = [...current];
        for (const rInv of remoteInvoices) {
          const idx = merged.findIndex((i) => i.id === rInv.id);
          if (idx >= 0) {
            merged[idx] = rInv;
          } else {
            merged.unshift(rInv);
          }
        }
        this.invoicesSignal.set(merged);
      }
    });

    this.firebaseService.subscribeToCollection<Voucher>(`tenants/${activeId}/vouchers`, (remoteVouchers) => {
      if (remoteVouchers && remoteVouchers.length > 0) {
        const current = this.vouchersSignal();
        const merged = [...current];
        for (const rVouch of remoteVouchers) {
          const idx = merged.findIndex((v) => v.id === rVouch.id);
          if (idx >= 0) {
            merged[idx] = rVouch;
          } else {
            merged.unshift(rVouch);
          }
        }
        this.vouchersSignal.set(merged);
      }
    });

    this.firebaseService.subscribeToCollection<Customer>(`tenants/${activeId}/customers`, (remoteCustomers) => {
      if (remoteCustomers && remoteCustomers.length > 0) {
        const current = this.customersSignal();
        const merged = [...current];
        for (const rCust of remoteCustomers) {
          const idx = merged.findIndex((c) => c.id === rCust.id);
          if (idx >= 0) {
            merged[idx] = rCust;
          } else {
            merged.unshift(rCust);
          }
        }
        this.customersSignal.set(merged);
      }
    });

    this.firebaseService.subscribeToCollection<Supplier>(`tenants/${activeId}/suppliers`, (remoteSuppliers) => {
      if (remoteSuppliers && remoteSuppliers.length > 0) {
        const current = this.suppliersSignal();
        const merged = [...current];
        for (const rSupp of remoteSuppliers) {
          const idx = merged.findIndex((s) => s.id === rSupp.id);
          if (idx >= 0) {
            merged[idx] = rSupp;
          } else {
            merged.unshift(rSupp);
          }
        }
        this.suppliersSignal.set(merged);
      }
    });

    this.firebaseService.subscribeToCollection<ProductItem>(`tenants/${activeId}/products`, (remoteProducts) => {
      if (remoteProducts && remoteProducts.length > 0) {
        const current = this.productsSignal();
        const merged = [...current];
        for (const rProd of remoteProducts) {
          const idx = merged.findIndex((p) => p.id === rProd.id);
          if (idx >= 0) {
            merged[idx] = rProd;
          } else {
            merged.unshift(rProd);
          }
        }
        this.productsSignal.set(merged);
      }
    });
  }

  public persistCustomerRemote(customer: Customer) {
    const tenantId = customer.tenantId;
    this.firebaseService.saveDocument(`tenants/${tenantId}/customers`, customer.id, customer);
    this.http.post('/api/v1/customers', customer).subscribe({
      next: (res) => console.debug('Customer persisted to backend API'),
      error: (err) => console.debug('Backend sync customer notification:', err?.status)
    });
  }

  public persistSupplierRemote(supplier: Supplier) {
    const tenantId = supplier.tenantId;
    this.firebaseService.saveDocument(`tenants/${tenantId}/suppliers`, supplier.id, supplier);
    this.http.post('/api/v1/suppliers', supplier).subscribe({
      next: (res) => console.debug('Supplier persisted to backend API'),
      error: (err) => console.debug('Backend sync supplier notification:', err?.status)
    });
  }

  public persistProductRemote(product: ProductItem) {
    const tenantId = product.tenantId;
    this.firebaseService.saveDocument(`tenants/${tenantId}/products`, product.id, product);
    this.http.post('/api/v1/products', product).subscribe({
      next: (res) => console.debug('Product persisted to backend API'),
      error: (err) => console.debug('Backend sync product notification:', err?.status)
    });
  }

  public persistInvoiceRemote(invoice: Invoice, journalEntry?: JournalEntry) {
    const tenantId = invoice.tenantId;
    // 1. Firestore cloud persistence
    this.firebaseService.saveDocument(`tenants/${tenantId}/invoices`, invoice.id, invoice);
    if (journalEntry) {
      this.firebaseService.saveDocument(`tenants/${tenantId}/journalEntries`, journalEntry.id, journalEntry);
    }

    // 2. Backend REST API
    this.http.post('/api/v1/invoices', invoice).subscribe({
      next: (res) => {
        console.debug('Invoice persisted to backend API:', res);
      },
      error: (err) => {
        console.debug('Backend sync invoice notification:', err?.status);
      },
    });

    if (journalEntry) {
      this.http.post('/api/v1/journal-entries', journalEntry).subscribe({
        next: (res) => {
          console.debug('Journal entry persisted to backend API:', res);
        },
        error: (err) => {
          console.debug('Backend sync journal notification:', err?.status);
        },
      });
    }
  }

  public persistVoucherRemote(voucher: Voucher, journalEntry?: JournalEntry) {
    const tenantId = voucher.tenantId;
    // 1. Firestore
    this.firebaseService.saveDocument(`tenants/${tenantId}/vouchers`, voucher.id, voucher);
    if (journalEntry) {
      this.firebaseService.saveDocument(`tenants/${tenantId}/journalEntries`, journalEntry.id, journalEntry);
    }

    // 2. Backend REST API
    this.http.post('/api/v1/vouchers', voucher).subscribe({
      next: (res) => {
        console.debug('Voucher persisted to backend API:', res);
      },
      error: (err) => {
        console.debug('Backend sync voucher notification:', err?.status);
      },
    });

    if (journalEntry) {
      this.http.post('/api/v1/journal-entries', journalEntry).subscribe({
        next: (res) => {
          console.debug('Journal entry persisted to backend API:', res);
        },
        error: (err) => {
          console.debug('Backend sync journal notification:', err?.status);
        },
      });
    }
  }

  public persistAccountRemote(account: Account) {
    const tenantId = account.tenantId;
    this.firebaseService.saveDocument(`tenants/${tenantId}/accounts`, account.id, account);
    this.http.post('/api/v1/accounts', account).subscribe({
      next: (res) => {
        console.debug('Account persisted to backend API:', res);
      },
      error: (err) => {
        console.debug('Backend sync account notification:', err?.status);
      },
    });
  }

  public persistTenantRemote(tenant: Tenant) {
    this.firebaseService.saveDocument('tenants', tenant.id, tenant);
    this.http.post('/api/v1/tenants', tenant).subscribe({
      next: (res) => {
        console.debug('Tenant persisted to backend API:', res);
      },
      error: (err) => {
        console.debug('Backend sync tenant notification:', err?.status);
      },
    });
  }

  public createInvoiceReturn(dto: {
    originalInvoiceId: string;
    returnReason: string;
    items: { itemId: string; quantity: number; unitPrice: number; discount?: number }[];
    creditDebitNoteType: 'credit_note' | 'debit_note';
    notes?: string;
  }): Invoice {
    const tenant = this.activeTenant();
    const originalInv = this.invoicesSignal().find((i) => i.id === dto.originalInvoiceId);
    const prods = this.products();
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];
    const retCount = this.invoicesSignal().filter((i) => i.isReturn).length + 1;
    const invNumber = `RET-2026-${String(retCount).padStart(4, '0')}`;
    const uuid = crypto.randomUUID ? crypto.randomUUID() : `ret-uuid-${Date.now()}`;

    let subtotal = 0;
    let discountTotal = 0;
    let vatTotal = 0;
    let totalCost = 0;

    const returnItems: InvoiceItem[] = dto.items.map((it) => {
      const prod = prods.find((p) => p.id === it.itemId) || prods[0];
      const discount = it.discount || 0;
      const totalBefore = it.quantity * it.unitPrice - discount;
      const vatRate = prod.vatRate || 15;
      const vat = (totalBefore * vatRate) / 100;
      const totalAfter = totalBefore + vat;
      const costForLine = it.quantity * prod.averageCost;

      subtotal += totalBefore;
      discountTotal += discount;
      vatTotal += vat;
      totalCost += costForLine;

      if (dto.creditDebitNoteType === 'credit_note') {
        this.productsSignal.update((list) =>
          list.map((p) => (p.id === prod.id ? { ...p, currentStock: p.currentStock + it.quantity } : p))
        );
      } else {
        this.productsSignal.update((list) =>
          list.map((p) => (p.id === prod.id ? { ...p, currentStock: Math.max(0, p.currentStock - it.quantity) } : p))
        );
      }

      return {
        id: `ret-item-${Date.now()}-${Math.random()}`,
        itemId: prod.id,
        itemName: prod.nameAr,
        sku: prod.sku,
        unit: prod.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unitCost: prod.averageCost,
        discount,
        vatRate,
        vatAmount: vat,
        totalBeforeVat: totalBefore,
        totalAfterVat: totalAfter,
      };
    });

    const grandTotal = subtotal - discountTotal + vatTotal;

    const returnInvoice: Invoice = {
      id: `inv-ret-${Date.now()}`,
      tenantId: tenant.id,
      kind: originalInv ? originalInv.kind : 'sales',
      invoiceNumber: invNumber,
      uuid,
      issueDate: today,
      issueTime: time,
      invoiceType: dto.creditDebitNoteType,
      partyName: originalInv ? originalInv.partyName : 'عميل عام',
      partyVatNumber: originalInv?.partyVatNumber,
      paymentMethod: originalInv ? originalInv.paymentMethod : 'cash',
      items: returnItems,
      subtotal,
      discountTotal,
      vatTotal,
      grandTotal,
      totalCost,
      grossProfit: 0,
      status: 'posted',
      zatcaStatus: 'cleared',
      zatcaValidationMessages: ['تم اعتماد إشعار المرتجع (Credit/Debit Note Cleared ZATCA)'],
      notes: dto.notes || `مرتجع للفاتورة الأصلية رقم ${originalInv?.invoiceNumber || ''} - السبب: ${dto.returnReason}`,
      isReturn: true,
      originalInvoiceId: dto.originalInvoiceId,
      originalInvoiceNumber: originalInv?.invoiceNumber,
      returnReason: dto.returnReason,
      creditDebitNoteType: dto.creditDebitNoteType,
    };

    returnInvoice.zatcaQrCode = this.generateInvoiceQrCode(returnInvoice, tenant);

    const jeId = `je-ret-${Date.now()}`;
    const entryNumber = `JV-RET-2026-${String(retCount).padStart(4, '0')}`;
    const lines =
      dto.creditDebitNoteType === 'credit_note'
        ? [
            { id: 'jl-1', accountCode: '411', accountName: 'مبيعات المنتجات الخاضعة لضريبة 15%', debit: subtotal, credit: 0, notes: 'تخفيض إيراد المبيعات (مرتجع)' },
            { id: 'jl-2', accountCode: '212', accountName: 'أمانات ضريبة القيمة المضافة (مخرجات)', debit: vatTotal, credit: 0, notes: 'تخفيض ضريبة المخرجات' },
            { id: 'jl-3', accountCode: '112', accountName: 'العملاء والمدينون التجاريون', debit: 0, credit: grandTotal, notes: 'تخفيض مديونية العميل / رد نقدية' },
            { id: 'jl-4', accountCode: '113', accountName: 'المخزون السلعي (بضاعة آخر المدة)', debit: totalCost, credit: 0, notes: 'إعادة البضاعة المرتجعة للمخزون' },
            { id: 'jl-5', accountCode: '511', accountName: 'تكلفة مشتريات البضاعة المباعة (COGS)', debit: 0, credit: totalCost, notes: 'تخفيض تكلفة البضاعة المباعة' },
          ]
        : [
            { id: 'jl-p1', accountCode: '211', accountName: 'الموردون والدائنون التجاريون', debit: grandTotal, credit: 0, notes: 'تخفيض التزام المورد (مرتجع مشتريات)' },
            { id: 'jl-p2', accountCode: '113', accountName: 'المخزون السلعي', debit: 0, credit: totalCost, notes: 'إخراج البضاعة المرتجعة من المخزون' },
            { id: 'jl-p3', accountCode: '114', accountName: 'ضريبة القيمة المضافة على المدخلات', debit: 0, credit: vatTotal, notes: 'تخفيض ضريبة المدخلات' },
          ];

    const journalEntry: JournalEntry = {
      id: jeId,
      tenantId: tenant.id,
      entryNumber,
      date: today,
      description: `قيود مرتجع الفاتورة رقم ${originalInv?.invoiceNumber || ''} (${dto.returnReason})`,
      referenceType: 'sales',
      referenceNumber: invNumber,
      lines,
      totalDebit: lines.reduce((s, l) => s + l.debit, 0),
      totalCredit: lines.reduce((s, l) => s + l.credit, 0),
      isBalanced: true,
      createdAt: `${today} ${time}`,
    };

    returnInvoice.journalEntryId = jeId;

    this.invoicesSignal.update((list) => [returnInvoice, ...list]);
    this.journalEntriesSignal.update((list) => [journalEntry, ...list]);

    this.persistInvoiceRemote(returnInvoice, journalEntry);

    return returnInvoice;
  }
}
