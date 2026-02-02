import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  Clock,
  Crown,
  Database,
  Gauge,
  RefreshCcw,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { superadminDashboardAPI, type SuperadminDashboardOverview } from '../../lib/services';
import './SuperadminDashboardPage.css';

const formatRelativeTime = (timestamp: string) => {
  const updatedAt = new Date(timestamp);
  if (Number.isNaN(updatedAt.getTime())) {
    return 'Actualizado recientemente';
  }

  const diffMs = updatedAt.getTime() - Date.now();
  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
  ];

  const formatter = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });
  let duration = diffMs / 1000;

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return 'Actualizado recientemente';
};

const toLocaleNumber = (value: number) => value.toLocaleString('es-ES');

export function SuperadminDashboardPage() {
  const [overview, setOverview] = useState<SuperadminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async (options?: { background?: boolean }) => {
    const background = Boolean(options?.background);
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await superadminDashboardAPI.getOverview();
      setOverview(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos cargar el panel de control.';
      setError(message);
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadOverview({ background: true });
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadOverview]);

  const activityStats = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      {
        icon: Activity,
        label: 'Usuarios en línea',
        value: toLocaleNumber(overview.activity.onlineUsers),
        helper: `Ventana de ${overview.activity.windowMinutes} minutos`,
        tone: 'accent',
      },
      {
        icon: ShieldCheck,
        label: 'Admins conectados',
        value: toLocaleNumber(overview.activity.onlineAdmins),
        helper: 'Sesiones activas con privilegios elevados',
      },
      {
        icon: Crown,
        label: 'Superadmins en línea',
        value: toLocaleNumber(overview.activity.onlineSuperadmins),
        helper: 'Supervisión global activa',
      },
      {
        icon: Database,
        label: 'Datasets activos',
        value: toLocaleNumber(overview.datasets.total),
        helper: 'Disponibles en catálogo',
      },
    ];
  }, [overview]);

  const userStats = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      {
        icon: Users,
        label: 'Usuarios totales',
        value: toLocaleNumber(overview.users.total),
        helper: 'Dentro de la plataforma',
      },
      {
        icon: CheckCircle,
        label: 'Aprobados',
        value: toLocaleNumber(overview.users.approved),
        helper: 'Con acceso disponible',
      },
      {
        icon: Clock,
        label: 'Pendientes',
        value: toLocaleNumber(overview.users.pending),
        helper: 'Esperan aprobación',
        tone: 'warning',
      },
      {
        icon: ShieldCheck,
        label: 'Administradores',
        value: toLocaleNumber(overview.users.admins),
        helper: 'Control operativo',
      },
      {
        icon: Crown,
        label: 'Superadmins',
        value: toLocaleNumber(overview.users.superadmins),
        helper: 'Gobierno global',
        tone: 'accent',
      },
      {
        icon: UserPlus,
        label: 'Altas últimos 7 días',
        value: toLocaleNumber(overview.users.recentSignups7d),
        helper: 'Registros recientes',
      },
      {
        icon: Gauge,
        label: 'Usuarios por organización',
        value: overview.users.averageUsersPerOrganization.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
        helper: 'Promedio por organización',
      },
    ];
  }, [overview]);

  const organizationStats = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      {
        icon: Building2,
        label: 'Organizaciones',
        value: toLocaleNumber(overview.organizations.total),
        helper: 'Registradas',
      },
      {
        icon: ShieldCheck,
        label: 'Con propietario',
        value: toLocaleNumber(overview.organizations.withOwner),
        helper: 'Definen responsable principal',
      },
      {
        icon: AlertTriangle,
        label: 'Sin propietario',
        value: toLocaleNumber(overview.organizations.withoutOwner),
        helper: 'Requieren asignar dueño',
        tone: 'warning',
      },
      {
        icon: Users,
        label: 'Con miembros activos',
        value: toLocaleNumber(overview.organizations.withMembers),
        helper: 'Tienen usuarios asignados',
      },
      {
        icon: UserMinus,
        label: 'Sin miembros',
        value: toLocaleNumber(overview.organizations.withoutMembers),
        helper: 'Sin usuarios vinculados',
      },
      {
        icon: BarChart3,
        label: 'Creadas en 30 días',
        value: toLocaleNumber(overview.organizations.createdLast30d),
        helper: 'Último mes',
        tone: 'accent',
      },
    ];
  }, [overview]);

  const datasetStats = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      {
        icon: Database,
        label: 'Datasets',
        value: toLocaleNumber(overview.datasets.total),
        helper: 'Registrados',
      },
      {
        icon: CheckCircle,
        label: 'Procesados',
        value: toLocaleNumber(overview.datasets.processed),
        helper: 'Listos para usar',
        tone: 'success',
      },
      {
        icon: Clock,
        label: 'Pendientes',
        value: toLocaleNumber(overview.datasets.pending),
        helper: 'Esperan procesamiento',
        tone: 'warning',
      },
      {
        icon: AlertTriangle,
        label: 'Con error',
        value: toLocaleNumber(overview.datasets.error),
        helper: 'Requieren revisión',
        tone: 'danger',
      },
      {
        icon: RefreshCcw,
        label: 'Actualizados en 7 días',
        value: toLocaleNumber(overview.datasets.updatedLast7d),
        helper: 'Actividad reciente',
      },
    ];
  }, [overview]);

  return (
    <div className="superadmin-dashboard">
      <header className="superadmin-dashboard__header">
        <div className="superadmin-dashboard__header-info">
          <div className="superadmin-dashboard__header-icon">
            <Activity size={24} />
          </div>
          <div className="superadmin-dashboard__header-copy">
            <span className="superadmin-dashboard__header-eyebrow">Supervisión global</span>
            <h1 className="superadmin-dashboard__header-title">Panel de control del superadmin</h1>
            <p className="superadmin-dashboard__header-subtitle">
              Monitorea la actividad en vivo, el estado de las organizaciones y el desempeño de los datasets en toda la plataforma.
            </p>
          </div>
        </div>
        <div className="superadmin-dashboard__header-actions">
          {overview && (
            <span className="superadmin-dashboard__timestamp">
              {`Actualizado ${formatRelativeTime(overview.timestamp)}`}
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadOverview({ background: true })}
            className={`superadmin-dashboard__refresh ${refreshing ? 'is-refreshing' : ''}`}
            disabled={loading || refreshing}
          >
            <RefreshCcw size={18} />
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </header>

      {error && (
        <div className="superadmin-dashboard__toast superadmin-dashboard__toast--error">{error}</div>
      )}

      {loading ? (
        <div className="superadmin-dashboard__loading">Cargando indicadores globales…</div>
      ) : (
        overview && (
          <div className="superadmin-dashboard__content">
            <section className="superadmin-dashboard__metrics">
              {activityStats.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.label}
                    className={`superadmin-dashboard__metric ${item.tone ? `superadmin-dashboard__metric--${item.tone}` : ''} ${item.label === 'Usuarios en línea' ? 'is-primary' : ''}`.trim()}
                  >
                    <div className="superadmin-dashboard__metric-icon">
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="superadmin-dashboard__metric-label">{item.label}</p>
                      <p className="superadmin-dashboard__metric-value">{item.value}</p>
                      <span className="superadmin-dashboard__metric-helper">{item.helper}</span>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="superadmin-dashboard__panels">
              <article className="superadmin-dashboard__panel">
                <header className="superadmin-dashboard__panel-header">
                  <div>
                    <h2 className="superadmin-dashboard__panel-title">Usuarios</h2>
                    <p className="superadmin-dashboard__panel-subtitle">Controla la salud de la base de usuarios y su distribución.</p>
                  </div>
                </header>
                <div className="superadmin-dashboard__stat-grid">
                  {userStats.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={`superadmin-dashboard__stat ${item.tone ? `superadmin-dashboard__stat--${item.tone}` : ''}`.trim()}
                      >
                        <div className="superadmin-dashboard__stat-icon">
                          <Icon size={18} />
                        </div>
                        <div className="superadmin-dashboard__stat-content">
                          <span className="superadmin-dashboard__stat-label">{item.label}</span>
                          <span className="superadmin-dashboard__stat-value">{item.value}</span>
                          <span className="superadmin-dashboard__stat-helper">{item.helper}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="superadmin-dashboard__panel">
                <header className="superadmin-dashboard__panel-header">
                  <div>
                    <h2 className="superadmin-dashboard__panel-title">Organizaciones</h2>
                    <p className="superadmin-dashboard__panel-subtitle">Identifica rápidamente qué organizaciones requieren acciones.</p>
                  </div>
                </header>
                <div className="superadmin-dashboard__stat-grid">
                  {organizationStats.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={`superadmin-dashboard__stat ${item.tone ? `superadmin-dashboard__stat--${item.tone}` : ''}`.trim()}
                      >
                        <div className="superadmin-dashboard__stat-icon">
                          <Icon size={18} />
                        </div>
                        <div className="superadmin-dashboard__stat-content">
                          <span className="superadmin-dashboard__stat-label">{item.label}</span>
                          <span className="superadmin-dashboard__stat-value">{item.value}</span>
                          <span className="superadmin-dashboard__stat-helper">{item.helper}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="superadmin-dashboard__panel">
                <header className="superadmin-dashboard__panel-header">
                  <div>
                    <h2 className="superadmin-dashboard__panel-title">Datasets</h2>
                    <p className="superadmin-dashboard__panel-subtitle">Supervisa la calidad y actividad de los datos compartidos.</p>
                  </div>
                </header>
                <div className="superadmin-dashboard__stat-grid">
                  {datasetStats.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={`superadmin-dashboard__stat ${item.tone ? `superadmin-dashboard__stat--${item.tone}` : ''}`.trim()}
                      >
                        <div className="superadmin-dashboard__stat-icon">
                          <Icon size={18} />
                        </div>
                        <div className="superadmin-dashboard__stat-content">
                          <span className="superadmin-dashboard__stat-label">{item.label}</span>
                          <span className="superadmin-dashboard__stat-value">{item.value}</span>
                          <span className="superadmin-dashboard__stat-helper">{item.helper}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            </section>
          </div>
        )
      )}
    </div>
  );
}
