import type { LucideIcon } from 'lucide-react';
import { Activity, AlertTriangle, BarChart3, Boxes, Building2, Database, LayoutGrid, LineChart, ShieldCheck, UploadCloud } from 'lucide-react';

export type AppRole = 'user' | 'admin' | 'superadmin';

type AppNavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  roles?: AppRole[];
};

// Main application navigation (used by AppShell)
export const appNavigation: AppNavigationItem[] = [
  { label: 'Dashboard', to: '/app/overview', icon: BarChart3, roles: ['user', 'admin'] },
  { label: 'Datasets', to: '/app/datasets', icon: Database, roles: ['user', 'admin'] },
  { label: 'Inventario', to: '/app/inventory', icon: Boxes, roles: ['user', 'admin'] },
  { label: 'Problemas', to: '/app/issues', icon: AlertTriangle, roles: ['user', 'admin'] },
  { label: 'Subir archivo', to: '/app/upload', icon: UploadCloud, roles: ['user', 'admin'] },
  { label: 'Dashboards guardados', to: '/app/saved', icon: LayoutGrid, roles: ['user', 'admin'] },
  { label: 'IA Insights', to: '/app/insights', icon: LineChart, roles: ['user', 'admin'] },
  { label: 'Panel superadmin', to: '/app/admin/dashboard', icon: Activity, roles: ['superadmin'] },
  { label: 'Organizaciones', to: '/app/admin/organizations', icon: Building2, roles: ['superadmin'] },
  { label: 'Cuentas y roles', to: '/app/admin/accounts', icon: ShieldCheck, roles: ['superadmin'] },
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
