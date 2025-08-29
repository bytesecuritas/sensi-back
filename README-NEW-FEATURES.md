# Nouvelles Fonctionnalités - Gestion de Session et Statistiques Avancées

## 1. Gestion de Session

### 1.1 Déconnexion (Logout)
**Route:** `POST /auth/logout`
**Description:** Permet à un utilisateur de se déconnecter de manière sécurisée.
**Authentification:** Requiert un token JWT valide
**Réponse:**
```json
{
  "message": "Déconnexion réussie"
}
```

### 1.2 Changement de Mot de Passe
**Route:** `POST /auth/change-password`
**Description:** Permet à un utilisateur de changer son mot de passe en fournissant l'ancien mot de passe.
**Authentification:** Requiert un token JWT valide
**Corps de la requête:**
```json
{
  "currentPassword": "AncienMotDePasse123!",
  "newPassword": "NouveauMotDePasse123!"
}
```
**Validation:** Le nouveau mot de passe doit respecter les règles de complexité (8+ caractères, majuscules, minuscules, chiffres, caractères spéciaux)

### 1.3 Demande de Réinitialisation de Mot de Passe
**Route:** `POST /auth/reset-password-request`
**Description:** Envoie un lien de réinitialisation par email (en production).
**Corps de la requête:**
```json
{
  "email": "user@example.com"
}
```
**Sécurité:** Ne révèle pas si l'email existe ou non dans la base de données
**Limitation:** 3 demandes maximum par 5 minutes par IP

### 1.4 Réinitialisation de Mot de Passe
**Route:** `POST /auth/reset-password`
**Description:** Réinitialise le mot de passe avec un token temporaire.
**Corps de la requête:**
```json
{
  "token": "token_de_reinitialisation",
  "newPassword": "NouveauMotDePasse123!"
}
```
**Sécurité:** Token valide pendant 1 heure maximum

## 2. Statistiques Avancées des Organisations

### 2.1 Statistiques Complètes d'Organisation
**Route:** `GET /organisations/:id/stats`
**Description:** Fournit des statistiques détaillées et complètes d'une organisation.
**Authentification:** Requiert un token JWT avec rôle 'superadmin' ou 'admin'

**Données retournées:**
- **Statistiques de base:** Nombre total d'utilisateurs, admins, utilisateurs
- **Statistiques des parcours:** Nombre de parcours, modules, taux de completion
- **Statistiques des certifications:** Nombre et types de certifications obtenues
- **Statistiques d'engagement:** Taux d'engagement, utilisateurs actifs
- **Activité récente:** Progression des 30 derniers jours
- **Classements:** Top parcours par engagement, top utilisateurs actifs
- **Métriques de performance:** Scores moyens, temps moyen, taux de completion global

### 2.2 Statistiques Détaillées par Parcours
**Route:** `GET /organisations/:id/stats/parcours/:parcoursId?periode=30`
**Description:** Statistiques détaillées d'un parcours spécifique.
**Paramètres:**
- `periode`: Nombre de jours pour l'analyse (défaut: 30)

**Données retournées:**
- Informations du parcours (titre, public cible, durée estimée)
- Statistiques par module (completion, scores, temps)
- Statistiques par utilisateur
- Activité temporelle

### 2.3 Statistiques Détaillées par Utilisateur
**Route:** `GET /organisations/:id/stats/utilisateur/:userId`
**Description:** Statistiques détaillées d'un utilisateur spécifique.

**Données retournées:**
- Informations de l'utilisateur
- Statistiques globales (modules complétés, scores moyens, temps total)
- Statistiques par parcours
- Certifications obtenues
- Activité temporelle (progression par mois)

### 2.4 Comparatif des Performances
**Route:** `GET /organisations/:id/stats/comparatif?periode=30`
**Description:** Comparatif des performances entre tous les parcours de l'organisation.

**Données retournées:**
- Statistiques globales de l'organisation
- Comparatif de tous les parcours
- Classements par différents critères (engagement, score, completion)

## 3. Métriques et Indicateurs Clés

### 3.1 Métriques d'Engagement
- **Taux d'engagement:** Pourcentage d'utilisateurs actifs
- **Utilisateurs actifs:** Nombre d'utilisateurs ayant une activité récente
- **Parcours populaires:** Classement par nombre d'inscriptions

### 3.2 Métriques de Performance
- **Score moyen global:** Performance moyenne des utilisateurs
- **Temps moyen:** Temps moyen passé sur les modules
- **Taux de completion:** Pourcentage de modules complétés

### 3.3 Métriques Temporelles
- **Activité récente:** Progression des 30 derniers jours
- **Nouveaux utilisateurs:** Inscriptions récentes
- **Completions récentes:** Modules terminés récemment

### 3.4 Métriques de Certification
- **Total de certifications:** Nombre total de certifications obtenues
- **Certifications par type:** Répartition par type de certification
- **Taux de certification:** Pourcentage d'utilisateurs certifiés

## 4. Sécurité et Performance

### 4.1 Sécurité
- **Validation des mots de passe:** Règles de complexité strictes
- **Limitation de taux:** Protection contre les attaques par force brute
- **Tokens temporaires:** Expiration automatique des tokens de réinitialisation
- **Validation des permissions:** Vérification des rôles pour chaque endpoint

### 4.2 Performance
- **Requêtes optimisées:** Utilisation de relations TypeORM pour éviter les N+1 queries
- **Agrégation côté base:** Calculs effectués au niveau de la base de données
- **Mise en cache:** Possibilité d'ajouter du cache Redis en production

## 5. Utilisation

### 5.1 Tests
Utilisez le fichier `test-organisations-enhanced.http` pour tester toutes les nouvelles fonctionnalités.

### 5.2 Intégration Frontend
Les nouvelles routes retournent des données structurées prêtes pour l'affichage dans des tableaux de bord et graphiques.

### 5.3 Monitoring
Les métriques fournies permettent de:
- Identifier les parcours les plus populaires
- Détecter les utilisateurs en difficulté
- Mesurer l'efficacité des formations
- Prendre des décisions basées sur les données

## 6. Évolutions Futures

### 6.1 Améliorations Possibles
- **Notifications:** Alertes automatiques pour les administrateurs
- **Rapports automatisés:** Génération de rapports PDF/Excel
- **Prédictions:** IA pour prédire les taux de completion
- **Gamification:** Système de badges et récompenses

### 6.2 Optimisations
- **Cache Redis:** Mise en cache des statistiques fréquemment consultées
- **Indexation:** Optimisation des requêtes de base de données
- **Pagination:** Gestion des grandes quantités de données
