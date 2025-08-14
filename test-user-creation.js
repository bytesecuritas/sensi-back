const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let organisationId = null;

// Fonction pour obtenir le token d'authentification
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'camara13fs@gmail.com',
      password: 'admin123'
    });
    authToken = response.data.access_token;
    console.log('✅ Token d\'authentification obtenu');
  } catch (error) {
    console.error('❌ Erreur lors de l\'authentification:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour créer une organisation
async function createOrganisation() {
  try {
    const response = await axios.post(`${BASE_URL}/organisations`, {
      nom: 'Test Organisation pour Utilisateur',
      type: 'entreprise',
      date_creation: new Date().toISOString().split('T')[0],
      code_pays: 'GN'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    organisationId = response.data.organisation_id;
    console.log('✅ Organisation créée:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'organisation:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour créer un utilisateur avec organisation
async function createUserWithOrganisation() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'testuser@example.com',
      password: 'password123',
      nom: 'Test',
      prenom: 'User',
      age: 25,
      role: 'user',
      code_langue: 'FR',
      organisation_id: organisationId.toString()
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Utilisateur créé avec organisation:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour créer un admin avec organisation
async function createAdminWithOrganisation() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'testadmin@example.com',
      password: 'password123',
      nom: 'Test',
      prenom: 'Admin',
      age: 30,
      role: 'admin',
      code_langue: 'FR',
      organisation_id: organisationId.toString()
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Admin créé avec organisation:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour créer un superadmin (sans organisation)
async function createSuperadmin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'testsuperadmin@example.com',
      password: 'password123',
      nom: 'Test',
      prenom: 'SuperAdmin',
      age: 35,
      role: 'superadmin',
      code_langue: 'FR'
      // Pas d'organisation_id pour les superadmins
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Superadmin créé:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création du superadmin:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester l'erreur - créer un utilisateur sans organisation
async function createUserWithoutOrganisation() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'testuser2@example.com',
      password: 'password123',
      nom: 'Test',
      prenom: 'User2',
      age: 25,
      role: 'user',
      code_langue: 'FR'
      // Pas d'organisation_id - devrait échouer
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('❌ Utilisateur créé sans organisation (ne devrait pas arriver):', response.data);
    return response.data;
  } catch (error) {
    console.log('✅ Erreur attendue - utilisateur sans organisation:', error.response?.data?.message);
    return error.response?.data;
  }
}

// Fonction pour tester l'erreur - créer un utilisateur avec une organisation inexistante
async function createUserWithInvalidOrganisation() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'testuser3@example.com',
      password: 'password123',
      nom: 'Test',
      prenom: 'User3',
      age: 25,
      role: 'user',
      code_langue: 'FR',
      organisation_id: '999' // Organisation inexistante
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('❌ Utilisateur créé avec organisation invalide (ne devrait pas arriver):', response.data);
    return response.data;
  } catch (error) {
    console.log('✅ Erreur attendue - organisation invalide:', error.response?.data?.message);
    return error.response?.data;
  }
}

// Test principal
async function runTests() {
  console.log('🚀 Démarrage des tests de création d\'utilisateur avec organisation...\n');
  
  try {
    // 1. Authentification
    await getAuthToken();
    
    // 2. Créer une organisation
    await createOrganisation();
    
    // 3. Créer un utilisateur avec organisation
    await createUserWithOrganisation();
    
    // 4. Créer un admin avec organisation
    await createAdminWithOrganisation();
    
    // 5. Créer un superadmin (sans organisation)
    await createSuperadmin();
    
    // 6. Tester l'erreur - utilisateur sans organisation
    await createUserWithoutOrganisation();
    
    // 7. Tester l'erreur - utilisateur avec organisation inexistante
    await createUserWithInvalidOrganisation();
    
    console.log('\n🎉 Tous les tests ont réussi !');
    
  } catch (error) {
    console.error('\n💥 Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = {
  getAuthToken,
  createOrganisation,
  createUserWithOrganisation,
  createAdminWithOrganisation,
  createSuperadmin,
  createUserWithoutOrganisation,
  createUserWithInvalidOrganisation
};
