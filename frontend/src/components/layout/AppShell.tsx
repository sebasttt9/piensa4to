import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { label: 'Resumen', to: '/app/overview' },
  { label: 'Datasets', to: '/app/datasets' },
  { label: 'Subir archivo', to: '/app/upload' },
  { label: 'Dashboards guardados', to: '/app/saved' },
  { label: 'IA Insights', to: '/app/insights' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const activeNav = navigation.find((item) => location.pathname.startsWith(item.to));
  const sectionTitle = activeNav?.label ?? 'Panel Principal';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-800/80 to-blue-800/80 border-b border-purple-500/30 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white">{sectionTitle}</h2>
          <p className="text-xs text-slate-400 mt-1">Explora, analiza y comparte insights</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-medium text-slate-300">{user?.name || 'Demo'}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-purple-800/40 hover:text-red-300 transition-colors duration-200 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
