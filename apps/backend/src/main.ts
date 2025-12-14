import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
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

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,PATCH',
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
