import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Learning API')
    .setDescription('API for managing learning media content')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe({
    transform: true, // ← Ceci est crucial
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
