# 🔐 Sécurisation de la Documentation Swagger

## Vue d'ensemble

La documentation Swagger est maintenant **sécurisée** et accessible uniquement aux utilisateurs avec le rôle `superadmin`.

## Comment ça fonctionne

### 1. Protection par Middleware
- Un middleware intercepte toutes les requêtes vers `/api/docs*`
- Vérifie la présence d'un token JWT valide
- Vérifie que le rôle de l'utilisateur est `superadmin`
- Redirige vers la page de connexion si l'accès est refusé

### 2. Page de Connexion Dédiée
- Route : `/api/auth/swagger-login`
- Interface HTML simple et sécurisée
- Vérification du rôle superadmin après connexion
- Stockage automatique du token pour Swagger

## Utilisation

### Étape 1 : Accéder à la page de connexion
```
http://localhost:3000/api/auth/swagger-login
```

### Étape 2 : Se connecter avec un compte superadmin
- Email : `superadmin@example.com`
- Mot de passe : `SuperAdmin123!`

### Étape 3 : Accès automatique à Swagger
- Après connexion réussie, redirection automatique vers `/api/docs`
- Le token est stocké dans le localStorage du navigateur

## Tests de Sécurité

Utilisez le fichier `http/swagger-security-test.http` pour tester :

1. **Accès sans authentification** → Redirection vers login
2. **Accès avec token invalide** → Redirection vers login
3. **Accès avec token utilisateur normal** → Accès refusé
4. **Accès avec token superadmin** → Accès autorisé

## Configuration

### Variables d'environnement requises
```env
JWT_SECRET=votre_secret_jwt_ultra_securise_32_caracteres_minimum
```

### Middleware de protection
Le middleware est configuré dans `src/main.ts` :
```typescript
app.use('/api/docs*', (req, res, next) => {
  // Vérification du token et du rôle superadmin
});
```

## Sécurité

### ✅ Protections implémentées
- Vérification JWT obligatoire
- Contrôle de rôle superadmin
- Redirection automatique si accès refusé
- Interface de connexion sécurisée

### ⚠️ Points d'attention
- Le token est stocké dans le localStorage (accessible via JavaScript)
- En production, considérez l'utilisation de cookies httpOnly
- Le middleware vérifie uniquement les requêtes vers `/api/docs*`

## Dépannage

### Erreur "Invalid token"
- Vérifiez que le token JWT est valide
- Vérifiez que `JWT_SECRET` est correctement configuré

### Erreur "Unauthorized"
- Vérifiez que l'utilisateur a le rôle `superadmin`
- Vérifiez que le token contient bien le bon rôle

### Redirection en boucle
- Vérifiez que la route `/api/auth/swagger-login` est accessible
- Vérifiez la configuration CORS

## Exemple de Token Superadmin
```json
{
  "sub": 1,
  "email": "superadmin@example.com",
  "role": "superadmin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Support

Pour toute question sur la sécurisation de Swagger, consultez :
- Le fichier `src/main.ts` pour la configuration du middleware
- Le fichier `src/auth/auth.controller.ts` pour la page de connexion
- Les tests dans `http/swagger-security-test.http`
