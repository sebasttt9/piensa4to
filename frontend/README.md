# DataPulse Frontend (React + Vite)

Interface web de DataPulse construida con **React**, **TypeScript** y **TailwindCSS**. Proporciona un panel moderno para cargar datasets, revisar análisis automáticos, gestionar dashboards y navegar insights generados por IA.

### Características

- Diseño inspirado en aplicaciones de analítica empresarial con navegación lateral y cards interactivas.
- Autenticación simulada (listo para conectar con el API NestJS via JWT).
- Gestión de rutas privada `/app/*` con `react-router-dom` + `ProtectedRoute`.
- Estado remoto preparado con `@tanstack/react-query` y cliente Axios configurado (`src/lib/api.ts`).
- Visualizaciones iniciales con `recharts` y datos mock (`src/data/mockAnalytics.ts`).
- Componentes reutilizables y maquetación con TailwindCSS + `@tailwindcss/forms`.

### Requisitos

- Node.js >= 18

### Variables de entorno

Crear un archivo `.env` tomando como referencia `.env.example`:

```
VITE_API_URL=http://localhost:3000/api
```

### Instalación

```bash
npm install
```

### Scripts

```bash
npm run dev     # servidor Vite en http://localhost:5173
npm run build   # build de producción
npm run preview # sirve la build localmente
```

### Estructura relevante

- `src/pages` · vistas principales (overview, datasets, upload, insights, auth).
- `src/components` · layout y componentes de protección de rutas.
- `src/context/AuthContext.tsx` · proveedor de autenticación listo para conectar con el backend.
- `src/lib/api.ts` · cliente Axios con interceptor de token.

### Conexión con backend

1. Levanta el API NestJS (`npm run start:dev` en `backend`).
2. Ajusta `VITE_API_URL` si tu backend corre en otra URL.
3. Actualiza los hooks del contexto y los servicios React Query para consumir los endpoints reales.

### Buenas prácticas

- Para componentes adicionales, utiliza la utilidad `cn` (`src/lib/utils.ts`) que simplifica la composición de clases Tailwind.
- Puedes activar temas oscuros mediante la clase `dark` en `<html>` gracias a Tailwind (`darkMode: 'class'`).
- Aprovecha `react-query` para cachear respuestas y estados de carga cuando reemplaces los mocks por llamadas reales.
