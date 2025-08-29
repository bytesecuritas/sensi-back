import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganisationsService } from './organisations.service';
import { OrganisationsController } from './organisations.controller';
import { Organisation } from './organisations.entity';
import { User } from '../users/users.entity';
import { Progress } from '../learning/entities/progress.entity';
import { LearningPath } from '../learning/entities/learning-path.entity';
import { OrganisationLearningPath } from '../learning/entities/organisation-learning-path.entity';
import { Certification } from '../learning/entities/certification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organisation, 
      User, 
      Progress, 
      LearningPath, 
      OrganisationLearningPath, 
      Certification
    ])
  ],
  controllers: [OrganisationsController],
  providers: [OrganisationsService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
