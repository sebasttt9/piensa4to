import { useCallback, useEffect, useState } from 'react';
import { Building2, RefreshCcw, Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { organizationsAPI, type Organization, type CreateOrganizationInput, type UpdateOrganizationInput } from '../../lib/services';
import './OrganizationsPage.css';

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
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateOrganizationInput>({
    name: '',
    description: '',
  });
  const [editForm, setEditForm] = useState<UpdateOrganizationInput>({
    name: '',
    description: '',
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

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Handle modal escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCreateForm) {
        setShowCreateForm(false);
        setCreateForm({ name: '', description: '' });
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

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setFeedback({ type: 'error', message: 'El nombre de la organización es obligatorio.' });
      return;
    }

    setProcessingId('create');
    setFeedback(null);
    try {
      await organizationsAPI.create(createForm);
      setCreateForm({ name: '', description: '' });
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
      setEditForm({ name: '', description: '' });
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
      <div className="organizations-page__header">
        <div className="organizations-page__title">
          <Building2 className="organizations-page__title-icon" />
          <h1>Gestión de Organizaciones</h1>
        </div>
        <div className="organizations-page__actions">
          <button
            className="organizations-page__refresh-btn"
            onClick={loadOrganizations}
            disabled={loading}
          >
            <RefreshCcw className="organizations-page__refresh-icon" />
            Actualizar
          </button>
          <button
            className="organizations-page__create-btn"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="organizations-page__create-icon" />
            Nueva Organización
          </button>
        </div>
      </div>

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
              setCreateForm({ name: '', description: '' });
            }
          }}
        >
          <div className="organizations-page__modal">
            <div className="organizations-page__modal-header">
              <h3>Crear Nueva Organización</h3>
              <button
                className="organizations-page__modal-close"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ name: '', description: '' });
                }}
              >
                <X className="organizations-page__modal-close-icon" />
              </button>
            </div>
            <div className="organizations-page__modal-body">
              <div className="organizations-page__form-group">
                <label htmlFor="create-name">Nombre *</label>
                <input
                  id="create-name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre de la organización"
                  autoFocus
                />
              </div>
              <div className="organizations-page__form-group">
                <label htmlFor="create-description">Descripción</label>
                <textarea
                  id="create-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción opcional"
                  rows={4}
                />
              </div>
            </div>
            <div className="organizations-page__modal-footer">
              <button
                className="organizations-page__cancel-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ name: '', description: '' });
                }}
              >
                <X className="organizations-page__cancel-icon" />
                Cancelar
              </button>
              <button
                className="organizations-page__submit-btn"
                onClick={handleCreate}
                disabled={processingId === 'create'}
              >
                {processingId === 'create' ? (
                  <RefreshCcw className="organizations-page__submit-icon organizations-page__submit-icon--spinning" />
                ) : (
                  <Save className="organizations-page__submit-icon" />
                )}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="organizations-page__table-container">
        <table className="organizations-page__table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Creado</th>
              <th>Actualizado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((organization) => (
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
            ))}
          </tbody>
        </table>

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
    </div>
  );
}