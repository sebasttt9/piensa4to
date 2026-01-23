import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, TrendingUp, Database, FileText, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { datasetsAPI, type Dataset } from '../lib/services';

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
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ columns: [], rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex min-h-[60vh] items-center justify-center text-white/70">
        Cargando dataset…
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center text-white/70">
          <AlertTriangle className="w-8 h-8 mx-auto text-red-400" />
          <p>{error ?? 'No encontramos este dataset.'}</p>
          <Button variant="secondary" onClick={() => void loadDataset()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = resolveStatus(dataset.status);
  const StatusIcon = statusConfig.icon;
  const previewRows = preview.rows.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between animate-slideIn">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex-shrink-0 hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)] transition-all duration-300 transform hover:scale-110">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <Badge variant={statusConfig.variant} size="sm" className="mb-2 flex items-center gap-2">
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </Badge>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              {dataset.name}
            </h1>
            <p className="text-white/50 mt-2 hover:text-white/70 transition-all">
              {(dataset.rowCount ?? 0).toLocaleString('es-ES')} filas • Actualizado {formatDateTime(dataset.updatedAt ?? dataset.createdAt)}
            </p>
            {dataset.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {dataset.tags.map((tag) => (
                  <Badge key={tag} variant="info" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap animate-slideInRight">
          <Button variant="secondary" className="flex items-center gap-2 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)]" onClick={() => {}}>
            <Download className="w-4 h-4" />
            Exportar datos
          </Button>
          <Button className="flex items-center gap-2 hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)]" onClick={() => {}}>
            <Share2 className="w-4 h-4" />
            Compartir
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              variant="elevated"
              className="group overflow-hidden hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transform hover:translate-y-[-4px] transition-all duration-300"
              style={{
                animation: `slideIn 0.5s ease-out ${idx * 0.1}s backwards`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <CardContent className="pt-0 relative z-10">
                <p className="text-white/50 text-sm group-hover:text-white/70 transition-all">{stat.label}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-3xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">
                    {stat.value}
                  </p>
                  <Icon className="w-5 h-5 text-white/80" />
                </div>
                <p className="text-white/40 text-xs mt-2 group-hover:text-white/60 transition-all">{stat.sublabel}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Section */}
      <Card variant="elevated" className="group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <CardContent className="pt-0 space-y-6 relative z-10">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">
                Vista previa de datos
              </h2>
              <p className="text-white/50 text-sm mt-1 group-hover:text-white/70 transition-all">
                Mostrando {previewRows.length} de {preview.total.toLocaleString('es-ES')} registros
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => void loadDataset()}>
              Actualizar
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            {preview.columns.length === 0 ? (
              <div className="py-10 text-center text-white/70">
                Aún no hay vista previa disponible para este dataset.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5 border-b border-white/10">
                  <TableRow>
                    {preview.columns.map((column) => (
                      <TableHead key={column} className="text-white/70 font-semibold">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, rowIndex) => (
                    <TableRow key={`preview-${rowIndex}`} className="border-b border-white/5">
                      {preview.columns.map((column) => (
                        <TableCell key={`${column}-${rowIndex}`} className="text-white/70">
                          {formatCellValue(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Section */}
      <Card
        variant="elevated"
        className="group overflow-hidden bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/40 hover:border-purple-400/50 hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <CardContent className="pt-0 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">
                ¿Listo para análisis profundo?
              </h3>
              <p className="text-white/50 text-sm mt-1 group-hover:text-white/70 transition-all">
                Cuando el procesamiento esté completo podrás generar reportes automáticos y dashboards inteligentes.
              </p>
            </div>
            <Button className="flex items-center gap-2 hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)]" onClick={() => {}}>
              <TrendingUp className="w-4 h-4" />
              Explorar análisis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
