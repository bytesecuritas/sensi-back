# Guide d'Administration - Système de Gestion des Utilisateurs

## 🚀 Installation et Configuration

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Créez un fichier `.env` à la racine du projet :
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Compilation du projet
```bash
npm run build
```

## 👑 Création du SuperAdmin

### Étape obligatoire : Créer le SuperAdmin unique

Le SuperAdmin est l'utilisateur principal qui peut créer tous les autres types d'utilisateurs.

```bash
npm run create-superadmin
```

Le script vous demandera :
- Email du SuperAdmin
- Mot de passe (minimum 8 caractères)
- Nom et prénom
- Âge
- Code langue (fr/en)

⚠️ **IMPORTANT** : 
- Un seul SuperAdmin est autorisé dans le système
- Le script vérifie automatiquement qu'il n'en existe pas déjà un
- Notez bien les informations du SuperAdmin créé

### Vérifier le SuperAdmin
```bash
npm run check-superadmin
```

## 🔐 Hiérarchie des Rôles et Permissions

### SuperAdmin (Unique)
- ✅ Peut créer tous les types d'utilisateurs (admin, user)
- ✅ Accès complet à toutes les fonctionnalités
- ✅ Peut gérer tous les utilisateurs

### Admin
- ✅ Peut créer des utilisateurs de type "user" uniquement
- ❌ Ne peut pas créer d'autres admin ou superadmin
- ✅ Peut gérer les utilisateurs (lecture, modification, suppression)

### User
- ❌ Ne peut pas créer d'autres utilisateurs
- ✅ Peut voir sa propre information
- ✅ Peut modifier ses propres informations

## 📋 Commandes Utiles

### Scripts de gestion
```bash
# Créer le SuperAdmin (une seule fois)
npm run create-superadmin

# Vérifier le SuperAdmin
npm run check-superadmin

# Tester la sécurité JWT
npm run test:security

# Tester les permissions utilisateurs
npm run test:permissions
```

### Scripts de développement
```bash
# Démarrer en mode développement
npm run start:dev

# Démarrer en mode production
npm run start:prod

# Tests unitaires
npm run test

# Tests de sécurité
npm run test:security
```

## 🔧 Utilisation de l'API

### 1. Connexion du SuperAdmin
```bash
POST /auth/login
{
  "email": "superadmin@example.com",
  "password": "password123"
}
```

### 2. Créer un Admin (par le SuperAdmin)
```bash
POST /auth/register
Authorization: Bearer <superadmin-token>
{
  "email": "admin@example.com",
  "password": "password123",
  "nom": "Admin",
  "prenom": "User",
  "age": 30,
  "role": "admin",
  "code_langue": "fr"
}
```

### 3. Créer un User (par l'Admin)
```bash
POST /auth/register
Authorization: Bearer <admin-token>
{
  "email": "user@example.com",
  "password": "password123",
  "nom": "User",
  "prenom": "Normal",
  "age": 25,
  "role": "user",
  "code_langue": "fr"
}
```

## 🛡️ Sécurité

### Règles de création d'utilisateurs
- **SuperAdmin** : Peut créer tous les types (admin, user)
- **Admin** : Peut créer uniquement des "user"
- **User** : Ne peut pas créer d'utilisateurs

### Vérifications automatiques
- Un seul SuperAdmin autorisé
- Validation des permissions lors de la création
- Tokens JWT avec expiration (1 heure)
- Validation des données d'entrée

## 🚨 Dépannage

### Problème : "Un SuperAdmin existe déjà"
- Utilisez `npm run check-superadmin` pour vérifier
- Un seul SuperAdmin est autorisé

### Problème : "Admins cannot create other admins"
- Les Admin ne peuvent créer que des User
- Seul le SuperAdmin peut créer des Admin

### Problème : "Users cannot create other users"
- Les User n'ont pas de permissions de création
- Seuls SuperAdmin et Admin peuvent créer des utilisateurs

## 📞 Support

Pour toute question ou problème :
1. Vérifiez la documentation `SECURITY.md`
2. Exécutez les tests de sécurité
3. Consultez les logs de l'application
