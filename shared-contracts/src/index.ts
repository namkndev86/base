export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
  correlationId?: string;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BaseEvent<T = any> {
  id: string;
  pattern: string;
  timestamp: string;
  correlationId: string;
  tenantId?: string;
  payload: T;
}

// User-related event payloads
export interface UserCreatedPayload {
  userId: string;
  email: string;
  tenantId?: string;
  roles: string[];
}

export interface UserDeletedPayload {
  userId: string;
  tenantId?: string;
}

// Tenant-related event payloads
export interface TenantCreatedPayload {
  tenantId: string;
  name: string;
  subdomain: string;
  ownerEmail: string;
}

// Audit-related event payloads
export interface AuditLogCreatedPayload {
  userId: string;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

// Notification payloads
export interface SendNotificationPayload {
  tenantId?: string;
  recipient: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM' | 'SLACK' | 'WEBSOCKET';
  templateName: string;
  variables: Record<string, string>;
  scheduledAt?: string;
}
