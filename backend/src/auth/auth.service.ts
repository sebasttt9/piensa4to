import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/schemas/user.schema';
import type { SignOptions } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtExpiration: SignOptions['expiresIn'];

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.jwtExpiration = (configService.get<string>('auth.jwtExpiration') ?? '1h') as SignOptions['expiresIn'];
  }

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: Record<string, unknown> }> {
    const user = await this.usersService.create(dto);
    const accessToken = this.buildToken(user);
    return { accessToken, user: this.sanitizeUser(user) };
  }

  async login({ email, password }: LoginDto): Promise<{ accessToken: string; user: Record<string, unknown> }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = this.buildToken(user);
    return { accessToken, user: this.sanitizeUser(user) };
  }

  private buildToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.jwtExpiration,
    });
  }

  private sanitizeUser(user: UserDocument): Record<string, unknown> {
    const plain = user.toObject({ versionKey: false, virtuals: true }) as Record<string, unknown>;
    delete plain['password'];
    plain['id'] = (plain['id'] as string | undefined) ?? user._id.toString();
    if ('_id' in plain) {
      delete plain['_id'];
    }
    return plain;
  }
}
