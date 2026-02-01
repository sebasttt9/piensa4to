import { useCallback, useEffect, useState } from 'react';
import { Building2, RefreshCcw, Plus, Trash2, Edit3, Save, X, Settings, ArrowRight } from 'lucide-react';
import { organizationsAPI, type Organization, type CreateOrganizationInput, type UpdateOrganizationInput } from '../../lib/services';
import { OrganizationManagementPage } from './OrganizationManagementPage';
import './OrganizationsPage.css';
import './OrganizationsModal.css';

type CreateFormState = CreateOrganizationInput & {
  name: string;
  description: string;
  location: string;
  owner: string;
  ciRuc: string;
  businessEmail: string;
};

const formatDate = (value: string) => {
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

export function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [createAlert, setCreateAlert] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedOrgForManagement, setSelectedOrgForManagement] = useState<Organization | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateFormState>({
    name: '',
    description: '',
    location: '',
    owner: '',
    ciRuc: '',
    businessEmail: '',
  });
  const [editForm, setEditForm] = useState<UpdateOrganizationInput>({
    name: '',
    description: '',
    location: '',
    owner: '',
    ciRuc: '',
    businessEmail: '',
  });

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const data = await organizationsAPI.list();
      setOrganizations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos recuperar las organizaciones.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showCreateForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateForm]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Handle modal escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCreateForm) {
        setShowCreateForm(false);
        setCreateStep(0);
        setCreateForm({ name: '', description: '', location: '', owner: '', ciRuc: '', businessEmail: '' });
      }
    };

    if (showCreateForm) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showCreateForm]);

  const requiredStep1Filled = createForm.name.trim() !== '' && createForm.owner.trim() !== '';
  const requiredStep2Filled =
    createForm.location.trim() !== '' && createForm.ciRuc.trim() !== '' && createForm.businessEmail.trim() !== '';

  const goNextStep = () => {
    if (!requiredStep1Filled) {
      setCreateAlert('Completa Nombre y Dueño para continuar.');
      return;
    }
    setFeedback(null);
    setCreateAlert(null);
    setStepDirection('forward');
    setCreateStep(1);
  };

  const resetCreateState = () => {
    setCreateStep(0);
    setCreateAlert(null);
    setCreateForm({ name: '', description: '', location: '', owner: '', ciRuc: '', businessEmail: '' });
  };

  const handleCreate = async () => {
    if (!requiredStep1Filled || !requiredStep2Filled) {
      setCreateAlert('Completa todos los campos obligatorios.');
      return;
    }

    setProcessingId('create');
    setFeedback(null);
    setCreateAlert(null);
    try {
      await organizationsAPI.create(createForm);
      resetCreateState();
      setShowCreateForm(false);
      setFeedback({ type: 'success', message: 'Organización creada exitosamente.' });
      await loadOrganizations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos crear la organización.';
      setFeedback({ type: 'error', message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (organization: Organization) => {
    setEditingId(organization.id);
    setEditForm({
      name: organization.name,
      description: organization.description || '',
      location: organization.location || '',
      owner: organization.owner || '',
      ciRuc: organization.ciRuc || '',
      businessEmail: organization.businessEmail || '',
    });
  };

  const handleUpdate = async () => {
    if (!editForm.name?.trim()) {
      setFeedback({ type: 'error', message: 'El nombre de la organización es obligatorio.' });
      return;
    }

    if (!editingId) return;

    setProcessingId(editingId);
    setFeedback(null);
    try {
      await organizationsAPI.update(editingId, editForm);
      setEditingId(null);
      setEditForm({ name: '', description: '', location: '', owner: '', ciRuc: '', businessEmail: '' });
      setFeedback({ type: 'success', message: 'Organización actualizada exitosamente.' });
      await loadOrganizations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos actualizar la organización.';
      setFeedback({ type: 'error', message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta organización? Esta acción no se puede deshacer.')) {
      return;
    }

    setProcessingId(id);
    setFeedback(null);
    try {
      await organizationsAPI.remove(id);
      setFeedback({ type: 'success', message: 'Organización eliminada exitosamente.' });
      await loadOrganizations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos eliminar la organización.';
      setFeedback({ type: 'error', message });
    } finally {
      setProcessingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '' });
  };

  const getAvailabilityMeta = (slots?: number) => {
    if (typeof slots !== 'number' || Number.isNaN(slots)) {
      return { label: 'Sin información', variant: 'unknown' as const };
    }

    if (slots > 0) {
      return {
        label: `${slots.toLocaleString('es-ES')} ${slots === 1 ? 'usuario disponible' : 'usuarios disponibles'}`,
        variant: 'positive' as const,
      };
    }

    if (slots === 0) {
      return { label: 'Sin cupos disponibles', variant: 'empty' as const };
    }

    return { label: `${slots.toLocaleString('es-ES')} cupos`, variant: 'unknown' as const };
  };

  if (selectedOrgForManagement) {
    return (
      <OrganizationManagementPage
        organization={selectedOrgForManagement}
        onBack={() => setSelectedOrgForManagement(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="organizations-page">
        <div className="organizations-page__loading">
          <RefreshCcw className="organizations-page__loading-icon" />
          <p>Cargando organizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="organizations-page">
      <header className="organizations-header">
        <div className="organizations-header__top">
          <div className="organizations-header__leading">
            <div className="organizations-header__icon">
              <Building2 size={24} />
            </div>
            <div className="organizations-header__titles">
              <span className="organizations-header__eyebrow">Administración central</span>
              <h1 className="organizations-header__title">Gestión de Organizaciones</h1>
            </div>
          </div>
          <div className="organizations-header__actions">
            <button
              type="button"
              className="organizations-header__button organizations-header__button--primary"
              onClick={() => {
                setCreateStep(0);
                setShowCreateForm(true);
              }}
            >
              <Plus size={16} />
              Nueva
            </button>
          </div>
        </div>
        <p className="organizations-header__subtitle">
          Gestiona registros empresariales, actualiza sus datos clave y mantén tu catálogo alineado.
        </p>
      </header>

      {error && (
        <div className="organizations-page__error">
          <p>{error}</p>
        </div>
      )}

      {feedback && (
        <div className={`organizations-page__feedback organizations-page__feedback--${feedback.type}`}>
          <p>{feedback.message}</p>
        </div>
      )}

      {showCreateForm && (
        <div
          className="organizations-page__modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateForm(false);
              resetCreateState();
            }
          }}
        >
          <div className="organizations-page__modal">
            <div className="organizations-page__modal-header">
              <div>
                <h3>Crear Nueva Organización</h3>
                <p className="organizations-page__subtitle">Define los datos clave de la empresa para habilitar accesos y permisos.</p>
              </div>
              <button
                className="organizations-page__cancel-btn organizations-page__cancel-btn--close"
                onClick={() => {
                  setShowCreateForm(false);
                  resetCreateState();
                }}
                aria-label="Cerrar"
              >
                <X className="organizations-page__cancel-icon" />
                Cerrar
              </button>
            </div>
            <div className="organizations-page__modal-body">
              <div className={`organizations-page__modal-body-content organizations-page__modal-body-content--${stepDirection}`} key={createStep}>
              {createAlert && (
                <div className="organizations-page__modal-alert">
                  {createAlert}
                </div>
              )}
              <div className="organizations-page__field-grid">
                <div className="organizations-page__form-group organizations-page__form-group--full">
                  <label htmlFor="create-name">Nombre *</label>
                  <input
                    id="create-name"
                    type="text"
                    value={createForm.name}
                     onChange={(e) => {
                       setCreateAlert(null);
                       setCreateForm(prev => ({ ...prev, name: e.target.value }));
                     }}
                    placeholder="Nombre de la organización"
                    autoFocus
                  />
                  <span className="organizations-page__hint">Será visible para admins y usuarios.</span>
                </div>
                <div className="organizations-page__form-group organizations-page__form-group--full">
                  <label htmlFor="create-owner">Dueño *</label>
                  <input
                    id="create-owner"
                    type="text"
                    value={createForm.owner}
                     onChange={(e) => {
                       setCreateAlert(null);
                       setCreateForm(prev => ({ ...prev, owner: e.target.value }));
                     }}
                    placeholder="Nombre del propietario"
                  />
                </div>
                {createStep === 0 && (
                  <div
                    key="step-0"
                    className={`organizations-page__step-content organizations-page__step-content--${stepDirection}`}
                  >
                    <div className="organizations-page__form-group organizations-page__form-group--full">
                      <label htmlFor="create-description">Descripción (opcional)</label>
                      <textarea
                        id="create-description"
                        value={createForm.description}
                         onChange={(e) => {
                           setCreateAlert(null);
                           setCreateForm(prev => ({ ...prev, description: e.target.value }));
                         }}
                        placeholder="Propósito, líneas de negocio o notas internas"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {createStep === 1 && (
                  <div
                    key="step-1"
                    className={`organizations-page__step-content organizations-page__step-content--grid organizations-page__step-content--${stepDirection}`}
                  >
                    <div className="organizations-page__form-group organizations-page__form-group--full">
                      <label htmlFor="create-location">Ubicación *</label>
                      <input
                        id="create-location"
                        type="text"
                        value={createForm.location}
                        onChange={(e) => {
                           setCreateAlert(null);
                           setCreateForm(prev => ({ ...prev, location: e.target.value }));
                         }}
                        placeholder="Ciudad, País"
                      />
                    </div>
                    <div className="organizations-page__form-group organizations-page__form-group--full">
                      <label htmlFor="create-ciRuc">CI/RUC *</label>
                      <input
                        id="create-ciRuc"
                        type="text"
                        value={createForm.ciRuc}
                        onChange={(e) => {
                           setCreateAlert(null);
                           setCreateForm(prev => ({ ...prev, ciRuc: e.target.value }));
                         }}
                        placeholder="Cédula de identidad o RUC"
                      />
                    </div>
                    <div className="organizations-page__form-group organizations-page__form-group--full">
                      <label htmlFor="create-businessEmail">Email Empresarial *</label>
                      <input
                        id="create-businessEmail"
                        type="email"
                        value={createForm.businessEmail}
                        onChange={(e) => {
                           setCreateAlert(null);
                           setCreateForm(prev => ({ ...prev, businessEmail: e.target.value }));
                         }}
                        placeholder="email@empresa.com"
                      />
                      <span className="organizations-page__hint">Usa un correo corporativo para notificaciones.</span>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
            <div className="organizations-page__modal-footer">
              {createStep === 0 ? (
                <>
                  <button
                    className="organizations-page__cancel-btn"
                    onClick={goNextStep}
                    disabled={processingId === 'create'}
                  >
                    Siguiente
                    <ArrowRight className="organizations-page__cancel-icon" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="organizations-page__cancel-btn"
                    onClick={() => {
                      setStepDirection('backward');
                      setCreateStep(0);
                    }}
                  >
                    <X className="organizations-page__cancel-icon" />
                    Anterior
                  </button>
                  <button
                    className="organizations-page__cancel-btn"
                    onClick={handleCreate}
                    disabled={processingId === 'create'}
                  >
                    {processingId === 'create' ? (
                      <RefreshCcw className="organizations-page__cancel-icon organizations-page__cancel-icon--spinning" />
                    ) : (
                      <Save className="organizations-page__cancel-icon" />
                    )}
                    Crear
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="organizations-table-card">
        <header className="organizations-table-card__header">
          <div>
            <h2 className="organizations-table-card__title">Organizaciones registradas</h2>
            <p className="organizations-table-card__subtitle">Administra accesos corporativos y mantén los datos al día.</p>
          </div>
          <span className="organizations-table-card__badge">
            {organizations.length.toLocaleString('es-ES')} organizaciones
          </span>
        </header>

        <div className="organizations-table-card__content">
          <div className="organizations-table__scroll">
            <table className="organizations-page__table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Creado</th>
                  <th>Actualizado</th>
                  <th>Usuarios disponibles</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => {
                  const availability = getAvailabilityMeta(organization.availableUserSlots);

                  return (
                    <tr key={organization.id}>
                    <td>
                      {editingId === organization.id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="organizations-page__edit-input"
                        />
                      ) : (
                        <span className="organizations-page__name">{organization.name}</span>
                      )}
                    </td>
                    <td>
                      {editingId === organization.id ? (
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="organizations-page__edit-textarea"
                          rows={2}
                        />
                      ) : (
                        <span className="organizations-page__description">
                          {organization.description || 'Sin descripción'}
                        </span>
                      )}
                    </td>
                    <td className="organizations-page__date">
                      {formatDate(organization.createdAt)}
                    </td>
                    <td className="organizations-page__date">
                      {formatDate(organization.updatedAt)}
                    </td>
                    <td>
                      <span
                        className={`organizations-page__availability organizations-page__availability--${availability.variant}`}
                        title={availability.label}
                      >
                        {availability.label}
                      </span>
                    </td>
                    <td>
                      <div className="organizations-page__actions-cell">
                        {editingId === organization.id ? (
                          <>
                            <button
                              className="organizations-page__save-btn"
                              onClick={handleUpdate}
                              disabled={processingId === organization.id}
                            >
                              {processingId === organization.id ? (
                                <RefreshCcw className="organizations-page__save-icon organizations-page__save-icon--spinning" />
                              ) : (
                                <Save className="organizations-page__save-icon" />
                              )}
                            </button>
                            <button
                              className="organizations-page__cancel-edit-btn"
                              onClick={cancelEdit}
                            >
                              <X className="organizations-page__cancel-edit-icon" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="organizations-page__manage-btn"
                              onClick={() => setSelectedOrgForManagement(organization)}
                              title="Gestionar organización"
                            >
                              <Settings className="organizations-page__manage-icon" />
                            </button>
                            <button
                              className="organizations-page__edit-btn"
                              onClick={() => handleEdit(organization)}
                              title="Editar organización"
                            >
                              <Edit3 className="organizations-page__edit-icon" />
                            </button>
                            <button
                              className="organizations-page__delete-btn"
                              onClick={() => handleDelete(organization.id)}
                              disabled={processingId === organization.id}
                              title="Eliminar organización"
                            >
                              {processingId === organization.id ? (
                                <RefreshCcw className="organizations-page__delete-icon organizations-page__delete-icon--spinning" />
                              ) : (
                                <Trash2 className="organizations-page__delete-icon" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {organizations.length === 0 && !loading && (
            <div className="organizations-page__empty">
              <Building2 className="organizations-page__empty-icon" />
              <p>No hay organizaciones registradas.</p>
              <button
                className="organizations-page__create-first-btn"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="organizations-page__create-first-icon" />
                Crear primera organización
              </button>
            </div>
          )}
        </div>
        <footer className="organizations-table-card__footer">
          <button
            type="button"
            className="organizations-icon-button"
            onClick={() => void loadOrganizations()}
            disabled={loading}
            aria-label="Recargar organizaciones"
            title="Recargar organizaciones"
          >
            <RefreshCcw size={20} />
          </button>
        </footer>
      </section>
    </div>
  );
}