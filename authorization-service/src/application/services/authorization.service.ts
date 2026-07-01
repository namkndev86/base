import { Injectable, NotFoundException } from '@nestjs/common';
import { NatsClientService } from '@platform/shared-sdk';

interface UserRoleRecord {
  userId: string;
  roleName: string;
  tenantId: string | null;
}

interface PolicyRecord {
  name: string;
  roleName: string;
  effect: 'ALLOW' | 'DENY';
  actions: string[]; // e.g. ["read", "write"] or ["*"]
  resources: string[]; // e.g. ["document"] or ["*"]
  rules?: any; // ABAC conditions
}

@Injectable()
export class AuthorizationApplicationService {
  // Pre-seed some roles and rules for simulation
  private userRoles: UserRoleRecord[] = [
    { userId: 'admin-id', roleName: 'ADMIN', tenantId: null },
    { userId: 'tenant-admin-id', roleName: 'TENANT_ADMIN', tenantId: 'tenant-1' },
    { userId: 'user-id', roleName: 'USER', tenantId: 'tenant-1' },
  ];

  private policies: PolicyRecord[] = [
    {
      name: 'GlobalAdminPolicy',
      roleName: 'ADMIN',
      effect: 'ALLOW',
      actions: ['*'],
      resources: ['*'],
    },
    {
      name: 'TenantAdminPolicy',
      roleName: 'TENANT_ADMIN',
      effect: 'ALLOW',
      actions: ['read', 'write', 'delete'],
      resources: ['*'],
    },
    {
      name: 'UserReadPolicy',
      roleName: 'USER',
      effect: 'ALLOW',
      actions: ['read'],
      resources: ['profile', 'document'],
    },
  ];

  constructor(private readonly natsClient: NatsClientService) {}

  async checkPermission(userId: string, permission: string, tenantId?: string): Promise<boolean> {
    // Standard format for permissions is "action:resource" e.g., "read:document"
    const parts = permission.split(':');
    const action = parts[0];
    const resource = parts[1] || '*';

    // 1. Get roles for user
    const roles = this.userRoles.filter(
      (ur) => ur.userId === userId && (ur.tenantId === null || ur.tenantId === tenantId)
    );

    if (roles.length === 0) {
      return false; // No roles assigned
    }

    // 2. Collect policies for these roles
    const userPolicies = this.policies.filter((p) =>
      roles.some((r) => r.roleName === p.roleName)
    );

    let allowed = false;

    // 3. Evaluate policies
    for (const policy of userPolicies) {
      const actionMatches = policy.actions.includes('*') || policy.actions.includes(action);
      const resourceMatches = policy.resources.includes('*') || policy.resources.includes(resource);

      if (actionMatches && resourceMatches) {
        // Evaluate ABAC rules if they exist
        let rulePassed = true;
        if (policy.rules) {
          // Dynamic evaluation: compare rule properties
          // e.g. rule: { tenantId: "context.tenantId" }
          if (policy.rules.tenantId === 'context.tenantId' && tenantId) {
            // Context matches
            rulePassed = true;
          } else {
            rulePassed = false;
          }
        }

        if (rulePassed) {
          if (policy.effect === 'DENY') {
            return false; // Explicit DENY overrides everything
          }
          if (policy.effect === 'ALLOW') {
            allowed = true;
          }
        }
      }
    }

    return allowed;
  }

  async getUserPermissions(userId: string, tenantId?: string): Promise<string[]> {
    const roles = this.userRoles.filter(
      (ur) => ur.userId === userId && (ur.tenantId === null || ur.tenantId === tenantId)
    );

    const userPolicies = this.policies.filter((p) =>
      roles.some((r) => r.roleName === p.roleName)
    );

    const permissions: string[] = [];
    for (const policy of userPolicies) {
      if (policy.effect === 'ALLOW') {
        policy.actions.forEach((act) => {
          policy.resources.forEach((res) => {
            permissions.push(`${act}:${res}`);
          });
        });
      }
    }

    return [...new Set(permissions)];
  }

  async assignRole(userId: string, roleName: string, tenantId?: string): Promise<void> {
    this.userRoles.push({
      userId,
      roleName,
      tenantId: tenantId || null,
    });

    await this.natsClient.emitEvent('user.role.assigned', {
      userId,
      roleName,
      tenantId,
    });
  }
}
