import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { LearningModule } from './learning/learning.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulerModule } from './schedule/schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
        synchronize: true, // Set to false in production
        charset: 'utf8mb4',
        timezone: 'local',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    OrganisationsModule,
    LearningModule,
    SchedulerModule,
  ],
})
export class AppModule {}