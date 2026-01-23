import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, PlusCircle, Database, Calendar, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { datasetsAPI, type Dataset } from '../lib/services';

export function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await datasetsAPI.list();
      setDatasets(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos recuperar los datasets.';
      setError(message);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDatasets();
  }, [loadDatasets]);

  const stats = useMemo(() => {
    const totalDatasets = datasets.length;
    const processed = datasets.filter((dataset) => dataset.status === 'processed').length;
    const pending = datasets.filter((dataset) => dataset.status === 'pending').length;
    const totalRows = datasets.reduce((acc, dataset) => acc + (dataset.rowCount ?? 0), 0);

    return [
      { label: 'Datasets Totales', value: totalDatasets.toString(), icon: Database },
      { label: 'Procesados', value: processed.toString(), icon: CheckCircle },
      { label: 'Filas Registradas', value: totalRows.toLocaleString('es-ES'), icon: Clock },
      { label: 'Pendientes', value: pending.toString(), icon: AlertTriangle },
    ];
  }, [datasets]);

  const formatDate = (value?: string) => {
    if (!value) {
      return 'Sin actualizar';
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

  const getStatusConfig = (status: Dataset['status']) => {
    switch (status) {
      case 'processed':
        return { variant: 'success' as const, icon: CheckCircle, label: 'Procesado' };
      case 'pending':
        return { variant: 'warning' as const, icon: Clock, label: 'Pendiente' };
      case 'error':
      default:
        return { variant: 'error' as const, icon: AlertTriangle, label: 'Error' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header con acciones */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-slideIn">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-white/10">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Datasets</h1>
          </div>
          <p className="text-white/50 hover:text-white/70 transition-all duration-300">Administra tus fuentes de datos y visualiza análisis automáticos</p>
        </div>
        <Link to="/app/upload">
          <Button size="lg" className="flex items-center gap-2 animate-slideInRight">
            <PlusCircle className="w-5 h-5" />
            Cargar Nuevo Dataset
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              style={{ animation: `slideIn 0.5s ease-out ${idx * 0.1}s backwards` }}
            >
              <CardContent className="pt-0 flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className="w-8 h-8 rounded-lg p-1 flex items-center justify-center bg-white/10">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center animate-slideInRight">
        <Button variant="secondary" size="md" className="flex items-center gap-2 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)]">
          <Filter className="w-4 h-4" />
          Filtros Avanzados
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="info" size="sm" className="hover:scale-105 transition-transform duration-300">Últimos 7 días</Badge>
          <Badge variant="default" size="sm" className="hover:scale-105 transition-transform duration-300">CSV</Badge>
          <Badge variant="default" size="sm" className="hover:scale-105 transition-transform duration-300">Excel</Badge>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <Table>
          <TableHeader className="border-b border-white/10 bg-white/5">
            <TableRow>
              <TableHead className="text-white/70 font-semibold">Nombre Dataset</TableHead>
              <TableHead className="text-white/70 font-semibold">Registros</TableHead>
              <TableHead className="text-white/70 font-semibold">Última Actualización</TableHead>
              <TableHead className="text-white/70 font-semibold">Estado</TableHead>
              <TableHead className="text-right text-white/70 font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-white/70">
                  Cargando datasets…
                </TableCell>
              </TableRow>
            )}

            {error && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8">
                  <div className="flex flex-col items-center justify-center gap-3 text-white/70">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <p>{error}</p>
                    <Button size="sm" variant="secondary" onClick={() => void loadDatasets()}>
                      Reintentar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && datasets.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-white/70">
                  Aún no has creado datasets. Importa tu primer archivo para comenzar.
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && datasets.map((dataset, index) => {
              const statusConfig = getStatusConfig(dataset.status);
              const StatusIcon = statusConfig.icon;
              return (
                <TableRow
                  key={dataset.id}
                  className="border-b border-white/5 hover:bg-white/10 transition-colors duration-300 group/row animate-fadeIn"
                  style={{
                    animation: `fadeIn 0.4s ease-out ${index * 0.05}s backwards`
                  }}
                >
                  <TableCell className="font-medium text-white flex items-center gap-3 transition-colors duration-300 group-hover/row:text-white">
                    <div className="p-1 rounded bg-white/10">
                      <Database className="w-4 h-4 text-white flex-shrink-0" />
                    </div>
                    {dataset.name}
                  </TableCell>
                  <TableCell className="text-white/70">{(dataset.rowCount ?? 0).toLocaleString('es-ES')}</TableCell>
                  <TableCell className="text-white/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-70" />
                      {formatDate(dataset.updatedAt ?? dataset.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant} size="sm" className="flex items-center gap-2 w-fit hover:scale-105 transition-transform duration-300">
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/app/datasets/${dataset.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 transition-colors duration-300 font-medium text-sm group/link"
                    >
                      Ver detalle
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
