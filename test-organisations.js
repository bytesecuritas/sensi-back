const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let organisationId = null;

// Fonction pour obtenir le token d'authentification
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@example.com',
      password: 'superadmin123'
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
      nom: 'Test Organisation',
      type: 'entreprise',
      date_creation: new Date().toISOString().split('T')[0],
      code_pays: 'F'
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

// Fonction pour récupérer toutes les organisations
async function getAllOrganisations() {
  try {
    const response = await axios.get(`${BASE_URL}/organisations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Organisations récupérées:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des organisations:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour récupérer une organisation spécifique
async function getOrganisation(id) {
  try {
    const response = await axios.get(`${BASE_URL}/organisations/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Organisation récupérée:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'organisation:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour mettre à jour une organisation
async function updateOrganisation(id) {
  try {
    const response = await axios.patch(`${BASE_URL}/organisations/${id}`, {
      nom: 'Test Organisation Modifiée',
      type: 'ecole'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Organisation mise à jour:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'organisation:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour obtenir les statistiques d'une organisation
async function getOrganisationStats(id) {
  try {
    const response = await axios.get(`${BASE_URL}/organisations/${id}/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Statistiques de l\'organisation:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour supprimer une organisation
async function deleteOrganisation(id) {
  try {
    await axios.delete(`${BASE_URL}/organisations/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Organisation supprimée');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'organisation:', error.response?.data || error.message);
    throw error;
  }
}

// Test principal
async function runTests() {
  console.log('🚀 Démarrage des tests du module Organisation...\n');
  
  try {
    // 1. Authentification
    await getAuthToken();
    
    // 2. Créer une organisation
    await createOrganisation();
    
    // 3. Récupérer toutes les organisations
    await getAllOrganisations();
    
    // 4. Récupérer l'organisation créée
    await getOrganisation(organisationId);
    
    // 5. Obtenir les statistiques
    await getOrganisationStats(organisationId);
    
    // 6. Mettre à jour l'organisation
    await updateOrganisation(organisationId);
    
    // 7. Vérifier la mise à jour
    await getOrganisation(organisationId);
    
    // 8. Supprimer l'organisation
    await deleteOrganisation(organisationId);
    
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
  getAllOrganisations,
  getOrganisation,
  updateOrganisation,
  getOrganisationStats,
  deleteOrganisation
};
