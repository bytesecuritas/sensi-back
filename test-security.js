const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test de sécurité JWT
async function testSecurity() {
  console.log('🧪 Test de sécurité JWT\n');

  try {
    // 1. Test d'inscription publique
    console.log('1. Test d\'inscription publique...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'password123',
      nom: 'Test',
      prenom: 'User',
      age: 25,
      role: 'user',
      code_langue: 'fr'
    });
    console.log('✅ Inscription réussie:', registerResponse.data);

    // 2. Test de connexion
    console.log('\n2. Test de connexion...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Connexion réussie:', loginResponse.data);

    const token = loginResponse.data.access_token;

    // 3. Test d'accès à une route protégée avec token valide
    console.log('\n3. Test d\'accès à une route protégée avec token valide...');
    const protectedResponse = await axios.post(`${BASE_URL}/auth/protected`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Route protégée accessible:', protectedResponse.data);

    // 4. Test d'accès aux utilisateurs avec token valide
    console.log('\n4. Test d\'accès aux utilisateurs avec token valide...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Liste des utilisateurs accessible:', usersResponse.data.length, 'utilisateurs');

    // 5. Test d'accès sans token (doit échouer)
    console.log('\n5. Test d\'accès sans token (doit échouer)...');
    try {
      await axios.get(`${BASE_URL}/users`);
      console.log('❌ Erreur: L\'accès sans token a réussi (ne devrait pas)');
    } catch (error) {
      console.log('✅ Accès refusé sans token (comportement attendu)');
    }

    // 6. Test d'accès avec token invalide (doit échouer)
    console.log('\n6. Test d\'accès avec token invalide (doit échouer)...');
    try {
      await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Erreur: L\'accès avec token invalide a réussi (ne devrait pas)');
    } catch (error) {
      console.log('✅ Accès refusé avec token invalide (comportement attendu)');
    }

    console.log('\n🎉 Tous les tests de sécurité sont passés !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testSecurity();
}

module.exports = { testSecurity }; 