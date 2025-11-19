import { useState } from 'react';
import { Package, TrendingUp, ShoppingCart, DollarSign, BarChart3 } from 'lucide-react';
import Dashboard from '../components/Dashboard';
import Inventory from '../components/Inventory';
import Sales from '../components/Sales';
import Purchases from '../components/Purchases';
import Reports from '../components/Reports';
import { overviewNav } from '../lib/navigation';

interface NavItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function SimpleLayoutDemo() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation: NavItem[] = overviewNav.map((n) => ({ 
    id: n.id,
    name: n.name,
    icon: (
      n.id === 'dashboard' ? BarChart3 : 
      n.id === 'inventory' ? Package : 
      n.id === 'sales' ? TrendingUp : 
      n.id === 'purchases' ? ShoppingCart : 
      DollarSign
    ) 
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">DataPulse</h1>
              <p className="text-sm text-gray-500">Sistema de Gestión Empresarial</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-81px)] sticky top-[81px]">
          <nav className="p-4 space-y-1">
            {navigation.map((item: NavItem) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'sales' && <Sales />}
          {activeTab === 'purchases' && <Purchases />}
          {activeTab === 'reports' && <Reports />}
        </main>
      </div>
    </div>
  );
}
