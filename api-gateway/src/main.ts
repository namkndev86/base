import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { HttpExceptionFilter } from '@platform/shared-common';
import { LoggerService } from '@platform/shared-common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup structured logger
  const logger = await app.resolve(LoggerService);
  logger.setContext('ApiGateway');
  app.useLogger(logger);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable API Versioning (/v1, /v2)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Enterprise Core Platform API Gateway')
    .setDescription('Gateway API definition for Core Platform Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`API Gateway is running on port ${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/docs`);
}
bootstrap();
