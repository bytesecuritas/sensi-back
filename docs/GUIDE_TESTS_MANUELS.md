# 🧪 GUIDE DE TESTS MANUELS - VALIDATION PRÉ-DÉPLOIEMENT

**Date :** 22 Mars 2026  
**Version :** 1.0  
**Durée estimée :** 2-3 heures

---

## 📋 PRÉREQUIS

### Environnement
- ✅ Application démarrée sur `http://localhost:3000`
- ✅ Base de données MySQL configurée
- ✅ Fichier `.env` configuré avec JWT_SECRET
- ✅ Superadmin créé (`npm run create-superadmin`)
- ✅ Badges initialisés (`npm run init-badges`)

### Outils Nécessaires
- Client HTTP (Postman, Insomnia, VS Code REST Client, ou curl)
- Navigateur web pour Swagger UI (`http://localhost:3000/api/docs`)

---

## 🎯 SCÉNARIOS DE TESTS

### SCÉNARIO 1: Authentification et Gestion Utilisateurs (30 min)

#### Test 1.1: Création du Superadmin
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "superadmin@test.com",
  "password": "SuperAdmin123!@#",
  "nom": "Super",
  "prenom": "Admin",
  "age": 35,
  "role": "superadmin"
}
```

**Résultat Attendu :**
- ✅ Status: 201 Created
- ✅ Retourne l'utilisateur sans le mot de passe
- ✅ `role: "superadmin"`

**Résultat Réel :** _____________

---

#### Test 1.2: Tentative de Création d'un 2ème Superadmin (Doit Échouer)
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "superadmin2@test.com",
  "password": "SuperAdmin123!@#",
  "nom": "Super2",
  "prenom": "Admin2",
  "age": 35,
  "role": "superadmin"
}
```

**Résultat Attendu :**
- ✅ Status: 409 Conflict
- ✅ Message: "A superadmin already exists"

**Résultat Réel :** _____________

---

#### Test 1.3: Login Superadmin
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "superadmin@test.com",
  "password": "SuperAdmin123!@#"
}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Retourne `access_token` et `refresh_token`
- ✅ Tokens sont des chaînes JWT valides

**Résultat Réel :** _____________

**IMPORTANT :** Copier le `access_token` pour les tests suivants
```
TOKEN_SUPERADMIN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### Test 1.4: Accès au Profil Superadmin
```http
GET http://localhost:3000/api/auth/profile
Authorization: Bearer {TOKEN_SUPERADMIN}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Retourne les informations du superadmin
- ✅ Pas de mot de passe dans la réponse

**Résultat Réel :** _____________

---

#### Test 1.5: Création d'une Organisation
```http
POST http://localhost:3000/api/organisations
Authorization: Bearer {TOKEN_SUPERADMIN}
Content-Type: application/json

{
  "nom": "TechCorp Solutions",
  "type": "entreprise_privee",
  "code_pays": "FR",
  "email": "contact@techcorp.fr",
  "telephone": "+33123456789",
  "ville": "Paris",
  "pays": "France"
}
```

**Résultat Attendu :**
- ✅ Status: 201 Created
- ✅ Retourne l'organisation avec `organisation_id`

**Résultat Réel :** _____________

**IMPORTANT :** Noter l'`organisation_id` : _____________

---

#### Test 1.6: Création d'un Admin
```http
POST http://localhost:3000/api/auth/register
Authorization: Bearer {TOKEN_SUPERADMIN}
Content-Type: application/json

{
  "email": "admin@techcorp.fr",
  "password": "Admin123!@#",
  "nom": "Dupont",
  "prenom": "Jean",
  "age": 30,
  "role": "admin",
  "organisation_id": "1"
}
```

**Résultat Attendu :**
- ✅ Status: 201 Created
- ✅ `role: "admin"`
- ✅ Organisation associée

**Résultat Réel :** _____________

---

#### Test 1.7: Création d'un Utilisateur Normal
```http
POST http://localhost:3000/api/auth/register
Authorization: Bearer {TOKEN_SUPERADMIN}
Content-Type: application/json

{
  "email": "marie.dupont@techcorp.fr",
  "password": "User123!@#",
  "nom": "Dupont",
  "prenom": "Marie",
  "age": 32,
  "role": "user",
  "organisation_id": "1"
}
```

**Résultat Attendu :**
- ✅ Status: 201 Created
- ✅ `role: "user"`

**Résultat Réel :** _____________

---

#### Test 1.8: Login Utilisateur
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "marie.dupont@techcorp.fr",
  "password": "User123!@#"
}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Retourne tokens

**Résultat Réel :** _____________

**IMPORTANT :** Copier le token utilisateur
```
TOKEN_USER = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### SCÉNARIO 2: Gamification et Badges (45 min)

#### Test 2.1: Initialisation des Badges
```http
POST http://localhost:3000/api/gamification/badges/init
Authorization: Bearer {TOKEN_SUPERADMIN}
Content-Type: application/json

{
  "force": true
}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Message de confirmation
- ✅ 6-7 badges créés

**Résultat Réel :** _____________

---

#### Test 2.2: Liste des Badges
```http
GET http://localhost:3000/api/gamification/badges
Authorization: Bearer {TOKEN_USER}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Liste de badges avec:
  - Premier Pas (bronze)
  - Vigilant (bronze)
  - Quiz Parfait (bronze)
  - Assidu (argent)
  - Expert Phishing (or)
  - Défenseur Cyber (or)

**Résultat Réel :** _____________

---

#### Test 2.3: Dashboard Utilisateur Initial
```http
GET http://localhost:3000/api/gamification/dashboard
Authorization: Bearer {TOKEN_USER}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ `userLevel.niveau_actuel: "debutant"`
- ✅ `userLevel.points_totaux: 0`
- ✅ `userLevel.points_pour_niveau_suivant: 200`
- ✅ `badges_obtenus: []`
- ✅ Pas de crash (boucle infinie corrigée)

**Résultat Réel :** _____________

---

#### Test 2.4: Création d'un Parcours
```http
POST http://localhost:3000/api/learning/parcours
Authorization: Bearer {TOKEN_SUPERADMIN}
Content-Type: application/json

{
  "titre": "Sensibilisation Cybersécurité - Niveau Débutant",
  "description": "Parcours d'introduction à la cybersécurité",
  "public_cible": "entreprise",
  "duree_estimee_heures": 10
}
```

**Résultat Attendu :**
- ✅ Status: 201 Created
- ✅ Retourne le parcours avec `parcours_id`

**Résultat Réel :** _____________

**IMPORTANT :** Noter le `parcours_id` : _____________

---

#### Test 2.5: Création d'un Module
```http
POST http://localhost:3000/api/learning/modules
Authorization: Bearer {TOKEN_SUPERADMIN}
Content-Type: application/json

{
  "titre": "Reconnaître les Emails de Phishing",
  "description": "Apprendre à identifier les emails frauduleux",
  "parcours_id": 1,
  "public_cible": "tous",
  "code_langue": "FR",
  "niveau_difficulte": "facile",
  "thematique_cyber": "phishing",
  "ordre": 1,
  "objectifs_apprentissage": ["Identifier les emails suspects", "Connaître les bonnes pratiques"],
  "points_completion": 50,
  "points_quiz_reussi": 25
}
```

**Résultat Attendu :**
- ✅ Status: 201 Created
- ✅ `points_completion: 50`

**Résultat Réel :** _____________

**IMPORTANT :** Noter le `module_id` : _____________

---

#### Test 2.6: Création d'une Progression (Complétion Module)
```http
POST http://localhost:3000/api/learning/progress
Authorization: Bearer {TOKEN_USER}
Content-Type: application/json

{
  "parcours_id": 1,
  "statut": "termine",
  "score": 95
}
```

**Résultat Attendu :**
- ✅ Status: 201 Created
- ✅ Progression créée

**Résultat Réel :** _____________

---

#### Test 2.7: Vérification Dashboard Après Module (TEST CRITIQUE)
```http
GET http://localhost:3000/api/gamification/dashboard
Authorization: Bearer {TOKEN_USER}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ **PAS DE TIMEOUT** (boucle infinie corrigée)
- ✅ `userLevel.points_totaux: >= 50` (points du module)
- ✅ `userLevel.niveau_actuel: "debutant"` (pas encore 200 points)
- ✅ `userLevel.points_pour_niveau_suivant: <= 150` (200 - points_actuels)
- ✅ `badges_obtenus` contient "Premier Pas" (si badge attribué)

**Résultat Réel :** _____________

**CRITIQUE :** Si timeout ou crash → BUG #1 non corrigé ❌

---

#### Test 2.8: Ajout de Points pour Atteindre Niveau Intermédiaire
```http
# Répéter la création de progressions ou utiliser un endpoint de test
# pour ajouter des points jusqu'à atteindre 250 points

GET http://localhost:3000/api/gamification/dashboard
Authorization: Bearer {TOKEN_USER}
```

**Résultat Attendu (avec 250 points) :**
- ✅ `userLevel.niveau_actuel: "intermediaire"`
- ✅ `userLevel.points_totaux: 250`
- ✅ `userLevel.points_niveau_actuel: 50` (250 - 200)
- ✅ `userLevel.points_pour_niveau_suivant: 250` (500 - 250) ← **TEST BUG #3**

**Résultat Réel :** _____________

**CRITIQUE :** Si `points_pour_niveau_suivant: 500` → BUG #3 non corrigé ❌

---

### SCÉNARIO 3: Quiz et Évaluations (30 min)

#### Test 3.1: Création d'un Quiz
```http
POST http://localhost:3000/api/learning/quiz
Authorization: Bearer {TOKEN_SUPERADMIN}
Content-Type: application/json

{
  "titre": "Quiz Phishing - Niveau 1",
  "description": "Testez vos connaissances sur le phishing",
  "module_id": 1,
  "type_quiz": "module",
  "ordre": 1,
  "actif": true,
  "temps_limite_minutes": 15,
  "score_minimum_pour_reussite": 70,
  "questions": [
    {
      "texte_question": "Quel est le principal indicateur d'un email de phishing ?",
      "type_question": "choix_multiple",
      "points": 10,
      "ordre": 1,
      "reponses": [
        {"texte_reponse": "Urgence injustifiée", "est_correcte": true, "ordre": 1},
        {"texte_reponse": "Email bien écrit", "est_correcte": false, "ordre": 2},
        {"texte_reponse": "Logo officiel", "est_correcte": false, "ordre": 3}
      ]
    }
  ]
}
```

**Résultat Attendu :**
- ✅ Status: 201 Created
- ✅ Quiz créé avec questions

**Résultat Réel :** _____________

---

#### Test 3.2: Soumission de Réponses au Quiz
```http
POST http://localhost:3000/api/learning/quiz/1/submit
Authorization: Bearer {TOKEN_USER}
Content-Type: application/json

{
  "reponses": [
    {
      "question_id": 1,
      "reponse_ids": [1]
    }
  ]
}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ `score_final: 100` (1/1 correct)
- ✅ `points_obtenus: 10`

**Résultat Réel :** _____________

---

#### Test 3.3: Vérification Points Après Quiz
```http
GET http://localhost:3000/api/gamification/dashboard
Authorization: Bearer {TOKEN_USER}
```

**Résultat Attendu :**
- ✅ Points augmentés (quiz + gamification)
- ✅ Pas d'erreur dans les logs

**Résultat Réel :** _____________

**NOTE :** Surveiller les logs pour warnings de gamification silencieuse (BUG #5)

---

### SCÉNARIO 4: Simulations d'Attaques (20 min)

#### Test 4.1: Liste des Simulations
```http
GET http://localhost:3000/api/gamification/simulations
Authorization: Bearer {TOKEN_USER}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Liste des simulations actives

**Résultat Réel :** _____________

---

#### Test 4.2: Réponse à une Simulation
```http
POST http://localhost:3000/api/gamification/simulations/respond
Authorization: Bearer {TOKEN_USER}
Content-Type: application/json

{
  "simulation_id": 1,
  "action_utilisateur": "signale_comme_spam",
  "temps_reponse_secondes": 120,
  "details_reponse": {
    "indicateurs_identifies": ["urgence", "lien_suspect"]
  }
}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ `reussi: true` (si action correcte)
- ✅ `points_gagnes: 150`
- ✅ Feedback personnalisé

**Résultat Réel :** _____________

---

### SCÉNARIO 5: Chatbot (15 min)

#### Test 5.1: Création d'une Conversation
```http
POST http://localhost:3000/api/gamification/chatbot/conversations
Authorization: Bearer {TOKEN_USER}
Content-Type: application/json

{
  "sujet": "Question sur le phishing"
}
```

**Résultat Attendu :**
- ✅ Status: 201 Created
- ✅ `conversation_id` retourné

**Résultat Réel :** _____________

---

#### Test 5.2: Envoi d'un Message
```http
POST http://localhost:3000/api/gamification/chatbot/conversations/1/messages
Authorization: Bearer {TOKEN_USER}
Content-Type: application/json

{
  "message": "Comment reconnaître un vrai email de ma banque ?"
}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Réponse du chatbot pertinente
- ✅ Suggestions de modules

**Résultat Réel :** _____________

---

### SCÉNARIO 6: Certificats (15 min)

#### Test 6.1: Vérification Éligibilité Certificat
```http
GET http://localhost:3000/api/certificates/user/2
Authorization: Bearer {TOKEN_USER}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Liste des certificats (vide si pas éligible)

**Résultat Réel :** _____________

---

### SCÉNARIO 7: Analytics Superadmin (20 min)

#### Test 7.1: Dashboard Global
```http
GET http://localhost:3000/api/analytics/dashboard?timeRange=MONTH
Authorization: Bearer {TOKEN_SUPERADMIN}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Métriques globales
- ✅ Statistiques utilisateurs

**Résultat Réel :** _____________

---

#### Test 7.2: Rapport Organisation
```http
GET http://localhost:3000/api/analytics/organisations/1/report
Authorization: Bearer {TOKEN_SUPERADMIN}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Statistiques de l'organisation

**Résultat Réel :** _____________

---

#### Test 7.3: Santé du Système
```http
GET http://localhost:3000/api/analytics/system/health
Authorization: Bearer {TOKEN_SUPERADMIN}
```

**Résultat Attendu :**
- ✅ Status: 200 OK
- ✅ Métriques de santé

**Résultat Réel :** _____________

---

## 📊 GRILLE DE VALIDATION

### Tests Critiques (Doivent TOUS passer)
- [ ] ✅ Test 1.3: Login fonctionne
- [ ] ✅ Test 2.3: Dashboard initial sans crash
- [ ] ✅ Test 2.7: Dashboard après module **SANS TIMEOUT** (BUG #1)
- [ ] ✅ Test 2.8: Points niveau suivant **CORRECTS** (BUG #3)
- [ ] ✅ Test 1.4: Accès au profil utilisateur (BUG #2)

### Tests Importants (Au moins 80% doivent passer)
- [ ] ⚠️ Test 1.5: Création organisation
- [ ] ⚠️ Test 1.6: Création admin
- [ ] ⚠️ Test 2.4: Création parcours
- [ ] ⚠️ Test 2.5: Création module
- [ ] ⚠️ Test 3.1: Création quiz
- [ ] ⚠️ Test 3.2: Soumission quiz
- [ ] ⚠️ Test 4.2: Réponse simulation
- [ ] ⚠️ Test 5.2: Chatbot

### Tests Optionnels (Nice to have)
- [ ] 🔵 Test 6.1: Certificats
- [ ] 🔵 Test 7.1: Analytics dashboard
- [ ] 🔵 Test 7.2: Rapport organisation

---

## 🐛 RAPPORT DE BUGS

### Bugs Trouvés Pendant les Tests

| Test | Bug | Sévérité | Description |
|------|-----|----------|-------------|
| 2.7 | | | |
| 2.8 | | | |
| | | | |

---

## ✅ VALIDATION FINALE

### Décision de Déploiement

**Tous les tests critiques passent :** ☐ OUI ☐ NON

**Au moins 80% des tests importants passent :** ☐ OUI ☐ NON

**Aucun bug bloquant trouvé :** ☐ OUI ☐ NON

### Verdict
☐ **APPROUVÉ POUR DÉPLOIEMENT**  
☐ **CORRECTIONS NÉCESSAIRES**  
☐ **REJETÉ - Bugs critiques**

---

**Testeur :** _______________________  
**Date :** _______________________  
**Signature :** _______________________
