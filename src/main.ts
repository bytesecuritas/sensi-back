import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Validate required environment variables
function validateEnvironment() {
  const requiredEnvVars = ['JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
}

async function bootstrap() {
  // Validate environment before starting the app
  validateEnvironment();
  
  const app = await NestFactory.create(AppModule);

  // Configuration CORS pour permettre les requêtes cross-origin
  app.enableCors({
    origin: ['http://localhost:8081', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Préfixe global pour toutes les routes de l'API
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Sensibilisation API')
    .setDescription('Documentation Swagger de l’API de sensibilisation: authentification, organisations, apprentissage et médias')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .setContact('BytCode', 'https://bytcode.example', 'support@bytcode.example')
    .addServer('', 'API prefix')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Expose UI at /api/docs and JSON at /api/docs-json
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Sensibilisation API Docs',
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true, // ← Ceci est crucial
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
