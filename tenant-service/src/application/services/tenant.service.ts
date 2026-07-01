import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { NatsClientService } from '@platform/shared-sdk';

export interface TenantRecord {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  tenantId: string;
}

@Injectable()
export class TenantApplicationService {
  private tenants: TenantRecord[] = [
    { id: 'tenant-1', name: 'Acme Corp', subdomain: 'acme', status: 'ACTIVE' },
    { id: 'tenant-2', name: 'Globex Corp', subdomain: 'globex', status: 'ACTIVE' },
  ];

  private organizations: OrganizationRecord[] = [];

  constructor(private readonly natsClient: NatsClientService) {}

  async createTenant(name: string, subdomain: string, ownerEmail: string) {
    const existing = this.tenants.find((t) => t.subdomain.toLowerCase() === subdomain.toLowerCase());
    if (existing) {
      throw new ConflictException('Subdomain is already taken');
    }

    const newTenant: TenantRecord = {
      id: `t-${Math.random().toString(36).substr(2, 9)}`,
      name,
      subdomain: subdomain.toLowerCase(),
      status: 'ACTIVE',
    };

    this.tenants.push(newTenant);

    // Emit TenantCreatedEvent via NATS
    await this.natsClient.emitEvent('tenant.created', {
      tenantId: newTenant.id,
      name: newTenant.name,
      subdomain: newTenant.subdomain,
      ownerEmail,
    });

    return newTenant;
  }

  async getTenant(tenantId: string) {
    const tenant = this.tenants.find((t) => t.id === tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async validateTenant(subdomain: string) {
    const tenant = this.tenants.find((t) => t.subdomain.toLowerCase() === subdomain.toLowerCase());
    if (!tenant || tenant.status !== 'ACTIVE') {
      return { isValid: false, tenantId: '' };
    }
    return { isValid: true, tenantId: tenant.id };
  }

  async createOrganization(name: string, tenantId: string) {
    const tenant = await this.getTenant(tenantId);
    const newOrg: OrganizationRecord = {
      id: `o-${Math.random().toString(36).substr(2, 9)}`,
      name,
      tenantId: tenant.id,
    };
    this.organizations.push(newOrg);
    return newOrg;
  }
}
