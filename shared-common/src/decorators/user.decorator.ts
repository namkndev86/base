import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserDto {
  id: string;
  tenantId?: string;
  roles: string[];
  permissions: string[];
  email?: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserDto => {
    const request = ctx.switchToHttp().getRequest();
    
    // Check if request.user is set (local JWT validation)
    if (request.user) {
      return request.user;
    }

    // fallback to parsing headers passed by API Gateway
    const userId = request.headers['x-user-id'] as string;
    const tenantId = request.headers['x-tenant-id'] as string;
    const rolesHeader = request.headers['x-user-roles'] as string;
    const permissionsHeader = request.headers['x-user-permissions'] as string;
    const email = request.headers['x-user-email'] as string;

    const roles = rolesHeader ? rolesHeader.split(',') : [];
    const permissions = permissionsHeader ? permissionsHeader.split(',') : [];

    return {
      id: userId || 'anonymous',
      tenantId,
      roles,
      permissions,
      email,
    };
  },
);
