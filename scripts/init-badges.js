const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { GamificationService } = require('../dist/learning/gamification.service');
const fs = require('fs');
const path = require('path');

async function bootstrap() {
  try {
    console.log('Initialisation des badges par défaut...');
    
    // Créer le répertoire des badges s'il n'existe pas
    const badgesDir = path.join(process.cwd(), 'ressources', 'badges');
    if (!fs.existsSync(badgesDir)) {
      console.log(`Création du répertoire ${badgesDir}`);
      fs.mkdirSync(badgesDir, { recursive: true });
    }
    
    // Chemin de l'image source
    const sourceImagePath = "D:\\Images\\_32f7fc69-f728-4323-821a-b59314912f14.jpeg";
    
    if (!fs.existsSync(sourceImagePath)) {
      console.error(`L'image source ${sourceImagePath} n'existe pas!`);
      process.exit(1);
    }
    
    // Créer l'application NestJS
    const app = await NestFactory.createApplicationContext(AppModule);
    const gamificationService = app.get(GamificationService);
    
    // Définition des badges par défaut (utilise la même liste que dans le service)
    const defaultBadges = [
      {
        nom: 'Premier Pas',
        description: 'Vous avez complété votre premier module de formation',
        type: 'bronze',
        categorie: 'premier_pas',
        points_requis: 0,
        points_attribues: 25,
        est_secret: false,
        conditions_obtention: 'Compléter un module de formation'
      },
      {
        nom: 'Vigilant',
        description: 'Vous avez réussi votre première simulation de phishing',
        type: 'bronze',
        categorie: 'vigilance',
        points_requis: 0,
        points_attribues: 25,
        est_secret: false,
        conditions_obtention: 'Réussir une simulation de phishing'
      },
      {
        nom: 'Quiz Parfait',
        description: 'Vous avez obtenu un score parfait à un quiz de parcours final',
        type: 'bronze',
        categorie: 'quiz',
        points_requis: 0,
        points_attribues: 50,
        est_secret: false,
        conditions_obtention: 'Obtenir 100% à un quiz de parcours final'
      },
      {
        nom: 'Assidu',
        description: 'Vous vous êtes connecté 7 jours consécutifs',
        type: 'argent',
        categorie: 'assiduite',
        points_requis: 100,
        points_attribues: 75,
        est_secret: false,
        conditions_obtention: 'Se connecter 7 jours consécutifs'
      },
      {
        nom: 'Expert Phishing',
        description: 'Vous avez complété tous les modules sur le phishing',
        type: 'or',
        categorie: 'expert',
        points_requis: 300,
        points_attribues: 100,
        est_secret: false,
        conditions_obtention: 'Compléter tous les modules sur le phishing'
      },
      {
        nom: 'Défenseur Cyber',
        description: 'Vous avez réussi 10 simulations',
        type: 'or',
        categorie: 'defenseur',
        points_requis: 500,
        points_attribues: 150,
        est_secret: false,
        conditions_obtention: 'Réussir 10 simulations'
      }
    ];
    
    // Initialiser chaque badge
    let created = 0;
    let updated = 0;
    let errors = [];
    
    for (const badgeData of defaultBadges) {
      try {
        // Copier l'image source vers le répertoire des badges
        const fileName = `${badgeData.nom.toLowerCase().replace(/\s+/g, '_')}.jpeg`;
        const destPath = path.join(badgesDir, fileName);
        
        // Copier l'image
        fs.copyFileSync(sourceImagePath, destPath);
        console.log(`Image copiée pour le badge ${badgeData.nom}: ${destPath}`);
        
        // Vérifier si le badge existe déjà
        const existingBadge = await gamificationService.getBadgeByName(badgeData.nom).catch(() => null);
        
        if (!existingBadge) {
          // Créer le badge
          await gamificationService.createBadge({
            ...badgeData,
            icone_url: destPath
          });
          created++;
          console.log(`Badge créé: ${badgeData.nom}`);
        } else {
          // Mettre à jour le badge
          await gamificationService.updateBadge(existingBadge.badge_id, {
            ...badgeData,
            icone_url: destPath
          });
          updated++;
          console.log(`Badge mis à jour: ${badgeData.nom}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la création/mise à jour du badge ${badgeData.nom}:`, error.message);
        errors.push(`${badgeData.nom}: ${error.message}`);
      }
    }
    
    console.log(`\nRésumé de l'initialisation des badges:`);
    console.log(`- Badges créés: ${created}`);
    console.log(`- Badges mis à jour: ${updated}`);
    
    if (errors.length > 0) {
      console.log(`- Erreurs: ${errors.length}`);
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des badges:', error);
    process.exit(1);
  }
}

bootstrap();