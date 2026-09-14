import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
  TemplateRef,
  ContentChild,
  inject
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslationService} from '../../../core/services/translation.service';
import {TranslatePipe} from '../../../core/pipes/translate.pipe';

export interface DataGridColumn<T = any> {
  field: string;
  caption: string;
  width?: string;
  alignment?: 'left' | 'right' | 'center';
  format?: 'currency' | 'date' | 'number' | 'badge' | 'text';
  sortable?: boolean;
  filterable?: boolean;
  badgeClass?: (value: any, row: T) => string;
  render?: (row: T) => any;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridComponent<T = any> {
  public i18n = inject(TranslationService);
  @Input({required: true}) columns: DataGridColumn<T>[] = [];
  @Input({required: true}) set data(val: T[]) {
    this.dataSource.set(val || []);
  }
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() searchable: boolean = true;
  @Input() exportable: boolean = true;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() defaultPageSize: number = 10;
  @Input() showMobileToggle: boolean = true;
  @Input() mobileCardTitleField: string = '';
  @Input() mobileCardSubtitleField: string = '';
  @Input() mobileCardBadgeField: string = '';

  @Output() rowClick = new EventEmitter<T>();
  @Output() exportData = new EventEmitter<T[]>();

  // Internal reactive states
  public dataSource = signal<T[]>([]);
  public searchQuery = signal<string>('');
  public sortColumn = signal<string | null>(null);
  public sortDirection = signal<'asc' | 'desc'>('asc');
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(10);
  public viewMode = signal<'auto' | 'grid' | 'cards'>('auto'); // auto uses media query, or manual switch
  public columnFilters = signal<Record<string, string>>({});
  public showColumnFilterRow = signal<boolean>(false);

  public ngOnInit() {
    this.pageSize.set(this.defaultPageSize);
  }

  // Filtered & Sorted Data
  public filteredData = computed(() => {
    let list = [...this.dataSource()];
    const query = this.searchQuery().trim().toLowerCase();
    const colFilters = this.columnFilters();

    // Global search
    if (query) {
      list = list.filter((item) => {
        return Object.values(item as Record<string, any>).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    // Column-specific filters
    Object.keys(colFilters).forEach((field) => {
      const fVal = colFilters[field]?.trim().toLowerCase();
      if (fVal) {
        list = list.filter((item) => {
          const val = (item as any)[field];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(fVal);
        });
      }
    });

    // Sorting
    const sortField = this.sortColumn();
    if (sortField) {
      const dir = this.sortDirection() === 'asc' ? 1 : -1;
      list.sort((a: any, b: any) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }
        return String(valA || '').localeCompare(String(valB || ''), 'ar') * dir;
      });
    }

    return list;
  });

  // Paginated Data
  public paginatedData = computed(() => {
    const list = this.filteredData();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  public totalPages = computed(() => {
    return Math.ceil(this.filteredData().length / this.pageSize()) || 1;
  });

  public onSort(column: DataGridColumn<T>) {
    if (!column.sortable) return;
    if (this.sortColumn() === column.field) {
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortColumn.set(null);
        this.sortDirection.set('asc');
      }
    } else {
      this.sortColumn.set(column.field);
      this.sortDirection.set('asc');
    }
  }

  public setColumnFilter(field: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.columnFilters.update((prev) => ({
      ...prev,
      [field]: value,
    }));
    this.currentPage.set(1);
  }

  public goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  public onPageSizeChange(event: Event) {
    const newSize = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(newSize);
    this.currentPage.set(1);
  }

  public toggleFilterRow() {
    this.showColumnFilterRow.update((v) => !v);
  }

  public toggleViewMode() {
    this.viewMode.update((curr) => {
      if (curr === 'auto') return 'cards';
      if (curr === 'cards') return 'grid';
      return 'auto';
    });
  }

  public exportToCsv() {
    const data = this.filteredData();
    if (!data.length) return;

    const headers = this.columns.map((c) => c.caption).join(',');
    const rows = data.map((item: any) =>
      this.columns
        .map((c) => {
          const val = item[c.field];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.title || 'export'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.exportData.emit(data);
  }

  public getCellValue(item: any, col: DataGridColumn<T>): string {
    if (col.render) {
      return String(col.render(item));
    }
    const val = item ? (item as any)[col.field] : null;
    if (val === null || val === undefined) return '-';
    if (col.format === 'currency') {
      return Number(val).toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ر.س';
    }
    if (col.format === 'date') {
      return val;
    }
    if (col.format === 'number') {
      return Number(val).toLocaleString('ar-SA');
    }
    return String(val);
  }

  public getRowValue(row: any, field: string): any {
    return row && field ? (row as any)[field] : '';
  }

  public getBadgeClass(col: DataGridColumn<T>, row: any): string {
    if (col.badgeClass) {
      return col.badgeClass((row as any)[col.field], row);
    }
    return 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700';
  }
}
