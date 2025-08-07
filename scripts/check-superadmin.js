const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { UsersService } = require('../dist/users/users.service');

async function checkSuperAdmin() {
  console.log('🔍 Vérification du SuperAdmin...\n');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    // Vérifier s'il existe un superadmin
    const superAdmins = await usersService.findByRole('superadmin');
    
    if (superAdmins.length === 0) {
      console.log('❌ Aucun SuperAdmin trouvé dans le système');
      console.log('💡 Exécutez: npm run create-superadmin');
    } else if (superAdmins.length === 1) {
      console.log('✅ SuperAdmin trouvé:');
      console.log('📧 Email:', superAdmins[0].email);
      console.log('👤 Nom:', superAdmins[0].nom);
      console.log('👤 Prénom:', superAdmins[0].prenom);
      console.log('🔑 Rôle:', superAdmins[0].role);
    } else {
      console.log('⚠️  ATTENTION: Plusieurs SuperAdmin trouvés !');
      console.log('Nombre de SuperAdmin:', superAdmins.length);
      superAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email} (${admin.nom} ${admin.prenom})`);
      });
      console.log('\n⚠️  Il ne devrait y avoir qu\'un seul SuperAdmin !');
    }

    // Afficher les statistiques des utilisateurs
    const allUsers = await usersService.findAll();
    const admins = await usersService.findByRole('admin');
    const users = await usersService.findByRole('user');

    console.log('\n📊 Statistiques des utilisateurs:');
    console.log('👑 SuperAdmin:', superAdmins.length);
    console.log('👨‍💼 Admin:', admins.length);
    console.log('👤 User:', users.length);
    console.log('📈 Total:', allUsers.length);

    await app.close();

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  checkSuperAdmin();
}

module.exports = { checkSuperAdmin };
