declare const _default: () => {
    port: number;
    mongodb: {
        uri: string;
    };
    auth: {
        jwtSecret: string;
        jwtExpiration: string;
    };
    uploads: {
        maxFileSize: number;
        previewLimit: number;
        storageType: string;
    };
    aws: {
        s3: {
            enabled: boolean;
            region: string;
            bucket: string;
            accessKeyId: string | undefined;
            secretAccessKey: string | undefined;
        };
    };
    email: {
        enabled: boolean;
        provider: string;
        smtp: {
            host: string | undefined;
            port: number;
            secure: boolean;
            user: string | undefined;
            password: string | undefined;
            from: string;
        };
        sendgrid: {
            apiKey: string | undefined;
            from: string;
        };
    };
    redis: {
        enabled: boolean;
        host: string;
        port: number;
        password: string | undefined;
    };
    logging: {
        level: string;
        enableFile: boolean;
        logDir: string;
    };
    security: {
        enableHelmet: boolean;
        enableCors: boolean;
        corsOrigin: string;
        rateLimitWindowMs: number;
        rateLimitMaxRequests: number;
    };
    monitoring: {
        sentryEnabled: boolean;
        sentryDsn: string | undefined;
    };
    env: string;
    isDevelopment: boolean;
    isProduction: boolean;
};
export default _default;
