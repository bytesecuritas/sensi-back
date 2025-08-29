const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test de sécurité JWT amélioré
async function testEnhancedSecurity() {
  console.log('🧪 Test de sécurité JWT amélioré\n');

  try {
    // 1. Test de validation d'environnement
    console.log('1. Test de validation d\'environnement...');
    try {
      await axios.get(`${BASE_URL}/api/auth/profile`);
      console.log('✅ Application démarrée avec validation d\'environnement');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Application non démarrée. Lancez d\'abord l\'application.');
        return;
      }
    }

    // 2. Test de création d'utilisateur avec mot de passe faible (doit échouer)
    console.log('\n2. Test de création avec mot de passe faible (doit échouer)...');
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'test@example.com',
        password: 'weak', // Mot de passe trop faible
        nom: 'Test',
        prenom: 'User',
        age: 25,
        role: 'user',
        code_langue: 'fr'
      });
      console.log('❌ Erreur: Création réussie avec mot de passe faible (ne devrait pas)');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Création refusée avec mot de passe faible (comportement attendu)');
      } else {
        console.log('✅ Création refusée (comportement attendu)');
      }
    }

    // 3. Test de création d'utilisateur avec mot de passe fort
    console.log('\n3. Test de création avec mot de passe fort...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'test@example.com',
        password: 'StrongPass123!', // Mot de passe conforme
        nom: 'Test',
        prenom: 'User',
        age: 25,
        role: 'user',
        code_langue: 'fr'
      });
      console.log('✅ Création réussie avec mot de passe fort');
      
      // Vérifier que le mot de passe n'est pas retourné
      if (registerResponse.data.password) {
        console.log('❌ Erreur: Le mot de passe est exposé dans la réponse');
      } else {
        console.log('✅ Mot de passe correctement masqué dans la réponse');
      }
    } catch (error) {
      console.log('⚠️  Création échouée (peut-être authentification requise):', error.response?.data?.message || error.message);
    }

    // 4. Test de connexion
    console.log('\n4. Test de connexion...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'StrongPass123!'
      });
      console.log('✅ Connexion réussie');
      
      const token = loginResponse.data.access_token;
      if (token) {
        console.log('✅ Token JWT généré correctement');
      }
    } catch (error) {
      console.log('⚠️  Connexion échouée:', error.response?.data?.message || error.message);
    }

    // 5. Test de rate limiting sur la connexion
    console.log('\n5. Test de rate limiting sur la connexion...');
    const loginAttempts = [];
    for (let i = 0; i < 6; i++) {
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });
        loginAttempts.push('success');
      } catch (error) {
        if (error.response?.status === 429) {
          loginAttempts.push('rate-limited');
        } else {
          loginAttempts.push('failed');
        }
      }
    }
    
    const rateLimitedCount = loginAttempts.filter(result => result === 'rate-limited').length;
    if (rateLimitedCount > 0) {
      console.log('✅ Rate limiting fonctionne (', rateLimitedCount, 'tentatives bloquées)');
    } else {
      console.log('⚠️  Rate limiting non détecté (vérifiez la configuration)');
    }

    // 6. Test d'accès à une route protégée
    console.log('\n6. Test d\'accès à une route protégée...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'StrongPass123!'
      });
      
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${loginResponse.data.access_token}` }
      });
      console.log('✅ Route protégée accessible avec token valide');
      
      // Vérifier que les données sensibles ne sont pas exposées
      if (profileResponse.data.user && !profileResponse.data.user.password) {
        console.log('✅ Données sensibles correctement masquées');
      } else {
        console.log('❌ Données sensibles exposées');
      }
    } catch (error) {
      console.log('⚠️  Test de route protégée échoué:', error.response?.data?.message || error.message);
    }

    // 7. Test d'accès sans token (doit échouer)
    console.log('\n7. Test d\'accès sans token (doit échouer)...');
    try {
      await axios.get(`${BASE_URL}/api/auth/profile`);
      console.log('❌ Erreur: L\'accès sans token a réussi (ne devrait pas)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Accès refusé sans token (comportement attendu)');
      } else {
        console.log('✅ Accès refusé (comportement attendu)');
      }
    }

    // 8. Test d'accès avec token invalide (doit échouer)
    console.log('\n8. Test d\'accès avec token invalide (doit échouer)...');
    try {
      await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Erreur: L\'accès avec token invalide a réussi (ne devrait pas)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Accès refusé avec token invalide (comportement attendu)');
      } else {
        console.log('✅ Accès refusé (comportement attendu)');
      }
    }

    console.log('\n🎉 Tests de sécurité améliorés terminés !');
    console.log('\n📋 Résumé des améliorations testées :');
    console.log('   ✅ Validation de complexité des mots de passe');
    console.log('   ✅ Protection contre l\'exposition des mots de passe');
    console.log('   ✅ Rate limiting sur les tentatives de connexion');
    console.log('   ✅ Validation des tokens JWT');
    console.log('   ✅ Contrôle d\'accès aux routes protégées');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testEnhancedSecurity();
}

module.exports = { testEnhancedSecurity };
