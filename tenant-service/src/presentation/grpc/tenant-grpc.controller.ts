import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TenantApplicationService } from '../../application/services/tenant.service';

interface GetTenantRequest {
  tenantId: string;
}

interface ValidateTenantRequest {
  subdomain: string;
}

@Controller()
export class TenantGrpcController {
  constructor(private readonly tenantService: TenantApplicationService) {}

  @GrpcMethod('TenantService', 'GetTenant')
  async getTenant(data: GetTenantRequest) {
    const tenant = await this.tenantService.getTenant(data.tenantId);
    return {
      tenantId: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      status: tenant.status,
    };
  }

  @GrpcMethod('TenantService', 'ValidateTenant')
  async validateTenant(data: ValidateTenantRequest) {
    return this.tenantService.validateTenant(data.subdomain);
  }
}
