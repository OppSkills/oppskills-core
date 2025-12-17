import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // reject unknown fields
      transform: true, // enable class-transformer (@Type) for nested DTOs
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  /**
   * CORS
   *
   * Production frontend: https://oppskills.com
   * Keep localhost enabled for development.
   */
  const allowedOrigins: string[] =
    process.env.NODE_ENV === 'production'
      ? ['https://oppskills.com', 'https://www.oppskills.com']
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'https://oppskills.com',
          'https://www.oppskills.com',
        ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      // Allow same-origin / server-to-server / tools like curl (no Origin header).
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('OppSkills API')
    .setDescription(
      'OppSkills API Documentation - Manage hackathons, festivals, and teams',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Clerk JWT token',
      },
      'clerk-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-reference', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
