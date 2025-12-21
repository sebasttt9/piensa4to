import { Download, Edit3, Share2, LayoutDashboard, PlusCircle, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const dashboards = [
  {
    id: 'dash-1',
    name: 'Ventas vs Inventario',
    dataset: 'Ventas Retail 2025',
    updatedAt: '2025-10-02',
    charts: 6,
  },
  {
    id: 'dash-2',
    name: 'Satisfacción de clientes',
    dataset: 'Encuestas NPS 2025',
    updatedAt: '2025-09-19',
    charts: 4,
  },
];

const statCards = [
  { label: 'Total de Dashboards', value: dashboards.length, icon: LayoutDashboard },
  { label: 'Total Visualizaciones', value: '10', icon: TrendingUp },
  { label: 'Actualizado', value: dashboards[0]?.updatedAt ?? '—', icon: Calendar },
];

export function SavedDashboardsPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Dashboards</h1>
              <p className="text-white/60 text-sm mt-1">Organiza, exporta y comparte vistas específicas para tu equipo</p>
            </div>
          </div>
          <Button className="flex items-center gap-2 whitespace-nowrap">
            <PlusCircle className="w-4 h-4" />
            Nuevo Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} variant="elevated" className="h-full">
                <CardContent className="pt-0 flex items-start justify-between">
                  <div>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/10">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} variant="elevated" className="h-full">
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                  <div>
                    <Badge variant="info" size="sm" className="mb-2">
                      {dashboard.dataset}
                    </Badge>
                    <h3 className="text-lg font-semibold text-white">{dashboard.name}</h3>
                  </div>
                  <div className="p-2 rounded-lg bg-white/10">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Visualizaciones:</span>
                    <Badge variant="success" size="sm">{dashboard.charts}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Calendar className="w-4 h-4 text-white/70" />
                    <span>Actualizado: {dashboard.updatedAt}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <Button size="sm" className="flex-1 flex items-center justify-center gap-2" variant="secondary" onClick={() => {}}>
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button size="sm" className="flex-1 flex items-center justify-center gap-2" variant="secondary" onClick={() => {}}>
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </Button>
                  <Button size="sm" className="flex-1 flex items-center justify-center gap-2" onClick={() => {}}>
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card variant="outlined" className="flex items-center justify-center min-h-[300px]">
            <CardContent className="text-center pt-0 space-y-3">
              <div className="p-4 bg-white/10 rounded-lg w-fit mx-auto">
                <PlusCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Crear nuevo</h3>
              <p className="text-white/60 text-sm">Diseña tu primer dashboard personalizado</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
