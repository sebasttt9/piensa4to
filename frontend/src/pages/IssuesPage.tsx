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
    console.log('Abriendo modal de nuevo reporte');
    resetForm();
    setShowForm(true);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

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
        <h1 className="issues-title">Reportes y Gastos Logísticos</h1>
        <p className="issues-subtitle">Análisis de compras, devoluciones y errores operativos</p>
        <button
          className="issues-add-button"
          onClick={openCreateForm}
        >
          <Plus className="issues-add-button__icon" />
          Nuevo Reporte
        </button>
      </header>

      <div className="issues-content">
        <div className="issues-stats">
        <div className="issues-stat">
          <h3>Total Reportes</h3>
          <p>{issues.length}</p>
        </div>
        <div className="issues-stat">
          <h3>Pendientes</h3>
          <p>{issues.filter(i => i.status === 'pendiente').length}</p>
        </div>
        <div className="issues-stat">
          <h3>Resueltos</h3>
          <p>{issues.filter(i => i.status === 'resuelto').length}</p>
        </div>
        <div className="issues-stat">
          <h3>Costo Total</h3>
          <p>{formatCurrency(issues.reduce((sum, i) => sum + (i.amount || 0), 0))}</p>
        </div>
        <div className="issues-stat">
          <h3>Compras</h3>
          <p>{issues.filter(i => i.type === 'compra').length}</p>
        </div>
        <div className="issues-stat">
          <h3>Devoluciones</h3>
          <p>{issues.filter(i => i.type === 'devolucion').length}</p>
        </div>
        <div className="issues-stat">
          <h3>Errores Logísticos</h3>
          <p>{issues.filter(i => i.type === 'error_logistico').length}</p>
        </div>
        <div className="issues-stat">
          <h3>Promedio por Mes</h3>
          <p>{issues.length > 0 ? (() => {
            const oldestDate = new Date(Math.min(...issues.map(i => new Date(i.createdAt).getTime())));
            const today = new Date();
            const monthsDiff = Math.max(1, (today.getFullYear() - oldestDate.getFullYear()) * 12 + (today.getMonth() - oldestDate.getMonth()) + 1);
            return Math.round(issues.length / monthsDiff);
          })() : 0}</p>
        </div>
        </div>

        <div className="issues-reports">
        <div className="issues-report-section">
          <h2 className="issues-report-title">Distribución por Tipo de Reporte</h2>
          <div className="issues-type-breakdown">
            {Object.entries(ISSUE_TYPES).map(([type, info]) => {
              const count = issues.filter(i => i.type === type).length;
              const percentage = issues.length > 0 ? Math.round((count / issues.length) * 100) : 0;
              const TypeIcon = info.icon;

              return (
                <div key={type} className="issues-type-item">
                  <div className="issues-type-header">
                    <TypeIcon
                      className="issues-type-icon"
                      style={{ color: info.color }}
                    />
                    <span className="issues-type-label">{info.label}</span>
                  </div>
                  <div className="issues-type-stats">
                    <span className="issues-type-count">{count}</span>
                    <span className="issues-type-percentage">({percentage}%)</span>
                  </div>
                  <div className="issues-type-bar">
                    <div
                      className="issues-type-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: info.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="issues-report-section">
          <h2 className="issues-report-title">Estado de Reportes</h2>
          <div className="issues-status-breakdown">
            {['pendiente', 'resuelto', 'cancelado'].map(status => {
              const count = issues.filter(i => i.status === status).length;
              const percentage = issues.length > 0 ? Math.round((count / issues.length) * 100) : 0;

              return (
                <div key={status} className="issues-status-item">
                  <div className="issues-status-header">
                    <span className="issues-status-label">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    <span className="issues-status-count">{count}</span>
                  </div>
                  <div className="issues-status-bar">
                    <div
                      className="issues-status-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS]
                      }}
                    />
                  </div>
                  <span className="issues-status-percentage">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {issues.length > 0 && (
          <div className="issues-report-section">
            <h2 className="issues-report-title">Resumen Financiero</h2>
            <div className="issues-financial-summary">
              <div className="issues-financial-item">
                <span className="issues-financial-label">Costo Promedio:</span>
                <span className="issues-financial-value">
                  {formatCurrency(issues.reduce((sum, i) => sum + (i.amount || 0), 0) / issues.length)}
                </span>
              </div>
              <div className="issues-financial-item">
                <span className="issues-financial-label">Costo Máximo:</span>
                <span className="issues-financial-value">
                  {formatCurrency(Math.max(...issues.map(i => i.amount || 0)))}
                </span>
              </div>
              <div className="issues-financial-item">
                <span className="issues-financial-label">Reportes con Costo:</span>
                <span className="issues-financial-value">
                  {issues.filter(i => i.amount && i.amount > 0).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      <div className="issues-list">
        {issues.length === 0 ? (
          <div className="issues-empty">
            <Package className="issues-empty__icon" />
            <h3>No hay reportes registrados</h3>
            <p>Registra el primer reporte logístico</p>
          </div>
        ) : (
          issues.map((issue) => {
            const typeInfo = ISSUE_TYPES[issue.type];
            const TypeIcon = typeInfo.icon;

            return (
              <div key={issue.id} className="issues-item">
                <div className="issues-item__header">
                  <div className="issues-item__type">
                    <TypeIcon
                      className="issues-item__type-icon"
                      style={{ color: typeInfo.color }}
                    />
                    <span className="issues-item__type-label">{typeInfo.label}</span>
                  </div>
                  <div
                    className="issues-item__status"
                    style={{ backgroundColor: STATUS_COLORS[issue.status] }}
                  >
                    {issue.status}
                  </div>
                </div>

                <div className="issues-item__content">
                  <p className="issues-item__description">{issue.description}</p>
                  {issue.amount && (
                    <p className="issues-item__amount">{formatCurrency(issue.amount)}</p>
                  )}
                  {issue.inventoryItem && (
                    <p className="issues-item__item">Item: {issue.inventoryItem.name}</p>
                  )}
                </div>

                <div className="issues-item__footer">
                  <span className="issues-item__date">{formatDate(issue.createdAt)}</span>
                  <div className="issues-item__actions">
                    <button
                      className="issues-item__action issues-item__action--edit"
                      onClick={() => openEditForm(issue)}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="issues-item__action issues-item__action--delete"
                      onClick={() => handleDelete(issue.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal del formulario */}
      {showForm && (
        <div className="issues-modal-overlay" onClick={closeForm}>
          <div className="issues-modal" onClick={e => e.stopPropagation()}>
            <div className="issues-modal-header">
              <h2 className="issues-modal-title">
                {editingIssue ? 'Editar Reporte' : 'Nuevo Reporte'}
              </h2>
              <button
                className="issues-modal-close"
                onClick={closeForm}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="issues-form">
              <div className="issues-form-group">
                <label className="issues-form-label">Tipo de Reporte *</label>
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
                <label className="issues-form-label">Descripción *</label>
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
                <label className="issues-form-label">Costo (opcional)</label>
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
                <label className="issues-form-label">Item del Inventario (opcional)</label>
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

              <div className="issues-form-actions">
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

      {/* Aquí iría el formulario modal para crear/editar, pero por simplicidad lo omito por ahora */}
    </div>
  );
}