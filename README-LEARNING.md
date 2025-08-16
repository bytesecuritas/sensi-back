# Module d'Apprentissage - Documentation

## Vue d'ensemble

Le module d'apprentissage permet de gérer des parcours de formation, des modules d'apprentissage, des contenus médias, des progressions utilisateur et des certifications. Il respecte les contraintes métier suivantes :

- Un utilisateur ne voit que les parcours choisis par son organisation (admin)
- L'ajout d'un parcours à une organisation se fait comme l'ajout d'un produit dans un panier (relation many-to-many)
- Un parcours contient plusieurs modules, mais un module appartient à un seul parcours
- Un module peut contenir plusieurs contenus médias, mais un contenu média appartient à un seul module

## Entités

### 1. Parcours_Apprentissage (LearningPath)
Représente un parcours de formation complet.

**Attributs :**
- `parcours_id` : Identifiant unique (BIGINT, Primary Key)
- `titre` : Titre du parcours (VARCHAR(255))
- `description` : Description détaillée (TEXT)
- `public_cible` : Public cible (ENUM: debutant, intermediaire, avance, tous)
- `date_creation` : Date de création (TIMESTAMP)
- `date_maj` : Date de mise à jour (TIMESTAMP)

### 2. Module_Apprentissage (LearningModule)
Représente un module individuel dans un parcours.

**Attributs :**
- `module_id` : Identifiant unique (BIGINT, Primary Key)
- `titre` : Titre du module (VARCHAR(255))
- `description` : Description du module (TEXT)
- `type_contenu` : Type de contenu (ENUM: video, pdf, quiz, interactif, audio)
- `public_cible` : Public cible (ENUM)
- `code_langue` : Code de langue (CHAR(2))
- `duree_minutes` : Durée en minutes (INTEGER)
- `niveau_difficulte` : Niveau de difficulté (ENUM: facile, moyen, difficile, expert)
- `parcours_id` : Référence au parcours (BIGINT, Foreign Key)
- `date_creation` : Date de création (TIMESTAMP)
- `date_maj` : Date de mise à jour (TIMESTAMP)

### 3. Contenu_Media (MediaContent)
Représente les contenus médias associés aux modules.

**Attributs :**
- `media_id` : Identifiant unique (BIGINT, Primary Key)
- `module_id` : Référence au module (BIGINT, Foreign Key)
- `type_media` : Type de média (ENUM: video, pdf, image, audio, document, presentation)
- `url_fichier` : URL du fichier (VARCHAR(255))
- `nom_fichier` : Nom du fichier (VARCHAR(255))
- `taille_fichier` : Taille en octets (BIGINT)
- `description` : Description du contenu (TEXT)
- `attaque_id` : Identifiant d'attaque (BIGINT, nullable)
- `date_creation` : Date de création (TIMESTAMP)
- `date_maj` : Date de mise à jour (TIMESTAMP)

### 4. Certification
Représente les certifications obtenues par les utilisateurs.

**Attributs :**
- `certification_id` : Identifiant unique (INTEGER, Primary Key)
- `utilisateur_id` : Référence à l'utilisateur (BIGINT, Foreign Key)
- `parcours_id` : Référence au parcours (BIGINT, Foreign Key)
- `type_certification` : Type de certification (ENUM: completion, competence, maitrise, specialisation)
- `date_emission` : Date d'émission (TIMESTAMP)
- `url_certification` : URL de la certification (VARCHAR(255))

### 5. Progression (Progress)
Représente la progression d'un utilisateur dans un module.

**Attributs :**
- `progression_id` : Identifiant unique (INTEGER, Primary Key)
- `utilisateur_id` : Référence à l'utilisateur (BIGINT, Foreign Key)
- `module_id` : Référence au module (BIGINT, Foreign Key)
- `statut` : Statut de progression (ENUM: non_commence, en_cours, termine, abandonne)
- `score` : Score obtenu (DECIMAL(5,2))
- `date_completion` : Date de completion (TIMESTAMP, nullable)
- `temps_passe` : Temps passé en secondes (INTEGER)
- `date_creation` : Date de création (TIMESTAMP)
- `date_maj` : Date de mise à jour (TIMESTAMP)

### 6. OrganisationLearningPath
Table de liaison pour la relation many-to-many entre Organisation et Parcours_Apprentissage.

**Attributs :**
- `id` : Identifiant unique (Primary Key)
- `organisation_id` : Référence à l'organisation (BIGINT, Foreign Key)
- `parcours_id` : Référence au parcours (BIGINT, Foreign Key)
- `date_ajout` : Date d'ajout (TIMESTAMP)
- `actif` : Statut actif (BOOLEAN)

## Relations

1. **Organisation ↔ Parcours_Apprentissage** : Many-to-Many via `OrganisationLearningPath`
2. **Parcours_Apprentissage → Module_Apprentissage** : One-to-Many
3. **Module_Apprentissage → Contenu_Media** : One-to-Many
4. **Utilisateur → Progression** : One-to-Many
5. **Module_Apprentissage → Progression** : One-to-Many
6. **Utilisateur → Certification** : One-to-Many
7. **Parcours_Apprentissage → Certification** : One-to-Many

## Endpoints API

### Parcours d'Apprentissage

- `POST /learning/parcours` - Créer un parcours
- `GET /learning/parcours` - Récupérer tous les parcours
- `GET /learning/parcours/:id` - Récupérer un parcours par ID
- `GET /learning/parcours/user/available` - Récupérer les parcours disponibles pour l'utilisateur connecté

### Modules d'Apprentissage

- `POST /learning/modules` - Créer un module
- `GET /learning/parcours/:parcoursId/modules` - Récupérer les modules d'un parcours

### Contenus Médias

- `POST /learning/media` - Créer un contenu média
- `GET /learning/modules/:moduleId/media` - Récupérer les contenus média d'un module

### Progressions

- `POST /learning/progress` - Créer une progression
- `PUT /learning/progress/:id` - Mettre à jour une progression
- `GET /learning/progress/user` - Récupérer les progressions de l'utilisateur connecté
- `GET /learning/progress/user/:moduleId` - Récupérer la progression d'un module spécifique

### Certifications

- `POST /learning/certifications` - Créer une certification
- `GET /learning/certifications/user` - Récupérer les certifications de l'utilisateur connecté

### Gestion Organisation-Parcours

- `POST /learning/organisations/:organisationId/parcours/:parcoursId` - Ajouter un parcours à une organisation
- `DELETE /learning/organisations/:organisationId/parcours/:parcoursId` - Retirer un parcours d'une organisation
- `GET /learning/organisations/:organisationId/parcours` - Récupérer les parcours d'une organisation

### Vérification d'Accès

- `GET /learning/access/check/:parcoursId` - Vérifier si l'utilisateur a accès à un parcours

## Utilisation

### 1. Créer un parcours d'apprentissage

```javascript
const parcoursData = {
  titre: "Formation Cybersécurité",
  description: "Parcours complet sur la cybersécurité",
  public_cible: "debutant"
};

const response = await axios.post('/learning/parcours', parcoursData);
```

### 2. Ajouter un parcours à une organisation

```javascript
const response = await axios.post('/learning/organisations/1/parcours/1');
```

### 3. Récupérer les parcours disponibles pour un utilisateur

```javascript
const response = await axios.get('/learning/parcours/user/available');
```

### 4. Créer une progression

```javascript
const progressData = {
  utilisateur_id: 1,
  module_id: 1,
  statut: "en_cours",
  score: 0,
  temps_passe: 0
};

const response = await axios.post('/learning/progress', progressData);
```

## Contraintes Métier

1. **Accès aux parcours** : Un utilisateur ne peut voir que les parcours choisis par son organisation
2. **Gestion des parcours** : L'ajout/retrait de parcours se fait via la table de liaison `OrganisationLearningPath`
3. **Hiérarchie des contenus** : Parcours → Modules → Contenus Médias
4. **Suivi de progression** : Chaque utilisateur a une progression individuelle par module
5. **Certifications** : Les certifications sont liées aux parcours et aux utilisateurs

## Tests

Pour tester le module, utilisez le fichier `test-learning.js` :

```bash
node test-learning.js
```

Ce script teste toutes les fonctionnalités principales du module d'apprentissage.
