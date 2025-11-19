import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getInventory, getSales, getPurchases } from '../lib/storage';
import './OverviewPage.css';

interface Stats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  inventoryValue: number;
  lowStockItems: number;
  salesCount: number;
}

export function OverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    inventoryValue: 0,
    lowStockItems: 0,
    salesCount: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const inventory = getInventory();
    const sales = getSales();
    const purchases = getPurchases();

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
    const inventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const lowStockItems = inventory.filter(item => item.quantity < 10).length;

    setStats({
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      inventoryValue,
      lowStockItems,
      salesCount: sales.length,
    });

    // Generate chart data for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySales = sales.filter(s => s.date.startsWith(dateStr));
      const dayPurchases = purchases.filter(p => p.date.startsWith(dateStr));
      
      last7Days.push({
        name: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        ventas: daySales.reduce((sum, s) => sum + s.total, 0),
        compras: dayPurchases.reduce((sum, p) => sum + p.total, 0),
      });
    }
    
    setChartData(last7Days);
  };

  const statCards = [
    {
      title: 'Ingresos Totales',
      value: `$${stats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Gastos Totales',
      value: `$${stats.totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      icon: ShoppingCart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Ganancia Neta',
      value: `$${stats.netProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      icon: stats.netProfit >= 0 ? TrendingUp : TrendingDown,
      color: stats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600',
      bgColor: stats.netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50',
    },
    {
      title: 'Valor Inventario',
      value: `$${stats.inventoryValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="overview-page">
      {/* Stats Grid - Professional Cards */}
      <div className="overview-stats">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="overview-stat-card">
              <div className="overview-stat-card__header">
                <h3 className="overview-stat-card__title">{stat.title}</h3>
                <div className="overview-stat-card__icon">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="overview-stat-card__value">{stat.value}</p>
              <p className="overview-stat-card__meta">Últimos 30 días</p>
            </div>
          );
        })}
      </div>

      {/* Alerts - Professional Alert Box */}
      {stats.lowStockItems > 0 && (
        <div className="overview-alert">
          <div className="overview-alert__icon">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="overview-alert__content">
            <h4 className="overview-alert__title">Alerta de Stock Bajo</h4>
            <p className="overview-alert__message">
              Tienes {stats.lowStockItems} producto{stats.lowStockItems > 1 ? 's' : ''} con stock por debajo del mínimo. Considera realizar un reabastecimiento.
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="overview-charts">
        <div className="overview-chart-card">
          <div className="overview-chart-card__header">
            <h3 className="overview-chart-card__title">Ventas vs Compras</h3>
            <p className="overview-chart-card__subtitle">Últimos 7 días - Análisis de tendencias</p>
          </div>
          <div className="overview-chart-card__content">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} name="Ventas" dot={{ fill: '#10b981', r: 5 }} />
                <Line type="monotone" dataKey="compras" stroke="#ef4444" strokeWidth={3} name="Compras" dot={{ fill: '#ef4444', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overview-chart-card">
          <div className="overview-chart-card__header">
            <h3 className="overview-chart-card__title">Comparativa Semanal</h3>
            <p className="overview-chart-card__subtitle">Distribución de ventas y compras</p>
          </div>
          <div className="overview-chart-card__content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="gradCompras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="ventas" fill="url(#gradVentas)" name="Ventas" radius={[8, 8, 0, 0]} />
                <Bar dataKey="compras" fill="url(#gradCompras)" name="Compras" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Stats - Key Metrics */}
      <div className="overview-quick-stats">
        <div className="overview-quick-stat">
          <p className="overview-quick-stat__label">Total de Ventas</p>
          <p className="overview-quick-stat__value">{stats.salesCount}</p>
          <div className="overview-quick-stat__progress">
            <div className="overview-quick-stat__progress-bar">
              <div className="overview-quick-stat__progress-fill" style={{ width: '75%' }} />
            </div>
            <span className="overview-quick-stat__progress-text">75%</span>
          </div>
        </div>
        <div className="overview-quick-stat">
          <p className="overview-quick-stat__label">Productos en Stock</p>
          <p className="overview-quick-stat__value">{getInventory().length}</p>
          <div className="overview-quick-stat__progress">
            <div className="overview-quick-stat__progress-bar">
              <div className="overview-quick-stat__progress-fill" style={{ width: '90%' }} />
            </div>
            <span className="overview-quick-stat__progress-text">90%</span>
          </div>
        </div>
        <div className="overview-quick-stat">
          <p className="overview-quick-stat__label">Margen de Ganancia</p>
          <p className="overview-quick-stat__value">
            {stats.totalRevenue > 0 
              ? `${((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}%`
              : '0%'}
          </p>
          <div className="overview-quick-stat__progress">
            <div className="overview-quick-stat__progress-bar">
              <div className="overview-quick-stat__progress-fill" style={{ width: `${Math.min(100, (stats.netProfit / stats.totalRevenue) * 100)}%` }} />
            </div>
            <span className="overview-quick-stat__progress-text">Meta</span>
          </div>
        </div>
      </div>
    </div>
  );
}
