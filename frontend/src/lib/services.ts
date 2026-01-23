import api from './api';

/* ==================== DATASETS API ==================== */

export interface Dataset {
    id: string;
    ownerId: string;
    name: string;
    description?: string;
    filename?: string;
    fileSize?: number;
    fileType?: 'csv' | 'xlsx';
    rowCount?: number;
    columnCount?: number;
    analysis?: Record<string, any>;
    preview: Record<string, any>[];
    status: 'pending' | 'processed' | 'error';
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateDatasetInput {
    name: string;
    description?: string;
    tags?: string[];
}

export const datasetsAPI = {
    // Listar todos los datasets del usuario
    list: async (page = 1, limit = 10) => {
        const response = await api.get<{
            data: Dataset[];
            total: number;
            page: number;
            limit: number;
        }>('/datasets', { params: { page, limit } });
        return response.data;
    },

    // Obtener un dataset específico por ID
    getById: async (id: string) => {
        const response = await api.get<Dataset>(`/datasets/${id}`);
        return response.data;
    },

    // Crear un nuevo dataset
    create: async (input: CreateDatasetInput) => {
        const response = await api.post<Dataset>('/datasets', input);
        return response.data;
    },

    // Actualizar dataset (metadata)
    update: async (id: string, input: Partial<CreateDatasetInput>) => {
        const response = await api.put<Dataset>(`/datasets/${id}`, input);
        return response.data;
    },

    // Eliminar dataset
    delete: async (id: string) => {
        await api.delete(`/datasets/${id}`);
    },

    // Subir archivo CSV/Excel
    uploadFile: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<Dataset>(`/datasets/${id}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Obtener preview del dataset
    getPreview: async (id: string, limit = 50) => {
        const response = await api.get<{
            data: Record<string, any>[];
            columns: string[];
            total: number;
        }>(`/datasets/${id}/preview`, { params: { limit } });
        return response.data;
    },
};

/* ==================== ANALYTICS API ==================== */

export interface OverviewAnalytics {
    summary: {
        totalDatasets: number;
        activeReports: number;
        createdCharts: number;
        growthPercentage: number;
    };
    financial: {
        totalRevenue: number;
        totalCosts: number;
        netProfit: number;
        monthlySeries: Array<{ month: string; revenue: number; costs: number }>;
        quarterlyRevenue: Array<{ label: string; revenue: number }>;
    };
    categoryDistribution: Array<{ name: string; value: number }>;
    datasetHealth: {
        processed: number;
        pending: number;
        error: number;
    };
    storage: {
        usedMb: number;
        capacityMb: number;
        usagePercentage: number;
    };
    lastUpdated: string;
}

export const analyticsAPI = {
    getOverview: async () => {
        const response = await api.get<OverviewAnalytics>('/analytics/overview');
        return response.data;
    },
};

/* ==================== DASHBOARDS API ==================== */

export interface Dashboard {
    _id: string;
    name: string;
    description?: string;
    layout: Record<string, any>;
    charts: Array<{
        id: string;
        type: string;
        config: Record<string, any>;
    }>;
    datasetIds: string[];
    createdAt: string;
    updatedAt: string;
    userId: string;
    isPublic: boolean;
}

export interface CreateDashboardInput {
    name: string;
    description?: string;
    datasetIds: string[];
}

export interface UpdateDashboardInput extends Partial<CreateDashboardInput> {
    layout?: Record<string, any>;
    charts?: Dashboard['charts'];
}

export interface ShareDashboardInput {
    channel: 'email' | 'sms';
    contact: string;
    message?: string;
    makePublic?: boolean;
}

export const dashboardsAPI = {
    // Listar todos los dashboards del usuario
    list: async (page = 1, limit = 10) => {
        const response = await api.get<{
            data: Dashboard[];
            total: number;
            page: number;
            limit: number;
        }>('/dashboards', { params: { page, limit } });
        return response.data;
    },

    // Obtener un dashboard específico
    getById: async (id: string) => {
        const response = await api.get<Dashboard>(`/dashboards/${id}`);
        return response.data;
    },

    // Crear nuevo dashboard
    create: async (input: CreateDashboardInput) => {
        const response = await api.post<Dashboard>('/dashboards', input);
        return response.data;
    },

    // Actualizar dashboard
    update: async (id: string, input: UpdateDashboardInput) => {
        const response = await api.put<Dashboard>(`/dashboards/${id}`, input);
        return response.data;
    },

    // Eliminar dashboard
    delete: async (id: string) => {
        await api.delete(`/dashboards/${id}`);
    },

    // Compartir dashboard (hace público)
    share: async (id: string, isPublic: boolean) => {
        const response = await api.patch<Dashboard>(`/dashboards/${id}/share`, {
            isPublic,
        });
        return response.data;
    },

    shareWithContact: async (id: string, input: ShareDashboardInput) => {
        const response = await api.post(`/dashboards/${id}/share/invite`, input);
        return response.data as {
            id: string;
            dashboardId: string;
            ownerId: string;
            channel: ShareDashboardInput['channel'];
            contact: string;
            message?: string;
            status: 'pending' | 'sent' | 'failed';
            createdAt: string;
        };
    },

    export: async (id: string, format: 'pdf' | 'json') => {
        const response = await api.get(`/dashboards/${id}/export`, {
            params: { format },
            responseType: format === 'pdf' ? 'blob' : 'json',
        });
        return response.data;
    },
};

/* ==================== ANALYSIS API ==================== */

export interface AnalysisResult {
    datasetId: string;
    summary: string;
    insights: Array<{
        title: string;
        description: string;
        type: 'trend' | 'anomaly' | 'correlation' | 'recommendation';
    }>;
    statistics: {
        totalRecords: number;
        columns: string[];
        dataTypes: Record<string, string>;
        missingValues: Record<string, number>;
    };
}

export const analysisAPI = {
    // Analizar un dataset completo
    analyzeDataset: async (datasetId: string) => {
        const response = await api.post<AnalysisResult>(
            `/datasets/${datasetId}/analyze`,
            {}
        );
        return response.data;
    },

    // Obtener insights específicos de un dataset
    getInsights: async (datasetId: string) => {
        const response = await api.get<AnalysisResult>(
            `/datasets/${datasetId}/insights`
        );
        return response.data;
    },

    // Generar reporte automático
    generateReport: async (datasetId: string, format: 'pdf' | 'json' = 'json') => {
        const response = await api.get(`/datasets/${datasetId}/report`, {
            params: { format },
            responseType: format === 'pdf' ? 'blob' : 'json',
        });
        return response.data;
    },
};

/* ==================== USERS API ==================== */

export interface UserProfile {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'superadmin';
    createdAt: string;
}

export const usersAPI = {
    // Obtener perfil del usuario autenticado
    getProfile: async () => {
        const response = await api.get<UserProfile>('/users/me');
        return response.data;
    },

    // Actualizar perfil del usuario
    updateProfile: async (input: Partial<Pick<UserProfile, 'name'>>) => {
        const response = await api.put<UserProfile>('/users/me', input);
        return response.data;
    },

    // Cambiar contraseña
    changePassword: async (
        currentPassword: string,
        newPassword: string
    ) => {
        await api.post('/users/change-password', {
            currentPassword,
            newPassword,
        });
    },
};

export interface ManagedUser {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'superadmin';
    createdAt: string;
    updatedAt: string;
}

export const adminUsersAPI = {
    list: async () => {
        const response = await api.get<ManagedUser[]>('/users');
        return response.data;
    },

    update: async (id: string, input: Partial<Pick<ManagedUser, 'role' | 'name'>>) => {
        const response = await api.patch<ManagedUser>(`/users/${id}`, input);
        return response.data;
    },

    remove: async (id: string) => {
        await api.delete(`/users/${id}`);
    },
};
