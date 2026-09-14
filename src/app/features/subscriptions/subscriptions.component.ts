import {ChangeDetectionStrategy, Component, inject, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {AuthService} from '../../core/services/auth.service';
import {ErpService} from '../../core/services/erp.service';
import {TranslationService} from '../../core/services/translation.service';
import {SubscriptionPlan} from '../../core/models/erp.models';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './subscriptions.component.html',
})
export class SubscriptionsComponent {
  public authService = inject(AuthService);
  public erpService = inject(ErpService);
  public i18n = inject(TranslationService);

  public showUpgradeModal = signal<boolean>(false);
  public selectedPlanToUpgrade = signal<'starter' | 'professional' | 'enterprise'>('enterprise');
  public upgradeBillingCycle = signal<'monthly' | 'yearly'>('yearly');
  public upgradeSuccessMessage = signal<string | null>(null);

  public plans = this.authService.plans;
  public currentTenant = this.erpService.activeTenant;
  public currentSubscription = this.authService.currentSubscription;
  public activePlan = this.authService.activePlan;

  // Mock payment / invoice records for the current subscription
  public paymentHistory = signal([
    {
      id: 'INV-SUB-2026-001',
      date: '2026-01-01',
      planName: 'باقة الشركات المتقدمة (Professional)',
      billingCycle: 'سنوي (سنة كاملة)',
      amount: 4990,
      vat: 748.5,
      total: 5738.5,
      method: 'مدى (Mada)',
      status: 'مدفوعة ومسددة بالكامل',
      reference: 'TXN-MADA-891024',
    },
    {
      id: 'INV-SUB-2025-098',
      date: '2025-01-01',
      planName: 'باقة الشركات المتقدمة (Professional)',
      billingCycle: 'سنوي',
      amount: 4990,
      vat: 748.5,
      total: 5738.5,
      method: 'مدى (Mada)',
      status: 'مدفوعة',
      reference: 'TXN-MADA-451290',
    }
  ]);

  // Usage statistics for current active company
  public usageStats = computed(() => {
    const tenant = this.currentTenant();
    const sub = this.currentSubscription();
    const invoices = this.erpService.invoices().filter((inv) => inv.tenantId === tenant.id);
    const accounts = this.erpService.accounts().filter((acc) => acc.tenantId === tenant.id);

    const maxUsers = sub?.planId === 'starter' ? 2 : sub?.planId === 'professional' ? 10 : 'غير محدود';
    const currentUsers = 2;

    const maxInvoices = sub?.planId === 'starter' ? 500 : 'غير محدود';

    return {
      currentUsers,
      maxUsers,
      invoicesCount: invoices.length,
      maxInvoices,
      accountsCount: accounts.length,
      daysRemaining: 292,
    };
  });

  public openUpgradeModal(planId?: 'starter' | 'professional' | 'enterprise') {
    if (planId) {
      this.selectedPlanToUpgrade.set(planId);
    }
    this.showUpgradeModal.set(true);
    this.upgradeSuccessMessage.set(null);
  }

  public closeUpgradeModal() {
    this.showUpgradeModal.set(false);
  }

  public confirmUpgrade() {
    const planId = this.selectedPlanToUpgrade();
    const cycle = this.upgradeBillingCycle();
    this.authService.upgradeSubscription(planId, cycle);

    this.upgradeSuccessMessage.set(
      this.i18n.isArabic()
        ? 'تمت ترقية باقة اشتراك المنشأة بنجاح وتحديث كافة الصلاحيات فوراً!'
        : 'Company subscription successfully upgraded!'
    );

    setTimeout(() => {
      this.showUpgradeModal.set(false);
    }, 1200);
  }
}
