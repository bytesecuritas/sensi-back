# Changelog - Module Organisation

## Version 2.0.0 - Création d'utilisateur avec organisation obligatoire

### 🎯 Changements majeurs

#### ✅ **Nouvelle logique de création d'utilisateur**
- **Organisation obligatoire** : Les utilisateurs et admins doivent obligatoirement appartenir à une organisation lors de leur création
- **Superadmin indépendant** : Les superadmins ne peuvent toujours pas appartenir à une organisation
- **Validation automatique** : Vérification automatique de l'existence de l'organisation lors de la création d'utilisateur

#### 🔧 **Modifications techniques**

##### **Entité User**
- ❌ Suppression du champ `organisation_id` (redondant avec la relation `organisation`)
- ✅ Conservation de la relation `ManyToOne` avec `Organisation`
- ✅ Relation nullable pour permettre l'indépendance des superadmins

##### **Service User**
- ✅ Nouvelle méthode `createWithOrganisation()` pour gérer la création avec validation d'organisation
- ✅ Validation automatique de l'existence de l'organisation
- ✅ Gestion des erreurs pour organisation inexistante ou manquante

##### **Service Auth**
- ✅ Mise à jour de la méthode `register()` pour inclure l'`organisation_id`
- ✅ Intégration avec la nouvelle logique de création d'utilisateur

##### **DTOs**
- ✅ Nouveau DTO `CreateUserDto` avec validation conditionnelle de l'organisation
- ✅ Validation `@ValidateIf` pour rendre l'organisation obligatoire sauf pour les superadmins

##### **Service Organisation**
- ✅ Mise à jour des requêtes pour utiliser la relation `organisation` au lieu de `organisation_id`
- ✅ Adaptation des méthodes de gestion des utilisateurs

### 🚀 **Nouvelles fonctionnalités**

#### **Création d'utilisateur avec organisation**
```typescript
// Exemple de création d'utilisateur avec organisation
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "nom": "Dupont",
  "prenom": "Jean",
  "age": 25,
  "role": "user",
  "organisation_id": "1"  // Obligatoire pour user et admin
}

// Exemple de création de superadmin (sans organisation)
POST /auth/register
{
  "email": "superadmin@example.com",
  "password": "password123",
  "nom": "Admin",
  "prenom": "Super",
  "age": 35,
  "role": "superadmin"  // Pas d'organisation_id nécessaire
}
```

### 🔒 **Règles de validation**

#### **Utilisateurs et Admins**
- ✅ **Organisation obligatoire** : Doit fournir un `organisation_id` valide
- ✅ **Organisation existante** : L'organisation doit exister dans la base de données
- ✅ **Validation automatique** : Erreur si organisation manquante ou inexistante

#### **Superadmins**
- ✅ **Pas d'organisation** : Ne peuvent pas appartenir à une organisation
- ✅ **Indépendance** : Peuvent être créés sans spécifier d'organisation

### 🧪 **Tests**

#### **Nouveaux scripts de test**
- ✅ `test-user-creation.js` : Tests complets de création d'utilisateur avec organisation
- ✅ `user-creation.http` : Requêtes HTTP pour tester la création d'utilisateur

#### **Scénarios de test**
1. ✅ Création d'utilisateur avec organisation valide
2. ✅ Création d'admin avec organisation valide
3. ✅ Création de superadmin sans organisation
4. ✅ Test d'erreur - utilisateur sans organisation
5. ✅ Test d'erreur - utilisateur avec organisation inexistante
6. ✅ Test d'erreur - admin sans organisation

### 📁 **Fichiers modifiés**

#### **Nouveaux fichiers**
- `src/users/dto/create-user.dto.ts`
- `src/users/dto/index.ts`
- `test-user-creation.js`
- `user-creation.http`
- `CHANGELOG-ORGANISATION.md`

#### **Fichiers modifiés**
- `src/users/users.entity.ts` - Suppression du champ organisation_id
- `src/users/users.service.ts` - Nouvelle méthode createWithOrganisation
- `src/users/users.module.ts` - Ajout de l'entité Organisation
- `src/auth/auth.service.ts` - Mise à jour de register()
- `src/auth/auth.controller.ts` - Ajout de organisation_id dans RegisterDto
- `src/organisations/organisations.service.ts` - Mise à jour des requêtes
- `src/organisations/dto/create-organisation.dto.ts` - Ajout de date_creation
- `package.json` - Nouveau script test:user-creation
- `README-ORGANISATIONS.md` - Mise à jour de la documentation

### 🎉 **Avantages de cette approche**

1. **Cohérence des données** : Chaque utilisateur (sauf superadmin) appartient obligatoirement à une organisation
2. **Validation automatique** : Plus de risque d'utilisateurs orphelins sans organisation
3. **Simplicité** : L'organisation est définie dès la création, pas besoin de l'ajouter après
4. **Sécurité** : Validation stricte des permissions et des relations
5. **Maintenabilité** : Code plus propre avec moins de redondance

### 🔄 **Migration**

#### **Pour les utilisateurs existants**
- Les utilisateurs existants sans organisation devront être mis à jour
- Les superadmins existants ne sont pas affectés
- Recommandation : Créer une organisation par défaut si nécessaire

#### **Pour les développeurs**
- Utiliser la nouvelle méthode `createWithOrganisation()` pour créer des utilisateurs
- Toujours fournir un `organisation_id` pour les utilisateurs et admins
- Ne pas fournir d'`organisation_id` pour les superadmins

### 📋 **Prochaines étapes**

1. **Tests en production** : Vérifier que tous les scénarios fonctionnent correctement
2. **Migration des données** : Mettre à jour les utilisateurs existants si nécessaire
3. **Documentation utilisateur** : Mettre à jour les guides d'utilisation
4. **Formation équipe** : Former l'équipe sur la nouvelle logique
