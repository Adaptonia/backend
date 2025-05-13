import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service'; // <- Import PrismaService
import * as cookieParser from 'cookie-parser'
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isCsrfEnabled = process.env.CSRF_ENABLED === 'true';

  console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
  console.log(`CSRF protection is ${isCsrfEnabled ? 'enabled' : 'disabled'}`);

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

  // Enable cookie parsing - must come before CSRF
  app.use(cookieParser()); 

  // Configure CORS (must be before CSRF in development)
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow frontend origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-TOKEN', 'Cookie'],
    exposedHeaders: ['X-XSRF-TOKEN'],
  });

  if (isCsrfEnabled) {
    // Create CSRF middleware only if enabled
    console.log('Setting up CSRF middleware');
    const csrfProtection = csurf({
      cookie: {
        key: 'XSRF-TOKEN',
        httpOnly: true,
        sameSite: 'lax',
        secure: !isDevelopment,
      },
      ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Apply protection to state-changing methods
    });

    

    // Apply CSRF middleware
    app.use(csrfProtection);

    // Add middleware to expose CSRF token to the frontend in a cookie
    app.use((req, res, next) => {
      try {
        // Make sure the csrfToken function exists
        if (typeof req.csrfToken === 'function') {
          // Get the token
          const token = req.csrfToken();
          
          // Set token in a non-HttpOnly cookie so frontend JS can read it
          res.cookie('XSRF-TOKEN', token, {
            httpOnly: false,
            sameSite: 'lax',
            secure: !isDevelopment,
            path: '/',
          });
        } else {
          console.warn('csrfToken function not available in request');
        }
        
        next();
      } catch (error) {
        console.error('Error in CSRF token middleware:', error);
        next(error);
      }
    });
  } else {
    console.log('CSRF protection disabled by configuration');
  }

  // Start server
  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
