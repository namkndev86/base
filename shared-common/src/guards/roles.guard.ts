import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CurrentUserDto } from '../decorators/user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    // Parse current user from headers/session
    const user: CurrentUserDto = request.user || {
      id: request.headers['x-user-id'] as string,
      tenantId: request.headers['x-tenant-id'] as string,
      roles: (request.headers['x-user-roles'] as string || '').split(',').filter(Boolean),
      permissions: (request.headers['x-user-permissions'] as string || '').split(',').filter(Boolean),
    };

    if (!user || !user.roles) {
      return false;
    }

    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
