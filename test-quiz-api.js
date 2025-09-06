// Test rapide pour vérifier l'API des quiz
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testQuizAPI() {
  try {
    console.log('🔍 Test de l\'API des quiz...\n');

    // 1. Test de connexion
    console.log('1. Test de connexion...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Serveur accessible\n');

    // 2. Test de récupération des quiz du module 4
    console.log('2. Récupération des quiz du module 4...');
    try {
      const quizzesResponse = await axios.get(`${BASE_URL}/learning/modules/4/quiz`);
      console.log('✅ Quiz récupérés:', quizzesResponse.data.length, 'quiz trouvés');
      console.log('Quiz:', quizzesResponse.data.map(q => ({ id: q.quiz_id, titre: q.titre })));
    } catch (error) {
      console.log('❌ Erreur quiz module 4:', error.response?.status, error.response?.data);
    }

    // 3. Test de récupération du quiz ID 5
    console.log('\n3. Récupération du quiz ID 5...');
    try {
      const quizResponse = await axios.get(`${BASE_URL}/learning/quiz/5`);
      console.log('✅ Quiz 5 récupéré');
      console.log('Titre:', quizResponse.data.titre);
      console.log('Nombre de questions:', quizResponse.data.questions?.length || 0);
      
      if (quizResponse.data.questions) {
        quizResponse.data.questions.forEach((q, index) => {
          console.log(`\nQuestion ${index + 1}:`);
          console.log('  - ID:', q.question_id);
          console.log('  - Énoncé:', q.enonce);
          console.log('  - Type:', q.type_question);
          console.log('  - Nombre de réponses:', q.reponses?.length || 0);
          
          if (q.reponses) {
            q.reponses.forEach((r, rIndex) => {
              console.log(`    Réponse ${rIndex + 1}:`, r.texte);
            });
          }
        });
      }
    } catch (error) {
      console.log('❌ Erreur quiz 5:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }
}

testQuizAPI();
