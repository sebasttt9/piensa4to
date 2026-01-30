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
    <div className="issues-page" style={{
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      <header className="issues-header" style={{
        marginBottom: '2rem'
      }}>
        <h1 className="issues-title" style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '0.5rem',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          Reportes y Gastos Logísticos
        </h1>
        <p className="issues-subtitle" style={{
          color: '#e2e8f0',
          marginBottom: '1.5rem'
        }}>
          Análisis de compras, devoluciones y errores operativos
        </p>
        <button
          className="issues-add-button"
          onClick={openCreateForm}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #00d4ff, #45b7d1)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus className="issues-add-button__icon" style={{ width: '20px', height: '20px' }} />
          Nuevo Reporte
        </button>
      </header>

      <div className="issues-content" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <div className="issues-stats" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
        <div className="issues-stat" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155',
          transition: 'all 0.3s ease',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            color: '#cbd5e1',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>Total Reportes</h3>
          <p style={{
            fontSize: '2.25rem',
            fontWeight: '800',
            color: '#ffffff',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>{issues.length}</p>
        </div>
        <div className="issues-stat" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155',
          transition: 'all 0.3s ease',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            color: '#cbd5e1',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>Pendientes</h3>
          <p style={{
            fontSize: '2.25rem',
            fontWeight: '800',
            color: '#ffffff',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>{issues.filter(i => i.status === 'pendiente').length}</p>
        </div>
        <div className="issues-stat" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155',
          transition: 'all 0.3s ease',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            color: '#cbd5e1',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>Resueltos</h3>
          <p style={{
            fontSize: '2.25rem',
            fontWeight: '800',
            color: '#ffffff',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>{issues.filter(i => i.status === 'resuelto').length}</p>
        </div>
        <div className="issues-stat" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155',
          transition: 'all 0.3s ease',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            color: '#cbd5e1',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>Costo Total</h3>
          <p style={{
            fontSize: '2.25rem',
            fontWeight: '800',
            color: '#ffffff',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>{formatCurrency(issues.reduce((sum, i) => sum + (i.amount || 0), 0))}</p>
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

      <div className="issues-list" style={{
        display: 'grid',
        gap: '1rem'
      }}>
        {issues.length === 0 ? (
          <div className="issues-empty" style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155'
          }}>
            <Package style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              color: '#64748b'
            }} />
            <h3 style={{
              color: '#ffffff',
              marginBottom: '0.5rem'
            }}>No hay reportes registrados</h3>
            <p style={{
              color: '#94a3b8'
            }}>Registra el primer reporte logístico</p>
          </div>
        ) : (
          issues.map((issue) => {
            const typeInfo = ISSUE_TYPES[issue.type];
            const TypeIcon = typeInfo.icon;

            return (
              <div key={issue.id} className="issues-item" style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                border: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    <TypeIcon
                      style={{
                        width: '24px',
                        height: '24px',
                        color: typeInfo.color
                      }}
                    />
                    <span style={{
                      color: '#e2e8f0',
                      fontWeight: '600'
                    }}>{typeInfo.label}</span>
                    <span style={{
                      backgroundColor: STATUS_COLORS[issue.status as keyof typeof STATUS_COLORS],
                      color: '#ffffff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>{issue.status}</span>
                  </div>
                  <p style={{
                    color: '#ffffff',
                    marginBottom: '0.5rem'
                  }}>{issue.description}</p>
                  {issue.amount && (
                    <p style={{
                      color: '#00d4ff',
                      fontWeight: '600'
                    }}>{formatCurrency(issue.amount)}</p>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => openEditForm(issue)}
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3b82f6',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button
                    onClick={() => handleDelete(issue.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

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