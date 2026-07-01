import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { CurrentUserDto } from '../decorators/user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
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

    if (!user || !user.permissions) {
      return false;
    }

    return requiredPermissions.every((perm) => user.permissions.includes(perm));
  }
}
