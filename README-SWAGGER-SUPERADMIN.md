# 🔐 Interface d'Authentification Superadmin pour Swagger

## 📋 Vue d'ensemble

L'API Sensibilisation dispose maintenant de **deux niveaux d'authentification** dans la documentation Swagger :

- **`bearer`** : Pour les routes utilisateur/admin
- **`superadmin`** : Pour les routes superadmin uniquement

## 🚀 Comment utiliser l'authentification dans Swagger

### 1. Accéder à la documentation Swagger

```
http://localhost:3000/api/docs
```

### 2. Se connecter en tant que superadmin

Utilisez le fichier de test `http/swagger-superadmin-test.http` pour obtenir un token :

```bash
# Connexion superadmin
POST http://localhost:3000/api/auth/login
{
  "email": "superadmin@example.com",
  "password": "SuperAdmin123!"
}
```

### 3. Configurer l'authentification dans Swagger

1. **Cliquez sur le bouton "Authorize" (🔒)** en haut de la page Swagger
2. **Dans le champ "bearer"** : Entrez le token JWT (sans "Bearer ")
3. **Dans le champ "superadmin"** : Entrez le même token JWT
4. **Cliquez sur "Authorize"**
5. **Fermez la modal**

### 4. Tester les routes protégées

Maintenant vous pouvez tester toutes les routes protégées avec l'authentification configurée !

## 🔒 Niveaux d'authentification

### **Routes protégées par `bearer`**
- `POST /auth/register` (admin/superadmin)
- `GET /auth/profile`
- `POST /auth/change-password`
- `POST /auth/logout`
- `GET /users` (admin/superadmin)
- `GET /organisations` (admin/superadmin)
- `GET /learning/parcours/:id`
- `GET /learning/modules/:id`

### **Routes protégées par `superadmin`**
- `POST /auth/register` (superadmin uniquement)
- Routes sensibles réservées aux superadmins
- Gestion des rôles et permissions

### **Routes publiques**
- `POST /auth/login`
- `POST /auth/reset-password-request`
- `POST /auth/reset-password`
- `GET /learning/parcours`
- `GET /learning/modules`
- `GET /learning/health`

## 🧪 Tests recommandés

### **1. Test des routes publiques**
```bash
# Tester sans authentification
GET /api/learning/parcours
GET /api/learning/modules
```

### **2. Test des routes protégées (bearer)**
```bash
# Avec token bearer
GET /api/auth/profile
GET /api/users
GET /api/organisations
```

### **3. Test des routes superadmin**
```bash
# Avec token superadmin
POST /api/auth/register
# Créer de nouveaux utilisateurs
```

## 🔧 Configuration technique

### **Fichier main.ts**
```typescript
const config = new DocumentBuilder()
  .setTitle('Sensibilisation API')
  .setDescription('Documentation Swagger de l\'API de sensibilisation')
  .setVersion('1.0.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'superadmin')
  .setContact('BytCode', 'https://bytcode.example', 'support@bytcode.example')
  .addServer('/api', 'API prefix')
  .build();
```

### **Utilisation dans les contrôleurs**
```typescript
@Post('register')
@ApiBearerAuth('bearer')        // Pour les routes admin
@ApiBearerAuth('superadmin')    // Pour les routes superadmin
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'superadmin')   // Vérification des rôles
async register(@Body() registerDto: RegisterDto) {
  // ...
}
```

## 📱 Interface utilisateur Swagger

### **Bouton Authorize**
- **Icône** : 🔒
- **Position** : En haut à droite de la page
- **Fonction** : Configure l'authentification pour toutes les routes

### **Champs d'authentification**
- **bearer** : Token pour les routes utilisateur/admin
- **superadmin** : Token pour les routes superadmin uniquement

### **Indicateurs visuels**
- **🔒** : Route protégée
- **🔓** : Route publique
- **📝** : Route avec documentation

## 🚨 Dépannage

### **Erreur 401 Unauthorized**
- Vérifiez que le token est valide
- Vérifiez que le token n'a pas expiré
- Vérifiez que vous utilisez le bon niveau d'authentification

### **Erreur 403 Forbidden**
- Vérifiez que votre rôle a les permissions nécessaires
- Utilisez le niveau d'authentification `superadmin` si nécessaire

### **Token expiré**
- Reconnectez-vous pour obtenir un nouveau token
- Mettez à jour l'authentification dans Swagger

## 📚 Ressources supplémentaires

- **Fichier de test** : `http/swagger-superadmin-test.http`
- **Documentation API** : `http://localhost:3000/api/docs`
- **Documentation JSON** : `http://localhost:3000/api/docs-json`

## 🎯 Avantages de cette approche

1. **Sécurité renforcée** : Différenciation claire des niveaux d'accès
2. **Tests facilités** : Interface Swagger intuitive pour tester l'API
3. **Documentation claire** : Chaque route indique son niveau de protection
4. **Flexibilité** : Possibilité de tester avec différents niveaux d'authentification
5. **Développement** : Aide au développement et aux tests d'intégration

---

**Note** : Cette interface d'authentification est particulièrement utile pour les développeurs et les administrateurs qui testent l'API, ainsi que pour la documentation technique des endpoints.
