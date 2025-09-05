import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { LearningModule } from './learning/learning.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { SchedulerModule } from './schedule/schedule.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 10, // 10 requests per minute
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST') ?? 'localhost',
        port: Number(configService.get<string>('DB_PORT')) || 3306,
        username: configService.get<string>('DB_USERNAME') ?? 'root',
        password: configService.get<string>('DB_PASSWORD') ?? '',
        database: configService.get<string>('DB_DATABASE') ?? 'sensibilisation',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Temporairement désactivé pour éviter les erreurs MySQL
        charset: 'utf8mb4',
        timezone: 'local',
        extra: {
          charset: 'utf8mb4_unicode_ci',
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    OrganisationsModule,
    LearningModule,
    AnalyticsModule,
    SchedulerModule,
  ],
})
export class AppModule {}