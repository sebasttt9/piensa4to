import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../constants/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const rolePriority: Record<UserRole, number> = {
      [UserRole.User]: 1,
      [UserRole.Admin]: 2,
      [UserRole.SuperAdmin]: 3,
    };

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole } | undefined;
    if (!user) {
      return false;
    }

    const userRole = user.role ?? UserRole.User;
    const userPriority = rolePriority[userRole] ?? 0;

    return requiredRoles.some((role) => {
      const requiredPriority = rolePriority[role] ?? Number.MAX_SAFE_INTEGER;
      return userPriority >= requiredPriority;
    });
  }
}
