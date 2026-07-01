import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { BaseEvent } from '@platform/shared-contracts';

@Controller()
export class AuditLogConsumer {
  @EventPattern('user.*')
  handleUserEvents(@Payload() event: BaseEvent) {
    console.log('[Audit Service] Logged User Event:', event);
  }

  @EventPattern('tenant.*')
  handleTenantEvents(@Payload() event: BaseEvent) {
    console.log('[Audit Service] Logged Tenant Event:', event);
  }
}
