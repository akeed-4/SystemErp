export interface Tenant {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  vatNumber: string;
  crNumber: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  currency: string;
  logoUrl?: string;
  financialYearStart: string;
  financialYearEnd: string;
  zatcaConfig: ZatcaConfig;
  subscription?: CompanySubscription;
}

export interface ZatcaConfig {
  environment: 'sandbox' | 'simulation' | 'production';
  complianceStatus: 'not_enrolled' | 'in_progress' | 'compliant';
  csid: string;
  binarySecurityToken?: string;
  secretKey?: string;
  solutionName: string;
  solutionVersion: string;
  registeredDevice: string;
  autoSendInvoices: boolean;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  tenantId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: AccountType;
  parentCode: string | null;
  level: number;
  balance: number;
  isDebitNature: boolean;
  isSystem: boolean;
  notes?: string;
  children?: Account[];
}

export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType: 'sales' | 'purchase' | 'receipt_voucher' | 'payment_voucher' | 'inventory_adjustment' | 'manual';
  referenceId?: string;
  referenceNumber?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  tenantId: string;
  sku: string;
  barcode?: string;
  nameAr: string;
  nameEn: string;
  category: string;
  unit: string;
  currentStock: number;
  averageCost: number; // متوسط التكلفة المرجح (Moving Average)
  lastPurchaseCost: number;
  sellingPrice: number;
  vatRate: number; // 15%
  minStockLevel: number;
  notes?: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  itemId: string;
  itemName: string;
  date: string;
  type: 'in_purchase' | 'out_sales' | 'adjustment_in' | 'adjustment_out';
  quantity: number;
  unitCost: number;
  unitPrice?: number;
  referenceNumber: string;
  remainingStock: number;
}

export interface Customer {
  id: string;
  tenantId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  vatNumber?: string;
  crNumber?: string;
  phone: string;
  email?: string;
  contactPerson?: string;
  city: string;
  district?: string;
  street?: string;
  buildingNo?: string;
  postalCode?: string;
  additionalNo?: string;
  creditLimit: number;
  creditPeriodDays: number;
  openingBalance: number;
  currentBalance: number;
  accountCode: string;
  status: 'active' | 'inactive';
  notes?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  vatNumber?: string;
  crNumber?: string;
  phone: string;
  email?: string;
  contactPerson?: string;
  city: string;
  address?: string;
  bankName?: string;
  iban?: string;
  swiftCode?: string;
  paymentTermsDays: number;
  openingBalance: number;
  currentBalance: number;
  accountCode: string;
  status: 'active' | 'inactive';
  notes?: string;
}

export interface UnitOfMeasure {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  isBaseUnit: boolean;
  baseUnitCode?: string;
  conversionFactor: number;
  status: 'active' | 'inactive';
}

export interface Currency {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  isBaseCurrency: boolean;
  exchangeRate: number;
  decimalPlaces: number;
  lastUpdated: string;
  status: 'active' | 'inactive';
}

export interface PaymentMethodItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: 'cash' | 'card' | 'bank' | 'cheque' | 'credit';
  linkedAccountCode: string;
  linkedAccountName: string;
  icon: string;
  commissionPercent?: number;
  requiresReference: boolean;
  status: 'active' | 'inactive';
}

export interface ProductCategory {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  itemCount: number;
  description?: string;
}

export interface Warehouse {
  id: string;
  tenantId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  location: string;
  managerName?: string;
  phone?: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

export type PaymentMethod = 'cash' | 'credit' | 'bank_card' | 'bank_transfer';
export type InvoiceKind = 'sales' | 'purchase';
export type ZatcaInvoiceType = 'tax_invoice' | 'simplified'; // معيارية أو مبسطة
export type ZatcaSubmissionStatus = 'not_submitted' | 'cleared' | 'reported' | 'rejected' | 'warning';

export interface InvoiceItem {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  totalBeforeVat: number;
  totalAfterVat: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  kind: InvoiceKind; // sales or purchase
  invoiceNumber: string;
  uuid: string;
  issueDate: string;
  issueTime: string;
  invoiceType: ZatcaInvoiceType;
  partyName: string; // Customer or Supplier
  partyVatNumber?: string;
  partyCrNumber?: string;
  partyAddress?: string;
  paymentMethod: PaymentMethod;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  vatTotal: number;
  grandTotal: number;
  totalCost: number;
  grossProfit: number;
  status: 'draft' | 'posted' | 'cancelled';
  zatcaStatus: ZatcaSubmissionStatus;
  zatcaHash?: string;
  zatcaQrCode?: string;
  zatcaUblXml?: string;
  zatcaValidationMessages?: string[];
  zatcaPih?: string; // Previous Invoice Hash
  journalEntryId?: string;
  notes?: string;
}

export interface Voucher {
  id: string;
  tenantId: string;
  voucherNumber: string;
  type: 'receipt' | 'payment'; // سند قبض أو صرف
  date: string;
  amount: number;
  amountInWordsAr: string;
  partyName: string;
  partyAccountCode: string; // حساب العميل/المورد/المصروف
  treasuryAccountCode: string; // حساب الصندوق أو البنك
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque';
  referenceNumber?: string; // رقم الفاتورة أو الشيك
  notes: string;
  journalEntryId?: string;
  receivedOrPaidBy: string;
}

export interface FinancialStats {
  totalSales: number;
  totalPurchases: number;
  totalReceipts: number;
  totalPayments: number;
  cogsTotal: number;
  cogs?: number;
  operatingExpenses?: number;
  todayDate?: string;
  netProfit: number;
  inventoryValuation: number;
  outputVat: number;
  inputVat: number;
  netVatPayable: number;
  cashAndBankBalance: number;
  receivablesBalance: number;
  payablesBalance: number;
}

export interface SubscriptionPlan {
  id: 'starter' | 'professional' | 'enterprise';
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceMonthly: number;
  priceYearly: number;
  isPopular?: boolean;
  badgeAr?: string;
  badgeEn?: string;
  maxUsers: number | 'unlimited';
  maxInvoicesPerMonth: number | 'unlimited';
  branches: number | 'unlimited';
  featuresAr: string[];
  featuresEn: string[];
}

export interface CompanySubscription {
  planId: 'starter' | 'professional' | 'enterprise';
  planNameAr: string;
  planNameEn: string;
  billingCycle: 'monthly' | 'yearly';
  startDate: string;
  expiryDate: string;
  status: 'active' | 'trial' | 'expired';
  paidAmount: number;
  paymentMethod: 'mada' | 'credit_card' | 'bank_transfer' | 'apple_pay';
  transactionReference: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'general_manager' | 'chief_accountant' | 'sales_rep';
  avatarInitials: string;
  isActive: boolean;
  createdAt: string;
}

export interface CompanyRegistrationRequest {
  // Company Info
  companyNameAr: string;
  companyNameEn: string;
  vatNumber: string;
  crNumber: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  industry: string;
  
  // Subscription Info
  planId: 'starter' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: 'mada' | 'credit_card' | 'bank_transfer' | 'apple_pay';

  // Admin User Info
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  password: string;
}

