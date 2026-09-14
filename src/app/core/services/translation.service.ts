import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AppLanguage = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

export interface DictionaryEntry {
  key: string;
  category: string;
  ar: string;
  en: string;
  context?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  // Current language signal, initialized from localStorage or default 'ar'
  private langSignal: any;
  public currentLang: any;
  public currentDir: any;
  public isArabic: any;
  public isEnglish: any;

  // Helper dictionary lookup map for fast O(1) translation
  private readonly lookupMap = new Map<string, DictionaryEntry>();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.langSignal = signal<AppLanguage>(this.getInitialLanguage());
    this.currentLang = this.langSignal.asReadonly();
    this.currentDir = computed<Direction>(() => (this.langSignal() === 'ar' ? 'rtl' : 'ltr'));
    this.isArabic = computed<boolean>(() => this.langSignal() === 'ar');
    this.isEnglish = computed<boolean>(() => this.langSignal() === 'en');
    
    // Populate fast lookup map
    for (const entry of this.dictionary) {
      this.lookupMap.set(entry.key, entry);
    }
    
    this.applyDocumentDirection(this.langSignal());
  }

  // Categories definitions
  public readonly categories = [
    { id: 'all', nameAr: 'جميع الأقسام', nameEn: 'All Categories' },
    { id: 'nav', nameAr: 'الشاشات والتنقل', nameEn: 'Navigation & Screens' },
    { id: 'common', nameAr: 'الإجراءات العامة والواجهة', nameEn: 'Common Actions & UI' },
    { id: 'masterData', nameAr: 'البيانات الأساسية والكيانات', nameEn: 'Master Data & Entities' },
    { id: 'sales', nameAr: 'المبيعات وفواتير ZATCA', nameEn: 'Sales & ZATCA Invoicing' },
    { id: 'purchases', nameAr: 'المشتريات والموردين', nameEn: 'Purchases & Vendors' },
    { id: 'costing', nameAr: 'المخزون وأسعار التكلفة', nameEn: 'Inventory & Costing' },
    { id: 'vouchers', nameAr: 'سندات القبض والصرف', nameEn: 'Receipt & Payment Vouchers' },
    { id: 'accounts', nameAr: 'شجرة الحسابات والقيود', nameEn: 'Chart of Accounts & GL' },
    { id: 'zatca', nameAr: 'منظومة هيئة الزكاة والضريبة', nameEn: 'ZATCA Compliance Platform' },
    { id: 'reports', nameAr: 'التقارير والقوائم المالية', nameEn: 'Financial Reports' },
    { id: 'backend', nameAr: 'معمارية الباك إند .NET', nameEn: '.NET Backend Architecture' },
    { id: 'dictionary', nameAr: 'قاموس المصطلحات واللغات', nameEn: 'Dictionary & I18n Hub' },
  ];

  // Complete comprehensive dictionary
  public readonly dictionary: DictionaryEntry[] = [
    // -------------------------------------------------------------
    // NAVIGATION
    // -------------------------------------------------------------
    { key: 'nav.dashboard', category: 'nav', ar: 'لوحة المؤشرات', en: 'Dashboard', context: 'Main KPI overview screen' },
    { key: 'nav.entities', category: 'nav', ar: 'البيانات الأساسية والكيانات', en: 'Master Data & Entities', context: 'Management of customers, suppliers, catalog, UOM' },
    { key: 'nav.sales', category: 'nav', ar: 'المبيعات وفواتير ZATCA', en: 'Sales & ZATCA Invoices', context: 'Tax invoices and simplified invoices' },
    { key: 'nav.purchases', category: 'nav', ar: 'المشتريات والموردين', en: 'Purchases & Vendors', context: 'Purchase orders and vendor bills' },
    { key: 'nav.costing', category: 'nav', ar: 'أسعار التكلفة والمخزون', en: 'Costing & Inventory', context: 'Weighted moving average cost and inventory valuation' },
    { key: 'nav.vouchers', category: 'nav', ar: 'سندات القبض والصرف', en: 'Receipt & Payment Vouchers', context: 'Cash and bank treasury vouchers' },
    { key: 'nav.accounts', category: 'nav', ar: 'شجرة الحسابات والقيود', en: 'Chart of Accounts & Journal', context: 'General ledger, tree structure, debit & credit' },
    { key: 'nav.zatca', category: 'nav', ar: 'منصة الربط مع الهيئة', en: 'ZATCA Phase 2 Integration', context: 'Fatoora portal clearance and reporting' },
    { key: 'nav.reports', category: 'nav', ar: 'التقارير والقوائم المالية', en: 'Financial Reports', context: 'Income statement, balance sheet, trial balance, VAT return' },
    { key: 'nav.subscriptions', category: 'nav', ar: 'الباقات والاشتراكات', en: 'Plans & Subscriptions', context: 'Company packages and subscription management' },
    { key: 'nav.register', category: 'nav', ar: 'تسجيل شركة جديدة', en: 'Register Company', context: 'New tenant onboarding wizard' },
    { key: 'nav.login', category: 'nav', ar: 'تسجيل الدخول', en: 'Sign In', context: 'User login' },
    { key: 'nav.backend', category: 'nav', ar: 'هندسة .NET Core الباك إند', en: '.NET Core Backend Architecture', context: 'Clean architecture specification and API docs' },
    { key: 'nav.dictionary', category: 'nav', ar: 'قاموس المصطلحات والترجمة', en: 'Translation Dictionary & Hub', context: 'Bilingual terminology and i18n management' },

    // -------------------------------------------------------------
    // COMMON & UI ACTIONS
    // -------------------------------------------------------------
    { key: 'common.appName', category: 'common', ar: 'نِظام الرَّايَة المُحاسَبي', en: 'Al-Raya ERP System', context: 'Main software title' },
    { key: 'common.erpSubtitle', category: 'common', ar: 'سحابي متعدد المستأجرين • معتمد لهيئة الزكاة ZATCA', en: 'Multi-Tenant Cloud ERP • ZATCA Compliant Phase 2', context: 'Header subtitle' },
    { key: 'common.search', category: 'common', ar: 'بحث...', en: 'Search...', context: 'General search input placeholder' },
    { key: 'common.filter', category: 'common', ar: 'تصفية', en: 'Filter', context: 'Filter button' },
    { key: 'common.add', category: 'common', ar: 'إضافة جديد', en: 'Add New', context: 'Add new record action' },
    { key: 'common.create', category: 'common', ar: 'إنشاء', en: 'Create', context: 'Create record' },
    { key: 'common.edit', category: 'common', ar: 'تعديل', en: 'Edit', context: 'Edit record' },
    { key: 'common.delete', category: 'common', ar: 'حذف', en: 'Delete', context: 'Delete record' },
    { key: 'common.save', category: 'common', ar: 'حفظ', en: 'Save', context: 'Save form' },
    { key: 'common.cancel', category: 'common', ar: 'إلغاء', en: 'Cancel', context: 'Cancel modal or form' },
    { key: 'common.close', category: 'common', ar: 'إغلاق', en: 'Close', context: 'Close modal' },
    { key: 'common.actions', category: 'common', ar: 'الإجراءات', en: 'Actions', context: 'Table actions column' },
    { key: 'common.status', category: 'common', ar: 'الحالة', en: 'Status', context: 'Status column' },
    { key: 'common.active', category: 'common', ar: 'نشط', en: 'Active', context: 'Active state' },
    { key: 'common.inactive', category: 'common', ar: 'غير نشط', en: 'Inactive', context: 'Inactive state' },
    { key: 'common.yes', category: 'common', ar: 'نعم', en: 'Yes', context: 'Affirmative response' },
    { key: 'common.no', category: 'common', ar: 'لا', en: 'No', context: 'Negative response' },
    { key: 'common.all', category: 'common', ar: 'الكل', en: 'All', context: 'Select all filter' },
    { key: 'common.print', category: 'common', ar: 'طباعة', en: 'Print', context: 'Print document' },
    { key: 'common.exportExcel', category: 'common', ar: 'تصدير إكسل', en: 'Export Excel', context: 'Export grid data to spreadsheet' },
    { key: 'common.exportPdf', category: 'common', ar: 'تصدير PDF', en: 'Export PDF', context: 'Export document to PDF' },
    { key: 'common.exportJson', category: 'common', ar: 'تصدير JSON', en: 'Export JSON', context: 'Export raw data' },
    { key: 'common.refresh', category: 'common', ar: 'تحديث', en: 'Refresh', context: 'Refresh data from server' },
    { key: 'common.details', category: 'common', ar: 'التفاصيل', en: 'Details', context: 'View details action' },
    { key: 'common.notes', category: 'common', ar: 'ملاحظات', en: 'Notes', context: 'Notes field' },
    { key: 'common.date', category: 'common', ar: 'التاريخ', en: 'Date', context: 'Date column' },
    { key: 'common.amount', category: 'common', ar: 'المبلغ', en: 'Amount', context: 'Currency amount' },
    { key: 'common.currencySar', category: 'common', ar: 'ر.س', en: 'SAR', context: 'Saudi Riyal currency symbol' },
    { key: 'common.required', category: 'common', ar: 'حقل إلزامي', en: 'Required field', context: 'Validation label' },
    { key: 'common.loading', category: 'common', ar: 'جاري التحميل...', en: 'Loading...', context: 'Loading indicator' },
    { key: 'common.noData', category: 'common', ar: 'لا توجد بيانات متاحة', en: 'No data available', context: 'Empty state message' },
    { key: 'common.confirmDelete', category: 'common', ar: 'هل أنت متأكد من رغبتك في الحذف؟', en: 'Are you sure you want to delete this record?', context: 'Delete confirmation prompt' },
    { key: 'common.successSaved', category: 'common', ar: 'تم الحفظ بنجاح', en: 'Saved successfully', context: 'Toast message' },
    { key: 'common.successDeleted', category: 'common', ar: 'تم الحذف بنجاح', en: 'Deleted successfully', context: 'Toast message' },
    { key: 'common.showingEntries', category: 'common', ar: 'عرض السجلات', en: 'Showing entries', context: 'Pagination text' },
    { key: 'common.page', category: 'common', ar: 'صفحة', en: 'Page', context: 'Pagination page label' },
    { key: 'common.of', category: 'common', ar: 'من', en: 'of', context: 'Pagination total separator' },

    // -------------------------------------------------------------
    // HEADER & MULTI-TENANCY
    // -------------------------------------------------------------
    { key: 'header.currentFacility', category: 'header', ar: 'المنشأة الحالية:', en: 'Current Facility:', context: 'Header tenant indicator' },
    { key: 'header.switchFacility', category: 'header', ar: 'تبديل المنشأة', en: 'Switch Facility', context: 'Tenant dropdown' },
    { key: 'header.vatNumber', category: 'header', ar: 'الرقم الضريبي', en: 'VAT Number', context: '15-digit tax identification number' },
    { key: 'header.crNumber', category: 'header', ar: 'السجل التجاري', en: 'CR Number', context: 'Commercial register number' },
    { key: 'header.language', category: 'header', ar: 'اللغة', en: 'Language', context: 'Language switcher' },
    { key: 'header.arabic', category: 'header', ar: 'العربية (AR)', en: 'Arabic (العربية)', context: 'Arabic language option' },
    { key: 'header.english', category: 'header', ar: 'الإنجليزية (EN)', en: 'English (US)', context: 'English language option' },
    { key: 'header.openDictionary', category: 'header', ar: 'فتح قاموس المصطلحات والترجمة', en: 'Open Translation Dictionary', context: 'Header menu link to dictionary' },
    { key: 'header.zatcaStatus', category: 'header', ar: 'منصة فاتورة ZATCA', en: 'ZATCA Fatoora Platform', context: 'Header compliance link' },
    { key: 'header.cleanArchBadge', category: 'header', ar: 'معمارية .NET 9 النظيفة', en: '.NET 9 Clean Architecture', context: 'Backend quick link' },
    { key: 'header.mobileMenu', category: 'header', ar: 'القائمة الرئيسية للمحاسبة', en: 'Main Accounting Menu', context: 'Mobile drawer title' },
    { key: 'header.systemFootnote', category: 'header', ar: 'واجهة أنجولر Angular • خادم .NET Core Web API', en: 'Angular Frontend • .NET Core Web API Backend', context: 'Sidebar footer' },

    // -------------------------------------------------------------
    // DASHBOARD
    // -------------------------------------------------------------
    { key: 'dashboard.title', category: 'dashboard', ar: 'لوحة القيادة والمؤشرات المالية', en: 'Financial Dashboard & KPIs', context: 'Dashboard main title' },
    { key: 'dashboard.subtitle', category: 'dashboard', ar: 'نظرة شمولية لحظية على المبيعات، المشتريات، السيولة، والالتزام الضريبي', en: 'Real-time overview of sales, purchases, liquidity, and tax compliance', context: 'Dashboard subtitle' },
    { key: 'dashboard.totalSales', category: 'dashboard', ar: 'إجمالي المبيعات (شامل الضريبة)', en: 'Total Sales (Gross)', context: 'KPI card' },
    { key: 'dashboard.totalPurchases', category: 'dashboard', ar: 'إجمالي المشتريات', en: 'Total Purchases', context: 'KPI card' },
    { key: 'dashboard.cogs', category: 'dashboard', ar: 'تكلفة البضاعة المباعة (COGS)', en: 'Cost of Goods Sold (COGS)', context: 'KPI card' },
    { key: 'dashboard.grossProfit', category: 'dashboard', ar: 'مجمل الربح التجاري', en: 'Gross Commercial Profit', context: 'KPI card' },
    { key: 'dashboard.netProfit', category: 'dashboard', ar: 'صافي الدخل التشغيلي', en: 'Net Operating Income', context: 'KPI card' },
    { key: 'dashboard.liquidity', category: 'dashboard', ar: 'رصيد الصناديق والبنوك', en: 'Cash & Bank Balances', context: 'KPI card' },
    { key: 'dashboard.inventoryValuation', category: 'dashboard', ar: 'تقييم المخزون الحالي', en: 'Current Inventory Valuation', context: 'KPI card' },
    { key: 'dashboard.netVatDue', category: 'dashboard', ar: 'صافي الضريبة المستحقة للهيئة', en: 'Net VAT Due to Authority', context: 'Output VAT minus Input VAT' },
    { key: 'dashboard.receivables', category: 'dashboard', ar: 'مستحقات العملاء (مدينون)', en: 'Accounts Receivable', context: 'Customer debt' },
    { key: 'dashboard.payables', category: 'dashboard', ar: 'مستحقات الموردين (دائنون)', en: 'Accounts Payable', context: 'Supplier debt' },
    { key: 'dashboard.quickActions', category: 'dashboard', ar: 'إجراءات سريعة ومعاملات مباشرة', en: 'Quick Actions & Transactions', context: 'Action bar title' },
    { key: 'dashboard.newInvoice', category: 'dashboard', ar: 'إصدار فاتورة ضريبية', en: 'Issue Tax Invoice', context: 'Quick action' },
    { key: 'dashboard.newReceipt', category: 'dashboard', ar: 'سند قبض مالي', en: 'Receipt Voucher', context: 'Quick action' },
    { key: 'dashboard.newPayment', category: 'dashboard', ar: 'سند صرف مالي', en: 'Payment Voucher', context: 'Quick action' },
    { key: 'dashboard.complianceRate', category: 'dashboard', ar: 'نسبة مطابقة الفواتير مع ZATCA', en: 'ZATCA Compliance Ratio', context: 'Compliance meter' },

    // -------------------------------------------------------------
    // MASTER DATA & ENTITIES
    // -------------------------------------------------------------
    { key: 'masterData.title', category: 'masterData', ar: 'إدارة البيانات الأساسية والكيانات', en: 'Master Data & Entities Management', context: 'Master data screen title' },
    { key: 'masterData.tabCustomers', category: 'masterData', ar: 'دليل العملاء', en: 'Customers Directory', context: 'Tab' },
    { key: 'masterData.tabSuppliers', category: 'masterData', ar: 'دليل الموردين', en: 'Suppliers Directory', context: 'Tab' },
    { key: 'masterData.tabProducts', category: 'masterData', ar: 'دليل الأصناف والمخزون', en: 'Product Catalog & Inventory', context: 'Tab' },
    { key: 'masterData.tabUom', category: 'masterData', ar: 'وحدات القياس والتحويل', en: 'Units of Measure (UOM)', context: 'Tab' },
    { key: 'masterData.tabCurrencies', category: 'masterData', ar: 'العملات وأسعار الصرف', en: 'Currencies & Exchange Rates', context: 'Tab' },
    { key: 'masterData.tabPaymentMethods', category: 'masterData', ar: 'طرق الدفع والتوجيه المالي', en: 'Payment Methods & GL Mapping', context: 'Tab' },
    { key: 'masterData.tabWarehouses', category: 'masterData', ar: 'المستودعات والفئات', en: 'Warehouses & Categories', context: 'Tab' },
    { key: 'masterData.customerCode', category: 'masterData', ar: 'كود العميل', en: 'Customer Code', context: 'Table header' },
    { key: 'masterData.customerNameAr', category: 'masterData', ar: 'اسم العميل (عربي)', en: 'Customer Name (Arabic)', context: 'Table header' },
    { key: 'masterData.customerNameEn', category: 'masterData', ar: 'اسم العميل (إنجليزي)', en: 'Customer Name (English)', context: 'Table header' },
    { key: 'masterData.supplierCode', category: 'masterData', ar: 'كود المورد', en: 'Supplier Code', context: 'Table header' },
    { key: 'masterData.supplierNameAr', category: 'masterData', ar: 'اسم المورد (عربي)', en: 'Supplier Name (Arabic)', context: 'Table header' },
    { key: 'masterData.creditLimit', category: 'masterData', ar: 'الحد الائتماني', en: 'Credit Limit', context: 'Maximum credit allowed' },
    { key: 'masterData.paymentTerms', category: 'masterData', ar: 'فترة السداد (أيام)', en: 'Payment Terms (Days)', context: 'Payment terms' },
    { key: 'masterData.bankIban', category: 'masterData', ar: 'رقم الآيبان البنكي (IBAN)', en: 'Bank IBAN', context: 'Supplier bank IBAN' },
    { key: 'masterData.swiftCode', category: 'masterData', ar: 'رمز السويفت (SWIFT)', en: 'SWIFT Code', context: 'Bank identifier' },
    { key: 'masterData.productSku', category: 'masterData', ar: 'رمز الصنف (SKU)', en: 'Item SKU', context: 'Product SKU' },
    { key: 'masterData.barcode', category: 'masterData', ar: 'الباركود الدولي', en: 'International Barcode', context: 'Product Barcode' },
    { key: 'masterData.sellingPrice', category: 'masterData', ar: 'سعر البيع الافتراضي', en: 'Default Selling Price', context: 'Selling price' },
    { key: 'masterData.averageCost', category: 'masterData', ar: 'متوسط التكلفة المرجح', en: 'Weighted Moving Average Cost', context: 'WAC cost calculation' },
    { key: 'masterData.currentStock', category: 'masterData', ar: 'الرصيد المخزني الحالي', en: 'Current Stock Balance', context: 'Stock quantity' },
    { key: 'masterData.reorderLevel', category: 'masterData', ar: 'حد إعادة الطلب', en: 'Reorder Level', context: 'Minimum threshold' },
    { key: 'masterData.baseUnit', category: 'masterData', ar: 'الوحدة الأساسية', en: 'Base Unit', context: 'Base unit of measure' },
    { key: 'masterData.conversionFactor', category: 'masterData', ar: 'معامل التحويل', en: 'Conversion Factor', context: 'Multiplier to base unit' },
    { key: 'masterData.exchangeRate', category: 'masterData', ar: 'سعر الصرف مقابل الريال', en: 'Exchange Rate vs SAR', context: 'Currency rate' },
    { key: 'masterData.currencyConverter', category: 'masterData', ar: 'حاسبة تحويل العملات اللحظية', en: 'Real-time Currency Converter', context: 'Converter tool' },
    { key: 'masterData.uomCalculator', category: 'masterData', ar: 'حاسبة تحويل الكميات', en: 'Quantity Conversion Calculator', context: 'UOM conversion test tool' },
    { key: 'masterData.linkedAccount', category: 'masterData', ar: 'حساب الأستاذ العام المرتبط', en: 'Linked GL Account', context: 'Financial chart mapping' },
    { key: 'masterData.commissionRate', category: 'masterData', ar: 'عمولة التحصيل البنكي (%)', en: 'Bank Commission Rate (%)', context: 'Payment fee' },

    // -------------------------------------------------------------
    // SALES & ZATCA INVOICES
    // -------------------------------------------------------------
    { key: 'sales.title', category: 'sales', ar: 'المبيعات والفواتير الإلكترونية ZATCA', en: 'Sales & ZATCA Electronic Invoices', context: 'Sales title' },
    { key: 'sales.newInvoiceBtn', category: 'sales', ar: 'إنشاء فاتورة مبيعات جديدة', en: 'Create New Sales Invoice', context: 'New invoice button' },
    { key: 'sales.invoiceNumber', category: 'sales', ar: 'رقم الفاتورة', en: 'Invoice Number', context: 'Sequential invoice number' },
    { key: 'sales.invoiceType', category: 'sales', ar: 'نوع الفاتورة الضريبية', en: 'Tax Invoice Type', context: 'ZATCA invoice category' },
    { key: 'sales.standardTaxInvoice', category: 'sales', ar: 'فاتورة ضريبية معيارية (B2B)', en: 'Standard Tax Invoice (B2B)', context: 'Requires buyer VAT number' },
    { key: 'sales.simplifiedTaxInvoice', category: 'sales', ar: 'فاتورة ضريبية مبسطة (B2C)', en: 'Simplified Tax Invoice (B2C)', context: 'For retail consumer transactions' },
    { key: 'sales.customerName', category: 'sales', ar: 'اسم العميل / المشتري', en: 'Customer / Buyer Name', context: 'Customer field' },
    { key: 'sales.customerVat', category: 'sales', ar: 'الرقم الضريبي للمشتري', en: 'Buyer VAT Number', context: '15-digit tax number' },
    { key: 'sales.issueDate', category: 'sales', ar: 'تاريخ ووقت الإصدار', en: 'Issue Date & Time', context: 'ZATCA timestamp' },
    { key: 'sales.paymentMethod', category: 'sales', ar: 'طريقة الدفع والتحصيل', en: 'Payment Method', context: 'Cash, Mada, Credit, Transfer' },
    { key: 'sales.subtotal', category: 'sales', ar: 'المجموع الخاضع للضريبة', en: 'Subtotal (Taxable Amount)', context: 'Net before VAT' },
    { key: 'sales.discount', category: 'sales', ar: 'مجموع الخصومات', en: 'Total Discounts', context: 'Line discount sum' },
    { key: 'sales.vatAmount', category: 'sales', ar: 'ضريبة القيمة المضافة (15%)', en: 'Value Added Tax (VAT 15%)', context: 'Calculated 15% rate' },
    { key: 'sales.grandTotal', category: 'sales', ar: 'المجموع الإجمالي النهائي', en: 'Grand Total (Inclusive of VAT)', context: 'Net + VAT' },
    { key: 'sales.cogsValue', category: 'sales', ar: 'تكلفة البضاعة المباعة', en: 'Cost of Goods Sold', context: 'COGS from weighted average' },
    { key: 'sales.grossMargin', category: 'sales', ar: 'هامش الربح الإجمالي', en: 'Gross Profit Margin', context: 'Sales minus COGS' },
    { key: 'sales.zatcaStatus', category: 'sales', ar: 'حالة الربط مع الهيئة', en: 'ZATCA Submission Status', context: 'Clearance/Reported/Rejected' },
    { key: 'sales.cleared', category: 'sales', ar: 'معتمدة ومطابقة (Cleared)', en: 'Cleared & Approved', context: 'Standard B2B approved' },
    { key: 'sales.reported', category: 'sales', ar: 'مبلّغ عنها بنجاح (Reported)', en: 'Reported Successfully', context: 'Simplified B2C reported' },
    { key: 'sales.rejected', category: 'sales', ar: 'مرفوضة من الهيئة (Rejected)', en: 'Rejected by ZATCA', context: 'Submission failed' },
    { key: 'sales.pending', category: 'sales', ar: 'بانتظار الإرسال (Draft)', en: 'Pending Submission', context: 'Not yet submitted' },
    { key: 'sales.viewQr', category: 'sales', ar: 'عرض رمز الاستجابة QR', en: 'View ZATCA QR Code', context: 'ZATCA TLV QR code modal' },
    { key: 'sales.downloadXml', category: 'sales', ar: 'تحميل ملف XML UBL 2.1', en: 'Download UBL 2.1 XML', context: 'Download compliant XML file' },
    { key: 'sales.printInvoice', category: 'sales', ar: 'طباعة الفاتورة الضريبية', en: 'Print Tax Invoice', context: 'Print action' },

    // -------------------------------------------------------------
    // PURCHASES & SUPPLIERS
    // -------------------------------------------------------------
    { key: 'purchases.title', category: 'purchases', ar: 'فواتير المشتريات والتوريدات', en: 'Purchase Invoices & Vendor Bills', context: 'Purchases title' },
    { key: 'purchases.newPurchaseBtn', category: 'purchases', ar: 'تسجيل فاتورة مشتريات جديدة', en: 'Record New Purchase Bill', context: 'New purchase button' },
    { key: 'purchases.supplierName', category: 'purchases', ar: 'اسم المورد / الشركة', en: 'Supplier / Company Name', context: 'Supplier name' },
    { key: 'purchases.supplierVat', category: 'purchases', ar: 'الرقم الضريبي للمورد', en: 'Supplier VAT Number', context: 'Tax identifier' },
    { key: 'purchases.purchaseNumber', category: 'purchases', ar: 'رقم فاتورة المشتريات', en: 'Purchase Bill Number', context: 'Bill reference' },
    { key: 'purchases.receivedDate', category: 'purchases', ar: 'تاريخ استلام البضاعة', en: 'Goods Receipt Date', context: 'Warehouse receipt date' },
    { key: 'purchases.inputVat', category: 'purchases', ar: 'ضريبة المدخلات القابلة للخصم', en: 'Deductible Input VAT (15%)', context: 'Recoverable tax' },
    { key: 'purchases.autoCostUpdate', category: 'purchases', ar: 'تحديث متوسط التكلفة آلياً', en: 'Auto Update Moving Average Cost', context: 'WAC recalculation' },

    // -------------------------------------------------------------
    // COSTING & INVENTORY
    // -------------------------------------------------------------
    { key: 'costing.title', category: 'costing', ar: 'محرك تسعير التكلفة وتقييم المخزون', en: 'Cost Engine & Inventory Valuation', context: 'Costing title' },
    { key: 'costing.wacFormula', category: 'costing', ar: 'معادلة متوسط التكلفة المرجح (WAC)', en: 'Weighted Average Cost (WAC) Formula', context: 'Mathematical explanation' },
    { key: 'costing.stockMovements', category: 'costing', ar: 'سجل حركات المخزون التفصيلي', en: 'Detailed Stock Movement Ledger', context: 'Audit trail' },
    { key: 'costing.inPurchase', category: 'costing', ar: 'توريد مشتريات (وارد)', en: 'Purchase Inflow (IN)', context: 'Stock in' },
    { key: 'costing.outSales', category: 'costing', ar: 'صرف مبيعات (صادر)', en: 'Sales Outflow (OUT)', context: 'Stock out' },
    { key: 'costing.adjustIn', category: 'costing', ar: 'تسوية مخزنية (إضافة)', en: 'Inventory Adjustment (IN)', context: 'Stock gain' },
    { key: 'costing.adjustOut', category: 'costing', ar: 'تسوية مخزنية (عجز)', en: 'Inventory Adjustment (OUT)', context: 'Stock loss' },
    { key: 'costing.totalValuation', category: 'costing', ar: 'إجمالي القيمة الدفترية للمخزون', en: 'Total Book Value of Stock', context: 'Sum of quantity * averageCost' },

    // -------------------------------------------------------------
    // VOUCHERS (RECEIPT & PAYMENT)
    // -------------------------------------------------------------
    { key: 'vouchers.title', category: 'vouchers', ar: 'سندات القبض والصرف وحركات الخزينة', en: 'Receipt & Payment Vouchers & Treasury', context: 'Vouchers title' },
    { key: 'vouchers.newReceiptBtn', category: 'vouchers', ar: 'إصدار سند قبض نقد/بنك', en: 'Issue Receipt Voucher', context: 'Money in' },
    { key: 'vouchers.newPaymentBtn', category: 'vouchers', ar: 'إصدار سند صرف نقد/بنك', en: 'Issue Payment Voucher', context: 'Money out' },
    { key: 'vouchers.receiptVoucher', category: 'vouchers', ar: 'سند قبض', en: 'Receipt Voucher', context: 'Cash/bank inflow' },
    { key: 'vouchers.paymentVoucher', category: 'vouchers', ar: 'سند صرف', en: 'Payment Voucher', context: 'Cash/bank outflow' },
    { key: 'vouchers.receivedFrom', category: 'vouchers', ar: 'استلمنا من السيد / السادة', en: 'Received From (Payer)', context: 'Payer name' },
    { key: 'vouchers.paidTo', category: 'vouchers', ar: 'صرفنا إلى السيد / السادة', en: 'Paid To (Payee)', context: 'Payee name' },
    { key: 'vouchers.amountInWords', category: 'vouchers', ar: 'المبلغ كتابة بالحروف (Tafqeet)', en: 'Amount in Words (Tafqeet)', context: 'Spelled out amount' },
    { key: 'vouchers.treasuryAccount', category: 'vouchers', ar: 'حساب الخزينة / البنك المتأثر', en: 'Treasury / Bank Account Affected', context: 'Debit or Credit cash account' },
    { key: 'vouchers.partyAccount', category: 'vouchers', ar: 'الحساب المقابل (عميل/مورد/مصروف)', en: 'Contra Account (Customer/Supplier/Expense)', context: 'Contra party account' },
    { key: 'vouchers.refNumber', category: 'vouchers', ar: 'الرقم المرجعي (شيك/حوالة)', en: 'Reference Number (Cheque/Transfer)', context: 'Transaction reference' },
    { key: 'vouchers.autoGlEntry', category: 'vouchers', ar: 'إنشاء قيد محاسبي آلي في اليومية', en: 'Auto-Generate Double-Entry Journal', context: 'Real-time GL posting' },

    // -------------------------------------------------------------
    // CHART OF ACCOUNTS & JOURNAL ENTRIES
    // -------------------------------------------------------------
    { key: 'accounts.title', category: 'accounts', ar: 'دليل الحسابات ودفتر القيود اليومية', en: 'Chart of Accounts & General Journal', context: 'Accounts title' },
    { key: 'accounts.tabTree', category: 'accounts', ar: 'شجرة الحسابات الهرمية', en: 'Hierarchical Chart of Accounts', context: 'Tree view tab' },
    { key: 'accounts.tabJournal', category: 'accounts', ar: 'دفتر اليومية العامة والقيود', en: 'General Journal Entries', context: 'Journal tab' },
    { key: 'accounts.accountCode', category: 'accounts', ar: 'رقم الحساب', en: 'Account Code', context: '1001, 2001, etc.' },
    { key: 'accounts.accountName', category: 'accounts', ar: 'اسم الحساب', en: 'Account Name', context: 'Account title' },
    { key: 'accounts.accountType', category: 'accounts', ar: 'طبيعة الحساب', en: 'Account Classification', context: 'Asset, Liability, Equity, Revenue, Expense' },
    { key: 'accounts.assets', category: 'accounts', ar: 'الأصول والموجودات (1)', en: 'Assets (1)', context: 'Debit normal' },
    { key: 'accounts.liabilities', category: 'accounts', ar: 'الخصوم والالتزامات (2)', en: 'Liabilities (2)', context: 'Credit normal' },
    { key: 'accounts.equity', category: 'accounts', ar: 'حقوق الملكية ورأس المال (3)', en: 'Equity & Capital (3)', context: 'Credit normal' },
    { key: 'accounts.revenue', category: 'accounts', ar: 'الإيرادات والمبيعات (4)', en: 'Revenues & Sales (4)', context: 'Credit normal' },
    { key: 'accounts.expenses', category: 'accounts', ar: 'المصروفات والتكاليف (5)', en: 'Expenses & COGS (5)', context: 'Debit normal' },
    { key: 'accounts.debit', category: 'accounts', ar: 'مدين (Debit)', en: 'Debit', context: 'Debit column' },
    { key: 'accounts.credit', category: 'accounts', ar: 'دائن (Credit)', en: 'Credit', context: 'Credit column' },
    { key: 'accounts.balance', category: 'accounts', ar: 'الرصيد القائم', en: 'Current Balance', context: 'Net balance' },
    { key: 'accounts.level', category: 'accounts', ar: 'المستوى الهرمي', en: 'Tree Level', context: 'Hierarchy depth' },
    { key: 'accounts.entryNumber', category: 'accounts', ar: 'رقم القيد', en: 'Entry Number', context: 'Journal voucher code' },
    { key: 'accounts.balancedStatus', category: 'accounts', ar: 'توازن القيد', en: 'Entry Equilibrium', context: 'Debit == Credit' },
    { key: 'accounts.isBalanced', category: 'accounts', ar: 'متزن (Debit = Credit)', en: 'Balanced (Debit = Credit)', context: 'Balanced state' },

    // -------------------------------------------------------------
    // ZATCA INTEGRATION & TAX COMPLIANCE
    // -------------------------------------------------------------
    { key: 'zatca.title', category: 'zatca', ar: 'بوابة الربط والتكامل مع منصة فاتورة (ZATCA)', en: 'ZATCA Fatoora Phase 2 Integration Portal', context: 'ZATCA title' },
    { key: 'zatca.phase2Compliance', category: 'zatca', ar: 'متطلبات المرحلة الثانية (الربط والتكامل)', en: 'Phase 2 (Integration & Clearance) Requirements', context: 'Phase 2 heading' },
    { key: 'zatca.environment', category: 'zatca', ar: 'بيئة العمل الحالية', en: 'Active Environment', context: 'Sandbox / Simulation / Production' },
    { key: 'zatca.sandbox', category: 'zatca', ar: 'بيئة الاختبار التجريبية (Sandbox)', en: 'Sandbox (Developer Testing)', context: 'Environment' },
    { key: 'zatca.simulation', category: 'zatca', ar: 'بيئة المحاكاة الرسمية (Simulation)', en: 'Simulation (ZATCA Portal)', context: 'Environment' },
    { key: 'zatca.production', category: 'zatca', ar: 'بيئة التشغيل والإنتاج الفعلي (Production)', en: 'Production (Live Invoices)', context: 'Environment' },
    { key: 'zatca.csid', category: 'zatca', ar: 'شهادة التشفير والأمان الرقمي (CSID)', en: 'Cryptographic Stamp Identifier (CSID)', context: 'Device certificate' },
    { key: 'zatca.complianceCheck', category: 'zatca', ar: 'فحص الامتثال والتحقق التلقائي', en: 'Automated Compliance Check', context: 'Verification tool' },
    { key: 'zatca.invoiceHash', category: 'zatca', ar: 'تجزئة الفاتورة الرقمية (SHA-256 Hash)', en: 'Digital Invoice Hash (SHA-256)', context: 'Cryptographic hash' },
    { key: 'zatca.pih', category: 'zatca', ar: 'تجزئة الفاتورة السابقة (PIH)', en: 'Previous Invoice Hash (PIH Chaining)', context: 'Blockchain-like tamper proof chaining' },
    { key: 'zatca.xmlUbl', category: 'zatca', ar: 'ملف XML بتنسيق UBL 2.1 المعتمد', en: 'UBL 2.1 Compliant XML Specification', context: 'Universal Business Language standard' },
    { key: 'zatca.tlvQrCode', category: 'zatca', ar: 'رمز الاستجابة السريعة بمعايير TLV المشفر', en: 'Encrypted TLV Base64 QR Code', context: 'Tag-Length-Value encoding' },

    // -------------------------------------------------------------
    // FINANCIAL REPORTS & STATEMENTS
    // -------------------------------------------------------------
    { key: 'reports.title', category: 'reports', ar: 'التقارير المالية والقوائم الختامية والإقرار الضريبي', en: 'Financial Statements, Trial Balance & Tax Returns', context: 'Reports title' },
    { key: 'reports.tabTrialBalance', category: 'reports', ar: 'ميزان المراجعة بالأرصدة والمجاميع', en: 'Trial Balance (Balances & Totals)', context: 'Tab' },
    { key: 'reports.tabIncomeStatement', category: 'reports', ar: 'قائمة الدخل والأرباح والخسائر (P&L)', en: 'Income Statement (Profit & Loss)', context: 'Tab' },
    { key: 'reports.tabBalanceSheet', category: 'reports', ar: 'الميزانية العمومية وقائمة المركز المالي', en: 'Balance Sheet (Financial Position)', context: 'Tab' },
    { key: 'reports.tabVatReturn', category: 'reports', ar: 'نموذج الإقرار الضريبي الرسمي (VAT Return)', en: 'Official VAT Return Declaration (ZATCA Form)', context: 'Tab' },
    { key: 'reports.netOperatingIncome', category: 'reports', ar: 'صافي الربح / الخسارة للفترة', en: 'Net Profit / Loss for the Period', context: 'Bottom line' },
    { key: 'reports.totalAssets', category: 'reports', ar: 'مجموع الأصول (الموجودات)', en: 'Total Assets', context: 'Balance sheet equation left side' },
    { key: 'reports.totalLiabilitiesAndEquity', category: 'reports', ar: 'مجموع الالتزامات وحقوق الملكية', en: 'Total Liabilities & Equity', context: 'Balance sheet equation right side' },
    { key: 'reports.vatDue', category: 'reports', ar: 'صافي ضريبة القيمة المضافة واجبة السداد للهيئة', en: 'Net VAT Due for Remittance to Authority', context: 'Output VAT - Input VAT' },

    // -------------------------------------------------------------
    // BACKEND ARCHITECTURE (.NET CORE 9)
    // -------------------------------------------------------------
    { key: 'backend.title', category: 'backend', ar: 'هندسة وبرمجة خادم الباك إند (.NET Core 9 Clean Architecture)', en: '.NET Core 9 Clean Architecture Backend Specification', context: 'Backend title' },
    { key: 'backend.domainLayer', category: 'backend', ar: 'طبقة النطاق والقواعد الأساسية (Domain Layer)', en: 'Domain Layer (Core Entities & Rules)', context: 'Clean architecture layer' },
    { key: 'backend.appLayer', category: 'backend', ar: 'طبقة التطبيق وأوامر المعالجة (Application Layer)', en: 'Application Layer (CQRS & MediatR)', context: 'Clean architecture layer' },
    { key: 'backend.infraLayer', category: 'backend', ar: 'طبقة البنية التحتية وقواعد البيانات (Infrastructure Layer)', en: 'Infrastructure Layer (EF Core & ZATCA APIs)', context: 'Clean architecture layer' },
    { key: 'backend.apiLayer', category: 'backend', ar: 'طبقة واجهات برمجة التطبيقات (API / Presentation)', en: 'API Layer (REST Endpoints & Controllers)', context: 'Clean architecture layer' },
    { key: 'backend.multiTenantPattern', category: 'backend', ar: 'عزل البيانات والمستأجرين (Tenant Isolation Filter)', en: 'Multi-Tenant Global Query Filters', context: 'Data isolation' },

    // -------------------------------------------------------------
    // DICTIONARY & I18N MANAGEMENT
    // -------------------------------------------------------------
    { key: 'dictionary.title', category: 'dictionary', ar: 'قاموس المصطلحات المحاسبية والترجمة الفورية', en: 'Accounting Terminology Dictionary & Translation Hub', context: 'Dictionary title' },
    { key: 'dictionary.subtitle', category: 'dictionary', ar: 'دليل ثنائي اللغة (عربي / إنجليزي) لكافة مصطلحات النظام وواجهاته مع محرك ترجمة حي', en: 'Bilingual glossary (Arabic / English) for all system screens, data structures, and live translation preview', context: 'Dictionary subtitle' },
    { key: 'dictionary.searchPlaceholder', category: 'dictionary', ar: 'ابحث بالكلمة العربية، الإنجليزية، أو المفتاح البرمجي...', en: 'Search by Arabic word, English word, or key code...', context: 'Search field' },
    { key: 'dictionary.totalTerms', category: 'dictionary', ar: 'إجمالي المصطلحات المترجمة', en: 'Total Translated Terms', context: 'Counter' },
    { key: 'dictionary.arabicTerms', category: 'dictionary', ar: 'مصطلحات باللغة العربية', en: 'Arabic Terms', context: 'Counter' },
    { key: 'dictionary.englishTerms', category: 'dictionary', ar: 'مصطلحات باللغة الإنجليزية', en: 'English Terms', context: 'Counter' },
    { key: 'dictionary.activeLanguage', category: 'dictionary', ar: 'اللغة الحالية للنظام', en: 'Current System Language', context: 'Active indicator' },
    { key: 'dictionary.keyColumn', category: 'dictionary', ar: 'المفتاح البرمجي (Key)', en: 'Code Key', context: 'Table header' },
    { key: 'dictionary.categoryColumn', category: 'dictionary', ar: 'التصنيف / القسم', en: 'Category', context: 'Table header' },
    { key: 'dictionary.arabicColumn', category: 'dictionary', ar: 'المصطلح بالعربية 🇸🇦', en: 'Arabic Term 🇸🇦', context: 'Table header' },
    { key: 'dictionary.englishColumn', category: 'dictionary', ar: 'المصطلح بالإنجليزية 🇬🇧', en: 'English Term 🇬🇧', context: 'Table header' },
    { key: 'dictionary.contextColumn', category: 'dictionary', ar: 'السياق المحاسبي والتقني', en: 'Accounting & Technical Context', context: 'Table header' },
    { key: 'dictionary.copySuccess', category: 'dictionary', ar: 'تم نسخ المصطلح بنجاح إلى الحافظة', en: 'Term copied to clipboard successfully', context: 'Copy toast' },
    { key: 'dictionary.sandboxTitle', category: 'dictionary', ar: 'مختبر الترجمة الفورية وفحص النصوص', en: 'Live Translation & Terminology Sandbox', context: 'Interactive tester' },
    { key: 'dictionary.sandboxDesc', category: 'dictionary', ar: 'أدخل أي مفتاح أو عبارة للتحقق من ترجمتها الفورية وتنسيق اتجاه الكتابة (RTL / LTR)', en: 'Enter any key code or phrase to preview its real-time translation and writing direction (RTL / LTR)', context: 'Sandbox subtitle' },
    { key: 'dictionary.switchLangPrompt', category: 'dictionary', ar: 'تغيير لغة النظام فورياً:', en: 'Instant System Language Toggle:', context: 'Switch prompt' },
    { key: 'dictionary.exportTitle', category: 'dictionary', ar: 'تصدير القاموس الكامل', en: 'Export Complete Dictionary', context: 'Export section' },
    { key: 'dictionary.exportJsonDesc', category: 'dictionary', ar: 'تصدير مصفوفة المفاتيح بتنسيق JSON للمطورين والمترجمين', en: 'Export dictionary as JSON structure for developers and translators', context: 'Export note' },
    { key: 'dictionary.exportCsvDesc', category: 'dictionary', ar: 'تصدير جدول المصطلحات بتنسيق CSV للمحاسبين وفرق التدقيق', en: 'Export terms table as CSV for accountants and audit teams', context: 'Export note' },
  ];

  // Helper dictionary lookup map for fast O(1) translation
  // (Moved to top of class)

  /**
   * Translates a key according to the currently active language.
   * If not found, returns the key itself as a fallback.
   */
  public t(key: string, params?: Record<string, string | number>): string {
    const entry = this.lookupMap.get(key);
    let text = key;

    if (entry) {
      text = this.langSignal() === 'ar' ? entry.ar : entry.en;
    }

    // Optional parameter replacement {paramName}
    if (params) {
      for (const [paramKey, paramVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }
    }

    return text;
  }

  /**
   * Alias for t()
   */
  public translate(key: string, params?: Record<string, string | number>): string {
    return this.t(key, params);
  }

  /**
   * Switches the active language across the entire application and persists it.
   */
  public setLanguage(lang: AppLanguage): void {
    if (this.langSignal() === lang) return;

    this.langSignal.set(lang);

    try {
      if (isPlatformBrowser(this.platformId) && window.localStorage) {
        window.localStorage.setItem('erp_app_language', lang);
      }
    } catch {
      // Ignore localStorage errors in restricted environments
    }

    this.applyDocumentDirection(lang);
  }

  /**
   * Toggles between Arabic and English
   */
  public toggleLanguage(): void {
    const next = this.langSignal() === 'ar' ? 'en' : 'ar';
    this.setLanguage(next);
  }

  /**
   * Updates document root dir and lang attributes
   */
  private applyDocumentDirection(lang: AppLanguage): void {
    if (isPlatformBrowser(this.platformId) && typeof document !== 'undefined') {
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
    }
  }

  /**
   * Retrieves the initial language from localStorage or defaults to 'ar'
   */
  private getInitialLanguage(): AppLanguage {
    try {
      if (isPlatformBrowser(this.platformId) && window.localStorage) {
        const stored = window.localStorage.getItem('erp_app_language');
        if (stored === 'en' || stored === 'ar') {
          return stored;
        }
      }
    } catch {
      // Ignore
    }
    return 'ar';
  }

  /**
   * Filter and search dictionary entries
   */
  public searchEntries(query: string, category: string = 'all'): DictionaryEntry[] {
    const q = (query || '').trim().toLowerCase();
    return this.dictionary.filter((entry) => {
      const matchesCategory = category === 'all' || entry.category === category;
      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        entry.key.toLowerCase().includes(q) ||
        entry.ar.toLowerCase().includes(q) ||
        entry.en.toLowerCase().includes(q) ||
        (entry.context && entry.context.toLowerCase().includes(q))
      );
    });
  }
}
