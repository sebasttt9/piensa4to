"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    supabase: {
        projectId: process.env.SUPABASE_PROJECT_ID ?? 'nqkodrksdcmzhxoeuidj',
        url: process.env.SUPABASE_URL ??
            (process.env.SUPABASE_PROJECT_ID
                ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
                : 'https://nqkodrksdcmzhxoeuidj.supabase.co'),
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ??
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZ3NxYnZycGVuYWhjcHB2dXljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc0NzI4MiwiZXhwIjoyMDgzMzIzMjgyfQ.j32e8oZwZDSgXOGbVRqnVcqdkGyclPIFTzmy29cb8Hw',
        datasets: {
            projectId: process.env.SUPABASE_DATA_PROJECT_ID ??
                process.env.SUPABASE_PROJECT_ID ??
                'nqkodrksdcmzhxoeuidj',
            url: process.env.SUPABASE_DATA_URL ??
                (process.env.SUPABASE_DATA_PROJECT_ID
                    ? `https://${process.env.SUPABASE_DATA_PROJECT_ID}.supabase.co`
                    : process.env.SUPABASE_PROJECT_ID
                        ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
                        : 'https://nqkodrksdcmzhxoeuidj.supabase.co'),
            serviceRoleKey: process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ??
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa29kcmtzZGNtemh4b2V1aWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyNzgxOSwiZXhwIjoyMDg0NzAzODE5fQ.DK8cTAE7ovECixgdZLFw2frKWn2fh1n2GFhllzBd30c',
        },
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
        jwtExpiration: process.env.JWT_EXPIRATION ?? '24h',
    },
    seed: {
        admin: {
            email: process.env.DEFAULT_ADMIN_EMAIL,
            password: process.env.DEFAULT_ADMIN_PASSWORD,
            name: process.env.DEFAULT_ADMIN_NAME ?? 'DataPulse Admin',
            role: process.env.DEFAULT_ADMIN_ROLE ?? 'admin',
        },
        experimentalUsers: {
            enabled: process.env.SEED_EXPERIMENTAL_USERS === 'true'
                ? true
                : process.env.SEED_EXPERIMENTAL_USERS === 'false'
                    ? false
                    : (process.env.NODE_ENV ?? 'development') !== 'production',
            users: [
                {
                    email: process.env.SEED_EXPERIMENTAL_USER_EMAIL ?? 'demo.user@datapulse.local',
                    password: process.env.SEED_EXPERIMENTAL_USER_PASSWORD ?? 'DemoUser123!',
                    name: process.env.SEED_EXPERIMENTAL_USER_NAME ?? 'Demo Usuario',
                    role: 'user',
                },
                {
                    email: process.env.SEED_EXPERIMENTAL_ADMIN_EMAIL ?? 'demo.admin@datapulse.local',
                    password: process.env.SEED_EXPERIMENTAL_ADMIN_PASSWORD ?? 'DemoAdmin123!',
                    name: process.env.SEED_EXPERIMENTAL_ADMIN_NAME ?? 'Demo Administrador',
                    role: 'admin',
                },
                {
                    email: process.env.SEED_EXPERIMENTAL_SUPERADMIN_EMAIL ?? 'demo.superadmin@datapulse.local',
                    password: process.env.SEED_EXPERIMENTAL_SUPERADMIN_PASSWORD ?? 'DemoRoot123!',
                    name: process.env.SEED_EXPERIMENTAL_SUPERADMIN_NAME ?? 'Demo Superadmin',
                    role: 'superadmin',
                },
            ],
        },
    },
    uploads: {
        maxFileSize: parseInt(process.env.FILE_MAX_SIZE ?? '5242880', 10),
        previewLimit: parseInt(process.env.FILE_PREVIEW_LIMIT ?? '50', 10),
        storageType: process.env.STORAGE_TYPE ?? 'memory',
    },
    aws: {
        s3: {
            enabled: process.env.AWS_S3_ENABLED === 'true',
            region: process.env.AWS_REGION ?? 'us-east-1',
            bucket: process.env.AWS_S3_BUCKET ?? 'datapulse-files',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    },
    email: {
        enabled: process.env.EMAIL_ENABLED === 'true',
        provider: process.env.EMAIL_PROVIDER ?? 'smtp',
        smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT ?? '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASSWORD,
            from: process.env.SMTP_FROM ?? 'noreply@datapulse.com',
        },
        sendgrid: {
            apiKey: process.env.SENDGRID_API_KEY,
            from: process.env.SENDGRID_FROM ?? 'noreply@datapulse.com',
        },
    },
    redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },
    logging: {
        level: process.env.LOG_LEVEL ?? 'info',
        enableFile: process.env.LOG_FILE_ENABLED === 'true',
        logDir: process.env.LOG_DIR ?? './logs',
    },
    security: {
        enableHelmet: process.env.HELMET_ENABLED !== 'false',
        enableCors: process.env.CORS_ENABLED !== 'false',
        corsOrigin: process.env.CORS_ORIGIN ?? '*',
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW ?? '900000', 10),
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    },
    monitoring: {
        sentryEnabled: process.env.SENTRY_ENABLED === 'true',
        sentryDsn: process.env.SENTRY_DSN,
    },
    env: process.env.NODE_ENV ?? 'development',
    isDevelopment: (process.env.NODE_ENV ?? 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
});
//# sourceMappingURL=configuration.js.map