import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  DollarSign,
  Database,
  LayoutDashboard,
  BarChart3,
  PieChart,
  Radar,
  Target,
  Activity,
  Layers,
  ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { inventoryAPI, inventoryItemsAPI, datasetsAPI, dashboardsAPI, type InventorySummary, type InventoryItem, type Dataset, type Dashboard } from '../lib/services';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('bar');
  const [showChartSelector, setShowChartSelector] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchOverview = async () => {
      setIsLoading(true);
      try {
        const [summary, items, datasets, dashboards] = await Promise.all([
          inventoryAPI.getSummary(),
          inventoryItemsAPI.list(),
          datasetsAPI.list(1, 100),
          dashboardsAPI.list(1, 100)
        ]);

        if (!active) return;

        setOverview({
          summary,
          items: items || [],
          datasets: datasets.data || [],
          dashboards: dashboards.data || []
        });
        setError(null);
      } catch (err: unknown) {
        if (!active) return;
        const message =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: unknown }).message ?? 'Error desconocido')
            : 'No se pudo cargar el resumen del inventario';
        setError(message);
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

  const formatCurrency = (value: number) => formatAmount(value, 'USD');

  const statCards: StatCard[] = useMemo(() => {
    if (!overview) return [];

    const totalValue = overview.items.reduce((sum, item) => sum + (item.quantity * item.pvp), 0);
    const totalCost = overview.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    const totalItems = overview.items.length;
    const approvedItems = overview.items.filter(item => item.status === 'approved').length;
    const linkedDatasets = new Set(overview.items.filter(item => item.datasetId).map(item => item.datasetId)).size;
    const linkedDashboards = new Set(overview.items.filter(item => item.dashboardId).map(item => item.dashboardId)).size;

    return [
      {
        title: 'Valor Total del Inventario',
        value: formatCurrency(totalValue),
        icon: DollarSign,
        accent: '#00D4FF', // Cyan brillante
        accentSoft: 'rgba(0, 212, 255, 0.15)',
        meta: 'Valor de mercado actual',
        trend: totalValue > 0 ? 'up' : 'neutral'
      },
      {
        title: 'Costo Total',
        value: formatCurrency(totalCost),
        icon: ShoppingCart,
        accent: '#FF6B6B', // Rojo coral
        accentSoft: 'rgba(255, 107, 107, 0.15)',
        meta: 'Inversión total',
        trend: 'neutral'
      },
      {
        title: 'Items de Inventario',
        value: totalItems.toLocaleString('es-ES'),
        icon: Package,
        accent: '#4ECDC4', // Turquesa
        accentSoft: 'rgba(78, 205, 196, 0.15)',
        meta: `${approvedItems} aprobados`,
        trend: totalItems > 0 ? 'up' : 'neutral'
      },
      {
        title: 'Datasets Vinculados',
        value: linkedDatasets.toString(),
        icon: Database,
        accent: '#45B7D1', // Azul cielo
        accentSoft: 'rgba(69, 183, 209, 0.15)',
        meta: 'Conexiones activas',
        trend: linkedDatasets > 0 ? 'up' : 'neutral'
      },
      {
        title: 'Dashboards Vinculados',
        value: linkedDashboards.toString(),
        icon: LayoutDashboard,
        accent: '#96CEB4', // Verde menta
        accentSoft: 'rgba(150, 206, 180, 0.15)',
        meta: 'Visualizaciones activas',
        trend: linkedDashboards > 0 ? 'up' : 'neutral'
      },
      {
        title: 'Margen Promedio',
        value: totalValue > 0 ? `${(((totalValue - totalCost) / totalValue) * 100).toFixed(1)}%` : '0%',
        icon: TrendingUp,
        accent: '#FFEAA7', // Amarillo crema
        accentSoft: 'rgba(255, 234, 167, 0.15)',
        meta: 'Rentabilidad',
        trend: totalValue > totalCost ? 'up' : totalValue < totalCost ? 'down' : 'neutral'
      }
    ];
  }, [overview]);

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
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#ffffff'
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
                  <Tooltip />
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
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#ffffff'
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
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#ffffff'
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
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#ffffff'
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

        {/* Secondary Chart - Status Overview */}
        <div className="overview-chart-card">
          <div className="overview-chart-card__header">
            <h3 className="overview-chart-card__title">Estado del Inventario</h3>
            <p className="overview-chart-card__subtitle">Distribución por estado de aprobación</p>
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
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
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
