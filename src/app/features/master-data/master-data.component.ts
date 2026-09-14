import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ErpService } from '../../core/services/erp.service';
import {
  Customer,
  Supplier,
  ProductItem,
  UnitOfMeasure,
  Currency,
  PaymentMethodItem,
  ProductCategory,
  Warehouse
} from '../../core/models/erp.models';
import { DataGridComponent, DataGridColumn } from '../../shared/components/data-grid/data-grid.component';

export type MasterDataTab = 'customers' | 'suppliers' | 'items' | 'units' | 'currencies' | 'payment_methods' | 'warehouses';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, DataGridComponent],
  templateUrl: './master-data.component.html',
  styleUrl: './master-data.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterDataComponent {
  public erpService = inject(ErpService);

  // Active Tab
  public activeTab = signal<MasterDataTab>('customers');
  public searchQuery = signal<string>('');
  public feedbackMessage = signal<string | null>(null);

  // Quick stats
  public totalCustomerDebt = computed(() => {
    return this.erpService.customers().reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  });

  public totalSupplierDebt = computed(() => {
    return this.erpService.suppliers().reduce((sum, s) => sum + (s.currentBalance || 0), 0);
  });

  public totalInventoryValue = computed(() => {
    return this.erpService.products().reduce((sum, p) => sum + (p.currentStock * p.averageCost), 0);
  });

  // Filtered lists
  public filteredCustomers = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.erpService.customers();
    if (!q) return list;
    return list.filter(c =>
      c.nameAr.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.vatNumber && c.vatNumber.includes(q))
    );
  });

  public filteredSuppliers = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.erpService.suppliers();
    if (!q) return list;
    return list.filter(s =>
      s.nameAr.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.iban && s.iban.toLowerCase().includes(q)) ||
      (s.vatNumber && s.vatNumber.includes(q))
    );
  });

  public filteredProducts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.erpService.products();
    if (!q) return list;
    return list.filter(p =>
      p.nameAr.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  });

  // DataGrid Columns for Customers
  public customerColumns: DataGridColumn<Customer>[] = [
    { field: 'code', caption: 'كود العميل', width: '110px', sortable: true },
    { field: 'nameAr', caption: 'الاسم التجاري', sortable: true },
    { field: 'vatNumber', caption: 'الرقم الضريبي', width: '150px' },
    { field: 'phone', caption: 'الهاتف / الجوال', width: '130px' },
    { field: 'city', caption: 'المدينة', width: '100px', sortable: true },
    { field: 'creditLimit', caption: 'حد الائتمان', width: '120px', format: 'currency', sortable: true },
    { field: 'currentBalance', caption: 'الرصيد المستحق', width: '130px', format: 'currency', sortable: true },
    {
      field: 'status',
      caption: 'الحالة',
      width: '90px',
      format: 'badge',
      badgeClass: (val) => val === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
    }
  ];

  // DataGrid Columns for Suppliers
  public supplierColumns: DataGridColumn<Supplier>[] = [
    { field: 'code', caption: 'كود المورد', width: '110px', sortable: true },
    { field: 'nameAr', caption: 'اسم المورد / الشركة', sortable: true },
    { field: 'vatNumber', caption: 'الرقم الضريبي', width: '150px' },
    { field: 'bankName', caption: 'البنك', width: '130px' },
    { field: 'paymentTermsDays', caption: 'شروط الدفع', width: '110px', render: (s) => `${s.paymentTermsDays} يوم` },
    { field: 'currentBalance', caption: 'المستحقات', width: '130px', format: 'currency', sortable: true },
    {
      field: 'status',
      caption: 'الحالة',
      width: '90px',
      format: 'badge',
      badgeClass: (val) => val === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
    }
  ];

  // DataGrid Columns for Products
  public productColumns: DataGridColumn<ProductItem>[] = [
    { field: 'sku', caption: 'رمز SKU', width: '120px', sortable: true },
    { field: 'nameAr', caption: 'اسم الصنف', sortable: true },
    { field: 'category', caption: 'الفئة', width: '130px', sortable: true },
    { field: 'unit', caption: 'الوحدة', width: '80px' },
    { field: 'averageCost', caption: 'متوسط التكلفة المرجح', width: '130px', format: 'currency', sortable: true },
    { field: 'lastPurchaseCost', caption: 'آخر سعر شراء', width: '120px', format: 'currency', sortable: true },
    { field: 'sellingPrice', caption: 'سعر البيع', width: '110px', format: 'currency', sortable: true },
    {
      field: 'margin',
      caption: 'هامش الربح %',
      width: '110px',
      format: 'badge',
      render: (p: ProductItem) => {
        const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.averageCost) / p.sellingPrice) * 100 : 0;
        return margin.toFixed(1) + '%';
      },
      badgeClass: (_val, p: ProductItem) => {
        const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.averageCost) / p.sellingPrice) * 100 : 0;
        if (margin > 25) return 'bg-emerald-100 text-emerald-800 font-bold';
        if (margin > 15) return 'bg-sky-100 text-sky-800 font-bold';
        return 'bg-amber-100 text-amber-800 font-bold';
      }
    },
    {
      field: 'currentStock',
      caption: 'الرصيد بالمخزن',
      width: '120px',
      sortable: true,
      badgeClass: (val, row) => val <= row.minStockLevel ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-100 text-slate-800'
    }
  ];

  // ==================== Modals State ====================
  // Customer Modal
  public showCustomerModal = signal<boolean>(false);
  public isEditCustomer = signal<boolean>(false);
  public currentCustomer: Partial<Customer> = {};

  // Supplier Modal
  public showSupplierModal = signal<boolean>(false);
  public isEditSupplier = signal<boolean>(false);
  public currentSupplier: Partial<Supplier> = {};

  // Product Modal
  public showProductModal = signal<boolean>(false);
  public isEditProduct = signal<boolean>(false);
  public currentProduct: Partial<ProductItem> = {};

  // Unit Modal
  public showUnitModal = signal<boolean>(false);
  public isEditUnit = signal<boolean>(false);
  public currentUnit: Partial<UnitOfMeasure> = {};

  // Currency Modal
  public showCurrencyModal = signal<boolean>(false);
  public isEditCurrency = signal<boolean>(false);
  public currentCurrency: Partial<Currency> = {};

  // Payment Method Modal
  public showPaymentModal = signal<boolean>(false);
  public isEditPayment = signal<boolean>(false);
  public currentPayment: Partial<PaymentMethodItem> = {};

  // Warehouse Modal
  public showWarehouseModal = signal<boolean>(false);
  public isEditWarehouse = signal<boolean>(false);
  public currentWarehouse: Partial<Warehouse> = {};

  // Currency Converter Live Calculator
  public calcAmount = signal<number>(1000);
  public calcFrom = signal<string>('USD');
  public calcTo = signal<string>('SAR');

  public convertedValue = computed(() => {
    const amount = Number(this.calcAmount() || 0);
    return this.erpService.convertCurrency(amount, this.calcFrom(), this.calcTo());
  });

  // Unit Converter Live Calculator
  public uomQty = signal<number>(5);
  public uomSelectedId = signal<string>('uom-2'); // BOX by default

  public convertedPieces = computed(() => {
    const unit = this.erpService.units().find(u => u.id === this.uomSelectedId());
    if (!unit) return 0;
    return Number(this.uomQty() || 0) * unit.conversionFactor;
  });

  // Switch Tab
  public setTab(tab: MasterDataTab) {
    this.activeTab.set(tab);
    this.searchQuery.set('');
  }

  private showToast(msg: string) {
    this.feedbackMessage.set(msg);
    setTimeout(() => this.feedbackMessage.set(null), 3000);
  }

  // ==================== Customer Actions ====================
  public openAddCustomer() {
    this.isEditCustomer.set(false);
    const count = this.erpService.customers().length + 1;
    this.currentCustomer = {
      code: `CUST-${String(count).padStart(3, '0')}`,
      nameAr: '',
      nameEn: '',
      vatNumber: '',
      crNumber: '',
      phone: '',
      email: '',
      contactPerson: '',
      city: 'الرياض',
      district: '',
      street: '',
      buildingNo: '',
      postalCode: '',
      additionalNo: '',
      creditLimit: 50000,
      creditPeriodDays: 30,
      openingBalance: 0,
      accountCode: '112',
      status: 'active',
      notes: ''
    };
    this.showCustomerModal.set(true);
  }

  public openEditCustomer(cust: Customer) {
    this.isEditCustomer.set(true);
    this.currentCustomer = { ...cust };
    this.showCustomerModal.set(true);
  }

  public saveCustomer() {
    if (!this.currentCustomer.nameAr || !this.currentCustomer.code) {
      alert('يرجى كتابة كود واسم العميل على الأقل');
      return;
    }

    if (this.isEditCustomer() && this.currentCustomer.id) {
      this.erpService.updateCustomer(this.currentCustomer.id, this.currentCustomer);
      this.showToast('تم تحديث بيانات العميل بنجاح');
    } else {
      this.erpService.addCustomer(this.currentCustomer as any);
      this.showToast('تمت إضافة العميل الجديد بنجاح');
    }
    this.showCustomerModal.set(false);
  }

  public deleteCustomer(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      this.erpService.deleteCustomer(id);
      this.showToast('تم حذف العميل بنجاح');
    }
  }

  // ==================== Supplier Actions ====================
  public openAddSupplier() {
    this.isEditSupplier.set(false);
    const count = this.erpService.suppliers().length + 1;
    this.currentSupplier = {
      code: `SUPP-${String(count).padStart(3, '0')}`,
      nameAr: '',
      nameEn: '',
      vatNumber: '',
      crNumber: '',
      phone: '',
      email: '',
      contactPerson: '',
      city: 'الرياض',
      address: '',
      bankName: 'مصرف الراجحي',
      iban: '',
      swiftCode: '',
      paymentTermsDays: 30,
      openingBalance: 0,
      accountCode: '211',
      status: 'active',
      notes: ''
    };
    this.showSupplierModal.set(true);
  }

  public openEditSupplier(supp: Supplier) {
    this.isEditSupplier.set(true);
    this.currentSupplier = { ...supp };
    this.showSupplierModal.set(true);
  }

  public saveSupplier() {
    if (!this.currentSupplier.nameAr || !this.currentSupplier.code) {
      alert('يرجى كتابة كود واسم المورد');
      return;
    }

    if (this.isEditSupplier() && this.currentSupplier.id) {
      this.erpService.updateSupplier(this.currentSupplier.id, this.currentSupplier);
      this.showToast('تم تحديث بيانات المورد بنجاح');
    } else {
      this.erpService.addSupplier(this.currentSupplier as any);
      this.showToast('تمت إضافة المورد الجديد بنجاح');
    }
    this.showSupplierModal.set(false);
  }

  public deleteSupplier(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      this.erpService.deleteSupplier(id);
      this.showToast('تم حذف المورد بنجاح');
    }
  }

  // ==================== Product Actions ====================
  public openAddProduct() {
    this.isEditProduct.set(false);
    const count = this.erpService.products().length + 1;
    this.currentProduct = {
      sku: `PRD-${String(count).padStart(3, '0')}`,
      barcode: `6281000${String(count).padStart(3, '0')}`,
      nameAr: '',
      nameEn: '',
      category: this.erpService.categories()[0]?.nameAr || 'عام',
      unit: 'حبة',
      currentStock: 10,
      averageCost: 100,
      lastPurchaseCost: 100,
      sellingPrice: 150,
      vatRate: 15,
      minStockLevel: 5,
      notes: ''
    };
    this.showProductModal.set(true);
  }

  public openEditProduct(prod: ProductItem) {
    this.isEditProduct.set(true);
    this.currentProduct = { ...prod };
    this.showProductModal.set(true);
  }

  public saveProduct() {
    if (!this.currentProduct.nameAr || !this.currentProduct.sku) {
      alert('يرجى تحديد رمز الصنف واسم الصنف');
      return;
    }

    if (this.isEditProduct() && this.currentProduct.id) {
      this.erpService.updateProduct(this.currentProduct.id, this.currentProduct);
      this.showToast('تم تحديث بيانات الصنف بنجاح');
    } else {
      this.erpService.addProduct(this.currentProduct as any);
      this.showToast('تمت إضافة الصنف إلى دليل المنتجات');
    }
    this.showProductModal.set(false);
  }

  public deleteProduct(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      this.erpService.deleteProduct(id);
      this.showToast('تم حذف الصنف من المخزون');
    }
  }

  // ==================== Unit of Measure Actions ====================
  public openAddUnit() {
    this.isEditUnit.set(false);
    this.currentUnit = {
      code: '',
      nameAr: '',
      nameEn: '',
      symbol: '',
      isBaseUnit: false,
      baseUnitCode: 'PCS',
      conversionFactor: 1,
      status: 'active'
    };
    this.showUnitModal.set(true);
  }

  public openEditUnit(unit: UnitOfMeasure) {
    this.isEditUnit.set(true);
    this.currentUnit = { ...unit };
    this.showUnitModal.set(true);
  }

  public saveUnit() {
    if (!this.currentUnit.code || !this.currentUnit.nameAr) {
      alert('يرجى إدخال رمز واسم الوحدة');
      return;
    }

    if (this.isEditUnit() && this.currentUnit.id) {
      this.erpService.updateUnit(this.currentUnit.id, this.currentUnit);
      this.showToast('تم تحديث وحدة القياس');
    } else {
      this.erpService.addUnit(this.currentUnit as any);
      this.showToast('تمت إضافة وحدة القياس بنجاح');
    }
    this.showUnitModal.set(false);
  }

  public deleteUnit(id: string) {
    if (confirm('هل أنت متأكد من حذف وحدة القياس؟')) {
      this.erpService.deleteUnit(id);
      this.showToast('تم حذف الوحدة');
    }
  }

  // ==================== Currency Actions ====================
  public openAddCurrency() {
    this.isEditCurrency.set(false);
    this.currentCurrency = {
      code: '',
      nameAr: '',
      nameEn: '',
      symbol: '',
      isBaseCurrency: false,
      exchangeRate: 1.0,
      decimalPlaces: 2,
      status: 'active'
    };
    this.showCurrencyModal.set(true);
  }

  public openEditCurrency(cur: Currency) {
    this.isEditCurrency.set(true);
    this.currentCurrency = { ...cur };
    this.showCurrencyModal.set(true);
  }

  public saveCurrency() {
    if (!this.currentCurrency.code || !this.currentCurrency.nameAr) {
      alert('يرجى إدخال رمز العملة واسمها');
      return;
    }

    if (this.isEditCurrency() && this.currentCurrency.id) {
      this.erpService.updateCurrency(this.currentCurrency.id, this.currentCurrency);
      this.showToast('تم تحديث سعر صرف وبيانات العملة');
    } else {
      this.erpService.addCurrency(this.currentCurrency as any);
      this.showToast('تمت إضافة العملة بنجاح');
    }
    this.showCurrencyModal.set(false);
  }

  public updateRate(cur: Currency, rateStr: string) {
    const val = parseFloat(rateStr);
    if (!isNaN(val) && val > 0) {
      this.erpService.updateExchangeRate(cur.code, val);
      this.showToast(`تم تحديث سعر صرف ${cur.nameAr} إلى ${val}`);
    }
  }

  // ==================== Payment Method Actions ====================
  public openAddPaymentMethod() {
    this.isEditPayment.set(false);
    this.currentPayment = {
      code: '',
      nameAr: '',
      nameEn: '',
      type: 'card',
      linkedAccountCode: '1112',
      linkedAccountName: 'مصرف الراجحي - الحساب الجاري',
      icon: 'payment',
      commissionPercent: 0,
      requiresReference: true,
      status: 'active'
    };
    this.showPaymentModal.set(true);
  }

  public openEditPaymentMethod(pm: PaymentMethodItem) {
    this.isEditPayment.set(true);
    this.currentPayment = { ...pm };
    this.showPaymentModal.set(true);
  }

  public savePaymentMethod() {
    if (!this.currentPayment.code || !this.currentPayment.nameAr) {
      alert('يرجى إدخال رمز واسم طريقة الدفع');
      return;
    }

    if (this.isEditPayment() && this.currentPayment.id) {
      this.erpService.updatePaymentMethod(this.currentPayment.id, this.currentPayment);
      this.showToast('تم تحديث طريقة الدفع والتوجيه المحاسبي');
    } else {
      this.erpService.addPaymentMethod(this.currentPayment as any);
      this.showToast('تمت إضافة طريقة الدفع الجديدة بنجاح');
    }
    this.showPaymentModal.set(false);
  }

  public deletePaymentMethod(id: string) {
    if (confirm('هل أنت متأكد من حذف طريقة الدفع؟')) {
      this.erpService.deletePaymentMethod(id);
      this.showToast('تم حذف طريقة الدفع');
    }
  }

  // ==================== Warehouse Actions ====================
  public openAddWarehouse() {
    this.isEditWarehouse.set(false);
    const count = this.erpService.warehouses().length + 1;
    this.currentWarehouse = {
      code: `WH-${String(count).padStart(2, '0')}`,
      nameAr: '',
      nameEn: '',
      location: '',
      managerName: '',
      phone: '',
      isDefault: false,
      status: 'active'
    };
    this.showWarehouseModal.set(true);
  }

  public openEditWarehouse(wh: Warehouse) {
    this.isEditWarehouse.set(true);
    this.currentWarehouse = { ...wh };
    this.showWarehouseModal.set(true);
  }

  public saveWarehouse() {
    if (!this.currentWarehouse.code || !this.currentWarehouse.nameAr) {
      alert('يرجى إدخال كود واسم المستودع');
      return;
    }

    if (this.isEditWarehouse() && this.currentWarehouse.id) {
      this.erpService.updateWarehouse(this.currentWarehouse.id, this.currentWarehouse);
      this.showToast('تم تحديث بيانات المستودع');
    } else {
      this.erpService.addWarehouse(this.currentWarehouse as any);
      this.showToast('تمت إضافة المستودع الجديد');
    }
    this.showWarehouseModal.set(false);
  }
}
