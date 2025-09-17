# Documentation CLI - Système de Badges

## Vue d'ensemble

Le système de badges utilise maintenant une approche CLI (Command Line Interface) pour l'initialisation des badges par défaut, offrant plus de contrôle et de flexibilité lors du déploiement.

## Commandes CLI disponibles

### 1. Initialisation des badges par défaut
Rent toi dans scripts\init-badges.js et spéciie le chemin d'une image qui sera utiliser comme 
image par défaut pour les badges.

```bash
npm run init-badges
```

**Description :** Initialise automatiquement les 6 badges par défaut dans la base de données.

**Ce que fait cette commande :**
- Crée le répertoire `resources/badges/` s'il n'existe pas
- Copie l'image source (`D:\Images\_32f7fc69-f728-4323-821a-b59314912f14.jpeg`) vers `resources/badges/` pour chaque badge
- Initialise les badges prédéfinis dans la base de données
- Affiche un résumé des opérations (créés/mis à jour/erreurs)

**Badges initialisés :**

| Nom | Type | Catégorie | Points requis | Points attribués | Description |
|-----|------|-----------|---------------|-----------------|-------------|
| Premier Pas | bronze | premier_pas | 0 | 25 | Premier module complété |
| Vigilant | bronze | vigilance | 0 | 25 | Première simulation réussie |
| Quiz Parfait | bronze | quiz | 0 | 50 | Score parfait à un quiz |
| Assidu | argent | assiduite | 100 | 75 | 7 jours de connexion consécutifs |
| Expert Phishing | or | expert | 300 | 100 | Tous les modules phishing complétés |
| Défenseur Cyber | or | defenseur | 500 | 150 | 10 simulations réussies |

**Exemple de sortie :**
```
Initialisation des badges par défaut...
Création du répertoire D:\...\resources\badges
Image copiée pour le badge Premier Pas: D:\...\resources\badges\premier_pas.jpeg
Badge créé: Premier Pas
Image copiée pour le badge Vigilant: D:\...\resources\badges\vigilant.jpeg
Badge créé: Vigilant
...

Résumé de l'initialisation des badges:
- Badges créés: 6
- Badges mis à jour: 0
```

## Structure des fichiers

### Répertoire des badges
```
resources/
└── badges/
    ├── premier_pas.jpeg
    ├── vigilant.jpeg
    ├── quiz_parfait.jpeg
    ├── assidu.jpeg
    ├── expert_phishing.jpeg
    └── defenseur_cyber.jpeg
```

### Script d'initialisation
```
scripts/
└── init-badges.js
```

## Gestion des erreurs

La commande gère plusieurs cas d'erreur :

1. **Image source manquante :** Arrêt avec message d'erreur si l'image source n'existe pas
2. **Erreurs de base de données :** Affichage des erreurs spécifiques pour chaque badge
3. **Erreurs de copie de fichier :** Gestion des erreurs de copie d'icônes

## Utilisation dans les tests

### Avant les tests HTTP
Toujours exécuter la commande d'initialisation avant de lancer les tests :

```bash
# 1. Construire l'application
npm run build

# 2. Initialiser les badges
npm run init-badges

# 3. Démarrer l'application
npm run start:dev

# 4. Lancer les tests HTTP
```

### Tests adaptés
Les tests HTTP ont été adaptés pour :
- Supprimer les appels à l'endpoint `/badges/init` (plus nécessaire)
- Ajouter des notes sur l'initialisation CLI requise
- Tester la création de badges personnalisés avec upload d'icônes
- Vérifier que les badges par défaut sont bien présents

## Avantages de l'approche CLI

1. **Contrôle du déploiement :** L'initialisation se fait explicitement via une commande
2. **Gestion des icônes :** Copie automatique et nommage cohérent des icônes
3. **Résilience :** Gestion des erreurs et résumé des opérations
4. **Flexibilité :** Possibilité d'exécuter plusieurs fois sans duplication
5. **Séparation des responsabilités :** L'API se concentre sur la gestion des badges, pas sur l'initialisation

## Maintenance

### Réinitialiser les badges
Pour réinitialiser complètement les badges :
```bash
# Supprimer manuellement les badges de la base de données
# Puis relancer l'initialisation
npm run init-badges
```

### Ajouter de nouveaux badges par défaut
1. Modifier le tableau `defaultBadges` dans `scripts/init-badges.js`
2. Ajouter l'icône correspondante dans le répertoire source
3. Relancer la commande d'initialisation

### Changer l'image source
Modifier la variable `sourceImagePath` dans `scripts/init-badges.js` :
```javascript
const sourceImagePath = "chemin/vers/nouvelle/image.jpeg";
```

## Intégration avec l'API

L'API reste inchangée pour :
- Créer des badges personnalisés (`POST /api/gamification/badges`)
- Récupérer les badges (`GET /api/gamification/badges`)
- Mettre à jour les badges (`PUT /api/gamification/badges/:id`)
- Gérer les badges utilisateur (`GET /api/gamification/users/:userId/badges`)

Seul l'endpoint d'initialisation (`POST /api/gamification/badges/init`) n'est plus utilisé.
