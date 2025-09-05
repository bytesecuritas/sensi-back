import { Logger, Module } from '@nestjs/common';
import { Cron, CronExpression, ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [],
})
export class SchedulerModule {
  private readonly logger = new Logger(SchedulerModule.name);

  constructor() {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    // Tâche de nettoyage temporaire - sera implémentée plus tard
    this.logger.log('Tâche de nettoyage planifiée exécutée à: ' + new Date().toISOString());
    
    // TODO: Implémenter le nettoyage des fichiers temporaires
    // Pour l'instant, on évite les dépendances complexes
  }
}