# Route GetMyInfos - Implémentation et Documentation

## Vue d'ensemble

La route `GET /auth/my-infos` a été implémentée pour fournir des informations personnalisées selon le rôle de l'utilisateur connecté. Cette route utilise une logique de routage intelligente basée sur les rôles pour retourner les données appropriées.

## Architecture Implémentée

### 1. Service Auth (`src/auth/auth.service.ts`)

#### Méthode `getMyInfos(userId: number)`
```typescript
async getMyInfos(userId: number) {
  const user = await this.usersService.findById(userId);
  if (!user) {
    throw new NotFoundException('Utilisateur non trouvé');
  }

  switch (user.role) {
    case 'user':
      // Pour un utilisateur normal, retourner son profil via getUserInfos
      return await this.usersService.getUserInfos(userId);
    
    case 'admin':
      // Pour un admin, retourner les stats de son organisation
      if (!user.organisation?.organisation_id) {
        throw new BadRequestException('Admin sans organisation assignée');
      }
      return await this.organisationsService.getOrganisationStats(user.organisation.organisation_id);
    
    case 'superadmin':
      // Pour un superadmin, retourner le dashboard global
      return await this.analyticsService.getGlobalDashboard({ timeRange: TimeRange.MONTH });
    
    default:
      throw new BadRequestException('Rôle utilisateur non reconnu');
  }
}
```

### 2. Service Users (`src/users/users.service.ts`)

#### Méthode `getUserInfos(userId: number)`
Cette méthode retourne des informations détaillées pour un utilisateur normal :

- **Informations utilisateur** : profil complet
- **Statistiques** : modules complétés, taux de completion, temps total, score moyen
- **Parcours** : statistiques par parcours d'apprentissage
- **Certifications** : liste des certifications obtenues

### 3. Contrôleur Auth (`src/auth/auth.controller.ts`)

#### Route `GET /auth/my-infos`
```typescript
@Get('my-infos')
@ApiOperation({ summary: 'Obtenir mes informations selon mon rôle' })
@ApiResponse({ status: 200, description: 'Informations récupérées avec succès' })
@ApiResponse({ status: 401, description: 'Non autorisé' })
@ApiResponse({ status: 403, description: 'Accès refusé' })
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'))
async getMyInfos(@Request() req) {
  // Implémentation avec gestion d'erreurs
}
```

## Logique de Routage par Rôle

### 1. Utilisateur Normal (Rôle: 'user')
- **Service appelé** : `usersService.getUserInfos(userId)`
- **Données retournées** :
  - Profil utilisateur complet
  - Statistiques personnelles (modules, scores, temps)
  - Progression par parcours
  - Certifications obtenues

### 2. Administrateur (Rôle: 'admin')
- **Service appelé** : `organisationsService.getOrganisationStats(organisationId)`
- **Données retournées** :
  - Statistiques de l'organisation de l'admin
  - Performance des utilisateurs de l'organisation
  - Métriques d'engagement et de completion
- **Validation** : Vérification que l'admin a une organisation assignée

### 3. Superadmin (Rôle: 'superadmin')
- **Service appelé** : `analyticsService.getGlobalDashboard({ timeRange: TimeRange.MONTH })`
- **Données retournées** :
  - Tableau de bord global du système
  - Métriques système complètes
  - Tendances et statistiques globales
  - Top performers

## Intégration des Modules

### 1. Module Auth (`src/auth/auth.module.ts`)
```typescript
@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => OrganisationsModule),
    forwardRef(() => AnalyticsModule),
    // ... autres imports
  ],
  // ... configuration
})
```

### 2. Dépendances Injectées
- `UsersService` : Pour les informations utilisateur
- `OrganisationsService` : Pour les statistiques d'organisation
- `AnalyticsService` : Pour le dashboard global

## Sécurité et Validation

### 1. Authentification
- **JWT Guard** : Authentification obligatoire
- **Token validation** : Vérification du token utilisateur
- **User extraction** : Récupération de l'ID utilisateur depuis le token

### 2. Validation des Rôles
- **Rôle vérification** : Validation du rôle utilisateur
- **Organisation validation** : Vérification de l'organisation pour les admins
- **Gestion d'erreurs** : Messages d'erreur appropriés

### 3. Gestion d'Erreurs
```typescript
try {
  const userId = req.user?.users_id;
  if (!userId) {
    throw new HttpException('Utilisateur non authentifié', HttpStatus.UNAUTHORIZED);
  }
  return await this.authService.getMyInfos(userId);
} catch (error) {
  // Gestion appropriée des erreurs
}
```

## Tests et Validation

### 1. Fichier de Test (`http/10-my-infos-tests.http`)
- **Tests par rôle** : Tests spécifiques pour chaque type d'utilisateur
- **Tests de sécurité** : Validation de l'authentification
- **Workflow complet** : Tests end-to-end avec authentification

### 2. Scénarios de Test
1. **Utilisateur normal** : Vérification des informations personnelles
2. **Administrateur** : Validation des stats d'organisation
3. **Superadmin** : Test du dashboard global
4. **Sécurité** : Tests sans token et avec token invalide

## Réponses API

### 1. Utilisateur Normal
```json
{
  "user": {
    "users_id": 1,
    "email": "user@example.com",
    "nom": "Doe",
    "prenom": "John",
    "role": "user",
    "organisation": { ... }
  },
  "statistiques": {
    "total_modules": 10,
    "modules_termines": 8,
    "taux_completion": "80.00",
    "temps_total": 3600,
    "score_moyen": "85.50",
    "nombre_certificats": 3
  },
  "parcours": { ... },
  "certificats": [ ... ]
}
```

### 2. Administrateur
```json
{
  "organisation": { ... },
  "statistiques": {
    "total_utilisateurs": 25,
    "utilisateurs_actifs": 20,
    "taux_completion_global": "75.50",
    "parcours_populaires": [ ... ]
  }
}
```

### 3. Superadmin
```json
{
  "overview": {
    "totalUsers": 150,
    "totalOrganisations": 10,
    "totalLearningPaths": 15,
    "completionRate": "78.50"
  },
  "trends": { ... },
  "topPerformers": { ... }
}
```

## Avantages de cette Approche

### 1. Flexibilité
- **Routage intelligent** : Une seule route pour tous les rôles
- **Extensibilité** : Facile d'ajouter de nouveaux rôles
- **Maintenance** : Logique centralisée

### 2. Performance
- **Appels optimisés** : Seuls les services nécessaires sont appelés
- **Données ciblées** : Informations pertinentes selon le rôle
- **Cache possible** : Possibilité d'ajouter du cache par rôle

### 3. Sécurité
- **Contrôle d'accès** : Validation stricte des rôles
- **Isolation des données** : Chaque rôle voit ses données appropriées
- **Validation robuste** : Gestion complète des erreurs

## Évolutions Futures Possibles

### 1. Fonctionnalités Avancées
- **Cache Redis** : Mise en cache des réponses par rôle
- **Filtres personnalisés** : Paramètres de filtrage optionnels
- **Notifications** : Alertes sur les métriques importantes

### 2. Optimisations
- **Lazy loading** : Chargement à la demande des données
- **Compression** : Compression des réponses volumineuses
- **Pagination** : Pour les grandes quantités de données

### 3. Extensions
- **Webhooks** : Notifications en temps réel
- **Export** : Export des données en différents formats
- **Historique** : Suivi des changements de métriques

## Conclusion

La route `GET /auth/my-infos` offre une solution élégante et flexible pour fournir des informations personnalisées selon le rôle de l'utilisateur. Cette approche centralisée simplifie l'API tout en maintenant une séparation claire des responsabilités et une sécurité appropriée.

L'implémentation respecte les principes SOLID et offre une base solide pour les évolutions futures du système.
