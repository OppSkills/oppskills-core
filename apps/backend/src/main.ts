import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import type { Request } from 'express';
import { AppModule } from './app.module';

// Patch BigInt to serialize as Number (safe for < 2^53)
// This is required because Prisma returns BigInt for certain numeric types (like counts)
// and Express/JSON.stringify fails to serialize BigInt by default.
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body parser limits for large file uploads (bulk import)
  app.use(
    json({
      limit: '150mb',
      verify: (req: Request, _res, buf, _encoding) => {
        if (req.originalUrl?.startsWith('/webhooks/razorpay')) {
          (req as Request & { rawBody?: Buffer }).rawBody = buf;
        }
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: '150mb' }));

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
      ? [
        'https://oppskills.com',
        'https://www.oppskills.com',
        // If the app is hosted on a subdomain (common), allow it explicitly.
        'https://app.oppskills.com',
      ]
      : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        'https://oppskills.com',
        'https://www.oppskills.com',
        'https://app.oppskills.com',
        "https://admin.oppskills.com"
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

      // Properly reject CORS request with false, not an error
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(null, false);
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
