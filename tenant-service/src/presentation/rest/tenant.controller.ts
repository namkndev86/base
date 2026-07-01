import { Controller, Post, Get, Body, Param, UseGuards, HttpStatus } from '@nestjs/common';
import { TenantApplicationService } from '../../application/services/tenant.service';
import { JwtAuthGuard, CurrentUser, CurrentUserDto } from '@platform/shared-common';

class CreateTenantDto {
  name: string;
  subdomain: string;
  ownerEmail: string;
}

class CreateOrgDto {
  name: string;
}

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantApplicationService) {}

  @Post()
  async createTenant(@Body() dto: CreateTenantDto) {
    const data = await this.tenantService.createTenant(dto.name, dto.subdomain, dto.ownerEmail);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Tenant created successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('organization')
  @UseGuards(JwtAuthGuard)
  async createOrganization(@Body() dto: CreateOrgDto, @CurrentUser() user: CurrentUserDto) {
    const tenantId = user.tenantId || '';
    const data = await this.tenantService.createOrganization(dto.name, tenantId);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Organization created successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getTenant(@Param('id') id: string) {
    const data = await this.tenantService.getTenant(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
