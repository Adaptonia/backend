import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service'; // <- Import PrismaService
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Adaptonia API')
    .setDescription('API for onboarding and authentication')
    .setVersion('1.0')
    .addBearerAuth() // Enables JWT auth testing in Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Swagger UI available at /docs

  // Graceful shutdown for Prisma
  const prismaService = app.get(PrismaService);
  // await prismaService.enableShutdownHooks(app);

  app.use(cookieParser()); 
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true
  })

  // Start server
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
