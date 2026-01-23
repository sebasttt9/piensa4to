import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Filter, PlusCircle, Database, Calendar, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { datasetsAPI, type Dataset } from '../lib/services';
import { useAuth } from '../context/AuthContext';
import './DatasetsPage.css';

interface StatCard {
  label: string;
  value: string;
  helper: string;
  icon: typeof Database;
  accent: string;
  accentSoft: string;
}

export function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { roleAtLeast } = useAuth();
  const canManageDatasets = roleAtLeast('admin');

  const loadDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch datasets from the Supabase-backed API
      const response = await datasetsAPI.list(1, 25);
      setDatasets(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos recuperar los datasets.';
      setError(message);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDatasets();
  }, [loadDatasets]);

  const stats = useMemo(() => {
    const totalDatasets = datasets.length;
    const processed = datasets.filter((dataset) => dataset.status === 'processed').length;
    const pending = datasets.filter((dataset) => dataset.status === 'pending').length;
    const totalRows = datasets.reduce((acc, dataset) => acc + (dataset.rowCount ?? 0), 0);
    const processedPercent = totalDatasets > 0 ? Math.round((processed / totalDatasets) * 100) : 0;
    const pendingPercent = totalDatasets > 0 ? Math.round((pending / totalDatasets) * 100) : 0;

    return [
      {
        label: 'Datasets totales',
        value: totalDatasets.toLocaleString('es-ES'),
        helper: 'Registrados en la plataforma',
        icon: Database,
        accent: '#818cf8',
        accentSoft: 'rgba(129, 140, 248, 0.18)',
      },
      {
        label: 'Procesados',
        value: processed.toLocaleString('es-ES'),
        helper: `${processedPercent}% listos para análisis`,
        icon: CheckCircle,
        accent: '#34d399',
        accentSoft: 'rgba(52, 211, 153, 0.18)',
      },
      {
        label: 'Filas registradas',
        value: totalRows.toLocaleString('es-ES'),
        helper: 'Datos almacenados para consulta',
        icon: Calendar,
        accent: '#38bdf8',
        accentSoft: 'rgba(56, 189, 248, 0.18)',
      },
      {
        label: 'Pendientes',
        value: pending.toLocaleString('es-ES'),
        helper: `${pendingPercent}% en cola de procesamiento`,
        icon: AlertTriangle,
        accent: '#f97316',
        accentSoft: 'rgba(249, 115, 22, 0.18)',
      },
    ] satisfies StatCard[];
  }, [datasets]);

  const formatDate = (value?: string) => {
    if (!value) {
      return 'Sin actualizar';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: Dataset['status']) => {
    switch (status) {
      case 'processed':
        return {
          label: 'Procesado',
          className: 'datasets-status datasets-status--processed',
          icon: CheckCircle,
        } as const;
      case 'pending':
        return {
          label: 'Pendiente',
          className: 'datasets-status datasets-status--pending',
          icon: Clock,
        } as const;
      case 'error':
      default:
        return {
          label: 'Error',
          className: 'datasets-status datasets-status--error',
          icon: AlertTriangle,
        } as const;
    }
  };

  return (
    <div className="datasets-page">
      <header className="datasets-header">
        <div className="datasets-header__info">
          <span className="datasets-header__icon">
            <Database className="w-6 h-6" />
          </span>
          <div className="datasets-header__meta">
            <h1 className="datasets-header__title">Datasets</h1>
            <p className="datasets-header__subtitle">
              Administra tus fuentes de datos, sincroniza tus archivos y accede al avance del procesamiento en tiempo real.
            </p>
          </div>
        </div>
        {canManageDatasets && (
          <div className="datasets-header__actions">
            <Link to="/app/upload" className="datasets-upload-button">
              <PlusCircle className="w-5 h-5" />
              Cargar nuevo dataset
            </Link>
          </div>
        )}
      </header>

      <section className="datasets-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const iconStyle: CSSProperties = {
            background: stat.accentSoft,
            color: stat.accent,
          };

          return (
            <article key={stat.label} className="datasets-stat-card">
              <span className="datasets-stat-card__icon" style={iconStyle}>
                <Icon className="w-5 h-5" />
              </span>
              <p className="datasets-stat-card__label">{stat.label}</p>
              <p className="datasets-stat-card__value">{stat.value}</p>
              <p className="datasets-stat-card__helper">{stat.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="datasets-filters">
        <button type="button" className="datasets-filters__primary">
          <Filter className="w-4 h-4" />
          Filtros avanzados
        </button>
        <div className="datasets-filters__chips">
          <span className="datasets-filters__chip">Últimos 7 días</span>
          <span className="datasets-filters__chip">CSV</span>
          <span className="datasets-filters__chip">Excel</span>
        </div>
      </section>

      <section className="datasets-table">
        <table>
          <thead>
            <tr>
              <th>Nombre dataset</th>
              <th>Registros</th>
              <th>Última actualización</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5}>
                  <div className="datasets-table__state">
                    <Clock className="w-5 h-5" />
                    <span>Cargando datasets…</span>
                  </div>
                </td>
              </tr>
            )}

            {error && !loading && (
              <tr>
                <td colSpan={5}>
                  <div className="datasets-table__state">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{error}</span>
                    <button type="button" className="datasets-table__retry" onClick={() => void loadDatasets()}>
                      Reintentar
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && datasets.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="datasets-table__state">
                    <Database className="w-5 h-5" />
                    <span>Aún no has creado datasets. Importa tu primer archivo para comenzar.</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && datasets.map((dataset) => {
              const status = getStatusConfig(dataset.status);
              const StatusIcon = status.icon;

              return (
                <tr key={dataset.id}>
                  <td>
                    <div className="datasets-name-cell">
                      <span className="datasets-name-cell__icon">
                        <Database className="w-4 h-4" />
                      </span>
                      <div className="datasets-meta">
                        <span className="datasets-meta__value">{dataset.name}</span>
                        <span className="datasets-meta__description">
                          {dataset.description ?? 'Sin descripción proporcionada'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="datasets-meta">
                      <span className="datasets-meta__value">{(dataset.rowCount ?? 0).toLocaleString('es-ES')}</span>
                      <span className="datasets-meta__label">
                        {dataset.columnCount ? `${dataset.columnCount} columnas` : 'Dimensión no disponible'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="datasets-meta">
                      <span className="datasets-meta__value">{formatDate(dataset.updatedAt ?? dataset.createdAt)}</span>
                      <span className="datasets-meta__label">
                        {dataset.fileType ? dataset.fileType.toUpperCase() : 'Sin archivo' }
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={status.className}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <Link to={`/app/datasets/${dataset.id}`} className="datasets-row-action">
                      Ver detalle
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
