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
            <div className="p-3 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg hover:from-purple-500/50 hover:to-blue-500/50 transition-all duration-300">
              <Database className="w-6 h-6 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">Datasets</h1>
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
          { label: 'Datasets Totales', value: mockDatasets.length, icon: Database, color: 'from-purple-500 to-blue-500' },
          { label: 'Activos Ahora', value: mockDatasets.filter(d => d.status === 'Activo').length, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
          { label: 'Total de Registros', value: (mockDatasets.reduce((sum, d) => sum + d.rows, 0) / 1000).toFixed(0) + 'k', icon: Clock, color: 'from-yellow-500 to-amber-500' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={idx}
              variant="elevated" 
              className="group overflow-hidden hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transform hover:translate-y-[-4px] transition-all duration-300"
              style={{
                animation: `slideIn 0.5s ease-out ${idx * 0.1}s backwards`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <CardContent className="pt-0 relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/50 text-sm font-medium mb-1 group-hover:text-white/70 transition-all duration-300">{stat.label}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-white to-white bg-clip-text text-transparent">{stat.value}</p>
                  </div>
                  <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg p-1 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white opacity-80" />
                  </div>
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
      <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 shadow-lg shadow-purple-900/10">
        <Table>
          <TableHeader className="bg-gradient-to-r from-white/5 to-white/2 border-b border-white/10">
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
                  className="border-b border-white/5 hover:bg-gradient-to-r hover:from-white/5 hover:to-white/2 transition-all duration-300 group/row hover:shadow-lg hover:shadow-purple-900/10 animate-fadeIn"
                  style={{
                    animation: `fadeIn 0.4s ease-out ${index * 0.05}s backwards`
                  }}
                >
                  <TableCell className="font-medium text-white flex items-center gap-3 group-hover/row:text-transparent group-hover/row:bg-gradient-to-r group-hover/row:from-purple-300 group-hover/row:to-blue-300 group-hover/row:bg-clip-text transition-all duration-300">
                    <div className="p-1 rounded bg-gradient-to-br from-purple-500/20 to-blue-500/20 group-hover/row:from-purple-500/40 group-hover/row:to-blue-500/40 transition-all">
                      <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    </div>
                    {dataset.name}
                  </TableCell>
                  <TableCell className="text-white/70 group-hover/row:text-white transition-all">{dataset.rows.toLocaleString()}</TableCell>
                  <TableCell className="text-white/50 group-hover/row:text-white/70 transition-all">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-50" />
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/40 hover:to-blue-500/40 text-white hover:text-white border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 font-medium text-sm group/link transform hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(167,139,250,0.2)]"
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
