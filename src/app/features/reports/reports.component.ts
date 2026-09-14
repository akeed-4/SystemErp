import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ErpService} from '../../core/services/erp.service';
import {Account, ProductItem} from '../../core/models/erp.models';
import {tafqeetArabic} from '../../core/utils/tafqeet.util';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  public erpService = inject(ErpService);

  public selectedReport = signal<'income_statement' | 'balance_sheet' | 'vat_return' | 'trial_balance' | 'inventory_valuation'>('income_statement');

  public trialBalanceAccounts = computed(() => {
    return this.erpService.accounts();
  });

  public trialBalanceTotalDebit = computed(() => {
    return this.trialBalanceAccounts().reduce((sum, a) => (a.isDebitNature ? sum + a.balance : sum), 0);
  });

  public trialBalanceTotalCredit = computed(() => {
    return this.trialBalanceAccounts().reduce((sum, a) => (!a.isDebitNature ? sum + a.balance : sum), 0);
  });

  // Income Statement Computations (قائمة الدخل)
  public incomeStatement = computed(() => {
    const stats = this.erpService.financialStats();
    const sales = stats.totalSales || 0;
    const cogs = stats.cogs ?? stats.cogsTotal ?? 0;
    const grossProfit = sales - cogs;
    const operatingExpenses = stats.operatingExpenses ?? 8000;
    const netProfit = grossProfit - operatingExpenses;

    return {
      sales,
      cogs,
      grossProfit,
      operatingExpenses,
      netProfit,
      netProfitTafqeet: tafqeetArabic(Math.max(0, netProfit)),
    };
  });

  // Balance Sheet Computations (الميزانية العمومية)
  public balanceSheet = computed(() => {
    const accounts = this.erpService.accounts();
    const assets = accounts.filter((a) => a.type === 'asset' && a.level >= 3);
    const liabilities = accounts.filter((a) => a.type === 'liability' && a.level >= 3);
    const equity = accounts.filter((a) => a.type === 'equity' && a.level >= 2);

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1,
    };
  });

  // VAT Return Computations (إقرار الضريبة)
  public vatReturn = computed(() => {
    const stats = this.erpService.financialStats();
    const taxableSales = stats.totalSales;
    const outputVat = stats.outputVat;
    const taxablePurchases = stats.totalPurchases;
    const inputVat = stats.inputVat;
    const netVatPayable = outputVat - inputVat;

    return {
      taxableSales,
      outputVat,
      taxablePurchases,
      inputVat,
      netVatPayable,
      payableTafqeet: tafqeetArabic(Math.max(0, netVatPayable)),
    };
  });

  public printCurrentReport() {
    window.print();
  }
}
