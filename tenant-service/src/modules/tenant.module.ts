import { Module } from '@nestjs/common';
import { TenantApplicationService } from '../application/services/tenant.service';
import { TenantController } from '../presentation/rest/tenant.controller';
import { TenantGrpcController } from '../presentation/grpc/tenant-grpc.controller';
import { NatsClientModule } from '@platform/shared-sdk';

@Module({
  imports: [NatsClientModule],
  controllers: [TenantController, TenantGrpcController],
  providers: [TenantApplicationService],
  exports: [TenantApplicationService],
})
export class TenantModule {}
