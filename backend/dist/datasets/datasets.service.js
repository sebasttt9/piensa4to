"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.DatasetsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const papaparse_1 = __importDefault(require("papaparse"));
const XLSX = __importStar(require("xlsx"));
const dataset_schema_1 = require("./schemas/dataset.schema");
const analysis_service_1 = require("./analysis.service");
let DatasetsService = class DatasetsService {
    datasetModel;
    analysisService;
    configService;
    maxRowsForPreview = 1000;
    dataCache = new Map();
    constructor(datasetModel, analysisService, configService) {
        this.datasetModel = datasetModel;
        this.analysisService = analysisService;
        this.configService = configService;
    }
    async create(ownerId, dto) {
        const document = new this.datasetModel({
            owner: new mongoose_2.Types.ObjectId(ownerId),
            name: dto.name,
            description: dto.description,
            status: 'pending',
        });
        return document.save();
    }
    async uploadDataset(ownerId, datasetId, file) {
        if (!file) {
            throw new common_1.BadRequestException('Debe adjuntar un archivo CSV o Excel.');
        }
        const dataset = await this.findOne(ownerId, datasetId);
        const extension = this.resolveExtension(file.originalname);
        const rows = await this.parseFile(file, extension);
        if (rows.length === 0) {
            throw new common_1.BadRequestException('El archivo no contiene registros.');
        }
        const previewLimit = this.configService.get('uploads.previewLimit', 50) ?? 50;
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        this.dataCache.set(datasetId, rows);
        dataset.filename = file.originalname;
        dataset.fileSize = file.size;
        dataset.fileType = extension;
        dataset.rowCount = rows.length;
        dataset.columnCount = columns.length;
        dataset.preview = rows.slice(0, previewLimit);
        dataset.status = 'processed';
        return dataset.save();
    }
    async update(ownerId, datasetId, dto) {
        const dataset = await this.findOne(ownerId, datasetId);
        if (dto.name) {
            dataset.name = dto.name;
        }
        if (dto.description !== undefined) {
            dataset.description = dto.description;
        }
        return dataset.save();
    }
    async findAll(ownerId, skip = 0, limit = 10) {
        return this.datasetModel
            .find({ owner: ownerId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }
    async countByUser(ownerId) {
        return this.datasetModel.countDocuments({ owner: ownerId });
    }
    async findOne(ownerId, datasetId) {
        const dataset = await this.datasetModel
            .findOne({ _id: datasetId, owner: ownerId })
            .exec();
        if (!dataset) {
            throw new common_1.NotFoundException('Dataset no encontrado');
        }
        return dataset;
    }
    async getPreview(datasetId, limit = 50) {
        const cached = this.dataCache.get(datasetId);
        if (cached) {
            return cached.slice(0, limit);
        }
        const dataset = await this.datasetModel.findById(datasetId);
        return dataset?.preview?.slice(0, limit) || [];
    }
    async remove(ownerId, datasetId) {
        const result = await this.datasetModel.deleteOne({
            _id: datasetId,
            owner: ownerId,
        });
        if (!result.deletedCount) {
            throw new common_1.NotFoundException('Dataset no encontrado');
        }
        this.dataCache.delete(datasetId);
    }
    resolveExtension(fileName) {
        const lower = fileName.toLowerCase();
        if (lower.endsWith('.csv')) {
            return 'csv';
        }
        if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
            return 'xlsx';
        }
        throw new common_1.BadRequestException('Formato no soportado. Use CSV o Excel.');
    }
    async parseFile(file, extension) {
        if (extension === 'csv') {
            const content = file.buffer.toString('utf-8');
            const parsed = papaparse_1.default.parse(content, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
            });
            if (parsed.errors.length > 0) {
                throw new common_1.BadRequestException(`Error al procesar CSV: ${parsed.errors[0].message}`);
            }
            return parsed.data;
        }
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            return [];
        }
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,
        });
        return data;
    }
};
exports.DatasetsService = DatasetsService;
exports.DatasetsService = DatasetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(dataset_schema_1.Dataset.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        analysis_service_1.AnalysisService,
        config_1.ConfigService])
], DatasetsService);
//# sourceMappingURL=datasets.service.js.map