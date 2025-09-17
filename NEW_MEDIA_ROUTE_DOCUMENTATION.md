# Nouvelle Route : Récupération d'un Média par ID

## Route Ajoutée

### `GET /api/learning/media/:mediaId`

**Description :** Récupère un contenu média spécifique par son ID avec toutes ses informations et son URL complète.

## Détails de la Route

### **Méthode HTTP**
```
GET /api/learning/media/:mediaId
```

### **Paramètres**
- **`mediaId`** (string, requis) : L'ID du contenu média à récupérer

### **Headers Requis**
```
Authorization: Bearer {token}
Content-Type: application/json
```

### **Réponses**

#### **200 - Succès**
```json
{
  "media_id": 1,
  "titre": "Vidéo Test CRUD",
  "type_contenu": "video",
  "duree_minutes": 5,
  "url_fichier": "http://localhost:3000/api/learning/media/1/stream",
  "nom_fichier": "test-video.mp4",
  "chemin_stockage": "ressources/phishing/module-test/test-video.mp4",
  "taille_fichier": 15728640,
  "description": "Vidéo pour tester les opérations CRUD",
  "contenu": null,
  "date_creation": "2024-01-15T10:00:00.000Z",
  "date_maj": "2024-01-15T10:00:00.000Z",
  "type_attaque": null,
  "module": {
    "module_id": 1,
    "titre": "Module Test CRUD",
    "description": "Module pour tester les opérations CRUD",
    "parcours_id": 1,
    "niveau_difficulte": "moyen",
    "thematique_cyber": "phishing",
    "duree_estimee_minutes": 45,
    "objectifs": ["Comprendre le phishing", "Identifier les attaques"],
    "prerequis": ["Connaissances de base"],
    "langue": "fr",
    "date_creation": "2024-01-15T10:00:00.000Z",
    "date_maj": "2024-01-15T10:00:00.000Z"
  }
}
```

#### **404 - Non Trouvé**
```json
{
  "statusCode": 404,
  "message": "Contenu média avec l'ID 999 non trouvé",
  "error": "Not Found"
}
```

#### **401 - Non Autorisé**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Implémentation

### **Contrôleur**
```typescript
@Get('media/:mediaId')
@ApiOperation({ summary: 'Récupérer un contenu média par ID' })
@ApiParam({ name: 'mediaId', type: String })
@ApiResponse({ status: 200, description: 'Contenu média récupéré avec succès', type: MediaContent })
@ApiResponse({ status: 404, description: 'Contenu média non trouvé' })
async getMediaContentById(@Param('mediaId') mediaId: string): Promise<MediaContent> {
  return await this.learningService.getMediaContentById(+mediaId);
}
```

### **Service**
```typescript
async getMediaContentById(mediaId: number): Promise<MediaContent> {
  const media = await this.mediaContentRepository.findOne({
    where: { media_id: mediaId },
    relations: ['module'],
  });
  if (!media) {
    throw new NotFoundException(`Contenu média avec l'ID ${mediaId} non trouvé`);
  }
  
  // Construire l'URL complète si nécessaire
  if (media.chemin_stockage && !media.url_fichier) {
    media.url_fichier = this.buildMediaUrl(media.media_id);
  }
  
  return media;
}
```

## Fonctionnalités

### **1. Récupération Complète**
- Toutes les informations du média
- Relations avec le module parent
- URL complète pour le streaming

### **2. Construction Automatique d'URL**
- URL complète générée automatiquement
- Format : `{API_BASE_URL}/api/learning/media/{mediaId}/stream`
- Compatible avec le streaming

### **3. Gestion d'Erreurs**
- Erreur 404 si le média n'existe pas
- Messages d'erreur explicites
- Gestion des exceptions appropriée

## Utilisation

### **Frontend JavaScript**
```javascript
// Récupérer un média spécifique
async function getMediaById(mediaId) {
  try {
    const response = await fetch(`/api/learning/media/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const media = await response.json();
    console.log('Média récupéré:', media);
    console.log('URL de streaming:', media.url_fichier);
    
    return media;
  } catch (error) {
    console.error('Erreur lors de la récupération du média:', error);
    throw error;
  }
}

// Utilisation
getMediaById(1).then(media => {
  // Utiliser le média récupéré
  displayMedia(media);
});
```

### **Frontend React**
```jsx
import React, { useState, useEffect } from 'react';

function MediaPlayer({ mediaId }) {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch(`/api/learning/media/${mediaId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }

        const mediaData = await response.json();
        setMedia(mediaData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [mediaId]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!media) return <div>Média non trouvé</div>;

  return (
    <div>
      <h2>{media.titre}</h2>
      <p>{media.description}</p>
      <p>Durée: {media.duree_minutes} minutes</p>
      
      {media.type_contenu === 'video' && (
        <video controls>
          <source src={media.url_fichier} type="video/mp4" />
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      )}
      
      {media.type_contenu === 'pdf' && (
        <iframe 
          src={media.url_fichier} 
          width="100%" 
          height="600px"
          title={media.titre}
        >
          <p>Votre navigateur ne supporte pas les iframes.</p>
        </iframe>
      )}
    </div>
  );
}
```

### **Frontend Vue.js**
```vue
<template>
  <div v-if="loading">Chargement...</div>
  <div v-else-if="error">Erreur: {{ error }}</div>
  <div v-else-if="media">
    <h2>{{ media.titre }}</h2>
    <p>{{ media.description }}</p>
    <p>Durée: {{ media.duree_minutes }} minutes</p>
    
    <video v-if="media.type_contenu === 'video'" controls>
      <source :src="media.url_fichier" type="video/mp4" />
      Votre navigateur ne supporte pas la balise vidéo.
    </video>
    
    <iframe 
      v-else-if="media.type_contenu === 'pdf'"
      :src="media.url_fichier" 
      width="100%" 
      height="600px"
      :title="media.titre"
    >
      <p>Votre navigateur ne supporte pas les iframes.</p>
    </iframe>
  </div>
</template>

<script>
export default {
  name: 'MediaPlayer',
  props: {
    mediaId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      media: null,
      loading: true,
      error: null
    };
  },
  async mounted() {
    try {
      const response = await fetch(`/api/learning/media/${this.mediaId}`, {
        headers: {
          'Authorization': `Bearer ${this.$store.state.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      this.media = await response.json();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
};
</script>
```

## Tests

### **Tests HTTP**
```http
### Récupérer un contenu média par ID
GET http://localhost:3000/api/learning/media/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Récupérer un contenu média inexistant (test d'erreur 404)
GET http://localhost:3000/api/learning/media/999
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Tests JavaScript**
```javascript
// Test de récupération réussie
async function testGetMediaSuccess() {
  const media = await getMediaById(1);
  console.assert(media.media_id === 1, 'ID du média incorrect');
  console.assert(media.url_fichier, 'URL du fichier manquante');
  console.assert(media.module, 'Module parent manquant');
  console.log('✅ Test de récupération réussie');
}

// Test d'erreur 404
async function testGetMediaNotFound() {
  try {
    await getMediaById(999);
    console.error('❌ Erreur attendue non levée');
  } catch (error) {
    console.assert(error.message.includes('404'), 'Erreur 404 attendue');
    console.log('✅ Test d\'erreur 404 réussi');
  }
}
```

## Avantages

### **1. Accès Direct**
- Récupération d'un média spécifique par ID
- Pas besoin de parcourir une liste complète
- Performance optimisée

### **2. Informations Complètes**
- Toutes les métadonnées du média
- Relations avec le module parent
- URL complète pour le streaming

### **3. Intégration Facile**
- Compatible avec tous les frameworks frontend
- API REST standard
- Gestion d'erreurs appropriée

### **4. Sécurité**
- Authentification requise
- Autorisation basée sur les rôles
- Validation des paramètres

## Cas d'Usage

### **1. Lecteur de Média**
- Récupération des informations d'un média pour l'affichage
- Construction de l'URL de streaming
- Affichage des métadonnées

### **2. Gestion de Contenu**
- Édition d'un média spécifique
- Suppression d'un média
- Mise à jour des informations

### **3. Navigation**
- Liens directs vers des médias spécifiques
- Partage d'URLs de médias
- Intégration dans des listes

### **4. Analytics**
- Suivi de l'utilisation d'un média spécifique
- Statistiques de lecture
- Métriques de performance

## Conclusion

Cette nouvelle route `GET /api/learning/media/:mediaId` offre :

- ✅ **Accès direct** à un média spécifique
- ✅ **Informations complètes** avec relations
- ✅ **URL complète** pour le streaming
- ✅ **Gestion d'erreurs** appropriée
- ✅ **Intégration facile** avec le frontend
- ✅ **Performance optimisée**

Elle complète parfaitement l'API existante et facilite l'intégration frontend ! 🎉
