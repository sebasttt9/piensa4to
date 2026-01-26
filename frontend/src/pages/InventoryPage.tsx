import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, RefreshCw, PackageCheck, Layers3, PieChart } from 'lucide-react';
import { analyticsAPI, dashboardsAPI, datasetsAPI, type Dashboard, type Dataset, type OverviewAnalytics } from '../lib/services';
import { useAuth } from '../context/AuthContext';

interface InventoryRecord {
  dataset: Dataset;
  dashboards: Dashboard[];
  adjustment: number;
}

const STORAGE_KEY = 'datapulse.inventory.adjustments';

const loadAdjustments = (): Record<string, number> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).reduce<Record<string, number>>((acc, [key, value]) => {
        const asNumber = Number(value);
        if (!Number.isFinite(asNumber)) {
          return acc;
        }
        acc[key] = asNumber;
        return acc;
      }, {});
    }
  } catch (error) {
    console.warn('Failed to parse inventory adjustments', error);
  }
  return {};
};

const persistAdjustments = (next: Record<string, number>) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Failed to persist inventory adjustments', error);
  }
};

export function InventoryPage() {
  const { roleAtLeast } = useAuth();
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, number>>(() => loadAdjustments());
  const [pendingAmounts, setPendingAmounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAdjust = roleAtLeast('admin');

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewResponse, datasetResponse, dashboardResponse] = await Promise.all([
          analyticsAPI.getOverview(),
          datasetsAPI.list(1, 100),
          dashboardsAPI.list(1, 100),
        ]);

        if (!active) {
          return;
        }

        setOverview(overviewResponse);
        setDatasets(datasetResponse.data ?? []);
        setDashboards(dashboardResponse.data ?? []);
      } catch (err) {
        if (!active) {
          return;
        }
        setError('No pudimos cargar el estado de inventario. Intenta nuevamente en unos minutos.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    persistAdjustments(adjustments);
  }, [adjustments]);

  const inventory: InventoryRecord[] = useMemo(() => {
    if (datasets.length === 0) {
      return [];
    }

    const dashboardsByDataset = dashboards.reduce<Record<string, Dashboard[]>>((acc, dashboard) => {
      const ids = Array.isArray((dashboard as any).datasetIds) ? (dashboard as any).datasetIds as string[] : [];
      ids.forEach((datasetId) => {
        acc[datasetId] = acc[datasetId] ?? [];
        acc[datasetId]!.push(dashboard);
      });
      return acc;
    }, {});

    return datasets.map((dataset) => ({
      dataset,
      dashboards: dashboardsByDataset[dataset.id] ?? [],
      adjustment: adjustments[dataset.id] ?? 0,
    }));
  }, [dashboards, datasets, adjustments]);

  const totals = useMemo(() => {
    const baseUnits = inventory.reduce((acc, record) => acc + (record.dataset.rowCount ?? 0), 0);
    const adjustedUnits = inventory.reduce(
      (acc, record) => acc + (record.dataset.rowCount ?? 0) + record.adjustment,
      0,
    );
    const datasetsWithAlerts = inventory.filter((record) => record.dataset.status !== 'processed').length;

    return {
      baseUnits,
      adjustedUnits,
      datasetsWithAlerts,
      dashboardsLinked: dashboards.length,
    };
  }, [dashboards.length, inventory]);

  const handlePendingAmountChange = (datasetId: string, value: number) => {
    setPendingAmounts((prev) => ({
      ...prev,
      [datasetId]: Number.isFinite(value) && value > 0 ? Math.floor(value) : 1,
    }));
  };

  const handleAdjust = (datasetId: string, direction: 'add' | 'subtract') => {
    if (!canAdjust) {
      return;
    }
    const amount = pendingAmounts[datasetId] ?? 1;
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const delta = direction === 'add' ? amount : -amount;
    setAdjustments((prev) => {
      const nextValue = (prev[datasetId] ?? 0) + delta;
      const next = { ...prev, [datasetId]: nextValue };
      if (nextValue === 0) {
        delete next[datasetId];
      }
      return next;
    });
  };

  const handleReset = () => {
    setAdjustments({});
    setPendingAmounts({});
  };

  const statusBadge = (status: Dataset['status']) => {
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
    switch (status) {
      case 'processed':
        return `${base} bg-emerald-100 text-emerald-700`;
      case 'pending':
        return `${base} bg-amber-100 text-amber-700`;
      case 'error':
        return `${base} bg-rose-100 text-rose-700`;
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg bg-slate-900/80 px-4 py-3 text-white shadow-lg">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Cargando inventario inteligente…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-rose-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-rose-700">Hubo un problema</h1>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button
          type="button"
          onClick={() => {
            setAdjustments(loadAdjustments());
            setPendingAmounts({});
            setError(null);
            setLoading(true);
            // force refetch
            setTimeout(() => {
              window.location.reload();
            }, 0);
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-slate-700"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Centro de control</p>
        <h1 className="text-3xl font-semibold text-slate-900">Inventario integrado</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Supervisa existencias en tiempo real combinando tus datasets operativos y dashboards activos. Los administradores pueden ajustar
          niveles directamente desde este panel para mantener la coherencia analítica.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unidades registradas</span>
            <PackageCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.baseUnits.toLocaleString('es-ES')}</p>
          <p className="mt-1 text-xs text-slate-500">Conteo original proveniente de datasets procesados.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inventario ajustado</span>
            <Layers3 className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.adjustedUnits.toLocaleString('es-ES')}</p>
          <p className="mt-1 text-xs text-slate-500">Incluye ajustes manuales aplicados por administradores.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datasets con alerta</span>
            <PieChart className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.datasetsWithAlerts}</p>
          <p className="mt-1 text-xs text-slate-500">Incluye datasets pendientes o con errores que afectan proyecciones.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboards vinculados</span>
            <RefreshCw className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.dashboardsLinked}</p>
          <p className="mt-1 text-xs text-slate-500">Se actualizan automáticamente cuando cambian los datasets asociados.</p>
        </article>
      </section>

      {overview ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Salud operacional</h2>
              <p className="text-xs text-slate-500">Basado en la última actualización del módulo de analytics.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
              Última sincronización: {new Date(overview.lastUpdated).toLocaleString('es-ES')}
            </span>
          </header>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Datasets totales</p>
              <p className="text-2xl font-semibold text-slate-900">{overview.summary.totalDatasets}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Reportes activos</p>
              <p className="text-2xl font-semibold text-slate-900">{overview.summary.activeReports}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Ganancia neta</p>
              <p className="text-2xl font-semibold text-emerald-600">{overview.financial.netProfit.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Crecimiento</p>
              <p className="text-2xl font-semibold text-indigo-600">{overview.summary.growthPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Inventario por dataset</h2>
            <p className="text-xs text-slate-500">Monitorea niveles y dashboards vinculados para cada fuente de datos.</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canAdjust || Object.keys(adjustments).length === 0}
          >
            <RefreshCw className="h-4 w-4" />
            Restablecer ajustes
          </button>
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Dataset</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold">Base</th>
                <th className="px-6 py-3 font-semibold">Ajuste</th>
                <th className="px-6 py-3 font-semibold">Total</th>
                <th className="px-6 py-3 font-semibold">Dashboards vinculados</th>
                <th className="px-6 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No hay datasets registrados todavía. Carga datos para comenzar a gestionar inventario.
                  </td>
                </tr>
              ) : (
                inventory.map((record) => {
                  const { dataset, dashboards: linkedDashboards, adjustment } = record;
                  const baseCount = dataset.rowCount ?? 0;
                  const total = baseCount + adjustment;
                  const pendingValue = pendingAmounts[dataset.id] ?? 1;
                  return (
                    <tr key={dataset.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{dataset.name}</div>
                        <div className="text-xs text-slate-500">Actualizado {new Date(dataset.updatedAt).toLocaleDateString('es-ES')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={statusBadge(dataset.status)}>{dataset.status}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{baseCount.toLocaleString('es-ES')}</td>
                      <td className="px-6 py-4">
                        <span className={adjustment >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                          {adjustment >= 0 ? `+${adjustment.toLocaleString('es-ES')}` : adjustment.toLocaleString('es-ES')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-semibold">{total.toLocaleString('es-ES')}</td>
                      <td className="px-6 py-4">
                        {linkedDashboards.length === 0 ? (
                          <span className="text-xs text-slate-400">Sin dashboards asociados</span>
                        ) : (
                          <ul className="space-y-1 text-xs text-slate-600">
                            {linkedDashboards.slice(0, 3).map((dashboard) => (
                              <li key={dashboard._id} className="truncate">
                                • {dashboard.name}
                              </li>
                            ))}
                            {linkedDashboards.length > 3 ? (
                              <li className="text-slate-400">+{linkedDashboards.length - 3} adicionales</li>
                            ) : null}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {canAdjust ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={pendingValue}
                              onChange={(event) => handlePendingAmountChange(dataset.id, Number(event.target.value))}
                              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAdjust(dataset.id, 'add')}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                              >
                                <Plus className="h-3 w-3" />
                                Añadir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjust(dataset.id, 'subtract')}
                                className="inline-flex items-center gap-1 rounded-md bg-rose-500 px-2 py-1 text-xs font-medium text-white hover:bg-rose-600"
                              >
                                <Minus className="h-3 w-3" />
                                Restar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Solo administradores pueden ajustar inventario</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
