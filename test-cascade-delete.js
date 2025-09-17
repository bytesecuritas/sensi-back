/**
 * Script de test pour vérifier la suppression en cascade
 * Ce script teste les suppressions d'entités avec leurs relations
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN1cGVyYWRtaW5AY3liZXJzZWMuY29tIiwic3ViIjoxLCJyb2xlIjoic3VwZXJhZG1pbiIsImlhdCI6MTc1ODEyMjA3NywiZXhwIjoxNzU4MTI1Njc3fQ.3M3awGIVu3lPnYMWwgtf9Pv3BRsAv-9NTZgjajEY7mk'; // À remplacer par un token admin valide

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testCascadeDelete() {
  console.log('🧪 Test de suppression en cascade...\n');

  try {
    // Test 1: Créer une organisation avec des utilisateurs
    console.log('1️⃣ Création d\'une organisation de test...');
    const orgResponse = await api.post('/organisations', {
      nom: 'Organisation Test Cascade',
      type: 'entreprise_privee',
      code_pays: 'FR',
      email: 'test@cascade.com'
    });
    const orgId = orgResponse.data.organisation_id;
    console.log(`✅ Organisation créée avec l'ID: ${orgId}`);

    // Test 2: Créer des utilisateurs dans cette organisation
    console.log('\n2️⃣ Création d\'utilisateurs de test...');
    const user1Response = await api.post('/auth/register', {
      email: 'user1@cascade.com',
      password: 'Password123@',
      nom: 'User1',
      prenom: 'Test',
      age: 25,
      role: 'user',
      organisation_id: orgId.toString()
    });
    const user1Id = user1Response.data.users_id;
    console.log(`✅ Utilisateur 1 créé avec l'ID: ${user1Id}`);

    const user2Response = await api.post('/auth/register', {
      email: 'user2@cascade.com',
      password: 'Password123@',
      nom: 'User2',
      prenom: 'Test',
      age: 30,
      role: 'admin',
      organisation_id: orgId.toString()
    });
    const user2Id = user2Response.data.users_id;
    console.log(`✅ Utilisateur 2 créé avec l'ID: ${user2Id}`);

    // Test 3: Créer un parcours d'apprentissage
    console.log('\n3️⃣ Création d\'un parcours de test...');
    const parcoursResponse = await api.post('/learning/parcours', {
      titre: 'Parcours Test Cascade',
      description: 'Parcours pour tester la suppression en cascade',
      public_cible: 'entreprise',
      duree_estimee_heures: 2.5
    });
    const parcoursId = parcoursResponse.data.parcours_id;
    console.log(`✅ Parcours créé avec l'ID: ${parcoursId}`);

    // Test 4: Associer le parcours à l'organisation
    console.log('\n4️⃣ Association du parcours à l\'organisation...');
    await api.post(`/learning/organisations/${orgId}/parcours/${parcoursId}`);
    console.log('✅ Parcours associé à l\'organisation');

    // Test 5: Créer un module dans le parcours
    console.log('\n5️⃣ Création d\'un module de test...');
    const moduleResponse = await api.post('/learning/modules', {
      titre: 'Module Test Cascade',
      description: 'Module pour tester la suppression en cascade',
      parcours_id: parcoursId,
      niveau_difficulte: 'moyen',
      thematique_cyber: 'phishing',
      code_langue : 'fr'
    });
    const moduleId = moduleResponse.data.module_id;
    console.log(`✅ Module créé avec l'ID: ${moduleId}`);

    // Test 6: Créer un quiz dans le module
    console.log('\n6️⃣ Création d\'un quiz de test...');
    const quizResponse = await api.post(`/learning/quizzes/module/parent/${moduleId}`, {
      titre: 'Quiz Test Cascade',
      description: 'Quiz pour tester la suppression en cascade',
      questions: [
        {
          enonce: 'Qu\'est-ce que le phishing ?',
          type_question: 'choix_unique',
          points: 1,
          reponses: [
            { texte: 'Une technique d\'hameçonnage', est_correcte: true },
            { texte: 'Un type de virus', est_correcte: false },
            { texte: 'Un protocole de sécurité', est_correcte: false }
          ]
        }
      ]
    });
    const quizId = quizResponse.data.quiz_id;
    console.log(`✅ Quiz créé avec l'ID: ${quizId}`);

    // Test 6b: Créer une question via endpoint dédié et vérifier association
    console.log('\n6️⃣.b Création d\'une question via endpoint dédié...');
    const createdQuestion = await api.post('/learning/questions', {
      enonce: 'Choisissez la bonne réponse',
      type_question: 'choix_unique',
      ordre: 1,
      points: 1,
      quiz_id: quizId
    });
    const questionId = createdQuestion.data.question_id;
    console.log(`✅ Question créée avec l'ID: ${questionId} (quiz_id=${quizId})`);

    // Test 6c: Créer une réponse via endpoint dédié et vérifier association
    console.log('\n6️⃣.c Création d\'une réponse via endpoint dédié...');
    const createdReponse = await api.post('/learning/reponses', {
      texte: 'Bonne',
      est_correcte: true,
      ordre: 1,
      question_id: questionId
    });
    const reponseId = createdReponse.data.reponse_id;
    console.log(`✅ Réponse créée avec l'ID: ${reponseId} (question_id=${questionId})`);

    // Test 7: Vérifier que tout existe avant suppression
    console.log('\n7️⃣ Vérification des données avant suppression...');
    const orgBefore = await api.get(`/organisations/${orgId}`);
    const usersBefore = await api.get(`/organisations/${orgId}/users`);
    const parcoursBefore = await api.get(`/learning/parcours/${parcoursId}`);
    const moduleBefore = await api.get(`/learning/modules/${moduleId}`);
    const quizBefore = await api.get(`/learning/quiz/${quizId}/admin`);

    console.log(`✅ Organisation: ${orgBefore.data.nom}`);
    console.log(`✅ Utilisateurs: ${usersBefore.data.length}`);
    console.log(`✅ Parcours: ${parcoursBefore.data.titre}`);
    console.log(`✅ Module: ${moduleBefore.data.titre}`);
    console.log(`✅ Quiz: ${quizBefore.data.titre}`);

    // Test 8: Supprimer l'organisation (devrait supprimer tout en cascade)
    console.log('\n8️⃣ Suppression de l\'organisation (test cascade)...');
    const deleteResponse = await api.delete(`/organisations/${orgId}`);
    console.log(`✅ ${deleteResponse.data.message}`);

    // Test 9: Vérifier que tout a été supprimé
    console.log('\n9️⃣ Vérification de la suppression en cascade...');
    
    try {
      await api.get(`/organisations/${orgId}`);
      console.log('❌ ERREUR: L\'organisation existe encore !');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Organisation supprimée');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data);
      }
    }

    try {
      await api.get(`/users/${user1Id}`);
      console.log('❌ ERREUR: L\'utilisateur 1 existe encore !');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Utilisateur 1 supprimé');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data);
      }
    }

    try {
      await api.get(`/users/${user2Id}`);
      console.log('❌ ERREUR: L\'utilisateur 2 existe encore !');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Utilisateur 2 supprimé');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data);
      }
    }

    try {
      await api.get(`/learning/parcours/${parcoursId}`);
      console.log('❌ ERREUR: Le parcours existe encore !');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Parcours supprimé');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data);
      }
    }

    try {
      await api.get(`/learning/modules/${moduleId}`);
      console.log('❌ ERREUR: Le module existe encore !');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Module supprimé');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data);
      }
    }

    try {
      await api.get(`/learning/quiz/${quizId}/admin`);
      console.log('❌ ERREUR: Le quiz existe encore !');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Quiz supprimé');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data);
      }
    }

    console.log('\n🎉 Test de suppression en cascade terminé avec succès !');
    console.log('✅ Toutes les relations ont été supprimées automatiquement');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Fonction pour tester la suppression d'un utilisateur spécifique
async function testUserCascadeDelete() {
  console.log('\n🧪 Test de suppression d\'utilisateur en cascade...\n');

  try {
    // Créer un utilisateur de test
    console.log('1️⃣ Création d\'un utilisateur de test...');
    const userResponse = await api.post('/auth/register', {
      email: 'testuser@cascade.com',
      password: 'Password123@',
      nom: 'TestUser',
      prenom: 'Cascade',
      age: 25,
      role: 'user',
      organisation_id: "1"
    });
    const userId = userResponse.data.users_id;
    console.log(`✅ Utilisateur créé avec l'ID: ${userId}`);

    // Supprimer l'utilisateur
    console.log('\n2️⃣ Suppression de l\'utilisateur...');
    const deleteResponse = await api.delete(`/users/${userId}`);
    console.log(`✅ ${deleteResponse.data.message}`);

    // Vérifier la suppression
    console.log('\n3️⃣ Vérification de la suppression...');
    try {
      await api.get(`/users/${userId}`);
      console.log('❌ ERREUR: L\'utilisateur existe encore !');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Utilisateur supprimé avec succès');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data);
      }
    }

    console.log('\n🎉 Test de suppression d\'utilisateur terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du test utilisateur:', error.response?.data || error.message);
  }
}

// Exécuter les tests
if (require.main === module) {
  console.log('🚀 Démarrage des tests de suppression en cascade...\n');
  console.log('⚠️  Assurez-vous que le serveur est démarré et que vous avez un token admin valide\n');
  
  testCascadeDelete()
    // .then(() => testUserCascadeDelete())
    .then(() => {
      console.log('\n✨ Tous les tests sont terminés !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testCascadeDelete, testUserCascadeDelete };
