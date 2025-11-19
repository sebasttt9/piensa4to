import { useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mockDatasets, mockCategory } from '../data/mockAnalytics';
import { Download, Share2, TrendingUp, Database, FileText } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function DatasetDetailPage() {
  const { datasetId } = useParams();
  const dataset = mockDatasets.find((item) => item.id === datasetId) ?? mockDatasets[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between animate-slideIn">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex-shrink-0 hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)] transition-all duration-300 transform hover:scale-110">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <Badge size="sm" className="mb-2 hover:scale-105 transition-transform">Dataset</Badge>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">{dataset.name}</h1>
            <p className="text-white/50 mt-2 hover:text-white/70 transition-all">
              {dataset.rows.toLocaleString()} filas {' '}• Última actualización {dataset.updatedAt}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap animate-slideInRight">
          <Button variant="secondary" className="flex items-center gap-2 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)]" onClick={() => {}}>
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button className="flex items-center gap-2 hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)]" onClick={() => {}}>
            <FileText className="w-4 h-4" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Ticket Promedio', value: `$${dataset.metrics.ticket}`, sublabel: 'Valor medio por transacción' },
          { label: 'Ingresos Totales', value: `$${dataset.metrics.total.toLocaleString()}`, sublabel: 'Acumulados en período' },
          { label: 'Crecimiento', value: `${dataset.metrics.growth}%`, sublabel: 'vs período anterior', isGrowth: true }
        ].map((stat, idx) => (
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
              <p className="text-white/50 text-sm group-hover:text-white/70 transition-all">{stat.label}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-3xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">{stat.value}</p>
                {stat.isGrowth && <TrendingUp className="w-5 h-5 text-green-400 animate-bounce" />}
              </div>
              <p className="text-white/40 text-xs mt-2 group-hover:text-white/60 transition-all">{stat.sublabel}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <Card variant="elevated" className="group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <CardContent className="pt-0 space-y-6 relative z-10">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">Análisis por Categoría</h2>
              <p className="text-white/50 text-sm mt-1 group-hover:text-white/70 transition-all">Comparación detectada automáticamente por DataPulse</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => {}}>
              Personalizar Gráfico
            </Button>
          </div>

          <div className="h-72 bg-gradient-to-br from-white/5 to-white/2 rounded-lg p-4 border border-white/10 group-hover:border-white/20 group-hover:from-white/8 group-hover:to-white/4 transition-all duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="categoria" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Valor']}
                />
                <Bar dataKey="valor" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Visualizations */}
      <div className="animate-slideIn">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500/30 to-yellow-500/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-yellow-300" />
          </div>
          Tablero Recomendado
        </h2>
        <p className="text-white/50 mb-6">DataPulse recomienda estas visualizaciones para contar la historia correctamente</p>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {[
            { icon: TrendingUp, title: 'Serie Temporal', subtitle: 'Ventas por Mes', desc: 'Perfecto para entender tendencia y detectar estacionalidad.', color: 'from-purple-500 to-blue-500' },
            { icon: Database, title: 'Comparativa', subtitle: 'Inventario vs Ventas', desc: 'Alinea la planificación de stock con el ritmo de demanda real.', color: 'from-blue-500 to-indigo-500' },
            { icon: FileText, title: 'Top Performance', subtitle: 'Top 10 Categorías', desc: 'Prioriza dónde invertir en promociones o reposiciones.', color: 'from-emerald-500 to-green-500' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card 
                key={idx}
                variant="outlined" 
                className="group overflow-hidden hover:border-white/40 hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transform hover:translate-y-[-4px] transition-all duration-300"
                style={{
                  animation: `slideInRight 0.5s ease-out ${idx * 0.1}s backwards`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <CardContent className="pt-0 space-y-3 relative z-10">
                  <div className={`p-2 bg-gradient-to-br ${item.color} rounded-lg w-fit group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/60 font-semibold group-hover:text-white/80 transition-all">{item.title}</p>
                    <h3 className="text-lg font-semibold text-white mt-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">{item.subtitle}</h3>
                    <p className="text-white/50 text-sm mt-2 group-hover:text-white/70 transition-all">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Action Section */}
      <Card 
        variant="elevated" 
        className="group overflow-hidden bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/40 hover:border-purple-400/50 hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <CardContent className="pt-0 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">¿Listo para análisis profundo?</h3>
              <p className="text-white/50 text-sm mt-1 group-hover:text-white/70 transition-all">Genera un informe ejecutivo con recomendaciones de IA</p>
            </div>
            <Button className="flex items-center gap-2 hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)]" onClick={() => {}}>
              <Share2 className="w-4 h-4" />
              Generar Informe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
