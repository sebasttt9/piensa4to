import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyticsAPI, type OverviewAnalytics } from '../lib/services';
import { useCurrency } from '../context/CurrencyContext';
import './OverviewPage.css';

interface StatCard {
  title: string;
  value: string;
  icon: typeof DollarSign;
  accent: string;
  accentSoft: string;
  meta: string;
}

interface QuickStat {
  label: string;
  value: string;
  progress: number;
  helper: string;
}

export function OverviewPage() {
  const { formatAmount } = useCurrency();
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchOverview = async () => {
      setIsLoading(true);
      try {
        const data = await analyticsAPI.getOverview();
        if (!active) {
          return;
        }
        setOverview(data);
        setError(null);
      } catch (err: unknown) {
        if (!active) {
          return;
        }
        const message =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: unknown }).message ?? 'Error desconocido')
            : 'No se pudo cargar el resumen';
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
    const revenue = overview?.financial.totalRevenue ?? 0;
    const costs = overview?.financial.totalCosts ?? 0;
    const netProfit = overview?.financial.netProfit ?? 0;
    const totalDatasets = overview?.summary.totalDatasets ?? 0;

    return [
      {
        title: 'Ingresos Totales',
        value: formatCurrency(revenue),
        icon: DollarSign,
        accent: '#10b981',
        accentSoft: 'rgba(16, 185, 129, 0.15)',
        meta: 'Período fiscal reciente',
      },
      {
        title: 'Costos Totales',
        value: formatCurrency(costs),
        icon: ShoppingCart,
        accent: '#ef4444',
        accentSoft: 'rgba(239, 68, 68, 0.18)',
        meta: 'Gastos operativos',
      },
      {
        title: 'Ganancia Neta',
        value: formatCurrency(netProfit),
        icon: netProfit >= 0 ? TrendingUp : TrendingDown,
        accent: netProfit >= 0 ? '#3b82f6' : '#f97316',
        accentSoft: netProfit >= 0 ? 'rgba(59, 130, 246, 0.18)' : 'rgba(249, 115, 22, 0.18)',
        meta: netProfit >= 0 ? 'Tendencia positiva' : 'Revisar costos',
      },
      {
        title: 'Datasets Totales',
        value: totalDatasets.toLocaleString('es-ES'),
        icon: Package,
        accent: '#a855f7',
        accentSoft: 'rgba(168, 85, 247, 0.18)',
        meta: 'Inventario analítico',
      },
    ];
  }, [overview]);

  const lineChartData = useMemo(
    () =>
      (overview?.financial.monthlySeries ?? []).map((entry) => ({
        name: entry.month,
        ingresos: entry.revenue,
        costos: entry.costs,
      })),
    [overview?.financial.monthlySeries],
  );

  const datasetHealthData = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      { name: 'Procesados', valor: overview.datasetHealth.processed },
      { name: 'Pendientes', valor: overview.datasetHealth.pending },
      { name: 'Con error', valor: overview.datasetHealth.error },
    ];
  }, [overview]);

  const quickStats: QuickStat[] = useMemo(() => {
    if (!overview) {
      return [];
    }

    const totalDatasets = Math.max(overview.summary.totalDatasets, 1);
    const processedPercent = Math.min(100, (overview.datasetHealth.processed / totalDatasets) * 100);
    const pendingPercent = Math.min(100, (overview.datasetHealth.pending / totalDatasets) * 100);
    const storagePercent = Math.min(100, overview.storage.usagePercentage);

    return [
      {
        label: 'Datasets procesados',
        value: overview.datasetHealth.processed.toLocaleString('es-ES'),
        progress: processedPercent,
        helper: `${processedPercent.toFixed(0)}% del total`,
      },
      {
        label: 'Pendientes de análisis',
        value: overview.datasetHealth.pending.toLocaleString('es-ES'),
        progress: pendingPercent,
        helper: `${pendingPercent.toFixed(0)}% en cola`,
      },
      {
        label: 'Uso de almacenamiento',
        value: `${overview.storage.usedMb.toFixed(1)} MB`,
        progress: storagePercent,
        helper: `${storagePercent.toFixed(0)}% de ${overview.storage.capacityMb} MB`,
      },
    ];
  }, [overview]);

  const pendingOrErrorDatasets =
    (overview?.datasetHealth.pending ?? 0) + (overview?.datasetHealth.error ?? 0);

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
            </div>
          );
        })}
      </div>

      {pendingOrErrorDatasets > 0 && (
        <div className="overview-alert">
          <div className="overview-alert__icon">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="overview-alert__content">
            <h4 className="overview-alert__title">
              {overview.datasetHealth.error > 0 ? 'Incidencias detectadas' : 'Procesamiento en curso'}
            </h4>
            <p className="overview-alert__message">
              Hay {pendingOrErrorDatasets} dataset{pendingOrErrorDatasets !== 1 ? 's' : ''} que requieren atención. Revisa el módulo de datasets para dar seguimiento.
            </p>
          </div>
        </div>
      )}

      <div className="overview-charts">
        <div className="overview-chart-card">
          <div className="overview-chart-card__header">
            <h3 className="overview-chart-card__title">Ingresos vs Costos</h3>
            <p className="overview-chart-card__subtitle">Serie mensual - últimos periodos</p>
          </div>
          <div className="overview-chart-card__content">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCostos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} name="Ingresos" dot={{ fill: '#10b981', r: 5 }} />
                <Line type="monotone" dataKey="costos" stroke="#ef4444" strokeWidth={3} name="Costos" dot={{ fill: '#ef4444', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overview-chart-card">
          <div className="overview-chart-card__header">
            <h3 className="overview-chart-card__title">Estado de datasets</h3>
            <p className="overview-chart-card__subtitle">Seguimiento del flujo de procesamiento</p>
          </div>
          <div className="overview-chart-card__content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datasetHealthData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradDatasets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#312e81" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => `${value} dataset${value === 1 ? '' : 's'}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="valor" fill="url(#gradDatasets)" name="Total" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overview-quick-stats">
        {quickStats.map((stat) => (
          <div className="overview-quick-stat" key={stat.label}>
            <p className="overview-quick-stat__label">{stat.label}</p>
            <p className="overview-quick-stat__value">{stat.value}</p>
            <div className="overview-quick-stat__progress">
              <div className="overview-quick-stat__progress-bar">
                <div className="overview-quick-stat__progress-fill" style={{ width: `${stat.progress}%` }} />
              </div>
              <span className="overview-quick-stat__progress-text">{stat.helper}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
