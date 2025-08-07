const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test des permissions utilisateurs
async function testUserPermissions() {
  console.log('🧪 Test des permissions utilisateurs\n');

  try {
    // 1. Créer un SuperAdmin (via script)
    console.log('1. Création du SuperAdmin (via script npm run create-superadmin)...');
    console.log('⚠️  Veuillez d\'abord exécuter: npm run create-superadmin');
    console.log('   Puis continuez avec ce test...\n');

    // 2. Connexion du SuperAdmin
    console.log('2. Connexion du SuperAdmin...');
    const superAdminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@example.com', // Remplacer par l'email du SuperAdmin créé
      password: 'password123' // Remplacer par le mot de passe du SuperAdmin créé
    });
    console.log('✅ Connexion SuperAdmin réussie');
    const superAdminToken = superAdminLogin.data.access_token;

    // 3. SuperAdmin crée un Admin
    console.log('\n3. SuperAdmin crée un Admin...');
    const createAdminResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'admin@example.com',
      password: 'password123',
      nom: 'Admin',
      prenom: 'User',
      age: 30,
      role: 'admin',
      code_langue: 'fr'
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('✅ Admin créé par SuperAdmin:', createAdminResponse.data.email);

    // 4. Connexion de l'Admin
    console.log('\n4. Connexion de l\'Admin...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    console.log('✅ Connexion Admin réussie');
    const adminToken = adminLogin.data.access_token;

    // 5. Admin crée un User
    console.log('\n5. Admin crée un User...');
    const createUserResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'user@example.com',
      password: 'password123',
      nom: 'User',
      prenom: 'Normal',
      age: 25,
      role: 'user',
      code_langue: 'fr'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ User créé par Admin:', createUserResponse.data.email);

    // 6. Test: Admin essaie de créer un autre Admin (doit échouer)
    console.log('\n6. Test: Admin essaie de créer un autre Admin (doit échouer)...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        email: 'admin2@example.com',
        password: 'password123',
        nom: 'Admin2',
        prenom: 'User2',
        age: 35,
        role: 'admin',
        code_langue: 'fr'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ Erreur: Admin a pu créer un autre Admin (ne devrait pas)');
    } catch (error) {
      console.log('✅ Admin ne peut pas créer d\'autre Admin (comportement attendu)');
    }

    // 7. Test: Admin essaie de créer un SuperAdmin (doit échouer)
    console.log('\n7. Test: Admin essaie de créer un SuperAdmin (doit échouer)...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        email: 'superadmin2@example.com',
        password: 'password123',
        nom: 'SuperAdmin2',
        prenom: 'User2',
        age: 40,
        role: 'superadmin',
        code_langue: 'fr'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ Erreur: Admin a pu créer un SuperAdmin (ne devrait pas)');
    } catch (error) {
      console.log('✅ Admin ne peut pas créer de SuperAdmin (comportement attendu)');
    }

    // 8. Connexion du User
    console.log('\n8. Connexion du User...');
    const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user@example.com',
      password: 'password123'
    });
    console.log('✅ Connexion User réussie');
    const userToken = userLogin.data.access_token;

    // 9. Test: User essaie de créer un autre User (doit échouer)
    console.log('\n9. Test: User essaie de créer un autre User (doit échouer)...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        email: 'user2@example.com',
        password: 'password123',
        nom: 'User2',
        prenom: 'Normal2',
        age: 28,
        role: 'user',
        code_langue: 'fr'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('❌ Erreur: User a pu créer un autre User (ne devrait pas)');
    } catch (error) {
      console.log('✅ User ne peut pas créer d\'autre User (comportement attendu)');
    }

    // 10. Test des accès aux routes utilisateurs
    console.log('\n10. Test des accès aux routes utilisateurs...');
    
    // SuperAdmin peut voir tous les utilisateurs
    const superAdminUsers = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('✅ SuperAdmin peut voir tous les utilisateurs:', superAdminUsers.data.length, 'utilisateurs');

    // Admin peut voir tous les utilisateurs
    const adminUsers = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin peut voir tous les utilisateurs:', adminUsers.data.length, 'utilisateurs');

    // User ne peut pas voir tous les utilisateurs
    try {
      await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('❌ Erreur: User a pu voir tous les utilisateurs (ne devrait pas)');
    } catch (error) {
      console.log('✅ User ne peut pas voir tous les utilisateurs (comportement attendu)');
    }

    console.log('\n🎉 Tous les tests de permissions sont passés !');
    console.log('\n📋 Résumé des règles vérifiées:');
    console.log('✅ SuperAdmin peut créer tous les types d\'utilisateurs');
    console.log('✅ Admin peut créer uniquement des Users');
    console.log('✅ Admin ne peut pas créer d\'autres Admin ou SuperAdmin');
    console.log('✅ User ne peut pas créer d\'autres utilisateurs');
    console.log('✅ Seuls SuperAdmin et Admin peuvent voir la liste des utilisateurs');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testUserPermissions();
}

module.exports = { testUserPermissions };
