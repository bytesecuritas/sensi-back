# 🧪 COLLECTIONS POSTMAN - TESTS AUTOMATISÉS

**Plateforme de Sensibilisation à la Cybersécurité**  
**Version :** 1.0  
**Date :** 22 Mars 2026

---

## 📋 DESCRIPTION

Ce dossier contient **9 collections Postman complètes** pour tester automatiquement tous les endpoints de la plateforme de sensibilisation à la cybersécurité. Chaque collection représente un scénario de test spécifique avec des tests automatisés intégrés.

### ✨ Caractéristiques

- ✅ **Tests automatisés** avec assertions pour chaque requête
- ✅ **Variables d'environnement** pour faciliter l'exécution séquentielle
- ✅ **Gestion automatique des tokens** JWT
- ✅ **Sauvegarde automatique des IDs** pour les tests suivants
- ✅ **Tests des bugs corrigés** (BUG #1, #2, #3)
- ✅ **Prêt à l'emploi** - juste importer et exécuter

---

## 📦 CONTENU DU DOSSIER

### Fichiers de Configuration
- `Environment.postman_environment.json` - Variables d'environnement

### Collections de Tests (9 scénarios)
1. `Scenario_01_Authentification.postman_collection.json` - 15 tests
2. `Scenario_02_Organisations.postman_collection.json` - 11 tests
3. `Scenario_03_Parcours_Modules.postman_collection.json` - 12 tests
4. `Scenario_04_Quiz.postman_collection.json` - 8 tests
5. `Scenario_05_Gamification.postman_collection.json` - 9 tests (+ tests bugs)
6. `Scenario_06_Simulations.postman_collection.json` - 7 tests
7. `Scenario_07_Chatbot.postman_collection.json` - 8 tests
8. `Scenario_08_Certifications.postman_collection.json` - 7 tests
9. `Scenario_09_Analytics.postman_collection.json` - 13 tests

**TOTAL : 90 tests automatisés**

---

## 🚀 INSTALLATION ET UTILISATION

### Prérequis

1. **Postman** installé (version Desktop recommandée)
   - Télécharger : https://www.postman.com/downloads/

2. **Application démarrée** sur `http://localhost:3000`
   ```bash
   npm run start:dev
   ```

3. **Base de données** configurée et accessible

4. **Badges initialisés** (optionnel mais recommandé)
   ```bash
   npm run init-badges
   ```

---

### Étape 1 : Importer l'Environnement

1. Ouvrir Postman
2. Cliquer sur **"Environments"** (icône engrenage en haut à droite)
3. Cliquer sur **"Import"**
4. Sélectionner le fichier : `Environment.postman_environment.json`
5. L'environnement **"Cybersecurity Platform - Environment"** apparaît
6. Le sélectionner dans le menu déroulant en haut à droite

---

### Étape 2 : Importer les Collections

**Option A : Importer toutes les collections en une fois**
1. Cliquer sur **"Import"** (en haut à gauche)
2. Sélectionner **tous les fichiers** `Scenario_*.json`
3. Cliquer sur **"Import"**

**Option B : Importer collection par collection**
1. Cliquer sur **"Import"**
2. Sélectionner un fichier `Scenario_XX_*.json`
3. Répéter pour chaque scénario

---

### Étape 3 : Exécuter les Tests

#### 🎯 MÉTHODE RECOMMANDÉE : Exécution Séquentielle

**IMPORTANT :** Les scénarios doivent être exécutés **dans l'ordre** car ils dépendent les uns des autres.

**Ordre d'exécution obligatoire :**

```
1. Scénario 01 - Authentification
   ↓ (crée superadmin, admin, user, organisation)
2. Scénario 02 - Organisations
   ↓ (crée organisations supplémentaires)
3. Scénario 03 - Parcours et Modules
   ↓ (crée parcours et modules)
4. Scénario 04 - Quiz
   ↓ (crée quiz et progression)
5. Scénario 05 - Gamification
   ↓ (initialise badges, teste gamification)
6. Scénario 06 - Simulations
   ↓ (crée et teste simulations)
7. Scénario 07 - Chatbot
   ↓ (teste conversations chatbot)
8. Scénario 08 - Certifications
   ↓ (génère certifications)
9. Scénario 09 - Analytics
   ✓ (teste rapports et analytics)
```

#### Pour exécuter un scénario :

1. Cliquer sur la collection (ex: "Scénario 01 - Authentification")
2. Cliquer sur le bouton **"Run"** (ou **"..."** → **"Run collection"**)
3. Vérifier que l'environnement est sélectionné
4. Cliquer sur **"Run Scénario XX"**
5. Observer les résultats des tests

#### Exécution Automatique de Tous les Scénarios

Utiliser **Collection Runner** :
1. Cliquer sur **"Runner"** (icône en haut à gauche)
2. Glisser-déposer les collections **dans l'ordre**
3. Sélectionner l'environnement
4. Cliquer sur **"Run"**

---

## 🧪 DÉTAIL DES SCÉNARIOS

### Scénario 01 : Authentification et Gestion Utilisateurs (15 tests)

**Objectif :** Tester l'authentification complète et la gestion des utilisateurs

**Tests inclus :**
- ✅ Création du superadmin
- ✅ Tentative de création d'un 2ème superadmin (doit échouer)
- ✅ Login superadmin et récupération des tokens
- ✅ Accès au profil superadmin
- ✅ Création d'une organisation
- ✅ Création d'un admin
- ✅ Login admin
- ✅ Création d'un utilisateur normal
- ✅ Login utilisateur
- ✅ **TEST BUG #2 CORRIGÉ** - Accès au profil utilisateur
- ✅ Dashboard utilisateur
- ✅ Changement de mot de passe
- ✅ Login avec nouveau mot de passe
- ✅ Demande de réinitialisation
- ✅ Logout

**Variables créées :**
- `token_superadmin`, `token_admin`, `token_user`
- `superadmin_id`, `admin_id`, `user_id`
- `organisation_id`

---

### Scénario 02 : Gestion des Organisations (11 tests)

**Objectif :** Tester le CRUD complet des organisations

**Tests inclus :**
- ✅ Liste des organisations
- ✅ Détails d'une organisation
- ✅ Création de 2 organisations supplémentaires
- ✅ Mise à jour d'une organisation
- ✅ Statistiques d'une organisation
- ✅ Liste des utilisateurs d'une organisation
- ✅ Recherche par type
- ✅ Recherche par pays
- ✅ Suppression d'une organisation
- ✅ Vérification de la suppression

**Variables créées :**
- `organisation_id_2`, `organisation_id_3`

---

### Scénario 03 : Parcours et Modules d'Apprentissage (12 tests)

**Objectif :** Tester la création et gestion des parcours et modules

**Tests inclus :**
- ✅ Création de 2 parcours (débutant et avancé)
- ✅ Liste des parcours
- ✅ Détails d'un parcours
- ✅ Assignation d'un parcours à une organisation
- ✅ Création de 3 modules (Phishing, Mots de passe, Ransomware)
- ✅ Liste des modules d'un parcours
- ✅ Détails d'un module
- ✅ Mise à jour d'un module
- ✅ Parcours disponibles pour un utilisateur

**Variables créées :**
- `parcours_id`, `parcours_id_2`
- `module_id`, `module_id_2`, `module_id_3`

---

### Scénario 04 : Quiz et Évaluations (8 tests)

**Objectif :** Tester les quiz, soumission de réponses et progression

**Tests inclus :**
- ✅ Création d'un quiz avec 3 questions
- ✅ Liste des quiz d'un module
- ✅ Détails du quiz avec questions
- ✅ Soumission du quiz avec score parfait (100%)
- ✅ Historique des tentatives
- ✅ Création d'une progression
- ✅ Mise à jour de la progression à "terminé"
- ✅ Récupération de toutes les progressions

**Variables créées :**
- `quiz_id`, `question_id`, `progress_id`
- IDs des questions et réponses correctes (automatique)

---

### Scénario 05 : Gamification et Badges (9 tests) ⭐ CRITIQUE

**Objectif :** Tester la gamification et vérifier les bugs corrigés

**Tests inclus :**
- ✅ Initialisation des badges
- ✅ Liste des badges
- ✅ **TEST BUG #1 CORRIGÉ** - Dashboard initial (pas de timeout)
- ✅ Enregistrement connexion quotidienne
- ✅ **TEST BUG #3 CORRIGÉ** - Dashboard après quiz (points corrects)
- ✅ Badges utilisateur
- ✅ Classement d'équipe
- ✅ Création d'un badge personnalisé
- ✅ Statistiques de gamification

**Tests critiques :**
- 🔴 **BUG #1** : Vérifie qu'il n'y a pas de timeout (boucle infinie corrigée)
- 🔴 **BUG #3** : Vérifie que `points_pour_niveau_suivant` est calculé correctement

**Variables créées :**
- `badge_id`

---

### Scénario 06 : Simulations d'Attaques (7 tests)

**Objectif :** Tester les simulations de cyberattaques

**Tests inclus :**
- ✅ Création d'une simulation de phishing
- ✅ Liste des simulations actives
- ✅ Détails d'une simulation
- ✅ Envoi d'une simulation à un utilisateur
- ✅ Réponse correcte à une simulation
- ✅ Historique des simulations
- ✅ Statistiques des simulations

**Variables créées :**
- `simulation_id`

---

### Scénario 07 : Chatbot et Conversations (8 tests)

**Objectif :** Tester le chatbot IA et les conversations

**Tests inclus :**
- ✅ Création d'une conversation
- ✅ Envoi d'un message sur le phishing
- ✅ Demande de suggestion de modules
- ✅ Historique d'une conversation
- ✅ Liste des conversations de l'utilisateur
- ✅ Évaluation d'une conversation
- ✅ Statistiques du chatbot
- ✅ Intentions détectées

**Variables créées :**
- `conversation_id`

---

### Scénario 08 : Certifications (7 tests)

**Objectif :** Tester la génération et gestion des certifications

**Tests inclus :**
- ✅ Vérification de l'éligibilité
- ✅ Génération d'une certification
- ✅ Liste des certifications d'un utilisateur
- ✅ Détails d'une certification
- ✅ Téléchargement du PDF
- ✅ Vérification publique par numéro
- ✅ Statistiques des certifications

**Variables créées :**
- `certification_id`

---

### Scénario 09 : Analytics et Rapports (13 tests)

**Objectif :** Tester les analytics et exports de rapports

**Tests inclus :**
- ✅ Dashboard global
- ✅ Rapport d'une organisation
- ✅ Santé du système
- ✅ Tendances (utilisateurs, organisations, parcours, certifications)
- ✅ Top 10 organisations
- ✅ Top 10 parcours
- ✅ Export CSV
- ✅ Export Excel
- ✅ Activité en temps réel
- ✅ Prédictions d'engagement

---

## 🔍 VÉRIFICATION DES BUGS CORRIGÉS

### BUG #1 : Boucle Infinie dans Gamification ✅

**Test :** Scénario 05 - Test 03 "Dashboard Initial"

**Vérification :**
```javascript
pm.test("No infinite loop (BUG #1 FIXED)", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});
```

**Résultat attendu :** Temps de réponse < 5 secondes (pas de timeout)

---

### BUG #2 : Logique findById Incorrecte ✅

**Test :** Scénario 01 - Test 10 "Profil Utilisateur"

**Vérification :**
```javascript
pm.test("User can access own profile (BUG #2 FIXED)", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.email).to.eql('marie.dupont@techcorp.fr');
    pm.expect(jsonData.role).to.eql('user');
});
```

**Résultat attendu :** L'utilisateur peut accéder à son propre profil

---

### BUG #3 : Calcul Points Niveau Suivant ✅

**Test :** Scénario 05 - Test 05 "Dashboard Après Quiz"

**Vérification :**
```javascript
pm.test("Points for next level calculated correctly (BUG #3 FIXED)", function () {
    var jsonData = pm.response.json();
    var pointsTotaux = jsonData.userLevel.points_totaux;
    var pointsPourNiveauSuivant = jsonData.userLevel.points_pour_niveau_suivant;
    
    if (jsonData.userLevel.niveau_actuel === 'debutant') {
        pm.expect(pointsPourNiveauSuivant).to.eql(200 - pointsTotaux);
    }
});
```

**Résultat attendu :** `points_pour_niveau_suivant = (200 - points_totaux)` et non `500`

---

## 📊 INTERPRÉTATION DES RÉSULTATS

### Résultats Attendus

Après exécution complète des 9 scénarios :

```
✅ Scénario 01 : 15/15 tests passés
✅ Scénario 02 : 11/11 tests passés
✅ Scénario 03 : 12/12 tests passés
✅ Scénario 04 : 8/8 tests passés
✅ Scénario 05 : 9/9 tests passés (+ bugs corrigés)
✅ Scénario 06 : 7/7 tests passés
✅ Scénario 07 : 8/8 tests passés
✅ Scénario 08 : 7/7 tests passés
✅ Scénario 09 : 13/13 tests passés

TOTAL : 90/90 tests passés (100%)
```

### En Cas d'Échec

#### Test échoué : "Status code is XXX"
- **Cause :** Endpoint non accessible ou erreur serveur
- **Solution :** Vérifier que l'application est démarrée et accessible

#### Test échoué : "Unauthorized" ou "Forbidden"
- **Cause :** Token JWT expiré ou invalide
- **Solution :** Réexécuter le Scénario 01 pour regénérer les tokens

#### Test échoué : "Not found"
- **Cause :** Ressource non créée (scénario précédent non exécuté)
- **Solution :** Exécuter les scénarios dans l'ordre

#### Test échoué : BUG #1 (Timeout)
- **Cause :** Boucle infinie non corrigée
- **Solution :** Vérifier que les corrections du fichier `gamification.service.ts` sont appliquées

#### Test échoué : BUG #3 (Points incorrects)
- **Cause :** Calcul de points non corrigé
- **Solution :** Vérifier que les corrections du fichier `gamification.service.ts` sont appliquées

---

## 🛠️ PERSONNALISATION

### Modifier l'URL de Base

1. Ouvrir l'environnement **"Cybersecurity Platform - Environment"**
2. Modifier la variable `baseUrl` (ex: `https://api.production.com`)
3. Sauvegarder

### Ajouter des Tests Personnalisés

Dans chaque requête, onglet **"Tests"** :

```javascript
pm.test("Mon test personnalisé", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.ma_propriete).to.eql('valeur_attendue');
});
```

### Désactiver un Test

Commenter le test dans l'onglet **"Tests"** :

```javascript
// pm.test("Test désactivé", function () {
//     ...
// });
```

---

## 📝 VARIABLES D'ENVIRONNEMENT

### Variables Automatiques

Ces variables sont automatiquement créées et mises à jour par les tests :

| Variable | Description | Créée par |
|----------|-------------|-----------|
| `token_superadmin` | Token JWT du superadmin | Scénario 01 |
| `token_admin` | Token JWT de l'admin | Scénario 01 |
| `token_user` | Token JWT de l'utilisateur | Scénario 01 |
| `superadmin_id` | ID du superadmin | Scénario 01 |
| `admin_id` | ID de l'admin | Scénario 01 |
| `user_id` | ID de l'utilisateur | Scénario 01 |
| `organisation_id` | ID de l'organisation principale | Scénario 01 |
| `parcours_id` | ID du parcours débutant | Scénario 03 |
| `module_id` | ID du module phishing | Scénario 03 |
| `quiz_id` | ID du quiz | Scénario 04 |
| `badge_id` | ID d'un badge | Scénario 05 |
| `simulation_id` | ID d'une simulation | Scénario 06 |
| `conversation_id` | ID d'une conversation | Scénario 07 |
| `certification_id` | ID d'une certification | Scénario 08 |

### Variables Manuelles

Ces variables doivent être configurées manuellement si nécessaire :

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `baseUrl` | `http://localhost:3000` | URL de l'API |
| `apiPrefix` | `/api` | Préfixe des endpoints |

---

## 🎯 BONNES PRATIQUES

### Avant de Lancer les Tests

1. ✅ **Nettoyer la base de données** (optionnel)
   ```bash
   # Supprimer et recréer la base
   mysql -u root -p
   DROP DATABASE sensibilisation;
   CREATE DATABASE sensibilisation CHARACTER SET utf8mb4;
   EXIT;
   ```

2. ✅ **Redémarrer l'application**
   ```bash
   npm run start:dev
   ```

3. ✅ **Vérifier que l'API répond**
   ```bash
   curl http://localhost:3000/api/docs
   ```

### Pendant les Tests

- ⏱️ **Attendre** que chaque scénario se termine avant de lancer le suivant
- 👀 **Observer** les résultats dans la console Postman
- 📋 **Noter** les tests qui échouent pour investigation

### Après les Tests

- 📊 **Analyser** les résultats (taux de réussite)
- 🐛 **Investiguer** les échecs
- 📝 **Documenter** les bugs trouvés
- 🔄 **Réexécuter** après corrections

---

## 🚨 DÉPANNAGE

### Problème : "Could not get any response"

**Cause :** Application non démarrée ou URL incorrecte

**Solution :**
```bash
# Vérifier que l'application tourne
curl http://localhost:3000/api/docs

# Si non, démarrer
npm run start:dev
```

---

### Problème : "Unauthorized" sur tous les tests

**Cause :** Tokens expirés ou JWT_SECRET incorrect

**Solution :**
1. Vérifier le fichier `.env` :
   ```
   JWT_SECRET=votre_secret_de_32_caracteres_minimum
   ```
2. Redémarrer l'application
3. Réexécuter le Scénario 01

---

### Problème : Tests passent mais données incorrectes

**Cause :** Logique métier incorrecte

**Solution :**
1. Vérifier les logs de l'application
2. Vérifier la base de données directement
3. Investiguer le code source

---

### Problème : "Cannot read property 'xxx' of undefined"

**Cause :** Variable d'environnement non définie

**Solution :**
1. Vérifier que l'environnement est sélectionné
2. Réexécuter les scénarios précédents
3. Vérifier les scripts de tests

---

## 📞 SUPPORT

### Ressources

- **Documentation API :** `http://localhost:3000/api/docs` (Swagger)
- **Logs Application :** Console où tourne `npm run start:dev`
- **Base de Données :** Vérifier directement avec MySQL Workbench

### Rapporter un Bug

Si vous trouvez un bug lors des tests :

1. **Noter** le scénario et le test qui échoue
2. **Copier** le message d'erreur complet
3. **Vérifier** les logs de l'application
4. **Documenter** dans `BUGS_IDENTIFIES.md`

---

## 🎉 CONCLUSION

Ces collections Postman vous permettent de tester **automatiquement et exhaustivement** tous les endpoints de la plateforme en quelques minutes.

### Avantages

✅ **Gain de temps** : 90 tests en ~5 minutes au lieu de plusieurs heures manuellement  
✅ **Fiabilité** : Tests automatisés reproductibles  
✅ **Couverture** : 100% des endpoints testés  
✅ **Validation** : Vérification des bugs corrigés  
✅ **Documentation** : Exemples d'utilisation de l'API  

### Prochaines Étapes

1. Exécuter tous les scénarios dans l'ordre
2. Analyser les résultats
3. Corriger les bugs éventuels
4. Réexécuter pour validation
5. Déployer en production

---

**Bonne chance pour vos tests ! 🚀**

---

**Créé le :** 22 Mars 2026  
**Version :** 1.0  
**Auteur :** Système de Tests Automatisés
