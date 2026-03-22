# 🐛 BUGS IDENTIFIÉS AVANT DÉPLOIEMENT

**Date d'analyse :** 22 Mars 2026  
**Statut :** CRITIQUE - À corriger avant déploiement

---

## 🚨 BUGS CRITIQUES (Bloquants)

### BUG #1: Boucle Infinie dans `awardBadge` - GamificationService
**Fichier :** `src/learning/gamification.service.ts:265-278`  
**Sévérité :** 🔴 CRITIQUE  
**Impact :** Crash de l'application, stack overflow

**Description :**
La méthode `awardBadge` appelle `awardPoints` qui elle-même appelle `checkAndAwardBadges` qui peut rappeler `awardBadge`, créant une **boucle infinie**.

**Code problématique :**
```typescript
async awardBadge(userId: number, badge: Badge, context: string): Promise<void> {
  // ... création du userBadge ...
  await this.userBadgeRepository.save(userBadge);

  // ⚠️ PROBLÈME: Appelle awardPoints
  if (badge.points_attribues > 0) {
    await this.awardPoints(userId, badge.points_attribues, `Badge: ${badge.nom}`);
  }
}

async awardPoints(userId: number, points: number, reason: string): Promise<void> {
  // ... mise à jour des points ...
  
  // ⚠️ PROBLÈME: Appelle checkAndAwardBadges
  await this.checkAndAwardBadges(userId, newPoints, reason);
}

async checkAndAwardBadges(userId: number, totalPoints: number, reason: string): Promise<Badge[]> {
  for (const badge of badges) {
    if (!existingBadgeIds.includes(badge.badge_id)) {
      if (await this.checkBadgeConditions(userId, badge, reason)) {
        // ⚠️ PROBLÈME: Rappelle awardBadge → BOUCLE INFINIE
        await this.awardBadge(userId, badge, reason);
      }
    }
  }
}
```

**Solution :**
Ajouter un flag pour éviter la récursion lors de l'attribution de points pour les badges.

---

### BUG #2: Logique Incorrecte dans `findById` - UsersService
**Fichier :** `src/users/users.service.ts:25-40`  
**Sévérité :** 🔴 CRITIQUE  
**Impact :** Utilisateurs ne peuvent pas voir leur propre profil

**Description :**
La logique de vérification des permissions est inversée. Un utilisateur avec le rôle 'user' ne peut jamais voir son propre profil car la condition vérifie `user.users_id !== id` alors qu'on passe déjà `id` en paramètre.

**Code problématique :**
```typescript
async findById(id: number): Promise<User> {
  const user = await this.usersRepository.findOne({ 
    where: { users_id: id },
    relations: ['organisation']
  });
  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  // ⚠️ PROBLÈME: Cette condition ne sera JAMAIS vraie
  if (user.role === 'user') {
    if (user.users_id !== id) {  // user.users_id === id toujours vrai ici!
      throw new UnauthorizedException('You cannot view this profile');
    }
  }
  return user;
}
```

**Solution :**
Cette vérification devrait être faite au niveau du contrôleur avec le JWT payload, pas dans le service.

---

## ⚠️ BUGS MAJEURS (Importants)

### BUG #3: Points de Niveau Suivant Incorrects
**Fichier :** `src/learning/gamification.service.ts:301-311`  
**Sévérité :** 🟡 MAJEUR  
**Impact :** Affichage incorrect de la progression

**Description :**
La méthode `getNextLevelThreshold` retourne le seuil absolu du niveau suivant, mais devrait retourner les points restants pour atteindre ce niveau.

**Code problématique :**
```typescript
private getNextLevelThreshold(currentLevel: UserLevelEnum): number {
  const levels = Object.values(UserLevelEnum);
  const currentIndex = levels.indexOf(currentLevel);
  
  if (currentIndex < levels.length - 1) {
    const nextLevel = levels[currentIndex + 1];
    return this.LEVEL_THRESHOLDS[nextLevel];  // ⚠️ Retourne seuil absolu
  }
  
  return 0;
}
```

**Utilisation :**
```typescript
userLevel.points_pour_niveau_suivant = this.getNextLevelThreshold(newLevel);
// Si newLevel = INTERMEDIAIRE (200 points requis)
// et nextLevel = AVANCE (500 points requis)
// Retourne 500 au lieu de (500 - points_actuels)
```

**Solution :**
Calculer la différence entre le seuil du niveau suivant et les points actuels.

---

### BUG #4: Calcul de Quiz Réussis Incomplet
**Fichier :** `src/learning/gamification.service.ts:352-359`  
**Sévérité :** 🟡 MAJEUR  
**Impact :** Statistiques incorrectes

**Description :**
Le calcul des quiz réussis est interrompu (code tronqué) et ne gère pas correctement les différents types de quiz.

**Code problématique :**
```typescript
const [moduleQuizResponses, finalQuizResponses] = await Promise.all([
  this.quizResponseRepository.find({
    where: {
      utilisateur: { users_id: userId },
      quiz: { type_quiz: 'module' as any }
    },
    relations: ['quiz', 'quiz.questions'],
  // ⚠️ Code incomplet, pas de fermeture
```

---

### BUG #5: Validation de Score Manquante dans submitQuizResponse
**Fichier :** `src/learning/learning.service.ts:1070-1111`  
**Sévérité :** 🟡 MAJEUR  
**Impact :** Gamification peut échouer silencieusement

**Description :**
La gamification est dans un try-catch qui log seulement un warning. Si elle échoue, l'utilisateur ne reçoit pas ses points mais le quiz est marqué comme réussi.

**Code problématique :**
```typescript
try {
  if (scoreUpdated && isReussi && quiz.type_quiz === 'module' && quiz.module) {
    await this.gamificationService.addQuizSuccessPoints(userId, quiz.module.module_id, Math.round(effectiveScoreFinal));
  }
  // ... plus de logique gamification ...
} catch (e) {
  // ⚠️ PROBLÈME: Erreur silencieuse, utilisateur perd ses points
  this.logger.warn(`Gamification non appliquée pour user ${userId}, quiz ${quizId}: ${e.message}`);
}
```

**Solution :**
Soit propager l'erreur, soit implémenter un système de retry, soit notifier l'utilisateur.

---

## 🔵 BUGS MINEURS (Non-bloquants)

### BUG #6: Gestion des Relations Cascade Excessive
**Fichier :** `src/learning/learning.service.ts:113-120`  
**Sévérité :** 🔵 MINEUR  
**Impact :** Performance

**Description :**
La suppression d'un parcours charge toutes les relations en profondeur, ce qui peut être très lent.

**Code problématique :**
```typescript
const parcours = await this.learningPathRepository.findOne({
  where: { parcours_id: id },
  relations: [
    'modules', 
    'modules.contenus_media', 
    'modules.quiz', 
    'modules.quiz.questions', 
    'modules.quiz.questions.reponses',  // ⚠️ Trop profond
    'quiz_finaux', 
    'organisationParcours'
  ]
});
```

**Solution :**
Utiliser les cascades TypeORM au lieu de charger toutes les relations.

---

### BUG #7: Validation d'Email Manquante
**Fichier :** `src/auth/auth.service.ts:178-216`  
**Sévérité :** 🔵 MINEUR  
**Impact :** Données invalides possibles

**Description :**
Pas de validation du format d'email dans la méthode `register`.

**Solution :**
Ajouter une validation regex pour l'email.

---

### BUG #8: Tokens de Réinitialisation en Mémoire
**Fichier :** `src/auth/auth.service.ts:27`  
**Sévérité :** 🔵 MINEUR (mais critique en production)  
**Impact :** Perte des tokens au redémarrage

**Description :**
Les tokens de réinitialisation sont stockés en mémoire (Map), ils seront perdus au redémarrage du serveur.

**Code problématique :**
```typescript
private resetTokens = new Map<string, { email: string; expiresAt: Date }>();
```

**Solution :**
Utiliser Redis ou la base de données pour stocker les tokens.

---

## 📊 RÉSUMÉ

| Sévérité | Nombre | Bloquant Déploiement |
|----------|--------|---------------------|
| 🔴 CRITIQUE | 2 | ✅ OUI |
| 🟡 MAJEUR | 3 | ⚠️ RECOMMANDÉ |
| 🔵 MINEUR | 3 | ❌ NON |
| **TOTAL** | **8** | **2 bloquants** |

---

## 🎯 PRIORITÉS DE CORRECTION

### Avant Déploiement (OBLIGATOIRE)
1. ✅ **BUG #1** - Boucle infinie dans awardBadge
2. ✅ **BUG #2** - Logique findById incorrecte

### Avant Beta (FORTEMENT RECOMMANDÉ)
3. ⚠️ **BUG #3** - Points niveau suivant
4. ⚠️ **BUG #4** - Calcul quiz réussis
5. ⚠️ **BUG #5** - Gamification silencieuse

### Améliorations Futures
6. 🔵 **BUG #6** - Performance cascade
7. 🔵 **BUG #7** - Validation email
8. 🔵 **BUG #8** - Tokens en mémoire

---

**Prochaine étape :** Correction des bugs critiques et création des tests automatisés.
