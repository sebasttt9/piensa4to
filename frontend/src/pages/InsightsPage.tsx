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

const capabilityCards = [
  { icon: Brain, title: 'Análisis Automático', description: 'IA detecta patrones, anomalías y oportunidades' },
  { icon: Zap, title: 'Recomendaciones Inteligentes', description: 'Acciones accionables basadas en datos' },
  { icon: TrendingUp, title: 'Seguimiento de KPIs', description: 'Monitoreo continuo de métricas clave' },
];

export function InsightsPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Card variant="elevated" className="animate-slideIn">
          <CardContent className="pt-0">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/10 flex-shrink-0">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">DataPulse AI Studio</p>
                <h1 className="mt-3 text-4xl font-bold text-white">Análisis Inteligentes</h1>
                <p className="mt-2 max-w-2xl text-white/70">
                  Combina datasets, detecta patrones y obtén recomendaciones basadas en IA. Libera tu tiempo del análisis repetitivo.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button className="flex items-center justify-center gap-2">
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

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Card key={action.id} variant="elevated" className="h-full" style={{ animation: `slideIn 0.5s ease-out ${idx * 0.1}s backwards` }}>
                <CardContent className="pt-0 space-y-4">
                  <div className="p-3 rounded-lg bg-white/10 w-fit">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                    <p className="mt-2 text-white/60 text-sm">{action.description}</p>
                  </div>
                  <Button size="sm" className="w-full">
                    Generar ahora
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <div className="mb-6 animate-slideIn">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              Insights Recientes
            </h2>
            <p className="text-white/60 mt-2">Auto-generados por DataPulse en base a tus datasets más recientes</p>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {mockInsights.map((insight, idx) => (
              <Card key={insight.id} variant="elevated" className="h-full" style={{ animation: `slideInRight 0.5s ease-out ${idx * 0.1}s backwards` }}>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge variant={insight.impact === 'Alto' ? 'success' : insight.impact === 'Medio' ? 'warning' : 'info'} size="sm">
                        Impacto {insight.impact}
                      </Badge>
                      <h4 className="mt-2 text-lg font-semibold text-white">{insight.title}</h4>
                    </div>
                  </div>

                  <p className="text-white/60 text-sm">{insight.description}</p>

                  <Button size="sm" className="w-full" variant="secondary" onClick={() => {}}>
                    Ver Recomendaciones
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card variant="outlined">
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {capabilityCards.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div key={item.title} className="p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="p-2 rounded-lg bg-white/10 w-fit">
                      <ItemIcon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-white font-semibold">{item.title}</h4>
                    <p className="text-white/60 text-sm">{item.description}</p>
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
