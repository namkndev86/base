import { Module } from '@nestjs/common';
import { IdentityApplicationService } from '../application/services/identity.service';
import { PrismaUserRepository } from '../infrastructure/repositories/prisma-user.repository';
import { JwtService } from '../infrastructure/security/jwt.service';
import { IdentityController } from '../presentation/rest/identity.controller';
import { IdentityGrpcController } from '../presentation/grpc/identity-grpc.controller';
import { NatsClientModule } from '@platform/shared-sdk';

@Module({
  imports: [NatsClientModule],
  controllers: [IdentityController, IdentityGrpcController],
  providers: [
    IdentityApplicationService,
    JwtService,
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
  ],
  exports: [IdentityApplicationService, 'IUserRepository'],
})
export class IdentityModule {}
