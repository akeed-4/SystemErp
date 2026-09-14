import {ChangeDetectionStrategy, Component, inject, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {ErpService} from './core/services/erp.service';
import {AuthService} from './core/services/auth.service';
import {TranslationService, AppLanguage} from './core/services/translation.service';
import {TranslatePipe} from './core/pipes/translate.pipe';

interface NavChild {
  path: string;
  labelAr: string;
  labelEn: string;
  icon: string;
}

interface ParentNavGroup {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  expanded: boolean;
  children: NavChild[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public erpService = inject(ErpService);
  public authService = inject(AuthService);
  public i18n = inject(TranslationService);
  public isMobileMenuOpen = signal<boolean>(false);
  public isLangMenuOpen = signal<boolean>(false);
  public isUserMenuOpen = signal<boolean>(false);

  public navGroups = signal<ParentNavGroup[]>([
    {
      id: 'dashboard',
      labelAr: 'لوحة المؤشرات',
      labelEn: 'Dashboard',
      icon: 'dashboard',
      expanded: true,
      children: [
        { path: '/dashboard', labelAr: 'الرئيسية والملخص المالي', labelEn: 'Main Dashboard', icon: 'analytics' }
      ]
    },
    {
      id: 'master',
      labelAr: 'البيانات الرئيسية',
      labelEn: 'Master Data',
      icon: 'folder_open',
      expanded: true,
      children: [
        { path: '/entities', labelAr: 'العملاء والموردين', labelEn: 'Customers & Suppliers', icon: 'manage_accounts' },
        { path: '/costing', labelAr: 'الأصناف والتكلفة (Moving Avg)', labelEn: 'Items & Costing', icon: 'calculate' }
      ]
    },
    {
      id: 'sales',
      labelAr: 'المبيعات والعملاء',
      labelEn: 'Sales & Invoices',
      icon: 'point_of_sale',
      expanded: true,
      children: [
        { path: '/sales', labelAr: 'فواتير المبيعات ونقاط البيع', labelEn: 'Sales Invoices & POS', icon: 'receipt' },
        { path: '/sales/returns', labelAr: 'مرتجع المبيعات (إشعار دائن)', labelEn: 'Sales Returns & Credit Notes', icon: 'assignment_return' }
      ]
    },
    {
      id: 'purchases',
      labelAr: 'المشتريات والموردين',
      labelEn: 'Purchases',
      icon: 'shopping_cart',
      expanded: true,
      children: [
        { path: '/purchases', labelAr: 'فواتير المشتريات والمخزون', labelEn: 'Purchase Invoices', icon: 'local_shipping' }
      ]
    },
    {
      id: 'finance',
      labelAr: 'الحسابات والمالية',
      labelEn: 'Accounts & Finance',
      icon: 'account_balance',
      expanded: true,
      children: [
        { path: '/accounts', labelAr: 'دليل الحسابات المحاسبي', labelEn: 'Chart of Accounts', icon: 'account_tree' },
        { path: '/vouchers', labelAr: 'سندات القبض والصرف', labelEn: 'Receipt & Payment Vouchers', icon: 'receipt_long' }
      ]
    },
    {
      id: 'settings',
      labelAr: 'التقارير والإعدادات',
      labelEn: 'Reports & Settings',
      icon: 'settings',
      expanded: true,
      children: [
        { path: '/reports', labelAr: 'التقارير المالية والضريبية', labelEn: 'Financial Reports & VAT', icon: 'assessment' },
        { path: '/subscriptions', labelAr: 'الباقات والاشتراكات', labelEn: 'Subscriptions & Billing', icon: 'card_membership' },
        { path: '/zatca', labelAr: 'ربط هيئة الزكاة (ZATCA Phase 2)', labelEn: 'ZATCA Integration', icon: 'verified' }
      ]
    }
  ]);

  public toggleGroup(groupId: string) {
    this.navGroups.update((groups) =>
      groups.map((g) => (g.id === groupId ? { ...g, expanded: !g.expanded } : g))
    );
  }

  public toggleMobileMenu() {
    this.isMobileMenuOpen.update((v) => !v);
  }

  public closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  public toggleLangMenu() {
    this.isLangMenuOpen.update((v) => !v);
  }

  public closeLangMenu() {
    this.isLangMenuOpen.set(false);
  }

  public selectLanguage(lang: AppLanguage) {
    this.i18n.setLanguage(lang);
    this.isLangMenuOpen.set(false);
  }

  public switchTenant(tenantId: string) {
    this.erpService.setActiveTenant(tenantId);
  }

  public toggleUserMenu() {
    this.isUserMenuOpen.update((v) => !v);
  }

  public closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  public logout() {
    this.isUserMenuOpen.set(false);
    this.authService.logout();
  }
}

