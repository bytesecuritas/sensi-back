# Guide de Dépannage - Upload de Fichiers

## 🔍 Diagnostic de l'erreur "No file uploaded"

### Problème
L'erreur `"No file uploaded"` indique que le fichier n'est pas correctement reçu par le serveur.

### Solutions possibles

## 1. **Vérification avec Thunder Client**

### Configuration correcte dans Thunder Client :

1. **Méthode** : `POST`
2. **URL** : `http://localhost:3000/api/learning/media/upload?module_id=1`
3. **Headers** :
   - `Authorization: Bearer [votre_token]`
   - `Content-Type: multipart/form-data` (automatique)

4. **Body** : Sélectionner "Form"
5. **Champs à ajouter** :
   - `file` : [Type: File] - Sélectionner votre fichier PDF
   - `titre` : [Type: Text] - "Guide de Sécurité PDF"
   - `type_contenu` : [Type: Text] - "pdf"
   - `description` : [Type: Text] - "Description du fichier"

### ⚠️ Points importants :
- Le champ doit s'appeler exactement `file`
- Le type doit être "File" pour le champ fichier
- Les autres champs doivent être de type "Text"

## 2. **Vérification du fichier**

### Caractéristiques du fichier :
- **Nom** : `cofig conda.pdf`
- **Chemin** : `C:\Users\Mossoko\Documents\cofig conda.pdf`
- **Type attendu** : PDF

### Problèmes possibles :
1. **Espaces dans le nom** : Le nom contient des espaces
2. **MIME type** : Le serveur peut ne pas reconnaître le type MIME
3. **Taille du fichier** : Vérifier que le fichier n'est pas trop volumineux

## 3. **Solutions appliquées**

### ✅ Corrections déjà appliquées :

1. **Validation plus souple des PDF** :
   ```typescript
   const isPdf = file.mimetype === 'application/pdf' || 
                file.originalname.toLowerCase().endsWith('.pdf') ||
                file.mimetype.includes('pdf');
   ```

2. **Logs de diagnostic** :
   - Logs dans le `fileFilter`
   - Logs dans la méthode `uploadMediaContent`

3. **Configuration du ValidationPipe** :
   ```typescript
   @Body(new ValidationPipe({ 
     transform: true, 
     whitelist: true, 
     forbidNonWhitelisted: false 
   }))
   ```

## 4. **Test étape par étape**

### Étape 1 : Vérifier que le serveur fonctionne
```bash
# Obtenir un token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@cybersec.com","password":"SuperAdmin123!"}'
```

### Étape 2 : Tester l'upload avec curl
```bash
curl -X POST http://localhost:3000/api/learning/media/upload?module_id=1 \
  -H "Authorization: Bearer [votre_token]" \
  -F "file=@C:\Users\Mossoko\Documents\cofig conda.pdf" \
  -F "titre=Test Upload" \
  -F "type_contenu=pdf" \
  -F "description=Test description"
```

### Étape 3 : Vérifier les logs du serveur
Les logs devraient afficher :
```
File upload attempt: {
  originalname: 'cofig conda.pdf',
  mimetype: 'application/pdf',
  size: [taille_du_fichier]
}
File accepted: cofig conda.pdf
```

## 5. **Problèmes courants et solutions**

### Problème 1 : MIME type incorrect
**Symptôme** : `Invalid file type: application/octet-stream`
**Solution** : Le fichier est reconnu comme binaire générique

### Problème 2 : Nom de fichier avec espaces
**Symptôme** : Erreur de parsing
**Solution** : Renommer le fichier sans espaces ou utiliser des guillemets

### Problème 3 : Token expiré
**Symptôme** : `Unauthorized`
**Solution** : Obtenir un nouveau token

### Problème 4 : Module inexistant
**Symptôme** : `Module not found`
**Solution** : Vérifier que le module_id=1 existe

## 6. **Configuration alternative**

### Si le problème persiste, essayez :

1. **Renommer le fichier** : `cofig-conda.pdf` (sans espaces)
2. **Utiliser Postman** au lieu de Thunder Client
3. **Vérifier la taille** : Le fichier ne doit pas dépasser 10MB

### Configuration Postman :
- Method: POST
- URL: `http://localhost:3000/api/learning/media/upload?module_id=1`
- Headers: `Authorization: Bearer [token]`
- Body: form-data
- Key: `file`, Type: File, Value: [sélectionner le fichier]
- Key: `titre`, Type: Text, Value: "Test"
- Key: `type_contenu`, Type: Text, Value: "pdf"

## 7. **Logs de diagnostic**

Après avoir appliqué les corrections, les logs du serveur devraient afficher :

```
File upload attempt: {
  originalname: 'cofig conda.pdf',
  mimetype: 'application/pdf',
  size: 123456
}
File accepted: cofig conda.pdf
uploadMediaContent called with: {
  file: {
    originalname: 'cofig conda.pdf',
    mimetype: 'application/pdf',
    size: 123456,
    filename: '1234567890-uuid-cofig_conda.pdf'
  },
  moduleId: 1,
  mediaData: { titre: 'Test', type_contenu: 'pdf', description: 'Test' }
}
```

## 8. **Contact et support**

Si le problème persiste après avoir essayé toutes ces solutions :

1. **Vérifier les logs** du serveur pour des erreurs spécifiques
2. **Tester avec un fichier PDF simple** (créé avec Word ou LibreOffice)
3. **Vérifier les permissions** du dossier `ressources/temp`

---

**Note** : Les corrections appliquées devraient résoudre la plupart des problèmes d'upload. Les logs ajoutés vous aideront à identifier précisément où le problème se situe.
