import { Inject, Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/constants/roles.enum';
import { SUPABASE_CLIENT } from '../database/supabase.constants';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserEntity } from './entities/user.entity';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) { }

  private readonly tableName = 'users';

  async create(input: CreateUserDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    const email = input.email.toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        email,
        name: input.name,
        role: input.role ?? UserRole.User,
        password_hash: hashedPassword,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('El correo ya está registrado');
      }
      throw new InternalServerErrorException('No se pudo crear el usuario');
    }

    if (!data) {
      throw new InternalServerErrorException('No se pudo crear el usuario');
    }

    return this.toPublicUser(data as UserRow);
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
      throw new InternalServerErrorException('No se pudo actualizar el usuario');
    }

    if (!data) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toPublicUser(data as UserRow);
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
