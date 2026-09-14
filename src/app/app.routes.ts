import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'entities',
    loadComponent: () =>
      import('./features/master-data/master-data.component').then(
        (m) => m.MasterDataComponent
      ),
  },
  {
    path: 'master-data',
    redirectTo: 'entities',
    pathMatch: 'full',
  },
  {
    path: 'sales',
    loadComponent: () =>
      import('./features/sales/sales.component').then(
        (m) => m.SalesComponent
      ),
  },
  {
    path: 'sales/returns',
    loadComponent: () =>
      import('./features/sales/sales-returns.component').then(
        (m) => m.SalesReturnsComponent
      ),
  },
  {
    path: 'purchases',
    loadComponent: () =>
      import('./features/purchases/purchases.component').then(
        (m) => m.PurchasesComponent
      ),
  },
  {
    path: 'costing',
    loadComponent: () =>
      import('./features/costing/costing.component').then(
        (m) => m.CostingComponent
      ),
  },
  {
    path: 'vouchers',
    loadComponent: () =>
      import('./features/vouchers/vouchers.component').then(
        (m) => m.VouchersComponent
      ),
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./features/accounts-tree/accounts-tree.component').then(
        (m) => m.AccountsTreeComponent
      ),
  },
  {
    path: 'zatca',
    loadComponent: () =>
      import('./features/zatca-integration/zatca-integration.component').then(
        (m) => m.ZatcaIntegrationComponent
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },
  {
    path: 'subscriptions',
    loadComponent: () =>
      import('./features/subscriptions/subscriptions.component').then(
        (m) => m.SubscriptionsComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'auth/login',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register-company.component').then(
        (m) => m.RegisterCompanyComponent
      ),
  },
  {
    path: 'auth/register',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: 'backend',
    loadComponent: () =>
      import('./features/backend-architecture/backend-architecture.component').then(
        (m) => m.BackendArchitectureComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
