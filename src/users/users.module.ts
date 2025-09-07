import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { Organisation } from '../organisations/organisations.entity';
import { Progress } from '../learning/entities/progress.entity';
import { Certification } from '../learning/entities/certification.entity';
import { UserLevel } from '../learning/entities/user-level.entity';
import { UserBadge } from '../learning/entities/user-badge.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organisation, Progress, Certification, UserLevel, UserBadge]), forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}