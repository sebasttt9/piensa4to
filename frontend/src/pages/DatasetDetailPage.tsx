import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Share2, TrendingUp, Database, FileText, Clock, AlertTriangle, CheckCircle, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { datasetsAPI, type Dataset } from '../lib/services';
import { useAuth } from '../context/AuthContext';
import './DatasetDetailPage.css';

type PreviewState = {
  columns: string[];
  rows: Array<Record<string, any>>;
  total: number;
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'Sin registrar';
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

const formatBytes = (value?: number) => {
  if (!value || value <= 0) {
    return '—';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('es-ES');
  }
  if (value instanceof Date) {
    return value.toLocaleString('es-ES');
  }
  return String(value);
};

const resolveStatus = (status?: Dataset['status']) => {
  switch (status) {
    case 'processed':
      return { variant: 'success' as const, label: 'Procesado', icon: CheckCircle };
    case 'pending':
      return { variant: 'warning' as const, label: 'Pendiente', icon: Clock };
    case 'error':
      return { variant: 'error' as const, label: 'Error', icon: AlertTriangle };
    default:
      return { variant: 'info' as const, label: 'Sin estado', icon: Clock };
  }
};

export function DatasetDetailPage() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ columns: [], rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { roleAtLeast } = useAuth();
  const canManageDataset = roleAtLeast('admin');

  const loadDataset = useCallback(async () => {
    if (!datasetId) {
      setError('Dataset no encontrado.');
      setDataset(null);
      setPreview({ columns: [], rows: [], total: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [details, previewData] = await Promise.all([
        datasetsAPI.getById(datasetId),
        datasetsAPI.getPreview(datasetId, 25),
      ]);

      setDataset(details);
      setPreview({
        columns: previewData.columns,
        rows: previewData.data,
        total: previewData.total ?? details.rowCount ?? 0,
      });
      setFeedback(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos obtener la información del dataset.';
      setError(message);
      setDataset(null);
      setPreview({ columns: [], rows: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    void loadDataset();
  }, [loadDataset]);

  const handleRename = useCallback(async () => {
    if (!datasetId || !dataset) {
      return;
    }

    const nextName = window.prompt('Nuevo nombre del dataset', dataset.name);
    if (!nextName || nextName.trim() === '' || nextName.trim() === dataset.name) {
      return;
    }

    setActionLoading(true);
    setFeedback(null);

    try {
      await datasetsAPI.update(datasetId, { name: nextName.trim() });
      setFeedback({ type: 'success', message: 'Dataset actualizado correctamente.' });
      await loadDataset();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos actualizar el dataset.';
      setFeedback({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  }, [dataset, datasetId, loadDataset]);

  const handleDelete = useCallback(async () => {
    if (!datasetId || !dataset) {
      return;
    }

    const confirmed = window.confirm(`¿Eliminar el dataset "${dataset.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setFeedback(null);

    try {
      await datasetsAPI.delete(datasetId);
      setFeedback({ type: 'success', message: 'Dataset eliminado.' });
      navigate('/app/datasets');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos eliminar el dataset.';
      setFeedback({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  }, [dataset, datasetId, navigate]);

  const handleExport = useCallback(async () => {
    if (!datasetId) {
      return;
    }

    setExporting(true);
    setFeedback(null);

    try {
      const estimatedTotal = dataset?.rowCount ?? preview.total ?? 100;
      const exportData = await datasetsAPI.getPreview(datasetId, Math.max(estimatedTotal, 100));
      const rows = exportData.data;
      if (!rows || rows.length === 0) {
        throw new Error('No hay datos disponibles para exportar.');
      }

      const headers = exportData.columns.length > 0 ? exportData.columns : Object.keys(rows[0] ?? {});
      const csvRows = [headers.join(',')];

      for (const row of rows) {
        const values = headers.map((header) => {
          const value = row[header];
          if (value === null || value === undefined) {
            return '';
          }
          const stringValue = String(value).replace(/"/g, '""');
          return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
        });
        csvRows.push(values.join(','));
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = dataset?.name ? dataset.name.replace(/[^a-z0-9_-]+/gi, '_').toLowerCase() : 'dataset';
      link.download = `${safeName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({ type: 'success', message: 'Exportación completada exitosamente.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos exportar el dataset.';
      setFeedback({ type: 'error', message });
    } finally {
      setExporting(false);
    }
  }, [dataset?.name, dataset?.rowCount, datasetId, preview.total]);

  const summaryCards = useMemo(() => {
    if (!dataset) {
      return [];
    }

    return [
      {
        label: 'Registros detectados',
        value: dataset.rowCount ? dataset.rowCount.toLocaleString('es-ES') : '—',
        sublabel: dataset.status === 'processed' ? 'Datos listos para análisis' : 'A la espera de procesamiento',
        icon: Database,
      },
      {
        label: 'Columnas identificadas',
        value: dataset.columnCount ? dataset.columnCount.toString() : '—',
        sublabel: dataset.tags.length > 0 ? `${dataset.tags.length} etiquetas asignadas` : 'Sin etiquetas registradas',
        icon: FileText,
      },
      {
        label: 'Última actualización',
        value: formatDateTime(dataset.updatedAt ?? dataset.createdAt),
        sublabel: dataset.filename ? `${dataset.filename} • ${formatBytes(dataset.fileSize)}` : 'Pendiente de cargar archivo',
        icon: Clock,
      },
    ];
  }, [dataset]);

  if (loading) {
    return (
      <div className="dataset-detail-loading">
        Cargando dataset…
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="dataset-detail-error">
        <AlertTriangle className="dataset-detail-error__icon" />
        <p>{error ?? 'No encontramos este dataset.'}</p>
        <Button variant="secondary" onClick={() => void loadDataset()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const statusConfig = resolveStatus(dataset.status);
  const StatusIcon = statusConfig.icon;
  const previewRows = preview.rows.slice(0, 10);

  return (
    <div className="dataset-detail-page">
      {feedback && (
        <div
          className={`dataset-detail-feedback dataset-detail-feedback--${feedback.type}`}
        >
          {feedback.message}
        </div>
      )}
      {/* Header */}
      <div className="dataset-detail-header">
        <div className="dataset-detail-header__content">
          <div className="dataset-detail-header__icon">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div className="dataset-detail-header__info">
            <Badge variant={statusConfig.variant} size="sm" className="dataset-detail-header__status">
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </Badge>
            <h1 className="dataset-detail-header__title">
              {dataset.name}
            </h1>
            <p className="dataset-detail-header__subtitle">
              {(dataset.rowCount ?? 0).toLocaleString('es-ES')} filas • Actualizado {formatDateTime(dataset.updatedAt ?? dataset.createdAt)}
            </p>
            {dataset.tags.length > 0 && (
              <div className="dataset-detail-header__tags">
                {dataset.tags.map((tag) => (
                  <Badge key={tag} variant="info" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="dataset-detail-header__actions">
          <Button
            variant="custom"
            className="button--transparent"
            onClick={() => void handleExport()}
            disabled={exporting || actionLoading}
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exportando…' : 'Exportar datos'}
          </Button>
          <Button
            variant="custom"
            className="button--transparent"
            onClick={() => { setFeedback({ type: 'success', message: 'En breve podrás compartir datasets con tu equipo.' }); }}
            disabled={actionLoading}
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </Button>
          {canManageDataset && (
            <>
              <Button
                variant="custom"
                className="button--transparent"
                onClick={() => void handleRename()}
                disabled={actionLoading}
              >
                <Edit2 className="w-4 h-4" />
                Renombrar
              </Button>
              <Button
                variant="danger"
                onClick={() => void handleDelete()}
                disabled={actionLoading}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dataset-detail-stats">
        <div className="dataset-detail-stats__grid">
          {summaryCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="dataset-detail-stats__card"
                style={{
                  animation: `slideIn 0.5s ease-out ${idx * 0.1}s backwards`,
                }}
              >
                <div className="dataset-detail-stats__card-icon">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="dataset-detail-stats__card-content">
                  <p className="dataset-detail-stats__card-label">{stat.label}</p>
                  <p className="dataset-detail-stats__card-value">{stat.value}</p>
                  <p className="dataset-detail-stats__card-sublabel">{stat.sublabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Section */}
      <div className="dataset-detail-preview">
        <div className="dataset-detail-preview__header">
          <div className="dataset-detail-preview__info">
            <h2 className="dataset-detail-preview__title">Vista previa de datos</h2>
            <p className="dataset-detail-preview__subtitle">
              Mostrando {previewRows.length} de {preview.total.toLocaleString('es-ES')} registros
            </p>
          </div>
          <Button size="sm" className="button--transparent" onClick={() => void loadDataset()}>
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>

        <div className="dataset-detail-preview__table-container">
          {preview.columns.length === 0 ? (
            <div className="dataset-detail-preview__empty">
              Aún no hay vista previa disponible para este dataset.
            </div>
          ) : (
            <table className="dataset-detail-preview__table">
              <thead className="dataset-detail-preview__table-header">
                <tr>
                  {preview.columns.map((column) => (
                    <th key={column} className="dataset-detail-preview__table-header-cell">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="dataset-detail-preview__table-body">
                {previewRows.map((row, rowIndex) => (
                  <tr key={`preview-${rowIndex}`} className="dataset-detail-preview__table-row">
                    {preview.columns.map((column) => (
                      <td key={`${column}-${rowIndex}`} className="dataset-detail-preview__table-cell">
                        {formatCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Action Section */}
      <div className="dataset-detail-actions">
        <div className="dataset-detail-actions__content">
          <div className="dataset-detail-actions__info">
            <h3 className="dataset-detail-actions__title">¿Listo para análisis profundo?</h3>
            <p className="dataset-detail-actions__subtitle">
              Cuando el procesamiento esté completo podrás generar reportes automáticos y dashboards inteligentes.
            </p>
          </div>
          <Button className="dataset-detail-actions__button" onClick={() => navigate('/app/insights')}>
            <TrendingUp className="w-4 h-4" />
            Explorar análisis
          </Button>
        </div>
      </div>
    </div>
  );
}
