import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './modules/app.module';
import { getGrpcClientOptions } from '@platform/shared-sdk';
import { LoggerService, HttpExceptionFilter } from '@platform/shared-common';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = await app.resolve(LoggerService);
  logger.setContext('TenantService');
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Connect gRPC microservice
  const grpcUrl = process.env.GRPC_URL || 'localhost:50053';
  app.connectMicroservice<MicroserviceOptions>(
    getGrpcClientOptions('TENANT', grpcUrl)
  );

  // Start microservices
  await app.startAllMicroservices();
  
  // Start REST
  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  logger.log(`Tenant Service REST running on port ${port}`);
  logger.log(`Tenant Service gRPC running on ${grpcUrl}`);
}
bootstrap();
