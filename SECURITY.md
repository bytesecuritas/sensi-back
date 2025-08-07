# Sécurité JWT - Documentation

## Configuration

### Variables d'environnement requises

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Configuration JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Configuration de la base de données
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=sensibilisation
```

## Création du SuperAdmin

### 1. Créer le SuperAdmin unique

Le SuperAdmin doit être créé en premier via la ligne de commande :

```bash
npm run create-superadmin
```

Ce script vous demandera les informations du SuperAdmin et vérifiera qu'il n'en existe qu'un seul.

### 2. Vérification

Le script vérifie automatiquement :
- Qu'un seul SuperAdmin existe dans le système
- La validité des données saisies
- La complexité du mot de passe

## Hiérarchie des rôles et permissions

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

## Routes sécurisées

### Routes d'authentification

- `POST /auth/register` - Création d'utilisateurs (superadmin, admin avec restrictions)
- `POST /auth/login` - Connexion (accessible à tous)
- `POST /auth/protected` - Route protégée (nécessite un token JWT)

### Routes utilisateurs

Toutes les routes `/users/*` nécessitent un token JWT valide :

- `GET /users` - Liste des utilisateurs (superadmin, admin)
- `GET /users/:id` - Détails d'un utilisateur (superadmin, admin, user)
- `POST /users` - Créer un utilisateur (superadmin, admin avec restrictions)
- `PUT /users/:id` - Modifier un utilisateur (superadmin, admin, user)
- `DELETE /users/:id` - Supprimer un utilisateur (superadmin, admin)

## Utilisation

### 1. Création du SuperAdmin
```bash
npm run create-superadmin
```

### 2. Connexion
```bash
POST /auth/login
{
  "email": "superadmin@example.com",
  "password": "password123"
}
```

### 3. Création d'utilisateurs par le SuperAdmin
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

### 4. Création d'utilisateurs par l'Admin
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

## Règles de sécurité

### Création d'utilisateurs
- **SuperAdmin** : Peut créer tous les types (admin, user)
- **Admin** : Peut créer uniquement des "user"
- **User** : Ne peut pas créer d'utilisateurs

### Accès aux données
- **SuperAdmin** : Accès complet
- **Admin** : Accès complet sauf création d'admin/superadmin
- **User** : Accès limité à ses propres données

## Sécurité

- Les tokens JWT expirent après 1 heure
- La clé secrète JWT doit être changée en production
- Un seul SuperAdmin autorisé dans le système
- Vérification automatique des permissions lors de la création d'utilisateurs 