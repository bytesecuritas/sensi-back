# Système de Quiz - Guide d'Utilisation

## 🎯 Objectif

Le système de quiz permet aux créateurs de modules de créer des évaluations à la fin de chaque module. La progression d'un utilisateur dans un module est déterminée par ses performances aux quiz.

## 🚀 Installation

### 1. Mise à jour de la base de données

Exécutez le script de migration pour créer les nouvelles tables :

```sql
-- Exécuter le fichier scripts/migration-quiz.sql
```

### 2. Redémarrage de l'application

```bash
npm run build
npm run start:dev
```

## 📋 Fonctionnalités

### Pour les Créateurs de Modules

#### Créer un Quiz

**Endpoint :** `POST /learning/modules/:moduleId/quiz`

```json
{
  "titre": "Quiz sur la cybersécurité",
  "description": "Testez vos connaissances en cybersécurité",
  "ordre": 1,
  "actif": true,
  "temps_limite_minutes": 15,
  "score_minimum_pour_reussite": 70.0,
  "questions": [
    {
      "enonce": "Qu'est-ce que le phishing ?",
      "type_question": "choix_unique",
      "ordre": 1,
      "points": 10.0,
      "explication": "Le phishing est une technique d'ingénierie sociale",
      "reponses": [
        {
          "texte": "Une technique d'ingénierie sociale pour voler des informations",
          "est_correcte": true,
          "ordre": 1
        },
        {
          "texte": "Un type de virus informatique",
          "est_correcte": false,
          "ordre": 2
        }
      ]
    }
  ]
}
```

#### Types de Questions Supportés

1. **Choix Unique** (`choix_unique`)
   - Une seule réponse correcte
   - Score complet ou 0

2. **Choix Multiple** (`choix_multiple`)
   - Plusieurs réponses correctes possibles
   - Score partiel avec pénalités

3. **Vrai/Faux** (`vrai_faux`)
   - Réponse binaire
   - Comparaison avec les réponses marquées comme correctes

4. **Texte Libre** (`texte_libre`)
   - Réponse textuelle
   - Validation basique

#### Gérer les Quiz

- **Lister les quiz d'un module :** `GET /learning/modules/:moduleId/quiz`
- **Obtenir un quiz spécifique :** `GET /learning/quiz/:quizId`
- **Supprimer un quiz :** `DELETE /learning/quiz/:quizId`

### Pour les Utilisateurs

#### Répondre à un Quiz

**Endpoint :** `POST /learning/quiz/:quizId/submit`

```json
{
  "reponses": [
    {
      "question_id": 1,
      "reponse_id": 1
    },
    {
      "question_id": 2,
      "reponses_multiple": [1, 2, 3]
    },
    {
      "question_id": 3,
      "reponse_vrai_faux": false
    },
    {
      "question_id": 4,
      "reponse_texte": "Ma réponse textuelle..."
    }
  ],
  "temps_total_secondes": 450
}
```

#### Consulter les Résultats

**Endpoint :** `GET /learning/quiz/:quizId/results`

Retourne :
- Score final obtenu
- Détail des réponses par question
- Indication des bonnes réponses
- Explications fournies

## 📊 Calcul de la Progression

### Règles de Progression

1. **Score Minimum :** 70% pour considérer un module comme terminé
2. **Calcul :** Moyenne des scores de tous les quiz du module
3. **Statut :**
   - `EN_COURS` : Score < 70%
   - `TERMINE` : Score ≥ 70%

### Exemple de Calcul

```
Module avec 2 quiz :
- Quiz 1 : 80% de réussite
- Quiz 2 : 90% de réussite

Progression finale = (80 + 90) / 2 = 85%
Statut = TERMINE (85% ≥ 70%)
```

## 🔒 Sécurité

### Authentification
- Toutes les routes nécessitent un token JWT
- Vérification de l'identité de l'utilisateur

### Validation
- Utilisation de DTOs avec validation stricte
- Vérification des types de données
- Contrôle des valeurs autorisées

### Prévention des Abus
- Un utilisateur ne peut répondre qu'une fois par quiz
- Validation des réponses selon le type de question
- Protection contre les soumissions multiples

## 🧪 Tests

### Fichier de Test
Utilisez le fichier `test-quiz.http` pour tester toutes les fonctionnalités :

```bash
# Dans VS Code ou un éditeur supportant les fichiers .http
# Cliquez sur "Send Request" pour chaque requête
```

### Tests Recommandés

1. **Création de quiz** avec différents types de questions
2. **Soumission de réponses** avec tous les types
3. **Vérification des scores** et calculs
4. **Consultation des résultats** détaillés
5. **Vérification de la progression** du module

## 📈 Évolutions Futures

### Fonctionnalités Planifiées

1. **Limite de temps** : Validation automatique du temps limite
2. **Questions aléatoires** : Mélange de l'ordre des questions
3. **Tentatives multiples** : Autoriser plusieurs tentatives
4. **Feedback avancé** : Explications détaillées
5. **Analytics** : Statistiques de performance

### Améliorations Techniques

1. **Cache Redis** pour les quiz fréquemment consultés
2. **Notifications** en temps réel des résultats
3. **Export des résultats** en PDF/Excel
4. **API GraphQL** pour des requêtes plus flexibles

## 🐛 Dépannage

### Problèmes Courants

1. **Erreur 401** : Vérifiez que le token JWT est valide
2. **Erreur 400** : Vérifiez le format des données envoyées
3. **Erreur 404** : Vérifiez que le quiz/module existe
4. **Erreur 409** : L'utilisateur a déjà répondu à ce quiz

### Logs
Consultez les logs de l'application pour plus de détails sur les erreurs.

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation technique (`QUIZ-IMPLEMENTATION.md`)
2. Vérifiez les logs de l'application
3. Testez avec le fichier `test-quiz.http`
4. Contactez l'équipe de développement
