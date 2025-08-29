# Implémentation du Système de Quiz

## Vue d'ensemble

Le système de quiz a été implémenté pour permettre aux créateurs de modules de créer des évaluations à la fin de chaque module. La progression d'un utilisateur dans un module est déterminée par ses performances aux quiz.

## Architecture

### Entités créées

1. **Quiz** (`quiz.entity.ts`)
   - Contient les informations générales du quiz
   - Lié à un module d'apprentissage
   - Définit le score minimum pour réussir

2. **Question** (`question.entity.ts`)
   - Définit les questions du quiz
   - Supporte différents types : choix unique, choix multiple, vrai/faux, texte libre
   - Liée à un quiz

3. **Reponse** (`reponse.entity.ts`)
   - Contient les options de réponse pour chaque question
   - Indique quelles réponses sont correctes
   - Liée à une question

4. **QuizResponse** (`quiz-response.entity.ts`)
   - Stocke les réponses des utilisateurs
   - Calcule les scores et points obtenus
   - Liée à l'utilisateur, au quiz et à la question

### Relations

```
LearningPathModule (1) ←→ (N) Quiz
Quiz (1) ←→ (N) Question
Question (1) ←→ (N) Reponse
User (1) ←→ (N) QuizResponse
Quiz (1) ←→ (N) QuizResponse
Question (1) ←→ (N) QuizResponse
```

## Fonctionnalités

### 1. Création de Quiz

**Endpoint :** `POST /learning/modules/:moduleId/quiz`

Les créateurs de modules peuvent créer des quiz avec :
- Titre et description
- Questions de différents types
- Options de réponse avec indication des bonnes réponses
- Score minimum pour réussir
- Temps limite optionnel

### 2. Types de Questions Supportés

#### Choix Unique
- Une seule réponse correcte
- Score complet si bonne réponse, 0 sinon

#### Choix Multiple
- Plusieurs réponses correctes possibles
- Score partiel basé sur le ratio de bonnes réponses choisies
- Pénalité pour les mauvaises réponses choisies

#### Vrai/Faux
- Réponse binaire
- Comparaison avec les réponses marquées comme correctes

#### Texte Libre
- Réponse textuelle
- Validation basique (présence de contenu)

### 3. Soumission et Évaluation

**Endpoint :** `POST /learning/quiz/:quizId/submit`

Le système :
- Vérifie que l'utilisateur n'a pas déjà répondu
- Évalue chaque réponse selon son type
- Calcule le score final en pourcentage
- Met à jour la progression du module

### 4. Calcul de Progression

La progression d'un module est calculée en :
- Récupérant tous les quiz du module
- Calculant la moyenne des scores obtenus
- Mettant à jour le statut (TERMINE si ≥ 70%, EN_COURS sinon)

### 5. Gestion des Résultats

**Endpoint :** `GET /learning/quiz/:quizId/results`

Permet de consulter :
- Score final obtenu
- Détail des réponses par question
- Indication des bonnes réponses
- Explications fournies

## API Endpoints

### Création et Gestion
- `POST /learning/modules/:moduleId/quiz` - Créer un quiz
- `GET /learning/modules/:moduleId/quiz` - Lister les quiz d'un module
- `GET /learning/quiz/:quizId` - Obtenir un quiz spécifique
- `DELETE /learning/quiz/:quizId` - Supprimer un quiz

### Utilisation
- `POST /learning/quiz/:quizId/submit` - Soumettre des réponses
- `GET /learning/quiz/:quizId/results` - Consulter les résultats

## Exemple d'Utilisation

### Création d'un Quiz

```json
{
  "titre": "Quiz sur la cybersécurité",
  "description": "Testez vos connaissances",
  "score_minimum_pour_reussite": 70.0,
  "questions": [
    {
      "enonce": "Qu'est-ce que le phishing ?",
      "type_question": "choix_unique",
      "points": 10.0,
      "reponses": [
        {
          "texte": "Une technique d'ingénierie sociale",
          "est_correcte": true
        },
        {
          "texte": "Un virus informatique",
          "est_correcte": false
        }
      ]
    }
  ]
}
```

### Soumission de Réponses

```json
{
  "reponses": [
    {
      "question_id": 1,
      "reponse_id": 1
    }
  ],
  "temps_total_secondes": 300
}
```

## Intégration avec la Progression

Le système de quiz s'intègre automatiquement avec le système de progression existant :

1. **Calcul automatique** : La progression est mise à jour après chaque soumission de quiz
2. **Statut dynamique** : Le statut du module passe à "TERMINE" si le score moyen ≥ 70%
3. **Suivi complet** : Toutes les réponses sont sauvegardées pour analyse

## Sécurité

- **Authentification requise** : Toutes les routes nécessitent un token JWT
- **Validation des données** : Utilisation de DTOs avec validation
- **Prévention des doublons** : Un utilisateur ne peut répondre qu'une fois par quiz
- **Cascade sécurisée** : Suppression en cascade des données liées

## Tests

Un fichier `test-quiz.http` est fourni avec des exemples complets pour tester toutes les fonctionnalités.

## Évolutions Possibles

1. **Limite de temps** : Implémentation de la validation du temps limite
2. **Questions aléatoires** : Mélange de l'ordre des questions et réponses
3. **Tentatives multiples** : Autoriser plusieurs tentatives avec pénalité
4. **Feedback avancé** : Explications détaillées pour chaque réponse
5. **Analytics** : Statistiques détaillées sur les performances
