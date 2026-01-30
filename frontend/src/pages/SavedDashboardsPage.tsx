import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  Download,
  Edit3,
  FileJson,
  FileText,
  LayoutDashboard,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Send,
  Share2,
  TrendingUp,
  X,
} from 'lucide-react';
import { dashboardsAPI, datasetsAPI, type Dataset, type ShareDashboardInput } from '../lib/services';
import { useAuth } from '../context/AuthContext';
import './SavedDashboardsPage.css';

interface DashboardSummary {
  id: string;
  name: string;
  description?: string;
  datasetName?: string;
  datasetIds: string[];
  chartCount: number;
  updatedAt: string;
  isPublic: boolean;
  status: 'pending' | 'approved' | 'rejected';
  ownerId: string;
}

interface CreateDashboardState {
  name: string;
  description: string;
  datasetIds: string[];
}

type PanelMode = 'create' | 'edit';

interface ShareDialogState {
  open: boolean;
  dashboard: DashboardSummary | null;
  channel: ShareDashboardInput['channel'];
  contact: string;
  message: string;
  makePublic: boolean;
  submitting: boolean;
  success: boolean;
  error: string | null;
}

export function SavedDashboardsPage() {
  const { roleAtLeast } = useAuth();
  const generateTempId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>('create');
  const [activeDashboard, setActiveDashboard] = useState<DashboardSummary | null>(null);
  const [isSavingDashboard, setIsSavingDashboard] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [creationState, setCreationState] = useState<CreateDashboardState>({
    name: '',
    description: '',
    datasetIds: [],
  });
  const [shareDialog, setShareDialog] = useState<ShareDialogState>({
    open: false,
    dashboard: null,
    channel: 'email',
    contact: '',
    message: '',
    makePublic: true,
    submitting: false,
    success: false,
    error: null,
  });
  const [exportMenu, setExportMenu] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const normalizeDashboard = useCallback((raw: unknown): DashboardSummary => {
    const item = raw as Record<string, unknown>;
    const id = String(item.id ?? item._id ?? generateTempId());
    const name = String(item.name ?? 'Sin nombre');
    const description = typeof item.description === 'string' ? item.description : undefined;
    const chartCount = Array.isArray(item.charts) ? item.charts.length : 0;
    const datasetIds = Array.isArray(item.datasetIds)
      ? (item.datasetIds as string[])
      : Array.isArray(item.dataset_ids)
        ? (item.dataset_ids as string[])
        : [];
    const updatedAt = String(item.updatedAt ?? item.updated_at ?? new Date().toISOString());
    const isPublic = Boolean(item.isPublic ?? item.is_public ?? false);
    const status = (item.status as 'pending' | 'approved' | 'rejected') ?? 'pending';
    const ownerId = String(item.ownerId ?? item.owner_id ?? item.userId ?? item.user_id ?? '');

    // Obtener el nombre del primer dataset
    const firstDatasetId = datasetIds.length > 0 ? datasetIds[0] : null;
    const firstDataset = firstDatasetId ? datasets.find(d => d.id === firstDatasetId) : null;
    const firstDatasetName = firstDataset ? firstDataset.name : 'Sin dataset';

    return {
      id,
      name,
      description,
      datasetName: firstDatasetName,
      datasetIds,
      chartCount,
      updatedAt,
      isPublic,
      status,
      ownerId,
    };
  }, [generateTempId, datasets]);

  const loadDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardsAPI.list(1, 30);
      const normalized = (response.data ?? []).map((dashboard) => normalizeDashboard(dashboard));
      setDashboards(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos recuperar tus dashboards guardados.';
      setError(message);
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeDashboard]);

  useEffect(() => {
    void loadDashboards();
  }, [loadDashboards]);

  useEffect(() => {
    if (!isCreateOpen || datasets.length > 0 || loadingDatasets) {
      return;
    }

    const fetchDatasets = async () => {
      setLoadingDatasets(true);
      try {
        const response = await datasetsAPI.list(1, 50);
        setDatasets(response.data ?? []);
      } catch (err) {
        console.warn('No se pudieron cargar los datasets', err);
      } finally {
        setLoadingDatasets(false);
      }
    };

    void fetchDatasets();
  }, [isCreateOpen, datasets.length, loadingDatasets]);

  useEffect(() => {
    if (!exportMenu) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      if (!target.closest('.saved-dashboards-export-menu') && !target.closest('.saved-dashboards-action--export-toggle')) {
        setExportMenu(null);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [exportMenu]);

  const stats = useMemo(() => {
    if (dashboards.length === 0) {
      return [];
    }

    const totalDashboards = dashboards.length;
    const totalCharts = dashboards.reduce((acc, dashboard) => acc + dashboard.chartCount, 0);
    const latestUpdate = dashboards.reduce((latest, dashboard) => {
      const current = new Date(dashboard.updatedAt).getTime();
      return current > latest ? current : latest;
    }, 0);

    return [
      {
        label: 'Dashboards guardados',
        value: totalDashboards.toLocaleString('es-ES'),
        icon: LayoutDashboard,
      },
      {
        label: 'Visualizaciones totales',
        value: totalCharts.toLocaleString('es-ES'),
        icon: TrendingUp,
      },
      {
        label: 'Última actualización',
        value: latestUpdate ? new Date(latestUpdate).toLocaleDateString('es-ES') : '—',
        icon: Calendar,
      },
    ];
  }, [dashboards]);

  const handleOpenCreate = () => {
    setPanelMode('create');
    setActiveDashboard(null);
    setCreationState({ name: '', description: '', datasetIds: [] });
    setIsCreateOpen(true);
    setCreateError(null);
  };

  const handleEditDashboard = (dashboard: DashboardSummary) => {
    setPanelMode('edit');
    setActiveDashboard(dashboard);
    setCreationState({
      name: dashboard.name,
      description: dashboard.description ?? '',
      datasetIds: dashboard.datasetIds,
    });
    setIsCreateOpen(true);
    setCreateError(null);
  };

  const handleApproveDashboard = async (dashboard: DashboardSummary, status: 'approved' | 'rejected') => {
    try {
      await dashboardsAPI.approve(dashboard.id, { status });
      await loadDashboards();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar el dashboard';
      setError(message);
    }
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setCreateError(null);
    setCreationState({ name: '', description: '', datasetIds: [] });
    setPanelMode('create');
    setActiveDashboard(null);
  };

  const handleCreationChange = (field: keyof CreateDashboardState, value: string | string[]) => {
    setCreationState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleDatasetSelection = (datasetId: string) => {
    setCreationState((prev) => {
      const exists = prev.datasetIds.includes(datasetId);
      return {
        ...prev,
        datasetIds: exists
          ? prev.datasetIds.filter((id) => id !== datasetId)
          : [...prev.datasetIds, datasetId],
      };
    });
  };

  const handleSubmitDashboard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!creationState.name.trim()) {
      setCreateError('Asigna un nombre al dashboard.');
      return;
    }

    setCreateError(null);
    setIsSavingDashboard(true);
    try {
      const payload = {
        name: creationState.name.trim(),
        description: creationState.description.trim() ? creationState.description.trim() : undefined,
        datasetIds: creationState.datasetIds,
      };

      if (panelMode === 'create') {
        await dashboardsAPI.create(payload);
      } else if (activeDashboard) {
        await dashboardsAPI.update(activeDashboard.id, payload);
      }

      handleCloseCreate();
      await loadDashboards();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el dashboard.';
      setCreateError(message);
    } finally {
      setIsSavingDashboard(false);
    }
  };

  const handleRetry = () => {
    void loadDashboards();
  };

  const formatDate = (iso: string) => {
    const parsed = Number.isNaN(Date.parse(iso)) ? new Date().toISOString() : iso;
    return new Date(parsed).toLocaleDateString('es-ES');
  };

  const formatText = (text: string | undefined) => {
    if (!text) {
      return '—';
    }
    return text.length > 120 ? `${text.slice(0, 117)}…` : text;
  };

  const handleOpenShareDialog = (dashboard: DashboardSummary) => {
    setShareDialog({
      open: true,
      dashboard,
      channel: 'email',
      contact: '',
      message: '',
      makePublic: !dashboard.isPublic,
      submitting: false,
      success: false,
      error: null,
    });
  };

  const handleCloseShareDialog = () => {
    setShareDialog({
      open: false,
      dashboard: null,
      channel: 'email',
      contact: '',
      message: '',
      makePublic: true,
      submitting: false,
      success: false,
      error: null,
    });
  };

  const handleShareFieldChange = (field: 'contact' | 'message' | 'channel' | 'makePublic', value: string | boolean) => {
    setShareDialog((prev) => ({
      ...prev,
      [field]:
        field === 'makePublic'
          ? Boolean(value)
          : field === 'channel'
            ? (value as ShareDashboardInput['channel'])
            : String(value),
      success: field === 'makePublic' ? prev.success : false,
      error: null,
    }));
  };

  const handleShareSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shareDialog.dashboard) {
      return;
    }

    const trimmedContact = shareDialog.contact.trim();
    if (!trimmedContact) {
      setShareDialog((prev) => ({ ...prev, error: 'Ingresa un correo o número de teléfono válido.' }));
      return;
    }

    setShareDialog((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      await dashboardsAPI.shareWithContact(shareDialog.dashboard.id, {
        channel: shareDialog.channel,
        contact: trimmedContact,
        message: shareDialog.message.trim() ? shareDialog.message.trim() : undefined,
        makePublic: shareDialog.makePublic,
      });
      await loadDashboards();
      setShareDialog((prev) => ({
        ...prev,
        submitting: false,
        success: true,
        contact: '',
        message: '',
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo compartir el dashboard.';
      setShareDialog((prev) => ({ ...prev, submitting: false, error: message }));
    }
  };

  const toggleExportMenu = (dashboardId: string) => {
    setExportError(null);
    setExportMenu((current) => (current === dashboardId ? null : dashboardId));
  };

  const handleExport = async (dashboard: DashboardSummary, format: 'pdf' | 'json') => {
    const loadingKey = `${dashboard.id}-${format}`;
    setExportLoading(loadingKey);
    setExportError(null);
    try {
      const data = await dashboardsAPI.export(dashboard.id, format);
      let blob: Blob;

      if (format === 'pdf') {
        if (data instanceof Blob) {
          blob = data;
        } else if (data instanceof ArrayBuffer) {
          blob = new Blob([data], { type: 'application/pdf' });
        } else {
          blob = new Blob([data], { type: 'application/pdf' });
        }
      } else {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        blob = new Blob([jsonString], { type: 'application/json' });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-${dashboard.id}.${format === 'pdf' ? 'pdf' : 'json'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo exportar el dashboard.';
      setExportError(message);
    } finally {
      setExportLoading(null);
      setExportMenu(null);
    }
  };

  return (
    <div className="saved-dashboards-page">
      <header className="saved-dashboards-header">
        <div className="saved-dashboards-header__info">
          <span className="saved-dashboards-header__icon">
            <LayoutDashboard className="w-6 h-6" />
          </span>
          <div>
            <h1 className="saved-dashboards-header__title">Dashboards guardados</h1>
            <p className="saved-dashboards-header__subtitle">
              Organiza las vistas clave de tu negocio, comparte con tu equipo y exporta reportes bajo demanda.
            </p>
          </div>
        </div>
        <button type="button" className="saved-dashboards-header__cta" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" />
          Nuevo dashboard
        </button>
      </header>

      {stats.length > 0 && (
        <section className="saved-dashboards-metrics">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="saved-dashboards-metric">
                <div className="saved-dashboards-metric__body">
                  <p className="saved-dashboards-metric__label">{stat.label}</p>
                  <p className="saved-dashboards-metric__value">{stat.value}</p>
                </div>
                <span className="saved-dashboards-metric__icon">
                  <Icon className="w-5 h-5" />
                </span>
              </article>
            );
          })}
        </section>
      )}

      {exportError && (
        <div className="saved-dashboards-toast saved-dashboards-toast--error">
          <AlertCircle className="saved-dashboards-toast__icon" />
          <span>{exportError}</span>
          <button type="button" onClick={() => setExportError(null)} className="saved-dashboards-toast__close">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {loading && (
        <div className="saved-dashboards-state saved-dashboards-state--loading">
          <Loader2 className="saved-dashboards-state__icon" />
          <p>Cargando dashboards...</p>
        </div>
      )}

      {!loading && error && (
        <div className="saved-dashboards-state saved-dashboards-state--error">
          <AlertCircle className="saved-dashboards-state__icon" />
          <div>
            <p>No se pudieron recuperar tus dashboards.</p>
            <span>{error}</span>
          </div>
          <button type="button" className="saved-dashboards-retry" onClick={handleRetry}>
            <RefreshCcw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && dashboards.length === 0 && (
        <div className="saved-dashboards-empty">
          <div className="saved-dashboards-empty__icon">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h2 className="saved-dashboards-empty__title">Aún no tienes dashboards guardados</h2>
          <p className="saved-dashboards-empty__subtitle">
            Crea tu primer dashboard combinando datasets y visualizaciones. Podrás compartirlo o exportarlo cuando lo necesites.
          </p>
          <button type="button" className="saved-dashboards-empty__cta" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            Crear dashboard
          </button>
        </div>
      )}

      {!loading && !error && dashboards.length > 0 && (
        <section className="saved-dashboards-grid">
          {dashboards.map((dashboard) => (
            <article key={dashboard.id} className="saved-dashboards-card">
              <header className="saved-dashboards-card__header">
                <div>
                  {dashboard.datasetName && (
                    <span className="saved-dashboards-card__badge">{dashboard.datasetName}</span>
                  )}
                  <h3 className="saved-dashboards-card__title">{dashboard.name}</h3>
                  <p className="saved-dashboards-card__description">{formatText(dashboard.description)}</p>
                </div>
                <span className="saved-dashboards-card__icon">
                  <LayoutDashboard className="w-5 h-5" />
                </span>
              </header>

              <dl className="saved-dashboards-card__meta">
                <div>
                  <dt>Visualizaciones</dt>
                  <dd>{dashboard.chartCount}</dd>
                </div>
                <div>
                  <dt>Actualizado</dt>
                  <dd>{formatDate(dashboard.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Visibilidad</dt>
                  <dd>{dashboard.isPublic ? 'Público' : 'Privado'}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>
                    <span className={`saved-dashboards-status saved-dashboards-status--${dashboard.status}`}>
                      {dashboard.status === 'pending' ? 'Pendiente' :
                       dashboard.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="saved-dashboards-card__actions">
                <button
                  type="button"
                  className="saved-dashboards-action"
                  onClick={() => handleEditDashboard(dashboard)}
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  type="button"
                  className="saved-dashboards-action"
                  onClick={() => handleOpenShareDialog(dashboard)}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
                <div className="saved-dashboards-export">
                  <button
                    type="button"
                    className="saved-dashboards-action saved-dashboards-action--primary saved-dashboards-action--export-toggle"
                    onClick={() => toggleExportMenu(dashboard.id)}
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                  {exportMenu === dashboard.id && (
                    <div className="saved-dashboards-export-menu">
                      <button
                        type="button"
                        className="saved-dashboards-export-option"
                        onClick={() => handleExport(dashboard, 'pdf')}
                        disabled={exportLoading === `${dashboard.id}-pdf`}
                      >
                        {exportLoading === `${dashboard.id}-pdf` ? (
                          <Loader2 className="saved-dashboards-spinner saved-dashboards-spinner--small" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        {exportLoading === `${dashboard.id}-pdf` ? 'Generando...' : 'Exportar PDF'}
                      </button>
                      <button
                        type="button"
                        className="saved-dashboards-export-option"
                        onClick={() => handleExport(dashboard, 'json')}
                        disabled={exportLoading === `${dashboard.id}-json`}
                      >
                        {exportLoading === `${dashboard.id}-json` ? (
                          <Loader2 className="saved-dashboards-spinner saved-dashboards-spinner--small" />
                        ) : (
                          <FileJson className="w-4 h-4" />
                        )}
                        {exportLoading === `${dashboard.id}-json` ? 'Generando...' : 'Exportar JSON'}
                      </button>
                    </div>
                  )}
                </div>
                {roleAtLeast('admin') && dashboard.status === 'pending' && (
                  <div className="saved-dashboards-approval">
                    <button
                      type="button"
                      className="saved-dashboards-action saved-dashboards-action--approve"
                      onClick={() => handleApproveDashboard(dashboard, 'approved')}
                    >
                      <Check className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="saved-dashboards-action saved-dashboards-action--reject"
                      onClick={() => handleApproveDashboard(dashboard, 'rejected')}
                    >
                      <X className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      <div className={shareDialog.open ? 'saved-dashboards-share saved-dashboards-share--open' : 'saved-dashboards-share'}>
        <div className="saved-dashboards-share__overlay" onClick={handleCloseShareDialog} />
        <div className="saved-dashboards-share__dialog" role="dialog" aria-modal="true" aria-labelledby="saved-dashboards-share-title">
          <header className="saved-dashboards-share__header">
            <div>
              <h2 id="saved-dashboards-share-title">Compartir dashboard</h2>
              <p>Envía acceso temporal vía correo electrónico o SMS.</p>
            </div>
            <button type="button" className="saved-dashboards-share__close" onClick={handleCloseShareDialog}>
              <X className="w-4 h-4" />
            </button>
          </header>

          {shareDialog.dashboard && (
            <form className="saved-dashboards-share__form" onSubmit={handleShareSubmit}>
              <div className="saved-dashboards-field">
                <label>Dashboard seleccionado</label>
                <p className="saved-dashboards-share__summary">{shareDialog.dashboard.name}</p>
              </div>

              <div className="saved-dashboards-share__channel">
                <span className="saved-dashboards-share__channel-label">Canal</span>
                <div className="saved-dashboards-share__channel-buttons">
                  <button
                    type="button"
                    className={shareDialog.channel === 'email' ? 'saved-dashboards-share__channel-btn saved-dashboards-share__channel-btn--active' : 'saved-dashboards-share__channel-btn'}
                    onClick={() => handleShareFieldChange('channel', 'email')}
                  >
                    <Mail className="w-4 h-4" />
                    Correo
                  </button>
                  <button
                    type="button"
                    className={shareDialog.channel === 'sms' ? 'saved-dashboards-share__channel-btn saved-dashboards-share__channel-btn--active' : 'saved-dashboards-share__channel-btn'}
                    onClick={() => handleShareFieldChange('channel', 'sms')}
                  >
                    <Phone className="w-4 h-4" />
                    SMS
                  </button>
                </div>
              </div>

              <div className="saved-dashboards-field">
                <label htmlFor="share-contact">{shareDialog.channel === 'email' ? 'Correo electrónico' : 'Número de teléfono'}</label>
                <input
                  id="share-contact"
                  type="text"
                  value={shareDialog.contact}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => handleShareFieldChange('contact', event.target.value)}
                  placeholder={shareDialog.channel === 'email' ? 'persona@empresa.com' : '+34 600 123 456'}
                />
              </div>

              <div className="saved-dashboards-field">
                <label htmlFor="share-message">Mensaje (opcional)</label>
                <textarea
                  id="share-message"
                  rows={3}
                  value={shareDialog.message}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => handleShareFieldChange('message', event.target.value)}
                  placeholder="Comparte instrucciones o contexto adicional para tu invitado"
                />
              </div>

              <label className="saved-dashboards-share__toggle">
                <input
                  type="checkbox"
                  checked={shareDialog.makePublic}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => handleShareFieldChange('makePublic', event.target.checked)}
                />
                <span>Marcar dashboard como público para nuevos invitados</span>
              </label>

              {shareDialog.error && <p className="saved-dashboards-create__error">{shareDialog.error}</p>}

              {shareDialog.success && !shareDialog.error && (
                <div className="saved-dashboards-share__success">
                  <Check className="w-4 h-4" />
                  Invitación registrada correctamente.
                </div>
              )}

              <div className="saved-dashboards-share__actions">
                <button type="button" className="saved-dashboards-secondary" onClick={handleCloseShareDialog}>
                  Cancelar
                </button>
                <button type="submit" className="saved-dashboards-primary" disabled={shareDialog.submitting}>
                  {shareDialog.submitting ? (
                    <>
                      <Loader2 className="saved-dashboards-spinner saved-dashboards-spinner--small" />
                      Enviando
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Compartir acceso
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className={isCreateOpen ? 'saved-dashboards-create saved-dashboards-create--open' : 'saved-dashboards-create'}>
        <div className="saved-dashboards-create__panel">
          <header className="saved-dashboards-create__header">
            <div>
              <h2>{panelMode === 'create' ? 'Nuevo dashboard' : 'Editar dashboard'}</h2>
              <p>
                {panelMode === 'create'
                  ? 'Define un nombre, agrega contexto y vincula datasets para comenzar a diseñar visualizaciones.'
                  : 'Actualiza el nombre, la descripción o los datasets conectados a este dashboard.'}
              </p>
            </div>
            <button type="button" className="saved-dashboards-create__close" onClick={handleCloseCreate}>
              <X className="w-4 h-4" />
            </button>
          </header>

          <form className="saved-dashboards-create__form" onSubmit={handleSubmitDashboard}>
            <div className="saved-dashboards-field">
              <label htmlFor="dashboard-name">Nombre</label>
              <input
                id="dashboard-name"
                type="text"
                value={creationState.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => handleCreationChange('name', event.target.value)}
                placeholder="Ej. Rendimiento comercial LATAM"
              />
            </div>

            <div className="saved-dashboards-field">
              <label htmlFor="dashboard-description">Descripción (opcional)</label>
              <textarea
                id="dashboard-description"
                rows={3}
                value={creationState.description}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => handleCreationChange('description', event.target.value)}
                placeholder="Describe el objetivo principal o métricas clave del dashboard"
              />
            </div>

            <div className="saved-dashboards-field">
              <label>Datasets asociados</label>
              {loadingDatasets && (
                <div className="saved-dashboards-field__state">
                  <Loader2 className="saved-dashboards-spinner saved-dashboards-spinner--small" />
                  <span>Cargando datasets disponibles...</span>
                </div>
              )}

              {!loadingDatasets && datasets.length === 0 && (
                <p className="saved-dashboards-field__empty">No encontramos datasets disponibles. Crea uno desde la sección de datasets.</p>
              )}

              {!loadingDatasets && datasets.length > 0 && (
                <div className="saved-dashboards-dataset-list">
                  {datasets.map((dataset) => {
                    const checked = creationState.datasetIds.includes(dataset.id);
                    return (
                      <label key={dataset.id} className={checked ? 'saved-dashboards-dataset saved-dashboards-dataset--checked' : 'saved-dashboards-dataset'}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDatasetSelection(dataset.id)}
                        />
                        <div>
                          <span className="saved-dashboards-dataset__name">{dataset.name}</span>
                          <span className="saved-dashboards-dataset__meta">{formatDate(dataset.createdAt)}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {createError && <p className="saved-dashboards-create__error">{createError}</p>}

            <div className="saved-dashboards-create__actions">
              <button type="button" className="saved-dashboards-secondary" onClick={handleCloseCreate}>
                Cancelar
              </button>
              <button type="submit" className="saved-dashboards-primary" disabled={isSavingDashboard}>
                {isSavingDashboard ? (
                  <>
                    <Loader2 className="saved-dashboards-spinner saved-dashboards-spinner--small" />
                    Guardando
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {panelMode === 'create' ? 'Crear dashboard' : 'Guardar cambios'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
