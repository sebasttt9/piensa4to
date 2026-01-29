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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const roles_enum_1 = require("../common/constants/roles.enum");
const supabase_constants_1 = require("../database/supabase.constants");
const supabase_js_1 = require("@supabase/supabase-js");
let UsersService = class UsersService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    tableName = 'users';
    async create(createUserDto) {
        try {
            const email = createUserDto.email.toLowerCase();
            const existing = await this.findByEmail(email);
            if (existing) {
                throw new common_1.ConflictException('El correo ya está registrado');
            }
            const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert({
                email,
                name: createUserDto.name,
                role: createUserDto.role ?? roles_enum_1.UserRole.User,
                password_hash: hashedPassword,
            })
                .select()
                .single();
            if (error) {
                console.error('Error de Supabase al insertar usuario:', error);
                if (error.code === '23505') {
                    throw new common_1.ConflictException('El correo ya está registrado');
                }
                throw new common_1.InternalServerErrorException('No se pudo crear el usuario');
            }
            if (!data) {
                throw new common_1.InternalServerErrorException('No se pudo crear el usuario');
            }
            return this.toUserEntity(data);
        }
        catch (error) {
            console.error('Error creando usuario:', error);
            console.error('Detalles del error:', error.message, error.details, error.hint);
            throw new common_1.InternalServerErrorException('No se pudo crear el usuario');
        }
    }
    async findAll() {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudieron listar los usuarios');
        }
        return (data ?? []).map((row) => this.toPublicUser(row));
    }
    async findById(id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo obtener el usuario');
        }
        if (!data) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return this.toPublicUser(data);
    }
    async findByEmail(email) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('email', email.toLowerCase())
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo consultar el usuario');
        }
        if (!data) {
            return null;
        }
        return this.toUserEntity(data);
    }
    async update(id, changes) {
        if (changes.email) {
            const existing = await this.supabase
                .from(this.tableName)
                .select('id')
                .eq('email', changes.email.toLowerCase())
                .neq('id', id)
                .maybeSingle();
            if (existing.data) {
                throw new common_1.ConflictException('El correo ya está registrado');
            }
            if (existing.error && existing.error.code !== 'PGRST116') {
                throw new common_1.InternalServerErrorException('No se pudo actualizar el usuario');
            }
        }
        const updatePayload = {};
        if (changes.email) {
            updatePayload.email = changes.email.toLowerCase();
        }
        if (changes.password) {
            updatePayload.password_hash = await bcrypt.hash(changes.password, 12);
        }
        if (changes.name) {
            updatePayload.name = changes.name;
        }
        if (changes.role) {
            updatePayload.role = changes.role;
        }
        if (Object.keys(updatePayload).length === 0) {
            return this.findById(id);
        }
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update(updatePayload)
            .eq('id', id)
            .select('*')
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo actualizar el usuario');
        }
        if (!data) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return this.toPublicUser(data);
    }
    async remove(id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id)
            .select('id')
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException('No se pudo eliminar el usuario');
        }
        if (!data) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
    }
    toPublicUser(row) {
        const entity = this.toUserEntity(row);
        const { passwordHash, ...rest } = entity;
        return rest;
    }
    toUserEntity(row) {
        return {
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            passwordHash: row.password_hash,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(supabase_constants_1.SUPABASE_CLIENT)),
    __metadata("design:paramtypes", [supabase_js_1.SupabaseClient])
], UsersService);
//# sourceMappingURL=users.service.js.map