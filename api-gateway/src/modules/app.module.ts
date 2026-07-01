import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule } from '@nestjs/microservices';
import { LoggerModule, CorrelationIdMiddleware } from '@platform/shared-common';
import { getGrpcClientOptions } from '@platform/shared-sdk';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ProxyController } from '../presentation/proxy.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    LoggerModule,
    // Connect to identity-service over gRPC
    ClientsModule.registerAsync([
      {
        name: 'IDENTITY_GRPC_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const url = configService.get<string>('IDENTITY_GRPC_URL', 'localhost:50051');
          return getGrpcClientOptions('IDENTITY', url);
        },
      },
    ]),
  ],
  controllers: [ProxyController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'docs', method: RequestMethod.GET },
        { path: 'identity/login', method: RequestMethod.POST },
        { path: 'identity/register', method: RequestMethod.POST }
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
