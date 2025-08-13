# Module Organisation

Ce module gère les organisations dans le système de sensibilisation. Il implémente toutes les fonctionnalités CRUD pour les organisations avec des règles de sécurité strictes.

## Fonctionnalités

### 🔐 Sécurité
- **Accès exclusif au superadmin** : Seul le superadmin peut créer, modifier, supprimer et consulter les organisations
- **Validation des données** : Toutes les entrées sont validées avec class-validator
- **Protection des routes** : Toutes les routes sont protégées par JWT et vérification des rôles

### 📋 Opérations CRUD
- **Création** : Créer une nouvelle organisation
- **Lecture** : Consulter une ou toutes les organisations
- **Mise à jour** : Modifier les informations d'une organisation
- **Suppression** : Supprimer une organisation (seulement si elle n'a pas d'utilisateurs)

### 👥 Gestion des utilisateurs
- **Ajout d'utilisateur** : Ajouter un utilisateur à une organisation
- **Retrait d'utilisateur** : Retirer un utilisateur d'une organisation
- **Liste des utilisateurs** : Consulter tous les utilisateurs d'une organisation
- **Statistiques** : Obtenir les statistiques d'une organisation

## Structure de données

### Entité Organisation
```typescript
{
  organisation_id: number;        // Clé primaire
  nom: string;                    // Nom de l'organisation
  type: OrganisationType;         // Type (entreprise, ecole, association, autre)
  code_pays: string;              // Code pays (1 caractère)
  date_creation: Date;            // Date de création
  date_maj: Date;                 // Date de dernière modification
  utilisateurs: User[];           // Relation avec les utilisateurs
}
```

### Types d'organisation
```typescript
enum OrganisationType {
  ENTREPRISE = 'entreprise',
  ECOLE = 'ecole',
  ASSOCIATION = 'association',
  AUTRE = 'autre'
}
```

## API Endpoints

### 🔐 Authentification requise
Toutes les routes nécessitent un token JWT valide et le rôle `superadmin`.

### 📝 CRUD Organisations

#### POST `/organisations`
Créer une nouvelle organisation
```json
{
  "nom": "Nom de l'organisation",
  "type": "entreprise",
  "code_pays": "F"
}
```

#### GET `/organisations`
Récupérer toutes les organisations

#### GET `/organisations/:id`
Récupérer une organisation spécifique

#### PATCH `/organisations/:id`
Mettre à jour une organisation
```json
{
  "nom": "Nouveau nom",
  "type": "ecole"
}
```

#### DELETE `/organisations/:id`
Supprimer une organisation (seulement si elle n'a pas d'utilisateurs)

### 👥 Gestion des utilisateurs

#### GET `/organisations/:id/users`
Récupérer tous les utilisateurs d'une organisation

#### POST `/organisations/:id/users/:userId`
Ajouter un utilisateur à une organisation

#### DELETE `/organisations/:id/users/:userId`
Retirer un utilisateur d'une organisation

#### GET `/organisations/:id/stats`
Obtenir les statistiques d'une organisation
```json
{
  "organisation_id": 1,
  "nom": "Nom de l'organisation",
  "type": "entreprise",
  "code_pays": "F",
  "date_creation": "2024-01-01T00:00:00.000Z",
  "stats": {
    "total_users": 10,
    "admins": 2,
    "users": 8
  }
}
```

## Règles métier

### 🏢 Organisation
1. **Nom obligatoire** : Le nom de l'organisation est obligatoire
2. **Type valide** : Le type doit être une valeur de l'enum OrganisationType
3. **Code pays** : Le code pays doit être exactement 1 caractère
4. **Dates automatiques** : Les dates de création et modification sont gérées automatiquement

### 👤 Utilisateurs
1. **Superadmin indépendant** : Les superadmins ne peuvent pas appartenir à une organisation
2. **Admin obligatoire** : Chaque organisation doit avoir au moins un administrateur
3. **Protection des admins** : Impossible de retirer le dernier admin d'une organisation
4. **Suppression sécurisée** : Impossible de supprimer une organisation qui contient des utilisateurs

### 🔒 Sécurité
1. **Accès restreint** : Seul le superadmin peut gérer les organisations
2. **Validation des données** : Toutes les entrées sont validées
3. **Gestion des erreurs** : Messages d'erreur explicites et appropriés

## Utilisation

### Installation
Le module est automatiquement inclus dans l'application principale.

### Test
```bash
# Tester le module organisation
npm run test:organisations
```

### Exemple d'utilisation
```bash
# 1. Authentification en tant que superadmin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@example.com", "password": "superadmin123"}'

# 2. Créer une organisation
curl -X POST http://localhost:3000/organisations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom": "Ma Société", "type": "entreprise", "code_pays": "F"}'

# 3. Récupérer toutes les organisations
curl -X GET http://localhost:3000/organisations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Fichiers du module

```
src/organisations/
├── organisations.entity.ts      # Entité TypeORM
├── organisations.service.ts     # Logique métier
├── organisations.controller.ts  # Contrôleur API
├── organisations.module.ts      # Module NestJS
└── dto/
    ├── create-organisation.dto.ts
    ├── update-organisation.dto.ts
    └── index.ts
```

## Dépendances

- `@nestjs/common` : Fonctionnalités de base NestJS
- `@nestjs/typeorm` : Intégration avec TypeORM
- `class-validator` : Validation des données
- `typeorm` : ORM pour la base de données

## Notes importantes

1. **Migration de base de données** : Les tables sont créées automatiquement avec `synchronize: true`
2. **Relations** : L'entité User a été mise à jour pour inclure la relation avec Organisation
3. **Sécurité** : Toutes les opérations sont protégées par authentification et autorisation
4. **Validation** : Toutes les entrées sont validées avant traitement
5. **Gestion d'erreurs** : Messages d'erreur explicites pour faciliter le débogage
