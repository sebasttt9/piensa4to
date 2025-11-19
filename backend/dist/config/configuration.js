"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    mongodb: {
        uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/datapulse',
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET ?? 'superchangeme',
        jwtExpiration: process.env.JWT_EXPIRATION ?? '24h',
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