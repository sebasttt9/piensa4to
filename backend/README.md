## DataPulse API (NestJS)

Backend de la plataforma **DataPulse**. Expone un API REST modular para autenticación, gestión de datasets, dashboards inteligentes y análisis automático de archivos CSV/XLSX.

### Características principales

- **JWT + roles (admin/analista)** mediante Passport y estrategias personalizadas.
- **Carga de datasets** con Multer en memoria, parsing con PapaParse/XLSX y persistencia en MongoDB.
- **Servicio de análisis** que detecta tipos de columnas, calcula estadísticas y propone visualizaciones.
- **Gestión de dashboards** guardados por usuario con validaciones de ownership.
- **Configuración centralizada** con `@nestjs/config` y `ConfigService`.
- **Capa común** con decoradores (`@CurrentUser`, `@Roles`), guards y utilidades de detección de tipos.

### Requisitos

- Node.js >= 18
- MongoDB (local o MongoDB Atlas)

### Variables de entorno

Duplicar `.env.example` como `.env` y ajustar valores:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/datapulse
JWT_SECRET=superchangeme
JWT_EXPIRATION=1h
FILE_MAX_SIZE=5242880
FILE_PREVIEW_LIMIT=50
```

### Instalación

```bash
npm install
```

### Scripts útiles

```bash
npm run start:dev   # modo desarrollo con hot-reload
npm run lint        # corre ESLint
npm run test        # unit tests
npm run test:e2e    # pruebas end-to-end con Supertest
npm run build       # genera artefactos en dist/
```

### Arquitectura de módulos

- `AuthModule`: registro, login, estrategia JWT, guardias y endpoints `/auth`.
- `UsersModule`: CRUD básico de usuarios con roles y hashing de contraseñas.
- `DatasetsModule`: endpoints `/datasets`, servicio de análisis automático y almacenamiento de previews.
- `DashboardsModule`: CRUD de dashboards guardados y verificación de ownership.
- `Common`: decoradores, guards, DTOs reutilizables y utilidades.

### Endpoints destacados

- `POST /api/auth/login` · Inicio de sesión (JWT)
- `POST /api/auth/register` · Alta de usuario y sesión inmediata
- `POST /api/datasets/upload` · Subida de CSV/XLSX, análisis y persistencia
- `GET /api/datasets` · Listado de datasets del usuario
- `POST /api/dashboards` · Guardar dashboards personalizados
- `GET /api/health` · Health check simple del servicio

### Tests

Los tests unitarios cubren controladores y servicios clave. Los e2e validan el health check base; extiéndelos para cubrir flujos auth/datasets cuando conectes la base real.

### Despliegue sugerido

La aplicación está lista para ejecutarse en **Railway** o cualquier plataforma Node. Recuerda configurar variables de entorno, habilitar SSL/TLS para MongoDB Atlas y revisar límites de tamaño en Multer según tus necesidades.
