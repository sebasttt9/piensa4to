"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardsService = void 0;
const common_1 = require("@nestjs/common");
const datasets_service_1 = require("../datasets/datasets.service");
const supabase_constants_1 = require("../database/supabase.constants");
const supabase_js_1 = require("@supabase/supabase-js");
const share_dashboard_dto_1 = require("./dto/share-dashboard.dto");
const pdfkit_1 = __importDefault(require("pdfkit"));
let DashboardsService = class DashboardsService {
    supabase;
    datasetsService;
    constructor(supabase, datasetsService) {
        this.supabase = supabase;
        this.datasetsService = datasetsService;
    }
    tableName = 'dashboards';
    shareTableName = 'dashboard_shares';
    async create(ownerId, dto) {
        if (dto.datasetIds && dto.datasetIds.length > 0) {
            for (const datasetId of dto.datasetIds) {
                await this.datasetsService.findOne(ownerId, datasetId);
            }
        }
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert({
            owner_id: ownerId,
            name: dto.name,
            description: dto.description ?? null,
            dataset_ids: dto.datasetIds ?? [],
            layout: {},
            charts: [],
            is_public: false,
        })
            .select('*')
            .single();
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo crear el dashboard');
        }
        if (!data) {
            throw new common_1.InternalServerErrorException('No se pudo crear el dashboard');
        }
        return this.toEntity(data);
    }
    async findAll(ownerId, skip = 0, limit = 10) {
        const rangeStart = skip;
        const rangeEnd = skip + limit - 1;
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('owner_id', ownerId)
            .order('updated_at', { ascending: false })
            .range(rangeStart, rangeEnd);
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudieron listar los dashboards');
        }
        return (data ?? []).map((row) => this.toEntity(row));
    }
    async countByUser(ownerId) {
        const { count, error } = await this.supabase
            .from(this.tableName)
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', ownerId);
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo contar los dashboards');
        }
        return count ?? 0;
    }
    async findOne(ownerId, id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .eq('owner_id', ownerId)
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo obtener el dashboard');
        }
        if (!data) {
            throw new common_1.NotFoundException('Dashboard no encontrado');
        }
        return this.toEntity(data);
    }
    async update(ownerId, id, dto) {
        const { datasetIds, ...rest } = dto;
        if (datasetIds && datasetIds.length > 0) {
            for (const datasetId of datasetIds) {
                await this.datasetsService.findOne(ownerId, datasetId);
            }
        }
        const updatePayload = { ...rest };
        if (datasetIds) {
            updatePayload.dataset_ids = datasetIds;
        }
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update(updatePayload)
            .eq('id', id)
            .eq('owner_id', ownerId)
            .select('*')
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo actualizar el dashboard');
        }
        if (!data) {
            throw new common_1.NotFoundException('Dashboard no encontrado');
        }
        return this.toEntity(data);
    }
    async share(ownerId, id, isPublic) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update({ is_public: isPublic })
            .eq('id', id)
            .eq('owner_id', ownerId)
            .select('*')
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo compartir el dashboard');
        }
        if (!data) {
            throw new common_1.NotFoundException('Dashboard no encontrado');
        }
        return this.toEntity(data);
    }
    async remove(ownerId, id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id)
            .eq('owner_id', ownerId)
            .select('id')
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo eliminar el dashboard');
        }
        if (!data) {
            throw new common_1.NotFoundException('Dashboard no encontrado');
        }
    }
    async shareWithContact(ownerId, id, dto) {
        const dashboard = await this.findOne(ownerId, id);
        const contact = dto.contact.trim();
        if (dto.channel === share_dashboard_dto_1.ShareChannel.EMAIL) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contact)) {
                throw new common_1.BadRequestException('El correo electrónico no es válido');
            }
        }
        if (dto.channel === share_dashboard_dto_1.ShareChannel.SMS) {
            const phoneRegex = /^[+]?\d[\d\s-]{7,15}$/;
            if (!phoneRegex.test(contact)) {
                throw new common_1.BadRequestException('El número de teléfono no es válido');
            }
        }
        const { data, error } = await this.supabase
            .from(this.shareTableName)
            .insert({
            dashboard_id: dashboard.id,
            owner_id: ownerId,
            channel: dto.channel,
            contact,
            message: dto.message ?? null,
            status: 'pending',
        })
            .select('*')
            .single();
        if (error || !data) {
            throw new common_1.InternalServerErrorException('No se pudo registrar la invitación de compartido');
        }
        if (dto.makePublic === true && !dashboard.isPublic) {
            await this.share(ownerId, id, true);
        }
        return this.toShareEntity(data);
    }
    async export(ownerId, id, format) {
        const dashboard = await this.findOne(ownerId, id);
        if (format === 'json') {
            return dashboard;
        }
        const doc = new pdfkit_1.default({ margin: 48, size: 'A4' });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        const completion = new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (error) => reject(error));
        });
        doc.fontSize(20).text(dashboard.name, { underline: false });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#4b5563').text(`Última actualización: ${new Date(dashboard.updatedAt).toLocaleString('es-ES')}`);
        doc.moveDown(1);
        if (dashboard.description) {
            doc.fontSize(12).fillColor('#0f172a').text(dashboard.description, {
                align: 'left',
            });
            doc.moveDown(1);
        }
        doc.fillColor('#1f2937').fontSize(14).text('Datasets asociados', { underline: true });
        doc.moveDown(0.5);
        if (dashboard.datasetIds.length === 0) {
            doc.fontSize(12).fillColor('#475569').text('Sin datasets vinculados.');
        }
        else {
            dashboard.datasetIds.forEach((datasetId, index) => {
                doc.fontSize(12).fillColor('#1f2937').text(`${index + 1}. ${datasetId}`);
            });
        }
        doc.moveDown(1);
        doc.fillColor('#1f2937').fontSize(14).text('Visualizaciones', { underline: true });
        doc.moveDown(0.5);
        if (dashboard.charts.length === 0) {
            doc.fontSize(12).fillColor('#475569').text('Sin visualizaciones registradas.');
        }
        else {
            dashboard.charts.forEach((chart, index) => {
                doc.fontSize(12).fillColor('#1f2937').text(`${index + 1}. ${chart.type}`);
                doc.fontSize(10).fillColor('#475569').text(JSON.stringify(chart.config ?? {}, null, 2), {
                    align: 'left',
                });
                doc.moveDown(0.5);
            });
        }
        doc.end();
        return completion;
    }
    toEntity(row) {
        return {
            id: row.id,
            ownerId: row.owner_id,
            name: row.name,
            description: row.description ?? undefined,
            datasetIds: row.dataset_ids ?? [],
            layout: row.layout ?? {},
            charts: row.charts ?? [],
            isPublic: row.is_public,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    toShareEntity(row) {
        return {
            id: row.id,
            dashboardId: row.dashboard_id,
            ownerId: row.owner_id,
            channel: row.channel,
            contact: row.contact,
            message: row.message ?? undefined,
            status: row.status,
            createdAt: row.created_at,
        };
    }
};
exports.DashboardsService = DashboardsService;
exports.DashboardsService = DashboardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(supabase_constants_1.SUPABASE_DATA_CLIENT)),
    __metadata("design:paramtypes", [supabase_js_1.SupabaseClient,
        datasets_service_1.DatasetsService])
], DashboardsService);
//# sourceMappingURL=dashboards.service.js.map