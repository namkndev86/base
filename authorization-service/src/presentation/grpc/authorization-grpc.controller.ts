import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthorizationApplicationService } from '../../application/services/authorization.service';

interface CheckPermissionRequest {
  userId: string;
  permission: string;
  tenantId?: string;
}

interface GetUserPermissionsRequest {
  userId: string;
  tenantId?: string;
}

@Controller()
export class AuthorizationGrpcController {
  constructor(private readonly authService: AuthorizationApplicationService) {}

  @GrpcMethod('AuthorizationService', 'CheckPermission')
  async checkPermission(data: CheckPermissionRequest) {
    const isAllowed = await this.authService.checkPermission(data.userId, data.permission, data.tenantId);
    return { isAllowed };
  }

  @GrpcMethod('AuthorizationService', 'GetUserPermissions')
  async getUserPermissions(data: GetUserPermissionsRequest) {
    const permissions = await this.authService.getUserPermissions(data.userId, data.tenantId);
    return { permissions };
  }
}
