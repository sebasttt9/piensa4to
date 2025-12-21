import { BarChart3, Database, UploadCloud, LineChart, LayoutGrid } from 'lucide-react';

// Main application navigation (used by AppShell)
export const appNavigation = [
  { label: 'Dashboard', to: '/app/overview', icon: BarChart3 },
  { label: 'Datasets', to: '/app/datasets', icon: Database },
  { label: 'Subir archivo', to: '/app/upload', icon: UploadCloud },
  { label: 'Dashboards guardados', to: '/app/saved', icon: LayoutGrid },
  { label: 'IA Insights', to: '/app/insights', icon: LineChart },
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
