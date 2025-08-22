const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Fonction pour tester les endpoints du module d'apprentissage
async function testLearningModule() {
  console.log('🧪 Test du module d\'apprentissage...\n');

  try {
    // 1. Créer un parcours d'apprentissage
    console.log('1. Création d\'un parcours d\'apprentissage...');
    const learningPathData = {
      titre: 'Sensibilisation à la Cybersécurité en Entreprise',
      description: 'Parcours complet de sensibilisation aux risques cyber pour les employés',
      public_cible: 'ENTREPRISE'
    };

    const learningPathResponse = await axios.post(`${BASE_URL}/learning/parcours`, learningPathData);
    const learningPath = learningPathResponse.data;
    console.log('✅ Parcours créé:', learningPath.parcours_id);

    // 2. Créer un module d'apprentissage
    console.log('\n2. Création d\'un module d\'apprentissage...');
    const moduleData = {
      titre: 'Reconnaître les emails de phishing',
      description: 'Module d\'apprentissage sur la détection des emails frauduleux et les bonnes pratiques',
      code_langue: 'fr',
      niveau_difficulte: 'facile',
      parcours_id: learningPath.parcours_id,
      thematique_cyber: 'PHISHING'
    };

    const moduleResponse = await axios.post(`${BASE_URL}/learning/modules`, moduleData);
    const learningModule = moduleResponse.data;
    console.log('✅ Module créé:', learningModule.module_id);

    // 3. Créer un contenu média
    console.log('\n3. Création d\'un contenu média...');
    const mediaData = {
      module_id: learningModule.module_id,
      type_contenu: 'VIDEO',
      duree_minutes: 30,
      url_fichier: 'https://example.com/video-phishing-awareness.mp4',
      nom_fichier: 'phishing-awareness.mp4',
      chemin_stockage: `src/resource/${learningPath.titre}/${learningModule.titre}/phishing-awareness.mp4`,
      taille_fichier: 52428800, // 50MB
      description: 'Vidéo de sensibilisation aux techniques de phishing et comment les détecter',
      type_attaque: 'PHISHING_EMAIL'
    };

    const mediaResponse = await axios.post(`${BASE_URL}/learning/media`, mediaData);
    const mediaContent = mediaResponse.data;
    console.log('✅ Contenu média créé:', mediaContent.media_id);

    // 4. Récupérer tous les parcours
    console.log('\n4. Récupération de tous les parcours...');
    const allPathsResponse = await axios.get(`${BASE_URL}/learning/parcours`);
    console.log('✅ Nombre de parcours:', allPathsResponse.data.length);

    // 5. Récupérer les modules d'un parcours
    console.log('\n5. Récupération des modules du parcours...');
    const modulesResponse = await axios.get(`${BASE_URL}/learning/parcours/${learningPath.parcours_id}/modules`);
    console.log('✅ Nombre de modules:', modulesResponse.data.length);

    // 6. Récupérer les contenus média d'un module
    console.log('\n6. Récupération des contenus média du module...');
    const mediaResponse2 = await axios.get(`${BASE_URL}/learning/modules/${learningModule.module_id}/media`);
    console.log('✅ Nombre de contenus média:', mediaResponse2.data.length);

    // 7. Créer une progression (simulation)
    console.log('\n7. Création d\'une progression...');
    const progressData = {
      utilisateur_id: 1, // Assurez-vous qu'un utilisateur avec cet ID existe
      module_id: learningModule.module_id,
      statut: 'en_cours',
      score: 0,
      temps_passe: 0
    };

    try {
      const progressResponse = await axios.post(`${BASE_URL}/learning/progress`, progressData);
      console.log('✅ Progression créée:', progressResponse.data.progression_id);
    } catch (error) {
      console.log('⚠️ Erreur lors de la création de la progression (utilisateur peut ne pas exister):', error.response?.data?.message || error.message);
    }

    // 8. Créer une certification (simulation)
    console.log('\n8. Création d\'une certification...');
    const certificationData = {
      utilisateur_id: 1, // Assurez-vous qu'un utilisateur avec cet ID existe
      parcours_id: learningPath.parcours_id,
      type_certification: 'completion',
      date_emission: new Date().toISOString(),
      url_certification: 'https://example.com/certification.pdf'
    };

    try {
      const certificationResponse = await axios.post(`${BASE_URL}/learning/certifications`, certificationData);
      console.log('✅ Certification créée:', certificationResponse.data.certification_id);
    } catch (error) {
      console.log('⚠️ Erreur lors de la création de la certification (utilisateur peut ne pas exister):', error.response?.data?.message || error.message);
    }

    // 9. Tester l'ajout d'un parcours à une organisation
    console.log('\n9. Ajout d\'un parcours à une organisation...');
    try {
      const orgPathResponse = await axios.post(`${BASE_URL}/learning/organisations/1/parcours/${learningPath.parcours_id}`);
      console.log('✅ Parcours ajouté à l\'organisation:', orgPathResponse.data.id);
    } catch (error) {
      console.log('⚠️ Erreur lors de l\'ajout du parcours à l\'organisation (organisation peut ne pas exister):', error.response?.data?.message || error.message);
    }

    // 10. Récupérer les parcours d'une organisation
    console.log('\n10. Récupération des parcours d\'une organisation...');
    try {
      const orgPathsResponse = await axios.get(`${BASE_URL}/learning/organisations/1/parcours`);
      console.log('✅ Nombre de parcours dans l\'organisation:', orgPathsResponse.data.length);
    } catch (error) {
      console.log('⚠️ Erreur lors de la récupération des parcours de l\'organisation:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Tests du module d\'apprentissage terminés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
  }
}

// Fonction pour nettoyer les données de test
async function cleanupTestData() {
  console.log('\n🧹 Nettoyage des données de test...');
  
  try {
    // Supprimer les associations organisation-parcours
    await axios.delete(`${BASE_URL}/learning/organisations/1/parcours/1`);
    console.log('✅ Association organisation-parcours supprimée');
  } catch (error) {
    console.log('⚠️ Erreur lors du nettoyage:', error.response?.data?.message || error.message);
  }
}

// Exécuter les tests
async function runTests() {
  await testLearningModule();
  // await cleanupTestData(); // Décommentez pour nettoyer après les tests
}

runTests().catch(console.error);
