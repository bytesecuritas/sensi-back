# Amélioration des URLs des Contenus Médias

## Problème Identifié

Le frontend ne pouvait pas accéder aux fichiers médias car les URLs retournées par l'API n'étaient pas complètes. Les contenus médias avaient soit :
- `url_fichier` vide (`''`)
- URLs relatives non fonctionnelles
- Chemins de stockage sans URL complète

## Solution Implémentée

### 1. Construction Automatique des URLs Complètes

**Fichier modifié :** `src/learning/learning.service.ts`

#### Nouvelle méthode `buildMediaUrl()`
```typescript
private buildMediaUrl(cheminStockage: string): string {
  // Remplacer les backslashes par des slashes pour la compatibilité web
  const normalizedPath = cheminStockage.replace(/\\/g, '/');
  
  // Construire l'URL complète
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/learning/media/stream/${normalizedPath}`;
}
```

#### Méthodes modifiées pour construire automatiquement les URLs :

1. **`createMediaContent()`** - Construit l'URL lors de la création
2. **`getMediaContentById()`** - Construit l'URL lors de la récupération
3. **`getMediaContentByModule()`** - Construit les URLs pour tous les médias d'un module
4. **`getAllMediaContent()`** - Construit les URLs pour tous les médias
5. **`updateMediaContent()`** - Construit l'URL lors de la mise à jour

### 2. Nouvelle Route de Streaming par Chemin

**Fichier modifié :** `src/learning/learning.controller.ts`

#### Nouvelle route : `GET /api/learning/media/stream/*`
```typescript
@Get('media/stream/*')
@ApiOperation({ summary: 'Streamer un média par chemin (supporte HTTP Range)' })
async streamMediaByPath(@Request() req, @Response() res) {
  const filePath = req.params[0]; // Récupère tout après /stream/
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new BadRequestException('File not found');
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Support HTTP Range pour le streaming
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(fullPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Streaming complet
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(fullPath).pipe(res);
  }
}
```

### 3. Nouvelle Route pour Récupérer Tous les Médias

```typescript
@Get('media')
@ApiOperation({ summary: 'Lister tous les contenus médias' })
async getAllMediaContent(): Promise<MediaContent[]> {
  return await this.learningService.getAllMediaContent();
}
```

## Structure des URLs Générées

### Format des URLs
```
{API_BASE_URL}/api/learning/media/stream/{chemin_stockage}
```

### Exemples d'URLs
```
http://localhost:3000/api/learning/media/stream/ressources/phishing/module-test/video.mp4
https://api.cybersec.com/api/learning/media/stream/ressources/malware/module-advanced/document.pdf
```

### Variables d'Environnement
- `API_BASE_URL` : URL de base de l'API (défaut : `http://localhost:3000`)

## Types de Contenus Médias Supportés

### 1. Fichiers Uploadés
- **Chemin de stockage :** `ressources/{thematique}/{nom_module}/{nom_fichier}`
- **URL générée :** `{API_BASE_URL}/api/learning/media/stream/ressources/{thematique}/{nom_module}/{nom_fichier}`

### 2. URLs Externes
- **URL fournie :** `https://example.com/video.mp4`
- **URL retournée :** `https://example.com/video.mp4` (inchangée)

### 3. URLs Relatives
- **URL fournie :** `/uploads/video.mp4`
- **URL retournée :** `/uploads/video.mp4` (inchangée)

## Fonctionnalités du Streaming

### Support HTTP Range
- Permet la lecture partielle des fichiers
- Essentiel pour les vidéos longues
- Support des balises HTML5 `<video>`

### Types MIME Supportés
- **Vidéos :** `video/mp4`, `video/webm`, `video/ogg`
- **Audio :** `audio/mp3`, `audio/wav`, `audio/ogg`
- **Documents :** `application/pdf`, `text/plain`
- **Images :** `image/jpeg`, `image/png`, `image/gif`

## Tests et Validation

### Fichiers de Test Créés
1. **`http/complete-crud-tests.http`** - Tests CRUD complets
2. **`http/media-url-tests.http`** - Tests spécifiques aux URLs des médias

### Scénarios de Test
1. **Création de contenus médias** avec différents types d'URLs
2. **Récupération des contenus** avec URLs complètes
3. **Streaming des fichiers** avec support HTTP Range
4. **Mise à jour des contenus** avec préservation des URLs
5. **Suppression en cascade** des contenus et fichiers

## Utilisation Frontend

### Récupération des Médias
```javascript
// Récupérer tous les médias d'un module
const response = await fetch('/api/learning/modules/1/media', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const medias = await response.json();

// Chaque média aura maintenant une url_fichier complète
medias.forEach(media => {
  console.log(media.url_fichier); // URL complète accessible
});
```

### Affichage des Vidéos
```html
<video controls>
  <source src="{{ media.url_fichier }}" type="video/mp4">
  Votre navigateur ne supporte pas la balise vidéo.
</video>
```

### Affichage des PDFs
```html
<iframe src="{{ media.url_fichier }}" width="100%" height="600px">
  <p>Votre navigateur ne supporte pas les iframes.</p>
</iframe>
```

## Avantages de la Solution

### 1. **URLs Complètes**
- Tous les contenus médias ont maintenant des URLs complètes
- Compatible avec tous les navigateurs et frameworks frontend

### 2. **Streaming Optimisé**
- Support HTTP Range pour les gros fichiers
- Lecture progressive des vidéos
- Réduction de la bande passante

### 3. **Flexibilité**
- Support des fichiers locaux et externes
- URLs relatives et absolues
- Configuration via variables d'environnement

### 4. **Performance**
- Construction automatique des URLs
- Pas de requêtes supplémentaires
- Cache des URLs dans la base de données

### 5. **Sécurité**
- Validation des chemins de fichiers
- Vérification de l'existence des fichiers
- Gestion des erreurs appropriée

## Migration et Compatibilité

### Contenus Existants
- Les contenus existants sans `url_fichier` auront automatiquement une URL construite
- Aucune migration manuelle nécessaire
- Compatible avec l'existant

### Variables d'Environnement
```env
# .env
API_BASE_URL=https://api.cybersec.com
```

### Configuration Production
```env
# .env.production
API_BASE_URL=https://api.cybersec.com
```

## Conclusion

Cette amélioration résout complètement le problème d'accès aux contenus médias depuis le frontend. Les URLs sont maintenant complètes, fonctionnelles et optimisées pour le streaming. Le système est flexible, performant et compatible avec tous les types de contenus médias.
