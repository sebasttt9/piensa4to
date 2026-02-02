import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  LineChart,
  RefreshCw,
  Users,
  UserPlus,
  UserCheck,
  PieChart,
} from 'lucide-react';
import { commerceAPI, type CommerceOverview } from '../lib/services';
import './CustomersPage.css';

interface MetricCardConfig {
  key: string;
  label: string;
  value: string;
  helper: string;
  trend: number;
  icon: typeof Users;
  tone: 'sky' | 'emerald' | 'violet';
}

type TrendDirection = 'up' | 'down' | 'neutral';

const formatPercent = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) {
    return '0.0%';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const resolveTrend = (value: number): TrendDirection => {
  if (!Number.isFinite(value) || value === 0) {
    return 'neutral';
  }
  return value > 0 ? 'up' : 'down';
};

export function CustomersPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<CommerceOverview, Error>({
    queryKey: ['commerce-overview'],
    queryFn: commerceAPI.getOverview,
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.monthlyRevenue.map((point) => ({
      label: point.label,
      customers: point.customers,
      orders: point.orders,
    }));
  }, [data]);

  const segments = useMemo(() => data?.segmentPerformance ?? [], [data]);

  const metrics = useMemo<MetricCardConfig[]>(() => {
    if (!data) return [];
    const { totals } = data;
    const returningShare = totals.ordersCurrent > 0
      ? (totals.returningCustomers / totals.ordersCurrent) * 100
      : 0;

    return [
      {
        key: 'new-customers',
        label: 'Nuevos clientes',
        value: totals.newCustomersCurrent.toLocaleString('es-ES'),
        helper: `Vs mes anterior ${formatPercent(totals.newCustomersChangePct)}`,
        trend: totals.newCustomersChangePct,
        icon: UserPlus,
        tone: 'sky',
      },
      {
        key: 'active-customers',
        label: 'Clientes activos',
        value: totals.activeCustomers.toLocaleString('es-ES'),
        helper: 'Clientes con al menos una orden en los ultimos meses',
        trend: 0,
        icon: Users,
        tone: 'emerald',
      },
      {
        key: 'returning-customers',
        label: 'Clientes recurrentes',
        value: totals.returningCustomers.toLocaleString('es-ES'),
        helper: `Representan ${returningShare.toFixed(1)}% de las ordenes del mes`,
        trend: totals.returningCustomers,
        icon: UserCheck,
        tone: 'violet',
      },
    ];
  }, [data]);

  const renderTrendIcon = (trend: TrendDirection) => {
    if (trend === 'neutral') {
      return <PieChart className="customers-metric-card__trend-icon customers-metric-card__trend-icon--neutral" />;
    }
    if (trend === 'up') {
      return <ArrowUpRight className="customers-metric-card__trend-icon customers-metric-card__trend-icon--up" />;
    }
    return <ArrowDownRight className="customers-metric-card__trend-icon customers-metric-card__trend-icon--down" />;
  };

  return (
    <div className="customers-page">
      <header className="customers-page__header">
        <div>
          <h1 className="customers-page__title">Clientes</h1>
          <p className="customers-page__subtitle">
            Comprende el crecimiento de tu base de clientes, su retencion y los segmentos que generan mayor valor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="customers-page__refresh"
          disabled={isLoading}
        >
          <RefreshCw className="customers-page__refresh-icon" />
          Actualizar
        </button>
      </header>

      {isLoading && (
        <div className="customers-page__state" role="status">
          <LineChart className="customers-page__state-icon" />
          <p>Cargando informacion de clientes...</p>
        </div>
      )}

      {isError && (
        <div className="customers-page__state customers-page__state--error" role="alert">
          <LineChart className="customers-page__state-icon" />
          <div>
            <p>No se pudo cargar el resumen de clientes.</p>
            <p className="customers-page__state-helper">{error?.message ?? 'Intenta nuevamente en unos minutos.'}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && data && !data.hasOrders && (
        <div className="customers-page__state customers-page__state--empty" role="status">
          <Users className="customers-page__state-icon" />
          <div>
            <p>No hay clientes registrados todavia.</p>
            <p className="customers-page__state-helper">
              Cuando cargues ordenes podras monitorear segmentos y clientes recurrentes.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && data && data.hasOrders && (
        <>
          <section className="customers-metrics" aria-label="Indicadores de clientes">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const trendDirection = resolveTrend(metric.trend);
              return (
                <article key={metric.key} className={`customers-metric-card customers-metric-card--${metric.tone}`}>
                  <div className="customers-metric-card__icon">
                    <Icon size={20} />
                  </div>
                  <div className="customers-metric-card__body">
                    <span className="customers-metric-card__label">{metric.label}</span>
                    <span className="customers-metric-card__value">{metric.value}</span>
                    <span className="customers-metric-card__helper">{metric.helper}</span>
                  </div>
                  <div className={`customers-metric-card__trend customers-metric-card__trend--${trendDirection}`}>
                    {renderTrendIcon(trendDirection)}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="customers-chart" aria-label="Evolucion de clientes">
            <header className="customers-section-header">
              <div>
                <h2>Evolucion mensual de clientes</h2>
                <p>
                  Nuevos clientes y relacion con el volumen de ordenes para identificar patrones de retencion.
                </p>
              </div>
            </header>
            <div className="customers-chart__container">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="customersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const label = name === 'customers' ? 'Clientes' : 'Ordenes';
                      return [value.toLocaleString('es-ES'), label];
                    }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      backgroundColor: 'rgba(15, 23, 42, 0.94)',
                      color: '#e2e8f0',
                    }}
                  />
                  <Area type="monotone" dataKey="customers" stroke="#38bdf8" strokeWidth={2} fill="url(#customersGradient)" name="customers" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="customers-segments" aria-label="Segmentos de clientes">
            <header className="customers-section-header">
              <div>
                <h2>Segmentos con mayor impacto</h2>
                <p>Distribucion de clientes y participacion de ingresos por segmento.</p>
              </div>
            </header>
            <div className="customers-segments__content">
              <div className="customers-segments__chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={segments} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                    <XAxis dataKey="segment" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'revenueShare') {
                          return [`${(value * 100).toFixed(1)}%`, 'Participacion'] as const;
                        }
                        if (name === 'customers') {
                          return [value.toLocaleString('es-ES'), 'Clientes'] as const;
                        }
                        return [value.toLocaleString('es-ES'), 'Ingresos'] as const;
                      }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        backgroundColor: 'rgba(15, 23, 42, 0.94)',
                        color: '#e2e8f0',
                      }}
                    />
                    <Bar dataKey="customers" name="customers" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="customers-segments__list">
                {segments.map((segment) => (
                  <article key={segment.segment} className="customers-segment-card">
                    <h3>{segment.segment}</h3>
                    <dl>
                      <div>
                        <dt>Clientes</dt>
                        <dd>{segment.customers.toLocaleString('es-ES')}</dd>
                      </div>
                      <div>
                        <dt>Ingresos</dt>
                        <dd>{segment.revenue.toLocaleString('es-ES')}</dd>
                      </div>
                      <div>
                        <dt>Ticket promedio</dt>
                        <dd>{segment.avgTicket.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                      </div>
                      <div>
                        <dt>Participacion</dt>
                        <dd>{(segment.revenueShare * 100).toFixed(1)}%</dd>
                      </div>
                    </dl>
                  </article>
                ))}
                {segments.length === 0 && (
                  <div className="customers-page__state customers-page__state--inline" role="status">
                    <Users className="customers-page__state-icon" />
                    <p>No hay segmentos suficientes para mostrar.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
