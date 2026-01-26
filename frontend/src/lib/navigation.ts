import type { LucideIcon } from 'lucide-react';
import { BarChart3, Database, UploadCloud, LineChart, LayoutGrid, ShieldCheck, Boxes } from 'lucide-react';

export type AppRole = 'user' | 'admin' | 'superadmin';

type AppNavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  minRole?: AppRole;
};

// Main application navigation (used by AppShell)
export const appNavigation: AppNavigationItem[] = [
  { label: 'Dashboard', to: '/app/overview', icon: BarChart3, minRole: 'user' },
  { label: 'Datasets', to: '/app/datasets', icon: Database, minRole: 'user' },
  { label: 'Inventario', to: '/app/inventory', icon: Boxes, minRole: 'user' },
  { label: 'Subir archivo', to: '/app/upload', icon: UploadCloud, minRole: 'admin' },
  { label: 'Dashboards guardados', to: '/app/saved', icon: LayoutGrid, minRole: 'admin' },
  { label: 'IA Insights', to: '/app/insights', icon: LineChart, minRole: 'user' },
  { label: 'Cuentas y roles', to: '/app/admin/accounts', icon: ShieldCheck, minRole: 'superadmin' },
];

// Overview sub-navigation (used inside the Overview page and SimpleLayoutDemo)
// This is intentionally separate from the main nav: it represents subsections
// within the Dashboard area. Keep labels in Spanish to match the app.
export const overviewNav = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'inventory', name: 'Inventario' },
  { id: 'sales', name: 'Ventas' },
  { id: 'purchases', name: 'Compras' },
  { id: 'reports', name: 'Reportes' },
];
