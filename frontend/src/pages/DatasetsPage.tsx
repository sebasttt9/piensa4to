import { Filter, PlusCircle, Database, Calendar, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockDatasets } from '../data/mockAnalytics';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

export function DatasetsPage() {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Activo':
        return { variant: 'success' as const, icon: CheckCircle };
      case 'Procesando':
        return { variant: 'warning' as const, icon: Clock };
      default:
        return { variant: 'default' as const, icon: Database };
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Datasets Totales', value: mockDatasets.length, icon: Database },
          { label: 'Activos Ahora', value: mockDatasets.filter((dataset) => dataset.status === 'Activo').length, icon: CheckCircle },
          { label: 'Total de Registros', value: `${Math.round(mockDatasets.reduce((sum, dataset) => sum + dataset.rows, 0) / 1000)}k`, icon: Clock },
        ].map((stat, idx) => {
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
            {mockDatasets.map((dataset, index) => {
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
                  <TableCell className="text-white/70">{dataset.rows.toLocaleString()}</TableCell>
                  <TableCell className="text-white/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-70" />
                      {dataset.updatedAt}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant} size="sm" className="flex items-center gap-2 w-fit hover:scale-105 transition-transform duration-300">
                      <StatusIcon className="w-3 h-3 animate-pulse" />
                      {dataset.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/app/datasets/${dataset.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 transition-colors duration-300 font-medium text-sm group/link"
                    >
                      Ver Análisis
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
