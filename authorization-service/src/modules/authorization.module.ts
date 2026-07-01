import { Module } from '@nestjs/common';
import { AuthorizationApplicationService } from '../application/services/authorization.service';
import { AuthorizationController } from '../presentation/rest/authorization.controller';
import { AuthorizationGrpcController } from '../presentation/grpc/authorization-grpc.controller';
import { NatsClientModule } from '@platform/shared-sdk';

@Module({
  imports: [NatsClientModule],
  controllers: [AuthorizationController, AuthorizationGrpcController],
  providers: [AuthorizationApplicationService],
  exports: [AuthorizationApplicationService],
})
export class AuthorizationModule {}
