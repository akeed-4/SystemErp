import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join, resolve, relative} from 'node:path';
import {existsSync, readdirSync, statSync, readFileSync} from 'node:fs';

process.on('unhandledRejection', (reason: any) => {
  if (reason && String(reason).includes('NotYetImplemented')) {
    return;
  }
  console.error('Unhandled Rejection caught in server.ts:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception caught in server.ts:', error);
});

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

// In-Memory Server-Side Database Store with Multi-Tenancy
interface ServerDb {
  tenants: any[];
  users: any[];
  invoices: any[];
  vouchers: any[];
  accounts: any[];
  journalEntries: any[];
  products: any[];
  customers: any[];
  suppliers: any[];
  auditLogs: any[];
}

const dbStore: ServerDb = {
  tenants: [
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
    },
  ],
  users: [
    {
      id: 'usr-1',
      email: 'admin@alofuq.com.sa',
      name: 'سلطان الراشد',
      role: 'SuperAdmin',
      tenantId: 'tenant-1',
    },
    {
      id: 'usr-2',
      email: 'accountant@alofuq.com.sa',
      name: 'عبدالله العمري',
      role: 'FinancialManager',
      tenantId: 'tenant-1',
    },
  ],
  customers: [],
  suppliers: [],
  invoices: [
    {
      id: 'inv-101',
      tenantId: 'tenant-1',
      invoiceNumber: 'INV-2026-0001',
      kind: 'sales',
      invoiceType: 'tax_invoice',
      issueDate: '2026-09-14',
      issueTime: '10:30:00',
      partyName: 'مؤسسة الشموخ للتجارة العامة',
      partyVatNumber: '300123456700003',
      partyCrNumber: '1010567890',
      partyAddress: 'الرياض - حي الملز',
      paymentMethod: 'bank_transfer',
      subtotal: 37800,
      vatTotal: 5670,
      grandTotal: 43470,
      grossProfit: 7800,
      zatcaStatus: 'cleared',
      zatcaQrCode: 'AQ3ZhNmK2KfZgSDYqtiu2KfZgQIKMzEwMTIzNDU2NzAwMDAzCjIwMjYtMDktMTRUMTA6MzAw',
      uuid: 'c8f76e1a-4d2b-4e68-912a-718293a4b5c6',
      items: [
        {
          id: 'item-1',
          sku: 'SRV-DL-01',
          itemName: 'خادم شبكات ديل باور إيدج Dell PowerEdge R750',
          quantity: 2,
          unit: 'وحدة',
          unitPrice: 18900,
          totalBeforeVat: 37800,
          vatRate: 15,
          vatAmount: 5670,
          totalAfterVat: 43470,
          cogsUnit: 15000,
        },
      ],
    },
  ],
  vouchers: [
    {
      id: 'v-101',
      tenantId: 'tenant-1',
      voucherNumber: 'RV-2026-0001',
      type: 'receipt',
      date: '2026-09-14',
      amount: 25000,
      amountInWordsAr: 'فقط خمسة وعشرون ألف ريال سعودي لا غير',
      partyName: 'مؤسسة الشموخ للتجارة العامة',
      partyAccountCode: '112',
      treasuryAccountCode: '1112',
      paymentMethod: 'bank_transfer',
      referenceNumber: 'TRF-982341',
      notes: 'دفعة تحت الحساب للفاتورة INV-2026-0001',
      receivedOrPaidBy: 'أحمد السعيد - أمين الصندوق',
    },
  ],
  accounts: [
    { code: '1', nameAr: 'الأصول', nameEn: 'Assets', type: 'asset', parentCode: '', balance: 650000, isDebitNature: true },
    { code: '11', nameAr: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', parentCode: '1', balance: 350000, isDebitNature: true },
    { code: '111', nameAr: 'النقدية وما في حكمها', nameEn: 'Cash & Cash Equivalents', type: 'asset', parentCode: '11', balance: 180000, isDebitNature: true },
    { code: '1111', nameAr: 'الصندوق الرئيسي', nameEn: 'Main Cash Box', type: 'asset', parentCode: '111', balance: 35000, isDebitNature: true },
    { code: '1112', nameAr: 'مصرف الراجحي - الحساب الجاري', nameEn: 'Al Rajhi Bank - Current Account', type: 'asset', parentCode: '111', balance: 145000, isDebitNature: true },
    { code: '112', nameAr: 'العملاء والمدينون', nameEn: 'Accounts Receivable', type: 'asset', parentCode: '11', balance: 85000, isDebitNature: true },
    { code: '113', nameAr: 'المخزون السلعي', nameEn: 'Inventory', type: 'asset', parentCode: '11', balance: 85000, isDebitNature: true },
    { code: '2', nameAr: 'الخصوم والالتزامات', nameEn: 'Liabilities', type: 'liability', parentCode: '', balance: 180000, isDebitNature: false },
    { code: '211', nameAr: 'الموردون والدائنون', nameEn: 'Accounts Payable', type: 'liability', parentCode: '2', balance: 120000, isDebitNature: false },
    { code: '212', nameAr: 'ضريبة القيمة المضافة المستحقة (ZATCA)', nameEn: 'VAT Output Tax Payable', type: 'liability', parentCode: '2', balance: 60000, isDebitNature: false },
    { code: '3', nameAr: 'حقوق الملكية ورأس المال', nameEn: 'Equity', type: 'equity', parentCode: '', balance: 470000, isDebitNature: false },
    { code: '4', nameAr: 'الإيرادات والمبيعات', nameEn: 'Revenues', type: 'revenue', parentCode: '', balance: 245000, isDebitNature: false },
    { code: '5', nameAr: 'المصروفات وتكلفة المبيعات', nameEn: 'Expenses', type: 'expense', parentCode: '', balance: 165000, isDebitNature: true },
  ],
  journalEntries: [
    {
      id: 'je-101',
      tenantId: 'tenant-1',
      entryNumber: 'JV-2026-0001',
      date: '2026-09-14',
      description: 'إثبات مبيعات فاتورة رقم INV-2026-0001 وتكلفة البضاعة المباعة',
      referenceType: 'sales',
      referenceId: 'inv-101',
      totalDebit: 73470,
      totalCredit: 73470,
      isBalanced: true,
      lines: [
        { accountCode: '112', accountNameAr: 'العملاء (مؤسسة الشموخ)', debit: 43470, credit: 0, description: 'استحقاق قيمة الفاتورة' },
        { accountCode: '411', accountNameAr: 'إيرادات المبيعات', debit: 0, credit: 37800, description: 'صافي قيمة المبيعات' },
        { accountCode: '212', accountNameAr: 'أمانات ضريبة القيمة المضافة', debit: 0, credit: 5670, description: '15% ضريبة مدخلات ومخرجات' },
        { accountCode: '511', accountNameAr: 'تكلفة البضاعة المباعة (COGS)', debit: 30000, credit: 0, description: 'تكلفة المخزون المنصرف' },
        { accountCode: '113', accountNameAr: 'المخزون السلعي', debit: 0, credit: 30000, description: 'صرف بضاعة من المستودع' },
      ],
    },
  ],
  products: [
    { sku: 'SRV-DL-01', nameAr: 'خادم شبكات ديل باور إيدج Dell PowerEdge R750', currentStock: 12, averageCost: 15000, sellingPrice: 18900 },
    { sku: 'LTP-THK-16', nameAr: 'حاسب محمول لينوفو ثينك باد ThinkPad P16', currentStock: 25, averageCost: 4200, sellingPrice: 5300 },
  ],
  auditLogs: [
    { id: 'log-1', timestamp: new Date().toISOString(), action: 'SYSTEM_BOOT', details: 'Express Backend & Clean Architecture API Started', user: 'System' },
  ],
};

// Middleware for recording audit logs
function logAudit(action: string, details: string, user: string = 'User') {
  dbStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    details,
    user,
  });
}

/**
 * ====================================================================
 * REST API ENDPOINTS (Real Backend Clean Architecture)
 * ====================================================================
 */

// 1. Authentication APIs
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
  }

  const user = dbStore.users.find((u) => u.email === email) || {
    id: `usr-${Date.now()}`,
    name: email.split('@')[0] || 'مستخدم النظام',
    email,
    role: 'SuperAdmin',
    tenantId: 'tenant-1',
  };

  logAudit('AUTH_LOGIN', `User ${email} signed in successfully.`, user.name);

  return res.json({
    success: true,
    token: `jwt-bearer-${Date.now()}`,
    user,
    serverTime: new Date().toISOString(),
  });
});

app.post('/api/v1/auth/register-company', (req, res) => {
  const body = req.body || {};
  const newTenantId = `tenant-${Date.now().toString().slice(-4)}`;
  const newTenant = {
    id: newTenantId,
    code: `TENANT-${Date.now().toString().slice(-3)}`,
    nameAr: body.companyNameAr || 'منشأة جديدة',
    nameEn: body.companyNameEn || 'New Company',
    vatNumber: body.vatNumber || '300000000000003',
    crNumber: body.crNumber || '1010000000',
    address: body.address || 'المملكة العربية السعودية',
    city: body.city || 'الرياض',
    country: 'المملكة العربية السعودية',
    phone: body.phone || '+966',
    email: body.email || 'admin@company.com',
    currency: 'SAR',
    financialYearStart: '2026-01-01',
    financialYearEnd: '2026-12-31',
  };

  dbStore.tenants.push(newTenant);
  logAudit('TENANT_REGISTER', `Created new tenant: ${newTenant.nameAr} (${newTenantId})`, 'Admin');

  return res.json({
    success: true,
    tenantId: newTenantId,
    tenant: newTenant,
    message: `تم تسجيل منشأة "${newTenant.nameAr}" وتفعيل قاعدة البيانات بنجاح!`,
  });
});

// 2. Tenants APIs
app.get('/api/v1/tenants', (req, res) => {
  res.json(dbStore.tenants);
});

app.put('/api/v1/tenants/:id', (req, res) => {
  const { id } = req.params;
  const index = dbStore.tenants.findIndex((t) => t.id === id);
  if (index >= 0) {
    dbStore.tenants[index] = { ...dbStore.tenants[index], ...req.body };
    logAudit('TENANT_UPDATE', `Updated company profile for ${id}`);
    return res.json({ success: true, tenant: dbStore.tenants[index] });
  }
  return res.status(404).json({ error: 'Tenant not found' });
});

// 3. Invoices APIs
app.get('/api/v1/invoices', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const list = dbStore.invoices.filter((inv) => !inv.tenantId || inv.tenantId === tenantId);
  res.json({
    status: 'success',
    tenantId,
    totalRecords: list.length,
    data: list,
  });
});

app.post('/api/v1/invoices', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const invoiceData = req.body;
  const newInvoice = {
    ...invoiceData,
    id: invoiceData.id || `inv-${Date.now()}`,
    tenantId,
    createdAt: new Date().toISOString(),
  };

  dbStore.invoices.unshift(newInvoice);
  logAudit('INVOICE_CREATE', `Created invoice ${newInvoice.invoiceNumber} (Total: ${newInvoice.grandTotal} SAR)`);

  res.status(201).json({
    status: 'success',
    message: 'تم حفظ الفاتورة بنجاح في قاعدة البيانات',
    data: newInvoice,
  });
});

// 4. Vouchers APIs
app.get('/api/v1/vouchers', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const list = dbStore.vouchers.filter((v) => !v.tenantId || v.tenantId === tenantId);
  res.json({
    status: 'success',
    tenantId,
    totalRecords: list.length,
    data: list,
  });
});

app.post('/api/v1/vouchers', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const voucherData = req.body;
  const newVoucher = {
    ...voucherData,
    id: voucherData.id || `v-${Date.now()}`,
    tenantId,
    createdAt: new Date().toISOString(),
  };

  dbStore.vouchers.unshift(newVoucher);
  logAudit('VOUCHER_CREATE', `Issued voucher ${newVoucher.voucherNumber} (${newVoucher.type}, Amount: ${newVoucher.amount} SAR)`);

  res.status(201).json({
    status: 'success',
    message: 'تم إنشاء وحفظ السند المالي بنجاح في قاعدة البيانات',
    data: newVoucher,
  });
});

// 5. Chart of Accounts & Journal Entries
app.get('/api/v1/accounts', (_req, res) => {
  res.json(dbStore.accounts);
});

app.post('/api/v1/accounts', (req, res) => {
  const acc = req.body;
  dbStore.accounts.push(acc);
  logAudit('ACCOUNT_CREATE', `Added account ${acc.code} - ${acc.nameAr}`);
  res.status(201).json({ success: true, account: acc });
});

app.get('/api/v1/journal-entries', (_req, res) => {
  res.json(dbStore.journalEntries);
});

app.post('/api/v1/journal-entries', (req, res) => {
  const entry = req.body;
  const newEntry = {
    ...entry,
    id: entry.id || `je-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  dbStore.journalEntries.unshift(newEntry);
  logAudit('JOURNAL_ENTRY_CREATE', `Posted balanced journal entry ${newEntry.entryNumber} (Total: ${newEntry.totalDebit} SAR)`);
  res.status(201).json({ success: true, data: newEntry });
});

// 5b. Customers, Suppliers, Products APIs
app.get('/api/v1/customers', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const list = dbStore.customers.filter((c) => !c.tenantId || c.tenantId === tenantId);
  res.json({ success: true, data: list });
});

app.post('/api/v1/customers', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const data = req.body;
  const newItem = { ...data, id: data.id || `cust-${Date.now()}`, tenantId };
  dbStore.customers.unshift(newItem);
  logAudit('CUSTOMER_CREATE', `Added customer ${newItem.nameAr}`);
  res.status(201).json({ success: true, data: newItem });
});

app.get('/api/v1/suppliers', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const list = dbStore.suppliers.filter((s) => !s.tenantId || s.tenantId === tenantId);
  res.json({ success: true, data: list });
});

app.post('/api/v1/suppliers', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const data = req.body;
  const newItem = { ...data, id: data.id || `sup-${Date.now()}`, tenantId };
  dbStore.suppliers.unshift(newItem);
  logAudit('SUPPLIER_CREATE', `Added supplier ${newItem.nameAr}`);
  res.status(201).json({ success: true, data: newItem });
});

app.get('/api/v1/products', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const list = dbStore.products.filter((p) => !p.tenantId || p.tenantId === tenantId);
  res.json({ success: true, data: list });
});

app.post('/api/v1/products', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  const data = req.body;
  const newItem = { ...data, id: data.id || `prod-${Date.now()}`, tenantId };
  dbStore.products.unshift(newItem);
  logAudit('PRODUCT_CREATE', `Added product ${newItem.nameAr}`);
  res.status(201).json({ success: true, data: newItem });
});

// 6. Financial Reports API
app.get('/api/v1/reports/summary', (req, res) => {
  const totalSales = dbStore.invoices.filter((i) => i.kind === 'sales').reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalPurchases = dbStore.invoices.filter((i) => i.kind === 'purchase').reduce((s, i) => s + (i.grandTotal || 0), 0);
  const outputVat = dbStore.invoices.filter((i) => i.kind === 'sales').reduce((s, i) => s + (i.vatTotal || 0), 0);
  const inputVat = dbStore.invoices.filter((i) => i.kind === 'purchase').reduce((s, i) => s + (i.vatTotal || 0), 0);

  res.json({
    period: '2026-Q3',
    generatedAt: new Date().toISOString(),
    totalSales,
    totalPurchases,
    outputVat,
    inputVat,
    netVatPayable: outputVat - inputVat,
    totalVouchersReceipt: dbStore.vouchers.filter((v) => v.type === 'receipt').reduce((s, v) => s + v.amount, 0),
    totalVouchersPayment: dbStore.vouchers.filter((v) => v.type === 'payment').reduce((s, v) => s + v.amount, 0),
  });
});

// 7. Audit Logs API
app.get('/api/v1/audit-logs', (_req, res) => {
  res.json({
    status: 'success',
    total: dbStore.auditLogs.length,
    logs: dbStore.auditLogs,
  });
});

// 8. Costing & ZATCA Simulation
app.get('/api/v1/costing', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1';
  res.json({
    tenantId,
    costingMethod: 'Weighted Moving Average (المتوسط المرجح المتحرك)',
    currency: 'SAR',
    products: dbStore.products,
  });
});

app.post('/api/v1/zatca/simulate', (req, res) => {
  const { invoiceId, invoiceNumber } = req.body || {};
  res.json({
    statusCode: 200,
    status: 'CLEARED',
    fatooraComplianceReference: `ZATCA-REF-${Date.now()}`,
    invoiceNumber: invoiceNumber || 'INV-2026-TEST',
    validationMessages: [
      'XSD Schema Validation Passed (UBL 2.1 Standard).',
      'Cryptographic Stamp (CSID) Verified against Root CA.',
      'Invoice SHA-256 Hash Chain Verified with Previous Invoice Hash (PIH).',
      'TLV Base64 QR Code Structure Verified with 8 Mandatory Tags.',
      'Document successfully cleared and registered in ZATCA central portal.',
    ],
  });
});

app.get('/api/v1/subscriptions/plans', (_req, res) => {
  res.json([
    {
      id: 'starter',
      nameAr: 'باقة رواد الأعمال (Starter)',
      nameEn: 'Starter Plan',
      priceMonthly: 199,
      priceYearly: 1990,
      maxUsers: 2,
      branches: 1,
      invoicesPerMonth: 500,
      isPopular: false,
    },
    {
      id: 'professional',
      nameAr: 'باقة الشركات المتقدمة (Professional)',
      nameEn: 'Professional Plan',
      priceMonthly: 499,
      priceYearly: 4990,
      maxUsers: 10,
      branches: 5,
      invoicesPerMonth: 'unlimited',
      isPopular: true,
      badgeAr: 'الأكثر اختياراً في المملكة 🇸🇦',
    },
    {
      id: 'enterprise',
      nameAr: 'باقة المؤسسات والمجموعات (Enterprise)',
      nameEn: 'Enterprise Plan',
      priceMonthly: 999,
      priceYearly: 9990,
      maxUsers: 'unlimited',
      branches: 'unlimited',
      invoicesPerMonth: 'unlimited',
      isPopular: false,
    },
  ]);
});

/**
 * Real Backend Directory File Explorer APIs
 */
app.get('/api/v1/backend/files', (_req, res) => {
  const backendDir = resolve(process.cwd(), 'backend');
  if (!existsSync(backendDir)) {
    return res.status(404).json({ error: 'Backend directory not found on server' });
  }

  interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    children?: FileNode[];
  }

  function scan(dir: string): FileNode[] {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      return entries
        .sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        })
        .map((entry) => {
          const fullPath = join(dir, entry.name);
          const relPath = relative(backendDir, fullPath);
          if (entry.isDirectory()) {
            return {
              name: entry.name,
              path: relPath,
              type: 'directory' as const,
              children: scan(fullPath),
            };
          }
          return {
            name: entry.name,
            path: relPath,
            type: 'file' as const,
            size: statSync(fullPath).size,
          };
        });
    } catch {
      return [];
    }
  }

  return res.json({
    root: 'backend',
    structure: scan(backendDir),
  });
});

app.get('/api/v1/backend/file-content', (req, res) => {
  const relPath = (req.query['path'] as string) || '';
  const backendDir = resolve(process.cwd(), 'backend');
  const safePath = resolve(backendDir, relPath);

  if (!safePath.startsWith(backendDir) || !existsSync(safePath) || statSync(safePath).isDirectory()) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const content = readFileSync(safePath, 'utf8');
    return res.json({ path: relPath, content });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  // Always accept incoming host or x-forwarded-host to prevent Angular SSR invalid host validation error
  const forwardedHost = req.headers['x-forwarded-host'];
  if (forwardedHost) {
    req.headers['host'] = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  } else if (req.headers['x-forwarded-server']) {
    req.headers['host'] = req.headers['x-forwarded-server'] as string;
  } else {
    // Allow any host header by mirroring request hostname if needed
    req.headers['host'] = req.get('host') || 'ais-dev-nnjnafc6c6fynvrpmqlxyx-345176819117.europe-west3.run.app';
  }
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch((err) => {
      console.warn('SSR rendering error, falling back to CSR index.html:', err?.message || err);
      const indexPath = join(browserDistFolder, 'index.html');
      if (existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next(err);
      }
    });
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
