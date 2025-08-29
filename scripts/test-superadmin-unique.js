const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSuperadminUnique() {
  console.log('🧪 Test de validation Superadmin Unique');
  console.log('=====================================\n');

  try {
    // Test 1: Créer le premier superadmin (doit réussir)
    console.log('1️⃣ Test: Créer le premier superadmin...');
    const firstSuperadmin = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'superadmin@cybersec.com',
      password: 'SuperAdmin123!',
      nom: 'Admin',
      prenom: 'Super',
      age: 35,
      role: 'superadmin',
      code_langue: 'FR'
    });
    console.log('✅ Premier superadmin créé avec succès');
    console.log(`   ID: ${firstSuperadmin.data.users_id}`);
    console.log(`   Email: ${firstSuperadmin.data.email}\n`);

    // Test 2: Tentative de créer un deuxième superadmin (doit échouer)
    console.log('2️⃣ Test: Tentative de créer un deuxième superadmin...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        email: 'superadmin2@cybersec.com',
        password: 'SuperAdmin456!',
        nom: 'Admin',
        prenom: 'Super2',
        age: 40,
        role: 'superadmin',
        code_langue: 'FR'
      });
      console.log('❌ ERREUR: Le deuxième superadmin a été créé (ne devrait pas être possible)');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Validation réussie: Impossible de créer un deuxième superadmin');
        console.log(`   Message d'erreur: ${error.response.data.message}`);
      } else {
        console.log('❌ ERREUR: Réponse inattendue');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Message: ${error.response?.data?.message}`);
      }
    }
    console.log('');

    // Test 3: Créer un admin normal (doit réussir)
    console.log('3️⃣ Test: Créer un admin normal...');
    const admin = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'admin@techcorp.com',
      password: 'AdminTech123!',
      nom: 'Martin',
      prenom: 'Sophie',
      age: 32,
      role: 'admin',
      code_langue: 'FR',
      organisation_id: '1'
    });
    console.log('✅ Admin créé avec succès');
    console.log(`   ID: ${admin.data.users_id}`);
    console.log(`   Email: ${admin.data.email}\n`);

    // Test 4: Créer un utilisateur normal (doit réussir)
    console.log('4️⃣ Test: Créer un utilisateur normal...');
    const user = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'user@techcorp.com',
      password: 'User123!',
      nom: 'Dupont',
      prenom: 'Jean',
      age: 28,
      role: 'user',
      code_langue: 'FR',
      organisation_id: '1'
    });
    console.log('✅ Utilisateur créé avec succès');
    console.log(`   ID: ${user.data.users_id}`);
    console.log(`   Email: ${user.data.email}\n`);

    // Test 5: Vérifier que seul un superadmin existe
    console.log('5️⃣ Test: Vérifier le nombre de superadmins...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@cybersec.com',
      password: 'SuperAdmin123!'
    });
    
    const token = loginResponse.data.access_token;
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const superadmins = usersResponse.data.filter(user => user.role === 'superadmin');
    console.log(`✅ Nombre de superadmins dans le système: ${superadmins.length}`);
    
    if (superadmins.length === 1) {
      console.log('✅ Validation réussie: Un seul superadmin existe');
    } else {
      console.log(`❌ ERREUR: ${superadmins.length} superadmins trouvés (devrait être 1)`);
    }

    console.log('\n🎉 Tous les tests de validation superadmin unique sont terminés!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data);
    }
  }
}

// Exécuter les tests
testSuperadminUnique();
