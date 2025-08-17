import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningPath } from './entities/learning-path.entity';
import { LearningPathModule } from './entities/learning-module.entity';
import { MediaContent } from './entities/media-content.entity';
import { Certification } from './entities/certification.entity';
import { Progress } from './entities/progress.entity';
import { OrganisationLearningPath } from './entities/organisation-learning-path.entity';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningPath,
      LearningPathModule,
      MediaContent,
      Certification,
      Progress,
      OrganisationLearningPath,
    ]),
  ],
  controllers: [LearningController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}
