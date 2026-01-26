import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Minus, RefreshCw, PackageCheck, Layers3, PieChart } from 'lucide-react';
import { inventoryAPI, type InventorySummary } from '../lib/services';
import { useAuth } from '../context/AuthContext';

export function InventoryPage() {
  const { roleAtLeast } = useAuth();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAmounts, setPendingAmounts] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState(false);

  const canAdjust = roleAtLeast('admin');

  const syncPendingDefaults = useCallback((records: InventorySummary['records']) => {
    setPendingAmounts((prev) => {
      const next = { ...prev };
      let changed = false;

      records.forEach((record) => {
        const current = next[record.dataset.id];
        if (typeof current !== 'number' || !Number.isFinite(current) || current <= 0) {
          next[record.dataset.id] = 1;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await inventoryAPI.getSummary();
        if (!active) {
          return;
        }

        setSummary(response);
        syncPendingDefaults(response.records);
      } catch (err) {
        if (!active) {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : 'No pudimos cargar el estado de inventario. Intenta nuevamente en unos minutos.';
        setError(message);
        setSummary(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      active = false;
    };
  }, [syncPendingDefaults]);

  const records = summary?.records ?? [];
  const overview = summary?.overview ?? null;
  const totals = summary?.totals ?? {
    baseUnits: 0,
    adjustedUnits: 0,
    datasetsWithAlerts: 0,
    dashboardsLinked: 0,
  };

  const hasAdjustments = useMemo(
    () => records.some((record) => record.adjustment !== 0),
    [records],
  );

  const handlePendingAmountChange = (datasetId: string, value: number) => {
    const normalized = Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
    setPendingAmounts((prev) => ({
      ...prev,
      [datasetId]: normalized,
    }));
  };

  const handleAdjust = async (datasetId: string, direction: 'add' | 'subtract') => {
    if (!canAdjust || actionLoading) {
      return;
    }

    const amount = pendingAmounts[datasetId] ?? 1;
    const normalized = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1;

    setPendingAmounts((prev) => ({
      ...prev,
      [datasetId]: normalized,
    }));

    setActionError(null);
    setActionLoading(true);

    try {
      const delta = direction === 'add' ? normalized : -normalized;
      const updated = await inventoryAPI.adjust(datasetId, delta);
      setSummary(updated);
      syncPendingDefaults(updated.records);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar el inventario.';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    if (!canAdjust || actionLoading) {
      return;
    }

    setActionError(null);
    setActionLoading(true);

    try {
      const updated = await inventoryAPI.reset();
      setSummary(updated);
      setPendingAmounts({});
      syncPendingDefaults(updated.records);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo reiniciar los ajustes de inventario.';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status: 'pending' | 'processed' | 'error') => {
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
            setSummary(null);
            setPendingAmounts({});
            setActionError(null);
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
            disabled={!canAdjust || actionLoading || !hasAdjustments}
          >
            <RefreshCw className="h-4 w-4" />
            Restablecer ajustes
          </button>
        </header>

        {actionError ? (
          <div className="mx-6 mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {actionError}
          </div>
        ) : null}

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
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No hay datasets registrados todavía. Carga datos para comenzar a gestionar inventario.
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const { dataset, dashboards: linkedDashboards, adjustment, total } = record;
                  const baseCount = dataset.rowCount ?? 0;
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
                              <li key={dashboard.id} className="truncate">
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
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={actionLoading}
                              >
                                <Plus className="h-3 w-3" />
                                Añadir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjust(dataset.id, 'subtract')}
                                className="inline-flex items-center gap-1 rounded-md bg-rose-500 px-2 py-1 text-xs font-medium text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={actionLoading}
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
