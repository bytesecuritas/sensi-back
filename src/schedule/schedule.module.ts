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
import { Quiz } from 'src/learning/entities/quiz.entity';
import { Reponse } from 'src/learning/entities/reponse.entity';
import { Question } from 'src/learning/entities/question.entity';
import { QuizResponse } from 'src/learning/entities/quiz-response.entity';
import { GamificationService } from '../learning/gamification.service';
import { Badge } from 'src/learning/entities/badge.entity';
import { UserBadge } from 'src/learning/entities/user-badge.entity';
import { UserLevel } from 'src/learning/entities/user-level.entity';
import { ChallengeParticipation } from 'src/learning/entities/challenge-participation.entity';
import { Challenge } from 'src/learning/entities/challenge.entity';
import { AlertShare } from 'src/learning/entities/alert-share.entity';
import { CyberAlert } from 'src/learning/entities/cyber-alert.entity';
import { ChatbotMessage } from 'src/learning/entities/chatbot-message.entity';
import { ChatbotConversation } from 'src/learning/entities/chatbot-conversation.entity';
import { SimulationResponse } from 'src/learning/entities/simulation-response.entity';
import { Simulation } from 'src/learning/entities/simulation.entity';
import { CertificateService } from 'src/learning/certificate.service';

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
      OrganisationLearningPath,
      Quiz,
      Reponse,
      Question,
      QuizResponse,
      Badge,
      UserBadge,
      UserLevel,
      SimulationResponse,
      ChallengeParticipation,
      Challenge,
      CyberAlert,
      AlertShare,
      ChatbotConversation,
      ChatbotMessage,
      Simulation,
      Certification
    ])  
  ],
  providers: [LearningService, GamificationService, CertificateService],
})
export class SchedulerModule {
  constructor(private readonly learningService: LearningService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    await this.learningService.cleanTempFiles();
  }
}