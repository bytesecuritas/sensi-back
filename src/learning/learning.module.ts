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
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { Reponse } from './entities/reponse.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UserLevel } from './entities/user-level.entity';
import { Simulation } from './entities/simulation.entity';
import { SimulationResponse } from './entities/simulation-response.entity';
import { Challenge } from './entities/challenge.entity';
import { ChallengeParticipation } from './entities/challenge-participation.entity';
import { CyberAlert } from './entities/cyber-alert.entity';
import { AlertShare } from './entities/alert-share.entity';
import { ChatbotConversation } from './entities/chatbot-conversation.entity';
import { ChatbotMessage } from './entities/chatbot-message.entity';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { SimulationService } from './simulation.service';
import { ChatbotService } from './chatbot.service';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
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
      Quiz,
      Question,
      Reponse,
      QuizResponse,
      Badge,
      UserBadge,
      UserLevel,
      Simulation,
      SimulationResponse,
      Challenge,
      ChallengeParticipation,
      CyberAlert,
      AlertShare,
      ChatbotConversation,
      ChatbotMessage,
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
  controllers: [LearningController, GamificationController, CertificateController],
  providers: [LearningService, GamificationService, SimulationService, ChatbotService, CertificateService],
  exports: [LearningService, GamificationService, SimulationService, ChatbotService, CertificateService],
})
export class LearningModule {}
