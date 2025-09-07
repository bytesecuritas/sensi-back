import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/users.entity';
import { Organisation } from '../organisations/organisations.entity';
import { Progress } from '../learning/entities/progress.entity';
import { LearningPath } from '../learning/entities/learning-path.entity';
import { LearningPathModule } from '../learning/entities/learning-module.entity';
import { MediaContent } from '../learning/entities/media-content.entity';
import { OrganisationLearningPath } from '../learning/entities/organisation-learning-path.entity';
import { Certification } from '../learning/entities/certification.entity';
import { UserLevel } from '../learning/entities/user-level.entity';
import { UserBadge } from '../learning/entities/user-badge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organisation,
      Progress,
      LearningPath,
      LearningPathModule,
      MediaContent,
      OrganisationLearningPath,
      Certification,
      UserLevel,
      UserBadge,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
