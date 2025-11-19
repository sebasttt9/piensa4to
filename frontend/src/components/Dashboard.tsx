import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

function KPICard({ title, value, change, icon }: KPICardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card variant="elevated" className="group cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-sm font-semibold text-white/80">{title}</CardTitle>
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 group-hover:from-purple-500/40 group-hover:to-blue-500/40 transition-all duration-300 transform group-hover:scale-110">
            <div className="text-blue-300 group-hover:text-blue-200 transition-colors">{icon}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">{value}</p>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-400 animate-bounce" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={isPositive ? 'text-green-300 text-sm font-semibold' : 'text-red-300 text-sm font-semibold'}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-white/50 text-xs">vs período anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Datasets Activos"
          value="12"
          change={8}
          icon={<Activity className="w-6 h-6" />}
        />
        <KPICard
          title="Análisis Completados"
          value="248"
          change={15}
          icon={<Zap className="w-6 h-6" />}
        />
        <KPICard
          title="Dashboards"
          value="8"
          change={3}
          icon={<Activity className="w-6 h-6" />}
        />
        <KPICard
          title="Usuarios"
          value="142"
          change={12}
          icon={<Activity className="w-6 h-6" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" className="group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></div>
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-64 flex items-center justify-center text-white/40 rounded-xl bg-gradient-to-br from-white/5 to-white/2 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 group-hover:from-white/8 group-hover:to-white/4">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Gráfico de línea - Actividad</p>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 mx-auto animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-full"></div>
              Distribución por Tipo
            </CardTitle>
            <CardDescription>Datasets por formato</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-64 flex items-center justify-center text-white/40 rounded-xl bg-gradient-to-br from-white/5 to-white/2 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 group-hover:from-white/8 group-hover:to-white/4">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Gráfico de dona - Tipos</p>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30 mx-auto animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card variant="elevated" className="group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-400 via-blue-400 to-indigo-400 rounded-full"></div>
            Últimas Actualizaciones
          </CardTitle>
          <CardDescription>Cambios recientes en tus datasets</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3].map((item, index) => (
              <div 
                key={item} 
                className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-white/5 to-white/2 border border-white/10 hover:border-white/20 hover:from-white/8 hover:to-white/4 transition-all duration-300 cursor-pointer group/item transform hover:translate-x-1"
                style={{
                  animation: `slideIn 0.5s ease-out ${index * 0.1}s backwards`
                }}
              >
                <div className="relative">
                  <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '0.3s' }}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover/item:text-transparent group-hover/item:bg-gradient-to-r group-hover/item:from-purple-300 group-hover/item:to-blue-300 group-hover/item:bg-clip-text transition-all duration-300">Dataset {item} actualizado</p>
                  <p className="text-xs text-white/50 mt-1">Hace {item * 2} horas</p>
                </div>
                <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30 rounded-lg font-semibold hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300">Completado</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
