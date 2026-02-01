import { Inject, Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/constants/roles.enum';
import { SUPABASE_CLIENT, SUPABASE_DATA_CLIENT } from '../database/supabase.constants';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserEntity } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AssignOrganizationDto } from './dto/assign-organization.dto';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
  approved: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    @Inject(SUPABASE_DATA_CLIENT)
    private readonly supabaseData: SupabaseClient,
  ) { }

  private readonly tableName = 'users';

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      const email = createUserDto.email.toLowerCase();
      const existing = await this.findByEmail(email);
      if (existing) {
        throw new ConflictException('El correo ya está registrado');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          email,
          name: createUserDto.name,
          role: createUserDto.role ?? UserRole.User,
          password_hash: hashedPassword,
          approved: createUserDto.role === UserRole.SuperAdmin ? true : false,
          organization_id: createUserDto.organizationId ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error de Supabase al insertar usuario:', error);
        if (error.code === '23505') {
          throw new ConflictException('El correo ya está registrado');
        }
        throw new InternalServerErrorException('No se pudo crear el usuario');
      }

      if (!data) {
        throw new InternalServerErrorException('No se pudo crear el usuario');
      }

      return this.toUserEntity(data as UserRow);
    } catch (error) {
      console.error('Error creando usuario:', error);
      console.error('Detalles del error:', error.message, error.details, error.hint);
      throw new InternalServerErrorException('No se pudo crear el usuario');
    }
  }

  async findAll(): Promise<Array<Omit<UserEntity, 'passwordHash'>>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('No se pudieron listar los usuarios');
    }

    return ((data ?? []) as UserRow[]).map((row) => this.toPublicUser(row));
  }

  async findById(id: string): Promise<Omit<UserEntity, 'passwordHash'>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el usuario');
    }

    if (!data) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toPublicUser(data as UserRow);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el usuario');
    }

    if (!data) {
      return null;
    }

    return this.toUserEntity(data as UserRow);
  }

  async update(id: string, changes: UpdateUserDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    if (changes.email) {
      const existing = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('email', changes.email.toLowerCase())
        .neq('id', id)
        .maybeSingle();

      if (existing.data) {
        throw new ConflictException('El correo ya está registrado');
      }
      if (existing.error && existing.error.code !== 'PGRST116') {
        throw new InternalServerErrorException('No se pudo actualizar el usuario');
      }
    }

    const updatePayload: Record<string, unknown> = {};
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
    if (changes.approved !== undefined) {
      updatePayload.approved = changes.approved;
    }
    if (changes.organizationId !== undefined) {
      updatePayload.organization_id = changes.organizationId ?? null;
    }

    if (Object.keys(updatePayload).length === 0) {
      return this.findById(id);
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el usuario');
    }

    if (!data) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toPublicUser(data as UserRow);
  }

  async assignOrganization(id: string, dto: AssignOrganizationDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    const { data: orgData, error: orgError } = await this.supabaseData
      .from('organizations')
      .select('id')
      .eq('id', dto.organizationId)
      .maybeSingle();

    if (orgError) {
      throw new InternalServerErrorException('No se pudo verificar la organización');
    }

    if (!orgData) {
      throw new NotFoundException('Organización no encontrada');
    }

    const approve = dto.approve ?? (dto.makeAdmin ? true : undefined);

    const updatePayload: Record<string, unknown> = {
      organization_id: dto.organizationId,
      updated_at: new Date().toISOString(),
    };

    if (dto.makeAdmin) {
      updatePayload.role = UserRole.Admin;
    }

    if (approve !== undefined) {
      updatePayload.approved = approve;
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo asignar la organización al usuario');
    }

    if (!data) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toPublicUser(data as UserRow);
  }

  async updateProfile(id: string, changes: UpdateProfileDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    const updatePayload: Record<string, unknown> = {};

    if (changes.name) {
      updatePayload.name = changes.name;
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
      throw new InternalServerErrorException('No se pudo actualizar el perfil');
    }

    if (!data) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toPublicUser(data as UserRow);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el usuario');
    }

    if (!data) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const userRow = data as UserRow;
    const isValid = await bcrypt.compare(currentPassword, userRow.password_hash ?? '');
    if (!isValid) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const { error: updateError } = await this.supabase
      .from(this.tableName)
      .update({ password_hash: hashedPassword })
      .eq('id', id);

    if (updateError) {
      throw new InternalServerErrorException('No se pudo actualizar la contraseña');
    }
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo eliminar el usuario');
    }

    if (!data) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  private toPublicUser(row: UserRow): Omit<UserEntity, 'passwordHash'> {
    const entity = this.toUserEntity(row);
    const { passwordHash, ...rest } = entity;
    return rest;
  }

  private toUserEntity(row: UserRow): UserEntity {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      passwordHash: row.password_hash,
      approved: row.approved,
      organizationId: row.organization_id ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
