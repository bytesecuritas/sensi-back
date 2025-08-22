import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LearningService } from '../learning/learning.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningPath } from 'src/learning/entities/learning-path.entity';
import { LearningPathModule } from 'src/learning/entities/learning-module.entity';
import { Certification } from 'src/learning/entities/certification.entity';
import { Progress } from 'src/learning/entities/progress.entity';
import { MediaContent } from 'src/learning/entities/media-content.entity';
import { User } from 'src/users/users.entity';
import { Organisation } from 'src/organisations/organisations.entity';
import { OrganisationLearningPath } from 'src/learning/entities/organisation-learning-path.entity';

@Module({
  imports: [ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      LearningPath,
      LearningPathModule,
      MediaContent,
      Certification,
      Progress,
      User,
      Organisation,
      OrganisationLearningPath
    ])
  ],
  providers: [LearningService],
})
export class SchedulerModule {
  constructor(private readonly learningService: LearningService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    await this.learningService.cleanTempFiles();
  }
}