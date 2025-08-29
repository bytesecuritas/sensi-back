const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { AuthService } = require('../dist/auth/auth.service');
const { UsersService } = require('../dist/users/users.service');
const bcrypt = require('bcrypt');

async function createSuperAdmin() {
  console.log('🔧 Création du SuperAdmin...\n');

  try {
    // Vérifier si un superadmin existe déjà
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const authService = app.get(AuthService);

    // Vérifier s'il existe déjà un superadmin
    const existingSuperAdmin = await usersService.findByRole('superadmin');
    
    if (existingSuperAdmin && existingSuperAdmin.length > 0) {
      console.log('❌ Un SuperAdmin existe déjà dans le système !');
      console.log('SuperAdmin existant:', existingSuperAdmin[0].email);
      await app.close();
      process.exit(1);
    }

    // Demander les informations du superadmin
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question, (answer) => {
          resolve(answer);
        });
      });
    };

    console.log('📝 Veuillez saisir les informations du SuperAdmin :\n');

    const email = await askQuestion('Email: ');
    const password = await askQuestion('Mot de passe (min 8 caractères, majuscules, minuscules, chiffres, caractères spéciaux): ');
    const nom = await askQuestion('Nom: ');
    const prenom = await askQuestion('Prénom: ');
    const age = parseInt(await askQuestion('Âge: '));
    const code_langue = await askQuestion('Code langue (fr/en): ') || 'fr';

    // Validation
    if (password.length < 8) {
      console.log('❌ Le mot de passe doit contenir au moins 8 caractères');
      rl.close();
      await app.close();
      process.exit(1);
    }

    // Validation de complexité du mot de passe
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      console.log('❌ Le mot de passe doit contenir au moins :');
      console.log('   - Une lettre majuscule');
      console.log('   - Une lettre minuscule');
      console.log('   - Un chiffre');
      console.log('   - Un caractère spécial (!@#$%^&*(),.?":{}|<>)');
      rl.close();
      await app.close();
      process.exit(1);
    }

    if (!email.includes('@')) {
      console.log('❌ Email invalide');
      rl.close();
      await app.close();
      process.exit(1);
    }

    if (age < 0 || age > 150) {
      console.log('❌ Âge invalide');
      rl.close();
      await app.close();
      process.exit(1);
    }

    // Créer le superadmin
    const superAdminData = {
      email,
      password,
      nom,
      prenom,
      age,
      role: 'superadmin',
      code_langue
    };

    const superAdmin = await authService.register(
      email,
      password,
      nom,
      prenom,
      age,
      'superadmin',
      code_langue
    );

    console.log('\n✅ SuperAdmin créé avec succès !');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Nom:', superAdmin.nom);
    console.log('👤 Prénom:', superAdmin.prenom);
    console.log('🔑 Rôle:', superAdmin.role);
    console.log('\n⚠️  IMPORTANT: Notez bien ces informations !');

    rl.close();
    await app.close();

  } catch (error) {
    console.error('❌ Erreur lors de la création du SuperAdmin:', error.message);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createSuperAdmin();
}

module.exports = { createSuperAdmin };
