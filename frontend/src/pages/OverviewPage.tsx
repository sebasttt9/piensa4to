import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  UserPlus,
  DollarSign,
  Database,
  LayoutDashboard,
  BarChart3,
  PieChart,
  Radar,
  Target,
  Activity,
  Layers,
  ChevronDown,
  Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { inventoryAPI, inventoryItemsAPI, datasetsAPI, dashboardsAPI, issuesAPI, commerceAPI, type InventorySummary, type InventoryItem, type Dataset, type Dashboard, type Issue, type CommerceOverview } from '../lib/services';
import { useCurrency } from '../context/CurrencyContext';
import './OverviewPage.css';

interface StatCard {
  title: string;
  value: string;
  icon: typeof DollarSign;
  accent: string;
  accentSoft: string;
  meta: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface InventoryOverview {
  summary: InventorySummary;
  items: InventoryItem[];
  datasets: Dataset[];
  dashboards: Dashboard[];
  issues?: Issue[];
}

type ChartType = 'bar' | 'pie' | 'radar' | 'line' | 'area' | 'scatter';

interface ChartOption {
  type: ChartType;
  name: string;
  icon: typeof BarChart3;
  description: string;
}

const CHART_OPTIONS: ChartOption[] = [
  { type: 'bar', name: 'Barras', icon: BarChart3, description: 'Gráfico de barras verticales' },
  { type: 'pie', name: 'Circular', icon: PieChart, description: 'Gráfico circular / pastel' },
  { type: 'radar', name: 'Radar', icon: Radar, description: 'Gráfico de radar multidimensional' },
  { type: 'line', name: 'Líneas', icon: Activity, description: 'Gráfico de líneas conectadas' },
  { type: 'area', name: 'Área', icon: Target, description: 'Gráfico de área acumulada' },
  { type: 'scatter', name: 'Dispersión', icon: Layers, description: 'Gráfico de puntos dispersos' }
];

export function OverviewPage() {
  const { formatAmount } = useCurrency();
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [commerce, setCommerce] = useState<CommerceOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('bar');
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [selectedSecondaryChartType, setSelectedSecondaryChartType] = useState<ChartType>('pie');
  const [showSecondaryChartSelector, setShowSecondaryChartSelector] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchOverview = async () => {
      setIsLoading(true);
      try {
        // Cargar datos principales primero
        const commercePromise = commerceAPI
          .getOverview()
          .catch((commerceError) => {
            console.warn('Commerce overview not available:', commerceError);
            return null;
          });

      {commerce && commerce.hasOrders && (
        <div className="overview-commerce">
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <DollarSign className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Evolución de Ingresos</h3>
                {commerce && !commerce.hasOrders && (
                  <div className="overview-alert" role="status">
                    <DollarSign className="overview-alert__icon" />
                    <div className="overview-alert__content">
                      <p className="overview-alert__title">Sin datos de ventas todavía</p>
                      <p className="overview-alert__message">Carga pedidos recientes para activar el resumen comercial y las métricas de clientes.</p>
                    </div>
                  </div>
                )}

                  <p className="overview-chart-card__subtitle">Ingresos, órdenes y clientes por mes</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesTrendData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="commerceRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value.toLocaleString('es-ES'),
                      name === 'revenue' ? 'Ingresos' : name === 'orders' ? 'Órdenes' : 'Clientes'
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#7C3AED" fill="url(#commerceRevenueGradient)" name="revenue" />
                  <Line type="monotone" dataKey="orders" stroke="#F97316" strokeWidth={2} name="orders" />
                  <Line type="monotone" dataKey="customers" stroke="#22C55E" strokeWidth={2} name="customers" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <BarChart3 className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Segmentos con Mayor Valor</h3>
                  <p className="overview-chart-card__subtitle">Participación de ingresos por segmento</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={segmentPerformanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : `${value.toFixed(1)}%`,
                      name === 'revenue' ? 'Ingresos' : 'Participación'
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#4ECDC4" name="revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <ShoppingCart className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Productos Destacados</h3>
                  <p className="overview-chart-card__subtitle">Top 5 productos por ingresos</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content overview-chart-card__content--list">
              {topSalesProducts.length > 0 ? (
                <ul className="overview-commerce-list">
                  {topSalesProducts.map((product) => (
                    <li key={product.sku} className="overview-commerce-list__item">
                      <div>
                        <span className="overview-commerce-list__name">{product.name}</span>
                        <span className="overview-commerce-list__meta">SKU {product.sku}</span>
                      </div>
                      <div className="overview-commerce-list__figures">
                        <span>{formatCurrency(product.revenue)}</span>
                        <span>{product.quantity.toLocaleString('es-ES')} uds</span>
                        <span>{product.growth !== null ? `${product.growth > 0 ? '+' : ''}${product.growth.toFixed(1)}%` : '––'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="overview-commerce-empty">Aún no hay ventas por producto registradas.</p>
              )}
            </div>
          </div>
        </div>
      )}

        const [summary, items, datasets, dashboards, commerceData] = await Promise.all([
          inventoryAPI.getSummary(),
          inventoryItemsAPI.list(),
          datasetsAPI.list(1, 100),
          dashboardsAPI.list(1, 100),
          commercePromise
        ]);

        // Cargar issues de forma opcional (si la tabla existe)
        let issues: Issue[] = [];
        try {
          issues = await issuesAPI.list();
        } catch (issuesError) {
          console.warn('Issues table not available yet:', issuesError);
          issues = [];
        }

        if (!active) return;

        setOverview({
          summary,
          items: items || [],
          datasets: datasets.data || [],
          dashboards: dashboards.data || [],
          issues: issues || []
        });
        setCommerce(commerceData);
        setError(null);
      } catch (err: unknown) {
        if (!active) return;
        const message =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: unknown }).message ?? 'Error desconocido')
            : 'No se pudo cargar el resumen del inventario';
        setError(message);
        setCommerce(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchOverview();

    return () => {
      active = false;
    };
  }, []);

  const formatCurrency = useCallback((value: number) => formatAmount(value), [formatAmount]);

  const statCards: StatCard[] = useMemo(() => {
    const cards: StatCard[] = [];

    if (overview) {
      const totalValue = overview.items.reduce((sum, item) => sum + (item.quantity * item.pvp), 0);
      const totalCost = overview.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
      const totalItems = overview.items.length;
      const approvedItems = overview.items.filter(item => item.status === 'approved').length;
      const linkedDatasets = new Set(overview.items.filter(item => item.datasetId).map(item => item.datasetId)).size;
      const linkedDashboards = new Set(overview.items.filter(item => item.dashboardId).map(item => item.dashboardId)).size;

      cards.push(
        {
          title: 'Valor Total del Inventario',
          value: formatCurrency(totalValue),
          icon: DollarSign,
          accent: '#00D4FF',
          accentSoft: 'rgba(0, 212, 255, 0.15)',
          meta: 'Valor de mercado actual',
          trend: totalValue > 0 ? 'up' : 'neutral'
        },
        {
          title: 'Costo Total',
          value: formatCurrency(totalCost),
          icon: ShoppingCart,
          accent: '#FF6B6B',
          accentSoft: 'rgba(255, 107, 107, 0.15)',
          meta: 'Inversión total',
          trend: 'neutral'
        },
        {
          title: 'Items de Inventario',
          value: totalItems.toLocaleString('es-ES'),
          icon: Package,
          accent: '#4ECDC4',
          accentSoft: 'rgba(78, 205, 196, 0.15)',
          meta: `${approvedItems} aprobados`,
          trend: totalItems > 0 ? 'up' : 'neutral'
        },
        {
          title: 'Datasets Vinculados',
          value: linkedDatasets.toString(),
          icon: Database,
          accent: '#45B7D1',
          accentSoft: 'rgba(69, 183, 209, 0.15)',
          meta: 'Conexiones activas',
          trend: linkedDatasets > 0 ? 'up' : 'neutral'
        },
        {
          title: 'Dashboards Vinculados',
          value: linkedDashboards.toString(),
          icon: LayoutDashboard,
          accent: '#96CEB4',
          accentSoft: 'rgba(150, 206, 180, 0.15)',
          meta: 'Visualizaciones activas',
          trend: linkedDashboards > 0 ? 'up' : 'neutral'
        },
        {
          title: 'Margen Promedio',
          value: totalValue > 0 ? `${(((totalValue - totalCost) / totalValue) * 100).toFixed(1)}%` : '0%',
          icon: TrendingUp,
          accent: '#FFEAA7',
          accentSoft: 'rgba(255, 234, 167, 0.15)',
          meta: 'Rentabilidad',
          trend: totalValue > totalCost ? 'up' : totalValue < totalCost ? 'down' : 'neutral'
        }
      );
    }

    if (commerce) {
      const { totals } = commerce;
      const formatPercent = (value: number) => {
        if (!Number.isFinite(value)) {
          return '0.0%';
        }
        const safe = Number(value);
        const sign = safe > 0 ? '+' : safe < 0 ? '' : '';
        return `${sign}${safe.toFixed(1)}%`;
      };

      const ordersMeta = totals.ordersPrevious > 0
        ? `Mes anterior ${totals.ordersPrevious.toLocaleString('es-ES')} órdenes`
        : 'Primer mes con órdenes registradas';

      cards.push(
        {
          title: 'Ingresos del Mes',
          value: formatCurrency(totals.revenueCurrent),
          icon: DollarSign,
          accent: '#7C3AED',
          accentSoft: 'rgba(124, 58, 237, 0.15)',
          meta: `Vs mes anterior ${formatPercent(totals.revenueChangePct)} · Moneda ${commerce.currency}`,
          trend: totals.revenueChangePct > 0 ? 'up' : totals.revenueChangePct < 0 ? 'down' : 'neutral'
        },
        {
          title: 'Órdenes del Mes',
          value: totals.ordersCurrent.toLocaleString('es-ES'),
          icon: Activity,
          accent: '#F97316',
          accentSoft: 'rgba(249, 115, 22, 0.15)',
          meta: ordersMeta,
          trend: totals.ordersCurrent >= totals.ordersPrevious ? 'up' : 'down'
        },
        {
          title: 'Ticket Promedio',
          value: formatCurrency(totals.avgTicketCurrent),
          icon: Target,
          accent: '#38BDF8',
          accentSoft: 'rgba(56, 189, 248, 0.15)',
          meta: `Variación ${formatPercent(totals.avgTicketChangePct)}`,
          trend: totals.avgTicketChangePct > 0 ? 'up' : totals.avgTicketChangePct < 0 ? 'down' : 'neutral'
        },
        {
          title: 'Clientes Nuevos',
          value: totals.newCustomersCurrent.toLocaleString('es-ES'),
          icon: UserPlus,
          accent: '#22C55E',
          accentSoft: 'rgba(34, 197, 94, 0.15)',
          meta: `Variación ${formatPercent(totals.newCustomersChangePct)}`,
          trend: totals.newCustomersChangePct > 0 ? 'up' : totals.newCustomersChangePct < 0 ? 'down' : 'neutral'
        },
        {
          title: 'Clientes Activos',
          value: totals.activeCustomers.toLocaleString('es-ES'),
          icon: Users,
          accent: '#14B8A6',
          accentSoft: 'rgba(20, 184, 166, 0.15)',
          meta: `${totals.returningCustomers.toLocaleString('es-ES')} recurrentes`,
          trend: totals.returningCustomers > 0 ? 'up' : 'neutral'
        }
      );
    }

    return cards;
  }, [overview, commerce, formatCurrency]);

  const inventoryStatusData = useMemo(() => {
    if (!overview) return [];

    const statusCount = overview.items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Aprobados', value: statusCount.approved || 0, color: '#4ECDC4' },
      { name: 'Pendientes', value: statusCount.pending || 0, color: '#FFEAA7' },
      { name: 'Rechazados', value: statusCount.rejected || 0, color: '#FF6B6B' }
    ].filter(item => item.value > 0);
  }, [overview]);

  const topItemsByValue = useMemo(() => {
    if (!overview) return [];

    return overview.items
      .map(item => ({
        name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
        value: item.quantity * item.pvp,
        quantity: item.quantity
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [overview]);

  const datasetConnections = useMemo(() => {
    if (!overview) return [];

    const connections = overview.items.reduce((acc, item) => {
      if (item.datasetId) {
        const dataset = overview.datasets.find(d => d.id === item.datasetId);
        const name = dataset ? dataset.name : 'Dataset desconocido';
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(connections)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [overview]);

  const dashboardConnections = useMemo(() => {
    if (!overview) return [];

    const connections = overview.items.reduce((acc, item) => {
      if (item.dashboardId) {
        const dashboard = overview.dashboards.find(d => d.id === item.dashboardId);
        const name = dashboard ? dashboard.name : 'Dashboard desconocido';
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(connections)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [overview]);

  const issuesData = useMemo(() => {
    if (!overview || !overview.issues) return [];

    const typeCount = overview.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Compras', value: typeCount.compra || 0, color: '#00D4FF' },
      { name: 'Devoluciones', value: typeCount.devolucion || 0, color: '#FF6B6B' },
      { name: 'Errores Logísticos', value: typeCount.error_logistico || 0, color: '#FFEAA7' },
      { name: 'Otros', value: typeCount.otro || 0, color: '#4ECDC4' }
    ].filter(item => item.value > 0);
  }, [overview]);

  // Datos para gráfico de radar (métricas multidimensionales)
  const radarData = useMemo(() => {
    if (!overview) return [];

    const totalValue = overview.items.reduce((sum, item) => sum + (item.quantity * item.pvp), 0);
    const totalCost = overview.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    const totalItems = overview.items.length;
    const approvedItems = overview.items.filter(item => item.status === 'approved').length;
    const linkedDatasets = new Set(overview.items.filter(item => item.datasetId).map(item => item.datasetId)).size;
    const linkedDashboards = new Set(overview.items.filter(item => item.dashboardId).map(item => item.dashboardId)).size;

    const maxValue = Math.max(totalValue, totalCost, totalItems * 1000, approvedItems * 1000, linkedDatasets * 10000, linkedDashboards * 10000);

    return [
      {
        metric: 'Valor Total',
        value: (totalValue / maxValue) * 100,
        actual: totalValue,
        fullMark: 100
      },
      {
        metric: 'Costo Total',
        value: (totalCost / maxValue) * 100,
        actual: totalCost,
        fullMark: 100
      },
      {
        metric: 'Items Totales',
        value: (totalItems / Math.max(totalItems, 10)) * 100,
        actual: totalItems,
        fullMark: 100
      },
      {
        metric: 'Items Aprobados',
        value: (approvedItems / Math.max(totalItems, 1)) * 100,
        actual: approvedItems,
        fullMark: 100
      },
      {
        metric: 'Datasets',
        value: (linkedDatasets / Math.max(linkedDatasets + 2, 5)) * 100,
        actual: linkedDatasets,
        fullMark: 100
      },
      {
        metric: 'Dashboards',
        value: (linkedDashboards / Math.max(linkedDashboards + 2, 5)) * 100,
        actual: linkedDashboards,
        fullMark: 100
      }
    ];
  }, [overview]);

  // Datos para gráfico de líneas (tendencias por estado)
  const lineData = useMemo(() => {
    if (!overview) return [];

    const statusGroups = overview.items.reduce((acc, item) => {
      if (!acc[item.status]) acc[item.status] = [];
      acc[item.status].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);

    return Object.entries(statusGroups).map(([status, items]) => ({
      status: status === 'approved' ? 'Aprobados' : status === 'pending' ? 'Pendientes' : 'Rechazados',
      count: items.length,
      value: items.reduce((sum, item) => sum + (item.quantity * item.pvp), 0),
      cost: items.reduce((sum, item) => sum + (item.quantity * item.cost), 0)
    }));
  }, [overview]);

  const salesTrendData = useMemo(() => {
    if (!commerce) return [];
    return commerce.monthlyRevenue.map((point) => ({
      label: point.label,
      revenue: point.revenue,
      orders: point.orders,
      customers: point.customers,
    }));
  }, [commerce]);

  const segmentPerformanceData = useMemo(() => {
    if (!commerce) return [];
    return commerce.segmentPerformance.map((segment) => ({
      name: segment.segment,
      revenue: segment.revenue,
      customers: segment.customers,
      avgTicket: segment.avgTicket,
      share: segment.revenueShare * 100,
    }));
  }, [commerce]);

  const topSalesProducts = useMemo(() => {
    if (!commerce) return [];
    return commerce.topProducts.map((product) => ({
      sku: product.sku,
      name: product.name,
      quantity: product.quantity,
      revenue: product.revenue,
      growth: product.growthPct,
      share: product.revenueShare * 100,
    }));
  }, [commerce]);

  // Función para renderizar el gráfico secundario seleccionado
  const renderSecondaryChart = () => {
    const selectedOption = CHART_OPTIONS.find(option => option.type === selectedSecondaryChartType);
    if (!selectedOption) return null;

    const Icon = selectedOption.icon;

    switch (selectedSecondaryChartType) {
      case 'bar':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Problemas por Tipo</h3>
                  <p className="overview-chart-card__subtitle">Distribución de problemas logísticos</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={issuesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="issuesBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ECDC4" />
                      <stop offset="100%" stopColor="#45B7D1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Cantidad']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Bar dataKey="value" fill="url(#issuesBarGradient)" name="Cantidad" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'pie':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Distribución de Problemas</h3>
                  <p className="overview-chart-card__subtitle">Problemas logísticos por tipo</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={issuesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  >
                    {issuesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'radar':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Problemas Multidimensionales</h3>
                  <p className="overview-chart-card__subtitle">Vista radial de los problemas</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={issuesData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" style={{ fontSize: '12px' }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 'dataMax']}
                    style={{ fontSize: '10px' }}
                  />
                  <RechartsRadar
                    name="Cantidad"
                    dataKey="value"
                    stroke="#4ECDC4"
                    fill="#4ECDC4"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Cantidad']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'line':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Tendencias de Problemas</h3>
                  <p className="overview-chart-card__subtitle">Evolución de problemas logísticos</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={issuesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Cantidad']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#4ECDC4" strokeWidth={3} name="Cantidad" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'area':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Distribución de Problemas</h3>
                  <p className="overview-chart-card__subtitle">Acumulación por tipo de problema</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={issuesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="issuesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Cantidad']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4ECDC4" fill="url(#issuesAreaGradient)" name="Cantidad" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'scatter':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Problemas Dispersos</h3>
                  <p className="overview-chart-card__subtitle">Distribución de problemas</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={issuesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="category"
                    dataKey="name"
                    name="Tipo"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="value"
                    name="Cantidad"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Cantidad']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Scatter dataKey="value" fill="#4ECDC4" name="Cantidad" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Función para renderizar el gráfico seleccionado
  const renderSelectedChart = () => {
    const selectedOption = CHART_OPTIONS.find(option => option.type === selectedChartType);
    if (!selectedOption) return null;

    const Icon = selectedOption.icon;

    switch (selectedChartType) {
      case 'bar':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Items de Mayor Valor</h3>
                  <p className="overview-chart-card__subtitle">Productos más valiosos en inventario</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topItemsByValue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D4FF" />
                      <stop offset="100%" stopColor="#45B7D1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Bar dataKey="value" fill="url(#barGradient)" name="Valor" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'pie':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Estado del Inventario</h3>
                  <p className="overview-chart-card__subtitle">Distribución por estado de aprobación</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={inventoryStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  >
                    {inventoryStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'radar':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Métricas del Inventario</h3>
                  <p className="overview-chart-card__subtitle">Vista multidimensional del rendimiento</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" style={{ fontSize: '12px' }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    style={{ fontSize: '10px' }}
                  />
                  <RechartsRadar
                    name="Valor"
                    dataKey="value"
                    stroke="#00D4FF"
                    fill="#00D4FF"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(_value: number, name: string, props: any) => [
                      formatCurrency(props.payload.actual),
                      name
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'line':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Tendencias por Estado</h3>
                  <p className="overview-chart-card__subtitle">Comparación de estados del inventario</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="status" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'value' ? formatCurrency(value) : value,
                      name === 'value' ? 'Valor' : name === 'count' ? 'Cantidad' : 'Costo'
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#00D4FF" strokeWidth={3} name="count" />
                  <Line type="monotone" dataKey="value" stroke="#4ECDC4" strokeWidth={3} name="value" />
                  <Line type="monotone" dataKey="cost" stroke="#FF6B6B" strokeWidth={3} name="cost" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'area':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Distribución de Valor</h3>
                  <p className="overview-chart-card__subtitle">Acumulación de valor por estado</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="status" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'value' ? 'Valor' : 'Costo'
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Area type="monotone" dataKey="value" stackId="1" stroke="#00D4FF" fill="url(#colorValue)" name="value" />
                  <Area type="monotone" dataKey="cost" stackId="2" stroke="#FF6B6B" fill="url(#colorCost)" name="cost" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'scatter':
        return (
          <div className="overview-chart-card">
            <div className="overview-chart-card__header">
              <div className="overview-chart-card__header-main">
                <Icon className="overview-chart-card__type-icon" />
                <div>
                  <h3 className="overview-chart-card__title">Relación Costo-Valor</h3>
                  <p className="overview-chart-card__subtitle">Análisis de rentabilidad por item</p>
                </div>
              </div>
            </div>
            <div className="overview-chart-card__content">
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={topItemsByValue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey="quantity"
                    name="Cantidad"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="value"
                    name="Valor"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'value' ? formatCurrency(value) : value,
                      name === 'value' ? 'Valor Total' : 'Cantidad'
                    ]}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.name || ''}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#f1f5f9'
                    }}
                  />
                  <Scatter dataKey="value" fill="#00D4FF" name="value" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="overview-page overview-page--loading">
        <div className="overview-state overview-loading">Cargando panorama general...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-page overview-page--error">
        <div className="overview-state overview-error">
          <p className="overview-error__title">No se pudo cargar el resumen</p>
          <p className="overview-error__message">{error}</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <div className="overview-page">
      <header className="overview-header">
        <p className="overview-subtitle">Centro de Control del Inventario</p>
        <h1 className="overview-title">Panorama General</h1>
        <p className="overview-description">
          Vista completa de tu inventario integrado con datasets y dashboards activos
        </p>
      </header>

      {/* Stats Grid */}
      <div className="overview-stats">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="overview-stat-card"
              style={{
                '--dp-card-accent': stat.accent,
                '--dp-card-accent-soft': stat.accentSoft,
              } as CSSProperties}
            >
              <div className="overview-stat-card__header">
                <h3 className="overview-stat-card__title">{stat.title}</h3>
                <div className="overview-stat-card__icon">
                  <Icon className="overview-stat-card__icon-svg" />
                </div>
              </div>
              <p className="overview-stat-card__value">{stat.value}</p>
              <p className="overview-stat-card__meta">{stat.meta}</p>
              {stat.trend && (
                <div className={`overview-stat-card__trend overview-stat-card__trend--${stat.trend}`}>
                  {stat.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {stat.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="overview-charts">
        {/* Chart Type Selector */}
        <div className="overview-chart-selector">
          <div className="overview-chart-selector__header">
            <h3 className="overview-chart-selector__title">Tipo de Visualización</h3>
            <button
              className="overview-chart-selector__toggle"
              onClick={() => setShowChartSelector(!showChartSelector)}
            >
              {CHART_OPTIONS.find(option => option.type === selectedChartType)?.name}
              <ChevronDown className={`overview-chart-selector__arrow ${showChartSelector ? 'rotated' : ''}`} />
            </button>
          </div>

          {showChartSelector && (
            <div className="overview-chart-selector__options">
              {CHART_OPTIONS.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.type}
                    className={`overview-chart-selector__option ${selectedChartType === option.type ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedChartType(option.type);
                      setShowChartSelector(false);
                    }}
                  >
                    <OptionIcon className="overview-chart-selector__option-icon" />
                    <div className="overview-chart-selector__option-content">
                      <span className="overview-chart-selector__option-name">{option.name}</span>
                      <span className="overview-chart-selector__option-description">{option.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Chart */}
        {renderSelectedChart()}

        {/* Secondary Chart Selector */}
        <div className="overview-chart-selector">
          <div className="overview-chart-selector__header">
            <h3 className="overview-chart-selector__title">Visualización Secundaria</h3>
            <button
              className="overview-chart-selector__toggle"
              onClick={() => setShowSecondaryChartSelector(!showSecondaryChartSelector)}
            >
              {CHART_OPTIONS.find(option => option.type === selectedSecondaryChartType)?.name}
              <ChevronDown className={`overview-chart-selector__arrow ${showSecondaryChartSelector ? 'rotated' : ''}`} />
            </button>
          </div>

          {showSecondaryChartSelector && (
            <div className="overview-chart-selector__options">
              {CHART_OPTIONS.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.type}
                    className={`overview-chart-selector__option ${selectedSecondaryChartType === option.type ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSecondaryChartType(option.type);
                      setShowSecondaryChartSelector(false);
                    }}
                  >
                    <OptionIcon className="overview-chart-selector__option-icon" />
                    <div className="overview-chart-selector__option-content">
                      <span className="overview-chart-selector__option-name">{option.name}</span>
                      <span className="overview-chart-selector__option-description">{option.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Secondary Chart */}
        {renderSecondaryChart()}
      </div>

      {/* Connections Section */}
      <div className="overview-connections">
        <div className="overview-connection-card">
          <div className="overview-connection-card__header">
            <Database className="overview-connection-card__icon" />
            <h3 className="overview-connection-card__title">Datasets Vinculados</h3>
          </div>
          <div className="overview-connection-card__content">
            {datasetConnections.length > 0 ? (
              datasetConnections.map((connection, index) => (
                <div key={connection.name} className="overview-connection-item" style={{
                  backgroundColor: `hsl(${(index * 60) % 360}, 70%, 95%)`,
                  borderLeftColor: `hsl(${(index * 60) % 360}, 70%, 60%)`
                }}>
                  <span className="overview-connection-item__name">{connection.name}</span>
                  <span className="overview-connection-item__count">{connection.count} items</span>
                </div>
              ))
            ) : (
              <p className="overview-connection-empty">No hay datasets vinculados aún</p>
            )}
          </div>
        </div>

        <div className="overview-connection-card">
          <div className="overview-connection-card__header">
            <LayoutDashboard className="overview-connection-card__icon" />
            <h3 className="overview-connection-card__title">Dashboards Vinculados</h3>
          </div>
          <div className="overview-connection-card__content">
            {dashboardConnections.length > 0 ? (
              dashboardConnections.map((connection, index) => (
                <div key={connection.name} className="overview-connection-item" style={{
                  backgroundColor: `hsl(${(index * 45 + 180) % 360}, 70%, 95%)`,
                  borderLeftColor: `hsl(${(index * 45 + 180) % 360}, 70%, 60%)`
                }}>
                  <span className="overview-connection-item__name">{connection.name}</span>
                  <span className="overview-connection-item__count">{connection.count} items</span>
                </div>
              ))
            ) : (
              <p className="overview-connection-empty">No hay dashboards vinculados aún</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
