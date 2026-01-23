# DataPulse Frontend (Vite + React)

Interfaz React de DataPulse. Consume el API de NestJS para autenticación, datasets y dashboards.

## Requisitos

- Node.js >= 18
- Backend DataPulse ejecutándose en `http://localhost:3000`

## Configuración

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env.local` y define la URL base del backend (incluye el prefijo `/api` definido en NestJS):
   ```bash
   VITE_API_URL=http://localhost:3000/api
   ```
   Si no defines la variable, el cliente usará `/api` y el proxy de Vite (`vite.config.ts`) reenviará las peticiones al backend local.
3. Inicia el backend en otra terminal:
   ```bash
   cd ../backend
   npm run start:dev
   ```
4. Ejecuta el frontend:
   ```bash
   npm run dev
   ```
5. Abre `http://localhost:5173` y regístrate para generar un JWT que se almacenará en `localStorage`.

## Notas de integración

- `src/lib/api.ts` normaliza `import.meta.env.VITE_API_URL` y `process.env.VITE_API_URL` para usar el backend sin necesidad de tocar el código.
- Las páginas `Datasets` y `DatasetDetail` consumen la API real usando `datasetsAPI`; los estados de carga y error ahora se muestran en la interfaz.
- El guardado de sesión ocurre en `AuthContext`. Si recibes un `401` el token se limpia automáticamente y se redirige al flujo de login.
- Durante desarrollo puedes modificar `vite.config.ts` si necesitas apuntar a otra instancia (por ejemplo, un backend desplegado).
