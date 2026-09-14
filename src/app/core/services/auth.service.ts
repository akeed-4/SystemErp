import {Injectable, inject, signal, computed} from '@angular/core';
import {Router} from '@angular/router';
import {
  User,
  SubscriptionPlan,
  CompanySubscription,
  CompanyRegistrationRequest,
  Tenant
} from '../models/erp.models';
import {ErpService} from './erp.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private erpService = inject(ErpService);
  private router = inject(Router);

  // 1. Subscription Plans Definition (الباقات المتاحة)
  public readonly plans = signal<SubscriptionPlan[]>([
    {
      id: 'starter',
      nameAr: 'باقة البداية (Starter)',
      nameEn: 'Starter Plan',
      descriptionAr: 'مثالية للمنشآت والمتاجر الناشئة ورواد الأعمال لتلبية متطلبات الفوترة الضريبية وإدارة المعاملات الأساسية.',
      descriptionEn: 'Ideal for startups, sole proprietors, and small shops to meet basic invoicing and tax compliance.',
      priceMonthly: 199,
      priceYearly: 1990, // وفر شهرين
      isPopular: false,
      badgeAr: 'للمنشآت الناشئة',
      badgeEn: 'For Startups',
      maxUsers: 2,
      maxInvoicesPerMonth: 500,
      branches: 1,
      featuresAr: [
        'مستخدمين 2 مع صلاحيات أساسية',
        'حتى 500 فاتورة مبيعات ومشتريات شهرياً',
        'فرع ومستودع رئيسي واحد',
        'إصدار فواتير ضريبية مبسطة (B2C) مع QR كود TLV',
        'سندات القبض والصرف الأساسية',
        'شجرة حسابات مبسطة (4 مستويات)',
        'دعم فني عبر البريد وتحديثات دورية'
      ],
      featuresEn: [
        'Up to 2 users with basic roles',
        'Up to 500 invoices/month',
        '1 branch & single warehouse',
        'Simplified Tax Invoices (B2C) with TLV QR Code',
        'Basic receipt & payment vouchers',
        'Standard chart of accounts (4 levels)',
        'Email support & regular updates'
      ]
    },
    {
      id: 'professional',
      nameAr: 'باقة الشركات المتقدمة (Professional)',
      nameEn: 'Professional Business Plan',
      descriptionAr: 'الخيار الأكثر طلباً للشركات والمؤسسات المتوسطة مع دعم كامل للربط والتكامل ZATCA ومحاسبة التكاليف.',
      descriptionEn: 'Most popular choice for growing businesses with full ZATCA Phase 2 clearance and costing engine.',
      priceMonthly: 499,
      priceYearly: 4990, // وفر شهرين
      isPopular: true,
      badgeAr: 'الأكثر طلباً ⭐',
      badgeEn: 'Most Popular ⭐',
      maxUsers: 10,
      maxInvoicesPerMonth: 'unlimited',
      branches: 3,
      featuresAr: [
        'حتى 10 مستخدمين مع إدارة أدوار متقدمة (RBAC)',
        'فواتير مبيعات ومشتريات غير محدودة شهرياً',
        'إدارة حتى 3 فروع ومستودعات متعددة',
        'ربط وتكامل مع هيئة الزكاة ZATCA Phase 2 (فواتير ضريبية B2B واعتماد لحظي)',
        'محرك حساب متوسط التكلفة المرجح المتحرك (Moving Average Costing)',
        'شجرة حسابات احترافية مرنة والقيود اليومية الآلية',
        'تقارير مالية تفصيلية (قائمة الدخل، الميزانية العمومية، إقرار الضريبة)',
        'دعم فني سريع عبر الواتساب والهاتف'
      ],
      featuresEn: [
        'Up to 10 users with advanced RBAC permissions',
        'Unlimited invoices per month',
        'Up to 3 branches & multi-warehouse inventory',
        'ZATCA Phase 2 Integration (B2B Clearance & B2C Reporting)',
        'Weighted Moving Average costing engine',
        'Enterprise chart of accounts with auto journal entries',
        'Financial reports (P&L, Balance Sheet, VAT Return)',
        'Priority phone & WhatsApp support'
      ]
    },
    {
      id: 'enterprise',
      nameAr: 'باقة المجموعات والمؤسسات (Enterprise)',
      nameEn: 'Enterprise Corporate Plan',
      descriptionAr: 'حل متكامل ومخصص للمجموعات التجارية والشركات الكبرى وفروعها مع بنية تحتية مخصصة وربط API مفتوح.',
      descriptionEn: 'Custom corporate solution for large holdings and chains with dedicated infrastructure and API webhooks.',
      priceMonthly: 999,
      priceYearly: 9990, // وفر شهرين
      isPopular: false,
      badgeAr: 'للمجموعات الكبرى',
      badgeEn: 'Corporate & Holding',
      maxUsers: 'unlimited',
      maxInvoicesPerMonth: 'unlimited',
      branches: 'unlimited',
      featuresAr: [
        'عدد غير محدود من المستخدمين والمشرفين',
        'فروع ومستودعات ومراكز تكلفة غير محدودة',
        'ربط برمجي كامل (RESTful API Webhooks) مع المتاجر ونقاط البيع',
        'ربط تلقائي بالكامل مع بوابة Fatoora ZATCA وتخزين سحابي للـ CSID',
        'تعدد العملات وسعر الصرف التلقائي',
        'تقارير تحليلية ومؤشرات أداء مالية متقدمة وتصدير مخصص',
        'خادم وقاعدة بيانات مستقلة عالية الأداء ونسخ احتياطي فوري',
        'مدير حساب محاسبي معتمد مخصص ودعم على مدار الساعة 24/7'
      ],
      featuresEn: [
        'Unlimited users and branch supervisors',
        'Unlimited branches, warehouses & cost centers',
        'Full RESTful API & POS webhooks integration',
        'Automated Fatoora ZATCA portal with cloud CSID storage',
        'Multi-currency support with auto FX rates',
        'Advanced financial BI dashboards & custom export',
        'Dedicated high-performance tenant database & real-time backup',
        'Dedicated account manager & 24/7 priority SLA'
      ]
    }
  ]);

  // 2. Demo Users Registry
  private usersSignal = signal<User[]>([
    {
      id: 'usr-1',
      tenantId: 'tenant-1',
      name: 'عبدالله السبيعي',
      email: 'admin@alofuq.com.sa',
      phone: '+966 50 123 4567',
      role: 'owner',
      avatarInitials: 'ع س',
      isActive: true,
      createdAt: '2026-01-01',
    },
    {
      id: 'usr-2',
      tenantId: 'tenant-1',
      name: 'محمد الشمري (محاسب قانوني)',
      email: 'accountant@alofuq.com.sa',
      phone: '+966 55 987 6543',
      role: 'chief_accountant',
      avatarInitials: 'م ش',
      isActive: true,
      createdAt: '2026-01-15',
    },
    {
      id: 'usr-3',
      tenantId: 'tenant-2',
      name: 'م. فهد القرشي',
      email: 'admin@alnoor-tech.com',
      phone: '+966 54 222 3344',
      role: 'general_manager',
      avatarInitials: 'ف ق',
      isActive: true,
      createdAt: '2026-02-01',
    },
    {
      id: 'usr-4',
      tenantId: 'tenant-3',
      name: 'خالد الهاجري',
      email: 'admin@alrowad-logistics.sa',
      phone: '+966 56 777 8899',
      role: 'owner',
      avatarInitials: 'خ هـ',
      isActive: true,
      createdAt: '2026-02-10',
    },
  ]);

  // Current Logged-in User (Default to User 1)
  private currentUserSignal = signal<User | null>(this.usersSignal()[0]);

  public readonly currentUser = computed(() => this.currentUserSignal());
  public readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  public readonly users = computed(() => this.usersSignal());

  // Active Tenant Subscription
  public readonly currentSubscription = computed<CompanySubscription | undefined>(() => {
    const activeTenant = this.erpService.activeTenant();
    return activeTenant?.subscription;
  });

  public readonly activePlan = computed(() => {
    const sub = this.currentSubscription();
    if (!sub) return this.plans()[1]; // default professional
    return this.plans().find((p) => p.id === sub.planId) || this.plans()[1];
  });

  // Login Method
  public login(
    email: string,
    password?: string,
    tenantId?: string
  ): { success: boolean; message: string } {
    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists in registered users
    let user = this.usersSignal().find(
      (u) => u.email.toLowerCase() === trimmedEmail
    );

    if (!user) {
      // If logging in with demo credentials or any email, dynamically bind or find by tenant
      if (tenantId) {
        const tenant = this.erpService.tenants().find((t) => t.id === tenantId);
        user = {
          id: `usr-${Date.now()}`,
          tenantId: tenantId,
          name: tenant ? `مدير ${tenant.nameAr}` : 'مدير النظام',
          email: trimmedEmail,
          phone: '+966 50 000 0000',
          role: 'owner',
          avatarInitials: 'م ن',
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0],
        };
        this.usersSignal.update((list) => [user!, ...list]);
      } else {
        return {
          success: false,
          message: 'البريد الإلكتروني غير مسجل في النظام. يمكنك تجربة الدخول السريع أو تسجيل شركة جديدة.',
        };
      }
    }

    this.currentUserSignal.set(user);
    this.erpService.switchTenant(user.tenantId);

    return {
      success: true,
      message: `تم تسجيل الدخول بنجاح! مرحباً بك، ${user.name}`,
    };
  }

  // Quick Demo Login by User ID
  public loginAsDemoUser(userId: string): void {
    const user = this.usersSignal().find((u) => u.id === userId);
    if (user) {
      this.currentUserSignal.set(user);
      this.erpService.switchTenant(user.tenantId);
      this.router.navigate(['/dashboard']);
    }
  }

  // Logout Method
  public logout(): void {
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  // Register New Company with Subscription (تسجيل شركة جديدة)
  public registerCompany(
    req: CompanyRegistrationRequest
  ): { success: boolean; tenantId: string; message: string } {
    // 1. Validate VAT Number (15 digits, start & end with 3)
    const cleanVat = req.vatNumber.replace(/\D/g, '');
    if (cleanVat.length !== 15 || !cleanVat.startsWith('3') || !cleanVat.endsWith('3')) {
      return {
        success: false,
        tenantId: '',
        message: 'الرقم الضريبي السعودي يجب أن يتكون من 15 خانة ويبدأ وينتهي بالرقم 3 (وفق معايير هيئة الزكاة).',
      };
    }

    // 2. Determine Selected Plan
    const selectedPlan = this.plans().find((p) => p.id === req.planId) || this.plans()[1];
    const paidAmount = req.billingCycle === 'yearly' ? selectedPlan.priceYearly : selectedPlan.priceMonthly;

    // Calculate Expiry Date
    const now = new Date();
    const expiry = new Date();
    if (req.billingCycle === 'yearly') {
      expiry.setFullYear(now.getFullYear() + 1);
    } else {
      expiry.setMonth(now.getMonth() + 1);
    }

    const subscription: CompanySubscription = {
      planId: selectedPlan.id,
      planNameAr: selectedPlan.nameAr,
      planNameEn: selectedPlan.nameEn,
      billingCycle: req.billingCycle,
      startDate: now.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      status: 'active',
      paidAmount: paidAmount,
      paymentMethod: req.paymentMethod,
      transactionReference: `TXN-${req.paymentMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    // 3. Create New Tenant in ErpService
    const newTenantData: Partial<Tenant> = {
      nameAr: req.companyNameAr,
      nameEn: req.companyNameEn || req.companyNameAr,
      vatNumber: cleanVat,
      crNumber: req.crNumber,
      city: req.city || 'الرياض',
      address: req.address || 'شارع التخصصي',
      phone: req.phone,
      email: req.email,
      currency: 'SAR',
      financialYearStart: `${now.getFullYear()}-01-01`,
      financialYearEnd: `${now.getFullYear()}-12-31`,
      subscription: subscription,
      zatcaConfig: {
        environment: 'simulation',
        complianceStatus: 'in_progress',
        csid: `CSID-SIM-${Math.floor(100000 + Math.random() * 900000)}`,
        solutionName: 'ERP-CleanArch-Zatca-Connector',
        solutionVersion: '2.4.0',
        registeredDevice: 'POS-TERMINAL-01',
        autoSendInvoices: true,
      },
    };

    const createdTenant = this.erpService.addTenant(newTenantData);

    // 4. Create Owner / Admin User
    const adminUser: User = {
      id: `usr-${Date.now()}`,
      tenantId: createdTenant.id,
      name: req.adminName,
      email: req.adminEmail,
      phone: req.adminPhone,
      role: 'owner',
      avatarInitials: this.getInitials(req.adminName),
      isActive: true,
      createdAt: now.toISOString().split('T')[0],
    };

    this.usersSignal.update((list) => [adminUser, ...list]);
    this.currentUserSignal.set(adminUser);

    // 5. Switch Active Tenant to the new company!
    this.erpService.switchTenant(createdTenant.id);

    return {
      success: true,
      tenantId: createdTenant.id,
      message: `تم تسجيل وتفعيل شركة "${createdTenant.nameAr}" بنجاح ضمن "${selectedPlan.nameAr}"!`,
    };
  }

  // Upgrade or Change Subscription Plan
  public upgradeSubscription(
    planId: 'starter' | 'professional' | 'enterprise',
    billingCycle: 'monthly' | 'yearly',
    paymentMethod: 'mada' | 'credit_card' | 'bank_transfer' | 'apple_pay' = 'mada'
  ): void {
    const tenant = this.erpService.activeTenant();
    if (!tenant) return;

    const selectedPlan = this.plans().find((p) => p.id === planId) || this.plans()[1];
    const paidAmount = billingCycle === 'yearly' ? selectedPlan.priceYearly : selectedPlan.priceMonthly;

    const now = new Date();
    const expiry = new Date();
    if (billingCycle === 'yearly') {
      expiry.setFullYear(now.getFullYear() + 1);
    } else {
      expiry.setMonth(now.getMonth() + 1);
    }

    const newSub: CompanySubscription = {
      planId: selectedPlan.id,
      planNameAr: selectedPlan.nameAr,
      planNameEn: selectedPlan.nameEn,
      billingCycle: billingCycle,
      startDate: now.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      status: 'active',
      paidAmount: paidAmount,
      paymentMethod: paymentMethod,
      transactionReference: `UPG-${paymentMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    // Update Tenant
    const currentTenants = this.erpService.tenants();
    const updated = currentTenants.map((t) =>
      t.id === tenant.id ? { ...t, subscription: newSub } : t
    );
    // update in erp service
    this.erpService.updateTenantSubscription(tenant.id, newSub);
  }

  private getInitials(name: string): string {
    if (!name) return 'م ن';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]} ${parts[1][0]}`;
    }
    return name.slice(0, 2);
  }
}
