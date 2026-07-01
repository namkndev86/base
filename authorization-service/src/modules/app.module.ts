import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule, CorrelationIdMiddleware } from '@platform/shared-common';
import { AuthorizationModule } from './authorization.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    AuthorizationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
