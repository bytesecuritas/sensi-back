# Documentation de la Gestion des Badges

## Présentation

Le système de badges permet de récompenser les utilisateurs pour leurs accomplissements dans la plateforme de sensibilisation. Chaque badge possède une icône visuelle qui le représente.

## Fonctionnalités

### 1. Initialisation des Badges par Défaut

Les badges par défaut peuvent être initialisés via une commande en ligne plutôt que par une route API.

```bash
npm run init-badges
```

Cette commande:
- Crée le répertoire `resources/badges` s'il n'existe pas
- Utilise l'image spécifiée (`D:\Images\_32f7fc69-f728-4323-821a-b59314912f14.jpeg`) comme icône pour tous les badges par défaut
- Initialise les badges prédéfinis dans la base de données

### 2. Création d'un Badge

Lors de la création d'un badge, vous pouvez spécifier une icône qui sera stockée dans le répertoire `resources/badges/`.

**Exemple de requête avec Multer:**

```http
POST /api/gamification/badges
Content-Type: multipart/form-data

nom: "Badge Test"
description: "Description du badge"
type: "bronze"
categorie: "premier_pas"
points_requis: 0
points_attribues: 25
est_secret: false
conditions_obtention: "Conditions pour obtenir ce badge"
icone_file: [FICHIER_IMAGE]
```

### 3. Modification d'un Badge

Lors de la modification d'un badge, vous pouvez également changer son icône. L'ancienne icône sera supprimée et remplacée par la nouvelle.

**Exemple de requête avec Multer:**

```http
PUT /api/gamification/badges/1
Content-Type: multipart/form-data

nom: "Badge Test Modifié"
description: "Nouvelle description"
icone_file: [NOUVELLE_IMAGE]
```

## Structure des Données

### Badge

| Champ | Type | Description |
|-------|------|-------------|
| badge_id | number | Identifiant unique du badge |
| nom | string | Nom du badge |
| description | string | Description du badge |
| type | BadgeType | Type du badge (bronze, argent, or, platine) |
| categorie | BadgeCategory | Catégorie du badge |
| icone_url | string | Chemin vers l'icône du badge |
| points_requis | number | Points requis pour obtenir le badge |
| points_attribues | number | Points attribués lors de l'obtention du badge |
| est_secret | boolean | Indique si le badge est secret |
| conditions_obtention | string | Description des conditions d'obtention |

## Stockage des Icônes

Les icônes des badges sont stockées dans le répertoire `resources/badges/` avec un nom de fichier unique généré à partir du nom du badge et d'un timestamp.

## Bonnes Pratiques

1. Utilisez des images de taille raisonnable (recommandé: moins de 200KB)
2. Formats d'image supportés: JPEG, PNG, SVG
3. Pour une meilleure expérience utilisateur, utilisez des images carrées (ratio 1:1)