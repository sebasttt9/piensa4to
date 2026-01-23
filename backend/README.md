## DataPulse API (NestJS)

Backend de la plataforma **DataPulse**. Expone un API REST modular para autenticación, gestión de datasets, dashboards inteligentes y análisis automático de archivos CSV/XLSX.

### Características principales

- **JWT + roles (admin/analista)** mediante Passport y estrategias personalizadas.
- **Carga de datasets** con Multer en memoria, parsing con PapaParse/XLSX y persistencia en Supabase Postgres.
- **Servicio de análisis** que detecta tipos de columnas, calcula estadísticas y propone visualizaciones.
- **Gestión de dashboards** guardados por usuario con validaciones de ownership respaldadas en Supabase.
- **Configuración centralizada** con `@nestjs/config` y `ConfigService`.
- **Capa común** con decoradores (`@CurrentUser`, `@Roles`), guards y utilidades de detección de tipos.

### Requisitos

- Node.js >= 18
- Cuenta de Supabase con base de datos Postgres

### Variables de entorno

Duplicar `.env.example` como `.env` y ajustar valores:

```
PORT=3000
SUPABASE_PROJECT_ID=nqkodrksdcmzhxoeuidj
SUPABASE_URL=https://nqkodrksdcmzhxoeuidj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=super-secret
SUPABASE_DATA_PROJECT_ID=nqkodrksdcmzhxoeuidj
SUPABASE_DATA_URL=https://nqkodrksdcmzhxoeuidj.supabase.co
SUPABASE_DATA_SERVICE_ROLE_KEY=super-secret
JWT_SECRET=superchangeme
JWT_EXPIRATION=1h
FILE_MAX_SIZE=5242880
FILE_PREVIEW_LIMIT=50
SEED_EXPERIMENTAL_USERS=true
SEED_EXPERIMENTAL_USER_PASSWORD=DemoUser123!
SEED_EXPERIMENTAL_ADMIN_PASSWORD=DemoAdmin123!
SEED_EXPERIMENTAL_SUPERADMIN_PASSWORD=DemoRoot123!
```

> Las variables `SEED_EXPERIMENTAL_*` son opcionales y se usan únicamente en entornos de desarrollo. Desactiva la siembra automática definiendo `SEED_EXPERIMENTAL_USERS=false` en despliegues productivos.

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

### Cuentas demo

Cuando `SEED_EXPERIMENTAL_USERS` está habilitado (por defecto en desarrollo) se aprovisionan automáticamente tres cuentas desechables:

- Usuario: `demo.user@datapulse.local` · contraseña `DemoUser123!`
- Administrador: `demo.admin@datapulse.local` · contraseña `DemoAdmin123!`
- Superadmin: `demo.superadmin@datapulse.local` · contraseña `DemoRoot123!`

Estas cuentas se crean en el arranque del backend y se omite su siembra si ya existen. Elimina o deshabilita estas credenciales antes de cualquier despliegue real.

### Tests

Los tests unitarios cubren controladores y servicios clave. Los e2e validan el health check base; extiéndelos para cubrir flujos auth/datasets cuando conectes la base real. Si inicias un nuevo proyecto de Supabase, limpia cualquier dato previo desde el panel (`Table editor` → `Delete data`) antes de importar tus tablas para mantener el entorno despejado. Recuerda definir tanto las credenciales primarias (`SUPABASE_*`) para usuarios/autenticación como las de datasets (`SUPABASE_DATA_*`) si deseas separar ambas bases.

### Despliegue sugerido

La aplicación está lista para ejecutarse en **Railway** o cualquier plataforma Node. Recuerda configurar variables de entorno, proteger las claves de servicio de Supabase y revisar límites de tamaño en Multer según tus necesidades.
