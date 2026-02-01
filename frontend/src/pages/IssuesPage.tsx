import { useEffect, useState } from 'react';
import { Edit, Trash2, AlertTriangle, ShoppingCart, RotateCcw, Package, Plus, X } from 'lucide-react';
import { issuesAPI, inventoryItemsAPI, type InventoryItem } from '../lib/services';
import './IssuesPage.css';

interface Issue {
  id: string;
  type: 'compra' | 'devolucion' | 'error_logistico' | 'otro';
  description: string;
  amount?: number;
  status: 'pendiente' | 'resuelto' | 'cancelado';
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  inventoryItem?: {
    id: string;
    name: string;
  };
}

const ISSUE_TYPES = {
  compra: { label: 'Compra', icon: ShoppingCart, color: '#00D4FF' },
  devolucion: { label: 'Devolución', icon: RotateCcw, color: '#FF6B6B' },
  error_logistico: { label: 'Error Logístico', icon: AlertTriangle, color: '#FFEAA7' },
  otro: { label: 'Otro', icon: Package, color: '#4ECDC4' },
};

const STATUS_COLORS = {
  pendiente: '#FFEAA7',
  resuelto: '#4ECDC4',
  cancelado: '#FF6B6B',
};

const STATUS_TEXT_COLORS: Record<Issue['status'], string> = {
  pendiente: '#0f172a',
  resuelto: '#052e1c',
  cancelado: '#ffffff',
};

export function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [formData, setFormData] = useState({
    type: 'compra' as Issue['type'],
    description: '',
    amount: '',
    inventoryItemId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [issuesData, inventoryData] = await Promise.all([
        issuesAPI.list(),
        inventoryItemsAPI.list()
      ]);
      setIssues(issuesData);
      setInventoryItems(inventoryData);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'compra',
      description: '',
      amount: '',
      inventoryItemId: ''
    });
    setEditingIssue(null);
  };

  const openCreateForm = () => {
    console.log('Abriendo modal de nuevo reporte - showForm antes:', showForm);
    resetForm();
    setShowForm(true);
    console.log('Abriendo modal de nuevo reporte - showForm después:', true);
  };

  const openEditForm = (issue: Issue) => {
    setFormData({
      type: issue.type,
      description: issue.description,
      amount: issue.amount?.toString() || '',
      inventoryItemId: issue.inventoryItem?.id || ''
    });
    setEditingIssue(issue);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit ejecutado, formData:', formData);
    if (!formData.description.trim()) {
      alert('La descripción es obligatoria');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        type: formData.type,
        description: formData.description.trim(),
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        inventoryItemId: formData.inventoryItemId || undefined
      };

      if (editingIssue) {
        await issuesAPI.update(editingIssue.id, submitData);
        setIssues(issues.map(issue =>
          issue.id === editingIssue.id
            ? { ...issue, ...submitData, updatedAt: new Date().toISOString() }
            : issue
        ));
      } else {
        const newIssue = await issuesAPI.create(submitData);
        setIssues([newIssue, ...issues]);
      }

      closeForm();
    } catch (err: any) {
      alert('Error al guardar el reporte: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este reporte?')) {
      try {
        await issuesAPI.delete(id);
        setIssues(issues.filter(issue => issue.id !== id));
      } catch (err: any) {
        setError('Error al eliminar el reporte');
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const aggregates = issues.reduce<{
    totalCost: number;
    reportsWithCost: number;
    maxCost: number;
    typeCounts: Record<Issue['type'], number>;
    statusCounts: Record<Issue['status'], number>;
    oldestTimestamp: number;
  }>((acc, issue) => {
    const amount = issue.amount ?? 0;
    acc.totalCost += amount;
    if (amount > 0) {
      acc.reportsWithCost += 1;
      acc.maxCost = Math.max(acc.maxCost, amount);
    }

    acc.typeCounts[issue.type] += 1;
    acc.statusCounts[issue.status] += 1;

    const timestamp = new Date(issue.createdAt).getTime();
    if (!Number.isNaN(timestamp)) {
      acc.oldestTimestamp = Math.min(acc.oldestTimestamp, timestamp);
    }

    return acc;
  }, {
    totalCost: 0,
    reportsWithCost: 0,
    maxCost: 0,
    typeCounts: {
      compra: 0,
      devolucion: 0,
      error_logistico: 0,
      otro: 0,
    },
    statusCounts: {
      pendiente: 0,
      resuelto: 0,
      cancelado: 0,
    },
    oldestTimestamp: Number.POSITIVE_INFINITY,
  });

  const totalCost = aggregates.totalCost;
  const typeCounts = aggregates.typeCounts;
  const statusCounts = aggregates.statusCounts;
  const pendingCount = statusCounts.pendiente;
  const resolvedCount = statusCounts.resuelto;

  const oldestDate = Number.isFinite(aggregates.oldestTimestamp)
    ? new Date(aggregates.oldestTimestamp)
    : null;
  const today = new Date();
  const monthsDiff = oldestDate
    ? Math.max(
        1,
        (today.getFullYear() - oldestDate.getFullYear()) * 12 +
          (today.getMonth() - oldestDate.getMonth()) +
          1,
      )
    : 1;
  const averageMonthly = issues.length > 0 ? Math.round(issues.length / monthsDiff) : 0;
  const averageCost = issues.length > 0 ? aggregates.totalCost / issues.length : 0;
  const reportsWithCostCount = aggregates.reportsWithCost;
  const maxCost = aggregates.maxCost;

  const primaryMetrics = [
    { key: 'total', label: 'Total de reportes', value: issues.length.toLocaleString('es-ES') },
    { key: 'pending', label: 'Pendientes', value: pendingCount.toLocaleString('es-ES') },
    { key: 'resolved', label: 'Resueltos', value: resolvedCount.toLocaleString('es-ES') },
    { key: 'cost', label: 'Costo total', value: formatCurrency(totalCost) },
  ];

  const secondaryMetrics = [
    { key: 'compra', label: 'Compras', value: typeCounts.compra.toLocaleString('es-ES') },
    { key: 'devolucion', label: 'Devoluciones', value: typeCounts.devolucion.toLocaleString('es-ES') },
    { key: 'error', label: 'Errores logísticos', value: typeCounts.error_logistico.toLocaleString('es-ES') },
    { key: 'avg', label: 'Promedio mensual', value: averageMonthly.toLocaleString('es-ES') },
  ];

  const typeBreakdown = Object.entries(ISSUE_TYPES).map(([type, info]) => {
    const typed = type as Issue['type'];
    const count = typeCounts[typed];
    const percentage = issues.length > 0 ? Math.round((count / issues.length) * 100) : 0;
    return {
      key: type,
      info,
      count,
      percentage,
    };
  });

  const statusBreakdown = (['pendiente', 'resuelto', 'cancelado'] as Issue['status'][]).map((status) => {
    const count = statusCounts[status];
    const percentage = issues.length > 0 ? Math.round((count / issues.length) * 100) : 0;
    return {
      status,
      count,
      percentage,
    };
  });

  if (isLoading) {
    return (
      <div className="issues-page issues-page--loading">
        <div className="issues-loading">Cargando reportes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="issues-page issues-page--error">
        <div className="issues-error">
          <p className="issues-error__title">Error</p>
          <p className="issues-error__message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="issues-page">
      <header className="issues-header">
        <div className="issues-header__info">
          <h1 className="issues-title">Reportes y Gastos Logísticos</h1>
          <p className="issues-subtitle">Análisis de compras, devoluciones y errores operativos</p>
        </div>
        <button className="issues-add-button" onClick={openCreateForm}>
          <Plus className="issues-add-button__icon" />
          Nuevo Reporte
        </button>
      </header>

      <section
        className={`issues-dashboard${issues.length > 0 ? '' : ' issues-dashboard--condensed'}`}
      >
        <div className="issues-summary issues-dashboard__summary">
          <div className="issues-metric-grid issues-metric-grid--primary">
            {primaryMetrics.map((metric) => (
              <article key={metric.key} className="issues-metric-card issues-metric-card--primary">
                <span className="issues-metric-label">{metric.label}</span>
                <strong className="issues-metric-value">{metric.value}</strong>
              </article>
            ))}
          </div>
          <div className="issues-metric-grid issues-metric-grid--secondary">
            {secondaryMetrics.map((metric) => (
              <article key={metric.key} className="issues-metric-card">
                <span className="issues-metric-label">{metric.label}</span>
                <strong className="issues-metric-value">{metric.value}</strong>
              </article>
            ))}
          </div>
        </div>

        <article className="issues-report-section issues-report-section--type issues-dashboard__type">
          <h2 className="issues-report-title">Distribución por Tipo de Reporte</h2>
          <div className="issues-type-breakdown">
            {typeBreakdown.map(({ key, info, count, percentage }) => {
              const TypeIcon = info.icon;
              return (
                <div key={key} className="issues-type-item">
                  <div className="issues-type-header">
                    <TypeIcon className="issues-type-icon" style={{ color: info.color }} />
                    <span className="issues-type-label">{info.label}</span>
                  </div>
                  <div className="issues-type-stats">
                    <span className="issues-type-count">{count.toLocaleString('es-ES')}</span>
                    <span className="issues-type-percentage">({percentage}%)</span>
                  </div>
                  <div className="issues-type-bar">
                    <div
                      className="issues-type-bar-fill"
                      style={{ width: `${percentage}%`, backgroundColor: info.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="issues-report-section issues-report-section--status issues-dashboard__status">
          <h2 className="issues-report-title">Estado de Reportes</h2>
          <div className="issues-status-breakdown">
            {statusBreakdown.map(({ status, count, percentage }) => (
              <div key={status} className="issues-status-item">
                <div className="issues-status-header">
                  <span className="issues-status-label">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  <span className="issues-status-count">{count.toLocaleString('es-ES')}</span>
                </div>
                <div className="issues-status-bar">
                  <div
                    className="issues-status-bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: STATUS_COLORS[status],
                    }}
                  />
                </div>
                <span className="issues-status-percentage">{percentage}%</span>
              </div>
            ))}
          </div>
        </article>

        {issues.length > 0 && (
          <article className="issues-report-section issues-report-section--financial issues-dashboard__financial">
            <h2 className="issues-report-title">Resumen Financiero</h2>
            <div className="issues-financial-summary">
              <div className="issues-financial-item">
                <span className="issues-financial-label">Costo promedio</span>
                <span className="issues-financial-value">{formatCurrency(averageCost)}</span>
              </div>
              <div className="issues-financial-item">
                <span className="issues-financial-label">Costo máximo</span>
                <span className="issues-financial-value">{formatCurrency(maxCost)}</span>
              </div>
              <div className="issues-financial-item">
                <span className="issues-financial-label">Reportes con costo</span>
                <span className="issues-financial-value">{reportsWithCostCount.toLocaleString('es-ES')}</span>
              </div>
            </div>
          </article>
        )}
      </section>

      <section className="issues-list">
        {issues.length === 0 ? (
          <div className="issues-empty">
            <Package className="issues-empty__icon" />
            <h3>No hay reportes registrados</h3>
            <p>Registra el primer reporte logístico.</p>
          </div>
        ) : (
          issues.map((issue) => {
            const typeInfo = ISSUE_TYPES[issue.type];
            const TypeIcon = typeInfo.icon;
            const statusColor = STATUS_COLORS[issue.status];
            const statusTextColor = STATUS_TEXT_COLORS[issue.status];

            return (
              <article key={issue.id} className="issues-item">
                <header className="issues-item__header">
                  <div className="issues-item__type">
                    <TypeIcon className="issues-item__type-icon" style={{ color: typeInfo.color }} />
                    <span className="issues-item__type-label">{typeInfo.label}</span>
                  </div>
                  <span
                    className="issues-item__status"
                    style={{ backgroundColor: statusColor, color: statusTextColor }}
                  >
                    {issue.status}
                  </span>
                </header>
                <div className="issues-item__content">
                  <p className="issues-item__description">{issue.description}</p>
                  {issue.amount ? (
                    <p className="issues-item__amount">{formatCurrency(issue.amount)}</p>
                  ) : null}
                  {issue.inventoryItem ? (
                    <p className="issues-item__item">{issue.inventoryItem.name}</p>
                  ) : null}
                </div>
                <footer className="issues-item__footer">
                  <span className="issues-item__date">
                    {new Date(issue.createdAt).toLocaleDateString('es-ES')}
                  </span>
                  <div className="issues-item__actions">
                    <button className="issues-item__action issues-item__action--edit" onClick={() => openEditForm(issue)}>
                      <Edit size={16} />
                    </button>
                    <button className="issues-item__action issues-item__action--delete" onClick={() => handleDelete(issue.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </footer>
              </article>
            );
          })
        )}
      </section>

      {/* Modal del formulario */}
      {showForm && (
          <div
          className="issues-modal-overlay"
          onClick={closeForm}
        >
          <div
            className="issues-modal"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="issues-modal-header"
            >
              <h2
                className="issues-modal-title"
              >
                {editingIssue ? 'Editar Reporte' : 'Nuevo Reporte'}
              </h2>
              <button
                className="issues-modal-close"
                onClick={closeForm}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="issues-form"
            >
              <div className="issues-form-group">
                <label
                  className="issues-form-label"
                >
                  Tipo de Reporte *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="issues-form-select"
                  required
                >
                  {Object.entries(ISSUE_TYPES).map(([value, info]) => (
                    <option key={value} value={value}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="issues-form-group">
                <label
                  className="issues-form-label"
                >
                  Descripción *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="issues-form-textarea"
                  placeholder="Describe el reporte en detalle..."
                  rows={4}
                  required
                />
              </div>

              <div className="issues-form-group">
                <label
                  className="issues-form-label"
                >
                  Costo (opcional)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="issues-form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="issues-form-group">
                <label
                  className="issues-form-label"
                >
                  Item del Inventario (opcional)
                </label>
                <select
                  name="inventoryItemId"
                  value={formData.inventoryItemId}
                  onChange={handleInputChange}
                  className="issues-form-select"
                >
                  <option value="">Seleccionar item...</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Código: {item.code})
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="issues-form-actions"
              >
                <button
                  type="button"
                  onClick={closeForm}
                  className="issues-form-button issues-form-button--cancel"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="issues-form-button issues-form-button--submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : (editingIssue ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}