import { join } from 'path';

export const IDENTITY_PROTO_PATH = join(__dirname, '../proto/identity.proto');
export const AUTHORIZATION_PROTO_PATH = join(__dirname, '../proto/authorization.proto');
export const TENANT_PROTO_PATH = join(__dirname, '../proto/tenant.proto');

export const PROTO_PACKAGE_NAMES = {
  IDENTITY: 'identity',
  AUTHORIZATION: 'authorization',
  TENANT: 'tenant',
};
export const PROTO_SERVICE_NAMES = {
  IDENTITY: 'IdentityService',
  AUTHORIZATION: 'AuthorizationService',
  TENANT: 'TenantService',
};
