export const mockDatasets = [
  {
    id: 'dataset-1',
    name: 'Ventas Retail 2025',
    updatedAt: '2025-10-01',
    rows: 12500,
    owner: 'María González',
    status: 'Análisis actualizado',
    metrics: {
      total: 845000,
      growth: 12.4,
      ticket: 58.7,
    },
  },
  {
    id: 'dataset-2',
    name: 'Inventario Sucursales',
    updatedAt: '2025-09-18',
    rows: 6400,
    owner: 'Juan Pérez',
    status: 'Necesita revisión',
    metrics: {
      total: 219000,
      growth: -3.1,
      ticket: 41.2,
    },
  },
];

export const mockTrend = [
  { month: 'Ene', ventas: 48000, pronostico: 52000 },
  { month: 'Feb', ventas: 51000, pronostico: 54000 },
  { month: 'Mar', ventas: 56000, pronostico: 59000 },
  { month: 'Abr', ventas: 60000, pronostico: 62000 },
  { month: 'May', ventas: 64000, pronostico: 66000 },
  { month: 'Jun', ventas: 67000, pronostico: 70000 },
];

export const mockCategory = [
  { categoria: 'Electrónica', valor: 320000 },
  { categoria: 'Hogar', valor: 210000 },
  { categoria: 'Moda', valor: 140000 },
  { categoria: 'Alimentos', valor: 108000 },
];

export const mockInsights = [
  {
    id: 'insight-1',
    title: 'Picos de demanda por temporada',
    description:
      'Las ventas de electrónica aumentan 32% durante noviembre y diciembre. Se recomienda incrementar inventario un 20% desde octubre.',
    impact: 'alto',
  },
  {
    id: 'insight-2',
    title: 'Rotación de inventario',
    description:
      'Las sucursales del norte mantienen stock 18% por encima del promedio. Ajustar compras para reducir costos de almacenamiento.',
    impact: 'medio',
  },
  {
    id: 'insight-3',
    title: 'Clientes con alto potencial',
    description:
      'El 12% de clientes generan el 48% de ingresos. Segmentarlos y activar campañas de retención personalizadas.',
    impact: 'alto',
  },
];
