import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { LearningPath } from './entities/learning-path.entity';
import { LearningPathModule } from './entities/learning-module.entity';
import { MediaContent } from './entities/media-content.entity';
import { Certification } from './entities/certification.entity';
import { Progress } from './entities/progress.entity';
import { OrganisationLearningPath } from './entities/organisation-learning-path.entity';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { User } from '../users/users.entity';
import { Organisation} from '../organisations/organisations.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningPath,
      LearningPathModule,
      MediaContent,
      Certification,
      Progress,
      OrganisationLearningPath,
      User,
      Organisation,
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
          cb(null, file.fieldname + '-' + uniqueSuffix)
        }
      })
    }),
  ],
  controllers: [LearningController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}
