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
    trend: 'up',
  },
  {
    id: 'dash-2',
    name: 'Satisfacción de clientes',
    dataset: 'Encuestas NPS 2025',
    updatedAt: '2025-09-19',
    charts: 4,
    trend: 'up',
  },
];

export function SavedDashboardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-col sm:flex-row gap-6 animate-slideIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)] transition-all duration-300 transform hover:scale-110">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">Dashboards</h1>
              <p className="text-white/50 text-sm mt-1 hover:text-white/70 transition-all duration-300">Organiza, exporta y comparte vistas específicas para tu equipo</p>
            </div>
          </div>
          <Button className="flex items-center gap-2 whitespace-nowrap hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)] animate-slideInRight">
            <PlusCircle className="w-4 h-4" />
            Nuevo Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total de Dashboards', value: dashboards.length, icon: LayoutDashboard, color: 'from-purple-500 to-blue-500' },
            { label: 'Total Visualizaciones', value: '10', icon: TrendingUp, color: 'from-blue-500 to-indigo-500' },
            { label: 'Actualizado', value: dashboards[0]?.updatedAt, icon: Calendar, color: 'from-emerald-500 to-green-500' }
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
                      <p className="text-white/50 text-sm group-hover:text-white/70 transition-all duration-300">{stat.label}</p>
                      <p className="text-3xl font-bold text-white mt-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">{stat.value}</p>
                    </div>
                    <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard, idx) => (
            <Card 
              key={dashboard.id} 
              variant="elevated" 
              className="group overflow-hidden hover:border-purple-500/50 hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transform hover:translate-y-[-4px] transition-all duration-300"
              style={{
                animation: `slideIn 0.5s ease-out ${idx * 0.1}s backwards`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <CardContent className="pt-0 space-y-4 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-white/10 group-hover:border-white/20 transition-all">
                  <div>
                    <Badge variant="info" size="sm" className="mb-2 hover:scale-105 transition-transform">
                      {dashboard.dataset}
                    </Badge>
                    <h3 className="text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">{dashboard.name}</h3>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg flex-shrink-0 group-hover:from-purple-500/50 group-hover:to-blue-500/50 group-hover:scale-110 transition-all duration-300">
                    <LayoutDashboard className="w-5 h-5 text-blue-300" />
                  </div>
                </div>

                {/* Dashboard Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 group-hover:text-white/70 transition-all">Visualizaciones:</span>
                    <Badge variant="success" size="sm" className="hover:scale-105 transition-transform">{dashboard.charts}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-white/50 group-hover:text-white/70 transition-all">
                    <Calendar className="w-4 h-4" />
                    <span>Actualizado: {dashboard.updatedAt}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-white/10 group-hover:border-white/20 transition-all">
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

          {/* Create New Dashboard Card */}
          <Card 
            variant="outlined" 
            className="group flex items-center justify-center min-h-[300px] cursor-pointer hover:border-purple-500/50 hover:bg-gradient-to-br hover:from-purple-500/5 hover:to-blue-500/5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <CardContent className="text-center pt-0 relative z-10">
              <div className="p-4 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg w-fit mx-auto mb-4 group-hover:from-purple-500/50 group-hover:to-blue-500/50 group-hover:scale-110 transition-all duration-300">
                <PlusCircle className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">Crear nuevo</h3>
              <p className="text-white/50 text-sm mt-2 group-hover:text-white/70 transition-all duration-300">Diseña tu primer dashboard personalizado</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
