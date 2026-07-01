import { Controller, Post, Get, Body, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthorizationApplicationService } from '../../application/services/authorization.service';
import { JwtAuthGuard, PermissionsGuard, Permissions } from '@platform/shared-common';

class AssignRoleDto {
  userId: string;
  roleName: string;
  tenantId?: string;
}

@Controller('authorization')
export class AuthorizationController {
  constructor(private readonly authService: AuthorizationApplicationService) {}

  @Post('assign-role')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('write:roles')
  @HttpCode(HttpStatus.OK)
  async assignRole(@Body() dto: AssignRoleDto) {
    await this.authService.assignRole(dto.userId, dto.roleName, dto.tenantId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Role '${dto.roleName}' assigned to user successful`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  async getPermissions(@Query('userId') userId: string, @Query('tenantId') tenantId?: string) {
    const data = await this.authService.getUserPermissions(userId, tenantId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
