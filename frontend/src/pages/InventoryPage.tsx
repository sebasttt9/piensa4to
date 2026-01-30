import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Minus, RefreshCw, PackageCheck, Layers3, Edit, Trash2, X, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { inventoryAPI, inventoryItemsAPI, datasetsAPI, dashboardsAPI, type InventorySummary, type InventoryItem, type CreateInventoryItemInput } from '../lib/services';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import './InventoryPage.css';

export function InventoryPage() {
  const { roleAtLeast, user } = useAuth();
  const { formatAmount, currency } = useCurrency();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAmounts, setPendingAmounts] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Inventory Items state
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'adjustments' | 'items'>('items');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<CreateInventoryItemInput>({
    name: '',
    code: '',
    quantity: 0,
    pvp: 0,
    cost: 0,
    datasetId: undefined,
    dashboardId: undefined,
  });
  const [datasets, setDatasets] = useState<any[]>([]);
  const [dashboards, setDashboards] = useState<any[]>([]);

  const canAdjust = roleAtLeast('admin');
  const canManageItems = roleAtLeast('user');

  const loadItems = useCallback(async () => {
    console.log('loadItems called, canManageItems:', canManageItems, 'role:', roleAtLeast('user'));
    if (!canManageItems) {
      console.log('User cannot manage items, skipping load');
      return;
    }
    setItemsLoading(true);
    setItemsError(null);
    try {
      console.log('Calling inventoryItemsAPI.list()');
      const data = await inventoryItemsAPI.list();
      console.log('Items loaded successfully:', data);
      setItems(data);
    } catch (err) {
      console.log('Error loading items:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar items';
      setItemsError(message);
    } finally {
      setItemsLoading(false);
    }
  }, [canManageItems]);

  const loadDatasets = useCallback(async () => {
    try {
      const response = await datasetsAPI.list(1, 100); // Load more datasets
      setDatasets(response.data || []);
    } catch (err) {
      console.error('Error loading datasets:', err);
      setDatasets([]); // Set empty array on error
    }
  }, []);

  const isValidUUID = (str: string): boolean => {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return typeof str === 'string' && uuidRegex.test(str);
    } catch (error) {
      console.error('Error validating UUID:', error);
      return false;
    }
  };

  const loadDashboards = useCallback(async () => {
    try {
      const response = await dashboardsAPI.list(1, 100); // Load more dashboards
      // Filter to only include dashboards with valid UUIDs and appropriate status
      const validDashboards = (response.data || []).filter(dashboard => {
        const isValidId = dashboard.id && isValidUUID(dashboard.id);
        const isApproved = dashboard.status === 'approved';
        const isOwnDashboard = dashboard.ownerId === user?.id;
        return isValidId && (isApproved || isOwnDashboard);
      });
      setDashboards(validDashboards);
    } catch (err) {
      console.error('Error loading dashboards:', err);
    }
  }, [user?.id]);

  const handleCreateItem = async () => {
    try {
      // Clear previous errors
      setItemsError(null);

      // Validate required fields
      if (!formData.name.trim()) {
        setItemsError('El nombre es obligatorio');
        return;
      }
      if (!formData.code.trim()) {
        setItemsError('El código es obligatorio');
        return;
      }

      // Validate UUIDs if provided
      if (formData.datasetId && !isValidUUID(formData.datasetId)) {
        setItemsError('El ID del dataset no es válido');
        return;
      }
      if (formData.dashboardId && !isValidUUID(formData.dashboardId)) {
        setItemsError('El ID del dashboard no es válido');
        return;
      }

      await inventoryItemsAPI.create(formData);
      setFormData({ name: '', code: '', quantity: 0, pvp: 0, cost: 0, datasetId: undefined, dashboardId: undefined });
      setShowCreateForm(false);
      await loadItems();
    } catch (err) {
      console.error('Error creating item:', err);
      setItemsError(err instanceof Error ? err.message : 'Error al crear item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      // Clear previous errors
      setItemsError(null);

      // Validate required fields
      if (!formData.name.trim()) {
        setItemsError('El nombre es obligatorio');
        return;
      }
      if (!formData.code.trim()) {
        setItemsError('El código es obligatorio');
        return;
      }

      // Validate UUIDs if provided
      if (formData.datasetId && !isValidUUID(formData.datasetId)) {
        setItemsError('El ID del dataset no es válido');
        setEditingItem(null); // Clear editing state on validation error
        setFormData({ name: '', code: '', quantity: 0, pvp: 0, cost: 0, datasetId: undefined, dashboardId: undefined });
        return;
      }
      if (formData.dashboardId && !isValidUUID(formData.dashboardId)) {
        setItemsError('El ID del dashboard no es válido');
        setEditingItem(null); // Clear editing state on validation error
        setFormData({ name: '', code: '', quantity: 0, pvp: 0, cost: 0, datasetId: undefined, dashboardId: undefined });
        return;
      }

      await inventoryItemsAPI.update(editingItem.id, formData);
      setEditingItem(null);
      setFormData({ name: '', code: '', quantity: 0, pvp: 0, cost: 0, datasetId: undefined, dashboardId: undefined });
      await loadItems();
    } catch (err) {
      console.error('Error updating item:', err);
      setItemsError(err instanceof Error ? err.message : 'Error al actualizar item');
      // Don't clear editing state on API errors, let user retry
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este item?')) return;
    try {
      await inventoryItemsAPI.delete(id);
      await loadItems();
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : 'Error al eliminar item');
    }
  };

  const handleApproveItem = async (id: string) => {
    try {
      await inventoryItemsAPI.approve(id, 'approved');
      await loadItems();
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : 'Error al aprobar item');
    }
  };

  const handleRejectItem = async (id: string) => {
    try {
      await inventoryItemsAPI.reject(id, 'rejected');
      await loadItems();
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : 'Error al rechazar item');
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      quantity: item.quantity,
      pvp: item.pvp,
      cost: item.cost,
      datasetId: item.datasetId || undefined,
      dashboardId: item.dashboardId || undefined,
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setFormData({ name: '', code: '', quantity: 0, pvp: 0, cost: 0, datasetId: undefined, dashboardId: undefined });
    setItemsError(null); // Clear any errors when canceling
  };

  const navigateToDashboard = (dashboardId: string) => {
    // Navigate to the dashboard page
    window.location.href = `/saved-dashboards?dashboard=${dashboardId}`;
  };

  const navigateToDataset = (datasetId: string) => {
    // Navigate to the datasets page with the specific dataset
    window.location.href = `/datasets?dataset=${datasetId}`;
  };

  const syncPendingDefaults = useCallback((records: any[]) => {
    const defaults: Record<string, number> = {};
    records.forEach((record) => {
      if (!(record.dataset.id in defaults)) {
        defaults[record.dataset.id] = 1; // Valor por defecto
      }
    });
    setPendingAmounts(defaults);
  }, []);

  useEffect(() => {
    if (activeTab === 'items') {
      loadItems();
      loadDatasets();
      loadDashboards();
    }
  }, [activeTab]); // Remover las dependencias de los callbacks para evitar loops

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
  }, []); // Remover syncPendingDefaults de las dependencias

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



  if (loading) {
    return (
      <div className="inventory-page inventory-page--loading">
        <div className="inventory-state inventory-loading">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Cargando inventario inteligente…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-page inventory-page--error">
        <div className="inventory-state inventory-error">
          <h1 className="inventory-error__title">Hubo un problema</h1>
          <p className="inventory-error__message">{error}</p>
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
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <header className="inventory-header">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Centro de control</p>
        <h1 className="inventory-title">Inventario integrado</h1>
        <p className="inventory-subtitle">
          Supervisa existencias en tiempo real combinando tus datasets operativos y dashboards activos. Los administradores pueden ajustar
          niveles directamente desde este panel para mantener la coherencia analítica.
        </p>
      </header>

      {/* Tabs */}
      <div className="inventory-tabs">
        <nav className="inventory-tabs__nav">
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`inventory-tab ${activeTab === 'adjustments' ? 'inventory-tab--active' : ''}`}
          >
            Ajustes de Datasets
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`inventory-tab ${activeTab === 'items' ? 'inventory-tab--active' : ''}`}
          >
            Gestión de Items
          </button>
        </nav>
      </div>

      {activeTab === 'adjustments' ? (
        <>
          {/* Key Metrics Grid */}
          <div className="inventory-stats">
            <div className="inventory-stat-card" style={{ '--dp-card-accent': '#3b82f6', '--dp-card-accent-soft': 'rgba(59, 130, 246, 0.1)', '--dp-card-accent-dark': '#1d4ed8' } as React.CSSProperties}>
              <div className="inventory-stat-card__header">
                <div>
                  <p className="inventory-stat-card__title">Unidades Registradas</p>
                  <p className="inventory-stat-card__value">{totals.baseUnits.toLocaleString('es-ES')}</p>
                  <p className="inventory-stat-card__meta">Conteo original de datasets</p>
                </div>
                <div className="inventory-stat-card__icon">
                  <PackageCheck className="inventory-stat-card__icon-svg" />
                </div>
              </div>
              <div className="inventory-stat-card__accent-bar" />
            </div>

            <div className="inventory-stat-card" style={{ '--dp-card-accent': '#10b981', '--dp-card-accent-soft': 'rgba(16, 185, 129, 0.1)', '--dp-card-accent-dark': '#059669' } as React.CSSProperties}>
              <div className="inventory-stat-card__header">
                <div>
                  <p className="inventory-stat-card__title">Inventario Ajustado</p>
                  <p className="inventory-stat-card__value">{totals.adjustedUnits.toLocaleString('es-ES')}</p>
                  <p className="inventory-stat-card__meta">Incluye ajustes manuales</p>
                </div>
                <div className="inventory-stat-card__icon">
                  <Layers3 className="inventory-stat-card__icon-svg" />
                </div>
              </div>
              <div className="inventory-stat-card__accent-bar" />
            </div>

            <div className="inventory-stat-card" style={{ '--dp-card-accent': '#f59e0b', '--dp-card-accent-soft': 'rgba(245, 158, 11, 0.1)', '--dp-card-accent-dark': '#d97706' } as React.CSSProperties}>
              <div className="inventory-stat-card__header">
                <div>
                  <p className="inventory-stat-card__title">Datasets con Alerta</p>
                  <p className="inventory-stat-card__value">{totals.datasetsWithAlerts}</p>
                  <p className="inventory-stat-card__meta">Requieren atención inmediata</p>
                </div>
                <div className="inventory-stat-card__icon">
                  <AlertTriangle className="inventory-stat-card__icon-svg" />
                </div>
              </div>
              <div className="inventory-stat-card__accent-bar" />
            </div>

            <div className="inventory-stat-card" style={{ '--dp-card-accent': '#8b5cf6', '--dp-card-accent-soft': 'rgba(139, 92, 246, 0.1)', '--dp-card-accent-dark': '#7c3aed' } as React.CSSProperties}>
              <div className="inventory-stat-card__header">
                <div>
                  <p className="inventory-stat-card__title">Dashboards Vinculados</p>
                  <p className="inventory-stat-card__value">{totals.dashboardsLinked}</p>
                  <p className="inventory-stat-card__meta">Actualización automática</p>
                </div>
                <div className="inventory-stat-card__icon">
                  <TrendingUp className="inventory-stat-card__icon-svg" />
                </div>
              </div>
              <div className="inventory-stat-card__accent-bar" />
            </div>
          </div>

      {overview ? (
        <div className="inventory-analytics">
          <div className="inventory-analytics__content">
            <div className="inventory-analytics__header">
              <div>
                <h3 className="inventory-analytics__title">Salud Operacional</h3>
                <p className="inventory-analytics__subtitle">Métricas financieras y operativas en tiempo real</p>
              </div>
              <div className="inventory-analytics__status">
                <div className="inventory-analytics__status-dot" />
                <span>Actualizado {new Date(overview.lastUpdated).toLocaleString('es-ES')}</span>
              </div>
            </div>

            <div className="inventory-analytics__grid">
              <div className="inventory-analytics__metric">
                <div className="inventory-analytics__metric-icon">
                  <PackageCheck className="inventory-analytics__metric-icon-svg" />
                </div>
                <div>
                  <p className="inventory-analytics__metric-label">Datasets Totales</p>
                  <p className="inventory-analytics__metric-value">{overview.summary.totalDatasets}</p>
                </div>
              </div>

              <div className="inventory-analytics__metric">
                <div className="inventory-analytics__metric-icon">
                  <TrendingUp className="inventory-analytics__metric-icon-svg" />
                </div>
                <div>
                  <p className="inventory-analytics__metric-label">Reportes Activos</p>
                  <p className="inventory-analytics__metric-value">{overview.summary.activeReports}</p>
                </div>
              </div>

              <div className="inventory-analytics__metric">
                <div className="inventory-analytics__metric-icon">
                  <DollarSign className="inventory-analytics__metric-icon-svg" />
                </div>
                <div>
                  <p className="inventory-analytics__metric-label">Ganancia Neta</p>
                  <p className="inventory-analytics__metric-value">{formatAmount(overview.financial.netProfit)}</p>
                </div>
              </div>

              <div className="inventory-analytics__metric">
                <div className="inventory-analytics__metric-icon">
                  <TrendingUp className="inventory-analytics__metric-icon-svg" />
                </div>
                <div>
                  <p className="inventory-analytics__metric-label">Crecimiento</p>
                  <p className="inventory-analytics__metric-value">{overview.summary.growthPercentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="inventory-table-section">
        <div className="inventory-table-section__header">
          <div>
            <h3 className="inventory-table-section__title">Inventario por Dataset</h3>
            <p className="inventory-table-section__subtitle">Monitorea niveles y dashboards vinculados para cada fuente de datos</p>
          </div>
          <div className="inventory-table-section__actions">
            <button
              type="button"
              onClick={handleReset}
              className="inventory-table-section__reset-btn"
              disabled={!canAdjust || actionLoading || !hasAdjustments}
            >
              <RefreshCw className="h-4 w-4" />
              Restablecer Ajustes
            </button>
          </div>
        </div>

        {actionError && (
          <div className="inventory-table-section__error">
            <AlertTriangle className="h-5 w-5" />
            <p>{actionError}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="inventory-table">
            <thead className="inventory-table__header">
              <tr>
                <th className="inventory-table__header">Dataset</th>
                <th className="inventory-table__header">Estado</th>
                <th className="inventory-table__header">Base</th>
                <th className="inventory-table__header">Ajuste</th>
                <th className="inventory-table__header">Total</th>
                <th className="inventory-table__header">Dashboards</th>
                <th className="inventory-table__header">Acciones</th>
              </tr>
            </thead>
            <tbody className="inventory-table__body">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <PackageCheck className="h-12 w-12 text-slate-400" />
                      <div>
                        <p className="text-lg font-medium text-slate-900">No hay datasets registrados</p>
                        <p className="text-sm text-slate-500">Carga datos para comenzar a gestionar inventario</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const { dataset, dashboards: linkedDashboards, adjustment, total } = record;
                  const baseCount = dataset.rowCount ?? 0;
                  const pendingValue = pendingAmounts[dataset.id] ?? 1;
                  return (
                    <tr key={dataset.id} className="inventory-table__body">
                      <td className="inventory-table__body">
                        <div className="inventory-table__dataset-name">{dataset.name}</div>
                        <div className="inventory-table__dataset-meta">
                          Actualizado {new Date(dataset.updatedAt).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="inventory-table__body">
                        <span className={`inventory-table__status-badge ${
                          dataset.status === 'processed' ? 'inventory-table__status-badge--processed' :
                          dataset.status === 'pending' ? 'inventory-table__status-badge--pending' :
                          'inventory-table__status-badge--error'
                        }`}>
                          {dataset.status === 'processed' ? 'Procesado' :
                           dataset.status === 'pending' ? 'Pendiente' :
                           'Error'}
                        </span>
                      </td>
                      <td className="inventory-table__body">
                        <span className="inventory-table__total">{baseCount.toLocaleString('es-ES')}</span>
                      </td>
                      <td className="inventory-table__body">
                        <span className={`inventory-table__adjustment ${
                          adjustment >= 0 ? 'inventory-table__adjustment--positive' : 'inventory-table__adjustment--negative'
                        }`}>
                          {adjustment >= 0 ? `+${adjustment.toLocaleString('es-ES')}` : adjustment.toLocaleString('es-ES')}
                        </span>
                      </td>
                      <td className="inventory-table__body">
                        <span className="inventory-table__total">{total.toLocaleString('es-ES')}</span>
                      </td>
                      <td className="inventory-table__body">
                        {linkedDashboards.length === 0 ? (
                          <span className="text-sm text-slate-400 italic">Sin dashboards asociados</span>
                        ) : (
                          <div className="inventory-table__dashboards">
                            {linkedDashboards.slice(0, 2).map((dashboard) => (
                              <span key={dashboard.id} className="inventory-table__dashboard-tag">
                                {dashboard.name}
                              </span>
                            ))}
                            {linkedDashboards.length > 2 && (
                              <span className="inventory-table__dashboard-tag">
                                +{linkedDashboards.length - 2} más
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="inventory-table__body">
                        {canAdjust ? (
                          <div className="inventory-table__actions">
                            <div className="inventory-table__input-group">
                              <input
                                type="number"
                                min={1}
                                value={pendingValue}
                                onChange={(event) => handlePendingAmountChange(dataset.id, Number(event.target.value))}
                                className="inventory-table__input"
                              />
                              <span className="inventory-table__input-label">unidades</span>
                            </div>
                            <div className="inventory-table__btn-group">
                              <button
                                type="button"
                                onClick={() => handleAdjust(dataset.id, 'add')}
                                className="inventory-table__btn inventory-table__btn--add"
                                disabled={actionLoading}
                              >
                                <Plus className="h-4 w-4" />
                                Añadir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjust(dataset.id, 'subtract')}
                                className="inventory-table__btn inventory-table__btn--subtract"
                                disabled={actionLoading}
                              >
                                <Minus className="h-4 w-4" />
                                Restar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Solo administradores pueden ajustar</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        // Inventory Items Tab
        <div className="inventory-items-section">
          <div className="inventory-items-header">
            <div>
              <h3 className="inventory-items-title">Gestión de Items de Inventario</h3>
              <p className="inventory-items-subtitle">Administra productos, precios y control de calidad</p>
            </div>
            {canManageItems && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inventory-items-create-btn"
              >
                <Plus className="h-5 w-5" />
                Nuevo Item
              </button>
            )}
          </div>

          {itemsError && (
            <div className="inventory-items-error">
              <AlertTriangle className="h-5 w-5" />
              <p>{itemsError}</p>
            </div>
          )}

          {/* Create/Edit Form */}
          {(showCreateForm || editingItem) && (
            <div className="inventory-form-modal">
              <div className="inventory-form-header">
                <h4 className="inventory-form-title">
                  {editingItem ? 'Editar Item' : 'Crear Nuevo Item'}
                </h4>
                <p className="inventory-form-subtitle">
                  {editingItem ? 'Modifica los detalles del item seleccionado' : 'Añade un nuevo producto al inventario'}
                </p>
                {itemsError && (
                  <div className="inventory-form-error">
                    <AlertTriangle className="h-4 w-4" />
                    <p>{itemsError}</p>
                    <button
                      onClick={() => setItemsError(null)}
                      className="inventory-form-error-close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="inventory-form-content">
                <div className="inventory-form-grid">
                  <div className="inventory-form-group">
                    <label className="inventory-form-label">Nombre</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="inventory-form-input"
                    />
                  </div>
                  <div className="inventory-form-group">
                    <label className="inventory-form-label">Código</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="inventory-form-input"
                    />
                  </div>
                  <div className="inventory-form-group">
                    <label className="inventory-form-label">Cantidad</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="inventory-form-input"
                    />
                  </div>
                  <div className="inventory-form-group">
                    <label className="inventory-form-label">PVP ({currency.symbol})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pvp}
                      onChange={(e) => setFormData({ ...formData, pvp: Number(e.target.value) })}
                      className="inventory-form-input"
                    />
                  </div>
                  <div className="inventory-form-group">
                    <label className="inventory-form-label">Coste ({currency.symbol})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      className="inventory-form-input"
                    />
                  </div>
                  <div className="inventory-form-group">
                    <label className="inventory-form-label">Dataset (opcional)</label>
                    <select
                      value={formData.datasetId || ''}
                      onChange={(e) => setFormData({ ...formData, datasetId: e.target.value || undefined })}
                      className="inventory-form-input"
                      disabled={datasets.length === 0}
                    >
                      <option value="">
                        {datasets.length === 0 ? 'Cargando datasets...' : 'Seleccionar dataset...'}
                      </option>
                      {datasets.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="inventory-form-group">
                    <label className="inventory-form-label">Dashboard (opcional)</label>
                    <select
                      value={formData.dashboardId || ''}
                      onChange={(e) => setFormData({ ...formData, dashboardId: e.target.value || undefined })}
                      className="inventory-form-input"
                      disabled={dashboards.length === 0}
                    >
                      <option value="">
                        {dashboards.length === 0 ? 'Cargando dashboards...' : 'Seleccionar dashboard...'}
                      </option>
                      {dashboards.map((dashboard) => (
                        <option key={dashboard.id} value={dashboard.id}>
                          {dashboard.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="inventory-form-actions">
                  <button
                    onClick={editingItem ? cancelEdit : () => setShowCreateForm(false)}
                    className="inventory-form-btn inventory-form-btn--cancel"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingItem ? handleUpdateItem : handleCreateItem}
                    className="inventory-form-btn inventory-form-btn--primary"
                  >
                    {editingItem ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Items List */}
          {itemsLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="inventory-items-table-section">
              <table className="inventory-items-table">
                <thead className="inventory-items-table__header">
                  <tr>
                    <th className="inventory-items-table__header">Nombre</th>
                    <th className="inventory-items-table__header">Código</th>
                    <th className="inventory-items-table__header">Cantidad</th>
                    <th className="inventory-items-table__header">PVP</th>
                    <th className="inventory-items-table__header">Coste</th>
                    <th className="inventory-items-table__header">Dataset</th>
                    <th className="inventory-items-table__header">Dashboard</th>
                    <th className="inventory-items-table__header">Estado</th>
                    <th className="inventory-items-table__header">Acciones</th>
                  </tr>
                </thead>
                <tbody className="inventory-items-table__body">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="inventory-items-table__body">
                        <div className="inventory-items-table__product-cell">
                          <div className="inventory-items-table__product-icon">
                            <PackageCheck className="inventory-items-table__product-icon-svg" />
                          </div>
                          <div>
                            <div className="inventory-items-table__product-name">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="inventory-items-table__body">
                        <span className="inventory-items-table__code">{item.code}</span>
                      </td>
                      <td className="inventory-items-table__body">
                        <div>
                          <div className="inventory-items-table__quantity">{item.quantity}</div>
                          <div className="inventory-items-table__quantity-label">unidades</div>
                        </div>
                      </td>
                      <td className="inventory-items-table__body">
                        <span className="inventory-items-table__price inventory-items-table__price--pvp">
                          {formatAmount(item.pvp, 'USD')}
                        </span>
                      </td>
                      <td className="inventory-items-table__body">
                        <span className="inventory-items-table__price inventory-items-table__price--cost">
                          {formatAmount(item.cost, 'USD')}
                        </span>
                      </td>
                      <td className="inventory-items-table__body">
                        {item.datasetId ? (
                          <button
                            onClick={() => navigateToDataset(item.datasetId!)}
                            className="inventory-items-table__link"
                          >
                            {datasets.find(d => d.id === item.datasetId)?.name || 'Cargando...'}
                          </button>
                        ) : '-'}
                      </td>
                      <td className="inventory-items-table__body">
                        {item.dashboardId ? (
                          <button
                            onClick={() => navigateToDashboard(item.dashboardId!)}
                            className="inventory-items-table__link"
                          >
                            {dashboards.find(d => d.id === item.dashboardId)?.name || 'Cargando...'}
                          </button>
                        ) : '-'}
                      </td>
                      <td className="inventory-items-table__body">
                        <span className={`inventory-items-table__status-badge ${
                          item.status === 'approved' ? 'inventory-items-table__status-badge--approved' :
                          item.status === 'rejected' ? 'inventory-items-table__status-badge--rejected' :
                          'inventory-items-table__status-badge--pending'
                        }`}>
                          {item.status === 'approved' ? 'Aprobado' :
                           item.status === 'rejected' ? 'Rechazado' :
                           'Pendiente'}
                        </span>
                      </td>
                      <td className="inventory-items-table__body">
                        {canManageItems && (
                          <div className="inventory-items-table__actions">
                            <button
                              onClick={() => startEdit(item)}
                              className="inventory-items-table__action-btn inventory-items-table__action-btn--edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="inventory-items-table__action-btn inventory-items-table__action-btn--delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {roleAtLeast('admin') && item.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveItem(item.id)}
                                  className="inventory-items-table__action-btn inventory-items-table__action-btn--approve"
                                  title="Aprobar item"
                                >
                                  <PackageCheck className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectItem(item.id)}
                                  className="inventory-items-table__action-btn inventory-items-table__action-btn--reject"
                                  title="Rechazar item"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && !itemsLoading && (
                <div className="inventory-empty-state">
                  <PackageCheck className="inventory-empty-state__icon" />
                  <h3 className="inventory-empty-state__title">No hay items de inventario</h3>
                  <p className="inventory-empty-state__message">
                    {canManageItems ? 'Crea el primero para comenzar.' : 'No tienes permisos para gestionar items.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
