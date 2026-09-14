import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {ErpService} from '../../core/services/erp.service';
import {Account, JournalEntry} from '../../core/models/erp.models';
import {DataGridComponent, DataGridColumn} from '../../shared/components/data-grid/data-grid.component';

@Component({
  selector: 'app-accounts-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, DataGridComponent],
  templateUrl: './accounts-tree.component.html',
  styleUrl: './accounts-tree.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsTreeComponent {
  public erpService = inject(ErpService);

  public activeTab = signal<'tree' | 'journal_entries'>('tree');
  public showAddAccountModal = signal<boolean>(false);
  public searchQuery = signal<string>('');
  public expandedNodes = signal<Set<string>>(new Set<string>(['1', '11', '12', '2', '21', '3', '4', '5']));
  public selectedJournalEntry = signal<JournalEntry | null>(null);

  // New Account Form
  public formParentCode: string = '111';
  public formAccountCode: string = '1113';
  public formAccountNameAr: string = '';
  public formAccountNameEn: string = '';
  public formAccountType: Account['type'] = 'asset';
  public formIsDebitNature: boolean = true;

  public accounts = computed(() => this.erpService.accounts());
  public journalEntries = computed(() => this.erpService.journalEntries());

  // Filtered accounts based on search or tree expansion hierarchy
  public visibleAccounts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all = this.accounts();
    if (query) {
      // If searching, show all matched accounts directly
      return all.filter(
        (a) =>
          a.code.toLowerCase().includes(query) ||
          a.nameAr.toLowerCase().includes(query) ||
          (a.nameEn && a.nameEn.toLowerCase().includes(query)) ||
          a.type.toLowerCase().includes(query)
      );
    }

    // Build hierarchical ordered and visibility-filtered list
    const result: Account[] = [];
    const expanded = this.expandedNodes();

    const addNodes = (parentCode: string | null) => {
      const children = all.filter((a) => (a.parentCode || null) === parentCode);
      for (const child of children) {
        result.push(child);
        // If this node is expanded, recursively add its children
        if (expanded.has(child.code)) {
          addNodes(child.code);
        }
      }
    };

    addNodes(null);
    return result;
  });

  // Top level parent accounts (root nodes)
  public rootAccounts = computed(() => {
    return this.accounts().filter((a) => !a.parentCode || a.parentCode === '');
  });

  public journalColumns: DataGridColumn<JournalEntry>[] = [
    { field: 'entryNumber', caption: 'رقم القيد', width: '130px', sortable: true },
    { field: 'date', caption: 'التاريخ', width: '110px', sortable: true },
    { field: 'description', caption: 'البيان وتفاصيل المعاملة', sortable: true },
    {
      field: 'referenceType',
      caption: 'المصدر',
      width: '130px',
      format: 'badge',
      badgeClass: (val) => this.getReferenceTypeBadge(val).class,
      render: (row) => this.getReferenceTypeBadge(row.referenceType).label,
    },
    { field: 'totalDebit', caption: 'إجمالي المدين', format: 'currency', alignment: 'left', width: '130px', sortable: true },
    { field: 'totalCredit', caption: 'إجمالي الدائن', format: 'currency', alignment: 'left', width: '130px', sortable: true },
    {
      field: 'isBalanced',
      caption: 'التوازن',
      width: '110px',
      format: 'badge',
      alignment: 'center',
      badgeClass: (val) => val ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
      render: (row) => row.isBalanced ? 'متوازن ✓' : 'غير متوازن ✗',
    },
  ];

  public toggleNode(code: string) {
    const current = new Set(this.expandedNodes());
    if (current.has(code)) {
      current.delete(code);
    } else {
      current.add(code);
    }
    this.expandedNodes.set(current);
  }

  public isExpanded(code: string): boolean {
    return this.expandedNodes().has(code);
  }

  public expandAll() {
    const allCodes = new Set<string>(this.accounts().map((a) => a.code));
    this.expandedNodes.set(allCodes);
  }

  public collapseAll() {
    this.expandedNodes.set(new Set<string>());
  }

  public getChildAccounts(parentCode: string): Account[] {
    return this.accounts().filter((a) => a.parentCode === parentCode);
  }

  public hasChildren(code: string): boolean {
    return this.accounts().some((a) => a.parentCode === code);
  }

  public openAddAccountModal(parent?: Account | any) {
    if (parent) {
      const code = parent.code;
      const type = parent.type || 'asset';
      const isDebitNature = parent.isDebitNature ?? true;

      this.formParentCode = code;
      const children = this.getChildAccounts(code);
      this.formAccountCode = `${code}${children.length + 1}`;
      this.formAccountType = type;
      this.formIsDebitNature = isDebitNature;
    }
    this.showAddAccountModal.set(true);
  }

  public onParentCodeChange() {
    const parent = this.accounts().find((a) => a.code === this.formParentCode);
    if (parent) {
      const children = this.getChildAccounts(parent.code);
      this.formAccountCode = `${parent.code}${children.length + 1}`;
      this.formAccountType = parent.type;
      this.formIsDebitNature = parent.isDebitNature;
    }
  }

  public saveAccount() {
    if (!this.formAccountCode.trim() || !this.formAccountNameAr.trim()) {
      alert('يرجى تعبئة رمز واسم الحساب');
      return;
    }

    this.erpService.addAccount({
      code: this.formAccountCode,
      nameAr: this.formAccountNameAr,
      nameEn: this.formAccountNameEn || this.formAccountNameAr,
      type: this.formAccountType,
      parentCode: this.formParentCode,
      isDebitNature: this.formIsDebitNature,
    });

    // Automatically expand parent node
    if (this.formParentCode) {
      const current = new Set(this.expandedNodes());
      current.add(this.formParentCode);
      this.expandedNodes.set(current);
    }

    this.showAddAccountModal.set(false);
    this.formAccountNameAr = '';
    this.formAccountNameEn = '';
  }

  public formatCurrency(val: number): string {
    return (Number(val) || 0).toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ر.س';
  }

  public getAccountTypeNameAr(type: string): string {
    switch (type) {
      case 'asset': return 'أصول (Assets)';
      case 'liability': return 'خصوم (Liabilities)';
      case 'equity': return 'حقوق ملكية (Equity)';
      case 'revenue': return 'إيرادات (Revenues)';
      case 'expense': return 'مصروفات (Expenses)';
      default: return type;
    }
  }

  public getReferenceTypeBadge(refType: string): { label: string; class: string } {
    switch (refType) {
      case 'sales':
        return { label: 'فاتورة مبيعات', class: 'bg-emerald-100 text-emerald-800' };
      case 'purchase':
        return { label: 'فاتورة مشتريات', class: 'bg-indigo-100 text-indigo-800' };
      case 'receipt_voucher':
        return { label: 'سند قبض', class: 'bg-teal-100 text-teal-800' };
      case 'payment_voucher':
        return { label: 'سند صرف', class: 'bg-rose-100 text-rose-800' };
      default:
        return { label: refType || 'قيد يدوي', class: 'bg-slate-100 text-slate-800' };
    }
  }
}
