# Tests HTTP - Application de Sensibilisation à la Cybersécurité

Ce dossier contient une suite complète de tests HTTP pour l'application de sensibilisation à la cybersécurité.

## 📁 Structure des Fichiers

### 1. `01-auth-tests.http` - Tests d'Authentification
- Création de comptes (superadmin, admin, utilisateurs)
- Login/logout
- Changement de mot de passe
- Réinitialisation de mot de passe
- Gestion des profils

### 2. `02-organisations-tests.http` - Tests des Organisations
- CRUD des organisations
- Gestion des utilisateurs par organisation
- Statistiques avancées des organisations
- Comparatifs de performance

### 3. `03-learning-paths-tests.http` - Tests des Parcours d'Apprentissage
- Création de parcours de cybersécurité
- Association parcours-organisations
- Gestion des parcours par public cible

### 4. `04-learning-modules-tests.http` - Tests des Modules
- Création de modules thématiques
- Contenus adaptés par niveau
- Modules spécialisés (phishing, RGPD, etc.)

### 5. `05-media-content-tests.http` - Tests des Contenus Médias
- Upload de vidéos (utilisant le fichier GIMS spécifié)
- Création de contenus texte, PDF, audio
- Contenus interactifs (quiz, jeux)
- Gestion des médias par module

### 6. `06-progress-tests.http` - Tests des Progressions
- Suivi des progressions utilisateurs
- Scores et temps passé
- Statistiques de progression
- Gestion des statuts (en cours, terminé, abandonné)

### 7. `07-certifications-tests.http` - Tests des Certifications
- Création de certifications par type
- Gestion des certifications par utilisateur
- Statistiques de certification
- Types de certifications spécialisées

### 8. `08-complete-workflow-test.http` - Test Workflow Complet
- Workflow end-to-end de l'application
- Simulation complète d'une formation
- Validation du processus complet

### 9. `09-analytics-tests.http` - Tests du Système d'Analytics
- Tableau de bord global du superadmin
- Rapports détaillés par organisation
- Tendances et évolutions temporelles
- Top performers et classements
- Export de rapports multi-formats
- Activité temps réel et prédictions
- Comparaisons de périodes
- Monitoring de la santé système

### 10. `10-my-infos-tests.http` - Tests de la Route GetMyInfos
- Tests pour utilisateurs normaux (rôle: user)
- Tests pour administrateurs (rôle: admin)
- Tests pour superadmins (rôle: superadmin)
- Tests de sécurité et gestion d'erreurs
- Workflow complet de test avec authentification

## 🚀 Utilisation

### Prérequis
1. L'application doit être démarrée sur `http://localhost:3000`
2. Avoir un client HTTP (VS Code REST Client, Postman, etc.)
3. Le fichier vidéo `GIMS__-_BABY__Clip_officiel_(480p).mp4` doit être présent dans `C:\Users\Mossoko\Videos\`

### Ordre d'Exécution Recommandé

1. **Commencer par `01-auth-tests.http`**
   - Créer les comptes de base
   - Obtenir les tokens d'authentification

2. **Continuer avec `02-organisations-tests.http`**
   - Créer les organisations
   - Configurer les structures

3. **Enchaîner avec `03-learning-paths-tests.http`**
   - Créer les parcours de formation

4. **Suivre avec `04-learning-modules-tests.http`**
   - Créer les modules d'apprentissage

5. **Tester `05-media-content-tests.http`**
   - Ajouter les contenus multimédias

6. **Exécuter `06-progress-tests.http`**
   - Simuler les progressions utilisateurs

7. **Tester `07-certifications-tests.http`**
   - Créer les certifications

8. **Finaliser avec `08-complete-workflow-test.http`**
   - Valider le workflow complet

9. **Tester `09-analytics-tests.http`**
    - Valider le système d'analytics du superadmin

10. **Tester `10-my-infos-tests.http`**
    - Valider la route getMyInfos avec routage basé sur les rôles

## 🔧 Configuration des Variables

### Variables d'Environnement
```http
@baseUrl = http://localhost:3000
@contentType = application/json
```

### Variables de Tokens
```http
# @superadmin_token = token_jwt_du_superadmin
# @admin_token = token_jwt_de_l_admin
# @user1_token = token_jwt_de_l_utilisateur_1
# @user2_token = token_jwt_de_l_utilisateur_2
# @reset_token = token_de_reinitialisation
```

## 📊 Données de Test

### Utilisateurs de Test
- **Superadmin:** `superadmin@cybersec.com` / `SuperAdmin123!`
- **Admin:** `admin@techcorp.com` / `AdminTech123!`
- **Utilisateur 1:** `user1@techcorp.com` / `User123!`
- **Utilisateur 2:** `user2@techcorp.com` / `User456!`

### Organisations de Test
- **TechCorp Solutions** (entreprise)
- **SecureBank Finance** (banque)
- **CyberEdu Academy** (éducation)

### Parcours de Test
1. **Sensibilisation Cybersécurité - Niveau Débutant**
2. **Cybersécurité en Entreprise - Niveau Intermédiaire**
3. **Sécurité Numérique pour Enfants**
4. **Détection et Prévention du Phishing**
5. **Protection des Données Personnelles (RGPD)**

### Modules de Test
- Mots de passe sécurisés
- Détection du phishing
- Protection des données
- Sécurité mobile
- Navigation sécurisée
- Rançongiciels (avancé)
- Ingénierie sociale
- Sécurité pour enfants

## 🎯 Thématiques Cybersécurité

### Niveaux de Difficulté
- **Facile:** Concepts de base, bonnes pratiques
- **Moyen:** Détection de menaces, protection avancée
- **Difficile:** Menaces avancées, réponse aux incidents

### Publics Cibles
- **Grand public:** Sensibilisation générale
- **Entreprise:** Formation professionnelle
- **Enfants:** Éducation ludique

### Types de Contenus
- **Vidéo:** Explications visuelles
- **Texte:** Guides détaillés
- **PDF:** Ressources téléchargeables
- **Audio:** Podcasts et formations audio
- **Interactif:** Quiz, jeux, simulations

## 🔒 Sécurité

### Validation des Mots de Passe
- Minimum 8 caractères
- Majuscules et minuscules
- Chiffres et caractères spéciaux
- Validation de complexité

### Authentification
- JWT tokens
- Gestion des rôles
- Protection des routes
- Limitation de taux

## 📈 Statistiques et Métriques

### Métriques d'Engagement
- Taux de completion
- Temps moyen par module
- Scores moyens
- Utilisateurs actifs

### Métriques de Performance
- Progression par parcours
- Statistiques par organisation
- Comparatifs de performance
- Tendances temporelles

### Système d'Analytics (Superadmin)
- Tableau de bord global avec métriques clés
- Rapports détaillés par organisation
- Tendances de croissance utilisateurs
- Performance des parcours d'apprentissage
- Top performers (organisations et parcours)
- Export de rapports (JSON, CSV, Excel, PDF)
- Activité temps réel et monitoring système
- Prédictions d'engagement et forecasting
- Comparaisons de périodes
- Santé et performance du système

## 🛠️ Dépannage

### Erreurs Courantes
1. **Token invalide:** Vérifier l'authentification
2. **Fichier vidéo manquant:** Vérifier le chemin du fichier
3. **Permissions insuffisantes:** Vérifier les rôles utilisateur
4. **Données manquantes:** Exécuter les tests dans l'ordre

### Validation
- Vérifier les codes de réponse HTTP
- Contrôler les données retournées
- Valider les statistiques générées
- Tester les workflows complets

## 📝 Notes

- Les tests utilisent des données cohérentes avec la sensibilisation à la cybersécurité
- Le fichier vidéo GIMS est utilisé comme contenu média de test
- Tous les scénarios couvrent les cas d'usage réels
- Les métriques permettent un suivi complet des formations
