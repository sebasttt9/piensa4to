import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Database, LineChart, LogOut, UploadCloud, Menu, X, Activity } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const navigation = [
  { label: 'Resumen', to: '/app/overview', icon: BarChart3 },
  { label: 'Datasets', to: '/app/datasets', icon: Database },
  { label: 'Subir archivo', to: '/app/upload', icon: UploadCloud },
  { label: 'Dashboards guardados', to: '/app/saved', icon: BarChart3 },
  { label: 'IA Insights', to: '/app/insights', icon: LineChart },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeNav = navigation.find((item) => location.pathname.startsWith(item.to));
  const sectionTitle = activeNav?.label ?? 'Panel Principal';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-gradient-to-b from-indigo-900 to-indigo-950 text-white border-r border-purple-500/30 flex flex-col transition-all duration-300 backdrop-blur-sm',
          !sidebarOpen && 'w-0 overflow-hidden'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DataPulse</h1>
              <p className="text-xs text-slate-400">Analytics Pro</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'text-purple-100 hover:bg-purple-800/40'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-purple-500/30">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-purple-200 truncate">{user?.email || 'user@datapulse.com'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-purple-800/40 hover:text-red-300 transition-colors duration-200 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-800/80 to-blue-800/80 border-b border-purple-500/30 px-6 py-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-purple-700/40 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">{sectionTitle}</h2>
              <p className="text-xs text-slate-400 mt-1">Explora, analiza y comparte insights</p>
            </div>
          </div>

          {/* Hidden on mobile, show on larger screens */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-slate-300">{user?.name || 'Demo'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
