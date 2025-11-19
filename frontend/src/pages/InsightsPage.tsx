import { Sparkles, Brain, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { mockInsights } from '../data/mockAnalytics';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const actions = [
  {
    id: 'action-1',
    icon: Sparkles,
    title: 'Generar resumen ejecutivo',
    description: 'Crea un informe en PDF listo para comité con los insights más relevantes.',
  },
  {
    id: 'action-2',
    icon: TrendingUp,
    title: 'Proponer acciones comerciales',
    description: 'DataPulse sugiere campañas y descuentos basados en patrones de compra.',
  },
  {
    id: 'action-3',
    icon: AlertTriangle,
    title: 'Detectar anomalías',
    description: 'Analiza variaciones inusuales en ventas, inventario o encuestas en segundos.',
  },
];

export function InsightsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header with Gradient */}
        <Card variant="elevated" className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/40 group overflow-hidden animate-slideIn">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <CardContent className="pt-0 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 via-blue-500 to-blue-600 rounded-lg flex-shrink-0 group-hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)] transition-all duration-300 transform group-hover:scale-110">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-purple-300 font-semibold">DataPulse AI Studio</p>
                <h1 className="mt-3 text-4xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">Análisis Inteligentes</h1>
                <p className="mt-2 max-w-2xl text-white/60 group-hover:text-white/80 transition-all duration-300">
                  Combina datasets, detecta patrones y obtén recomendaciones basadas en IA. Libera tu tiempo del análisis repetitivo.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button className="flex items-center justify-center gap-2 hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)]">
                    <Sparkles className="w-4 h-4" />
                    Analizar con IA
                  </Button>
                  <Button variant="secondary" className="flex items-center justify-center gap-2">
                    Prompt Personalizado
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.id} 
                variant="elevated" 
                className="group overflow-hidden hover:border-purple-500/50 hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transform hover:translate-y-[-4px] transition-all duration-300 cursor-pointer"
                style={{
                  animation: `slideIn 0.5s ease-out ${idx * 0.1}s backwards`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <CardContent className="pt-0 space-y-4 relative z-10">
                  <div className="p-3 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg w-fit group-hover:from-purple-500/50 group-hover:to-blue-500/50 transition-all duration-300 transform group-hover:scale-110">
                    <Icon className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">{action.title}</h3>
                    <p className="mt-2 text-white/50 text-sm group-hover:text-white/70 transition-all duration-300">{action.description}</p>
                  </div>
                  <Button size="sm" className="w-full hover:shadow-[0_10px_30px_rgba(167,139,250,0.2)]">
                    Generar ahora
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Insights Section */}
        <div>
          <div className="mb-6 animate-slideIn">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/30 to-yellow-500/30 rounded-lg">
                <Sparkles className="w-8 h-8 text-yellow-300" />
              </div>
              Insights Recientes
            </h2>
            <p className="text-white/50 mt-2">Auto-generados por DataPulse en base a tus datasets más recientes</p>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {mockInsights.map((insight, idx) => (
              <Card 
                key={insight.id} 
                variant="elevated" 
                className="group overflow-hidden hover:border-purple-500/50 hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transform hover:translate-y-[-4px] transition-all duration-300"
                style={{
                  animation: `slideInRight 0.5s ease-out ${idx * 0.1}s backwards`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <CardContent className="pt-0 space-y-4 relative z-10">
                  {/* Header with Impact Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge 
                        variant={
                          insight.impact === 'Alto' ? 'success' : 
                          insight.impact === 'Medio' ? 'warning' : 
                          'info'
                        } 
                        size="sm"
                        className="hover:scale-105 transition-transform"
                      >
                        Impacto {insight.impact}
                      </Badge>
                      <h4 className="mt-2 text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">{insight.title}</h4>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/60 text-sm group-hover:text-white/80 transition-all duration-300">{insight.description}</p>

                  {/* Action Button */}
                  <Button size="sm" className="w-full" variant="secondary" onClick={() => {}}>
                    Ver Recomendaciones
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Capabilities Info */}
        <Card variant="outlined" className="group overflow-hidden border-white/20 hover:border-white/40 hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <CardContent className="pt-0 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Brain, title: 'Análisis Automático', desc: 'IA detecta patrones, anomalías y oportunidades', color: 'from-purple-500 to-blue-500' },
                { icon: Zap, title: 'Recomendaciones Inteligentes', desc: 'Acciones accionables basadas en datos', color: 'from-blue-500 to-indigo-500' },
                { icon: TrendingUp, title: 'Seguimiento de KPIs', desc: 'Monitoreo continuo de métricas clave', color: 'from-emerald-500 to-green-500' }
              ].map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <div key={idx} className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/2 border border-white/10 hover:border-white/20 hover:from-white/8 hover:to-white/4 transition-all duration-300 group/item cursor-pointer">
                    <div className={`p-2 bg-gradient-to-br ${item.color} rounded-lg w-fit mb-3 group-hover/item:scale-110 group-hover/item:shadow-lg transition-all duration-300`}>
                      <ItemIcon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-white font-semibold group-hover/item:text-transparent group-hover/item:bg-gradient-to-r group-hover/item:from-purple-300 group-hover/item:to-blue-300 group-hover/item:bg-clip-text transition-all duration-300">{item.title}</h4>
                    <p className="text-white/50 text-sm mt-1 group-hover/item:text-white/70 transition-all duration-300">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
