# Système de Quiz - Guide PostgreSQL

## 🐘 Adaptation pour PostgreSQL

Ce guide explique comment utiliser le système de quiz avec PostgreSQL au lieu de MySQL.

## 📋 Différences Principales avec MySQL

### 1. **Types de Données**
- `INT` → `INTEGER`
- `AUTO_INCREMENT` → `SERIAL`
- `ENUM` → `VARCHAR` avec `CHECK` constraint

### 2. **Syntaxe des Contraintes**
- Contraintes nommées explicites
- Syntaxe `CONSTRAINT nom_constraint` obligatoire

### 3. **Triggers et Fonctions**
- Utilisation de `plpgsql` pour les triggers
- Fonction `update_date_maj()` pour les mises à jour automatiques

### 4. **Commentaires**
- `COMMENT ON TABLE` au lieu de `ALTER TABLE ... COMMENT`

## 🚀 Installation

### 1. **Exécuter la Migration**

```bash
# Se connecter à PostgreSQL
psql -U votre_utilisateur -d votre_base_de_donnees

# Exécuter le script de migration
\i scripts/migration-quiz-postgresql.sql
```

### 2. **Vérifier l'Installation**

```sql
-- Vérifier que les tables ont été créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quiz', 'question', 'reponse', 'reponse_quiz');

-- Vérifier les triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%date_maj%';

-- Vérifier les contraintes
SELECT constraint_name, table_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name IN ('quiz', 'question', 'reponse', 'reponse_quiz');
```

## 🔧 Configuration TypeORM

### 1. **Mise à jour de la Configuration**

Dans votre fichier de configuration TypeORM, assurez-vous d'avoir :

```typescript
// ormconfig.ts ou dans votre module
{
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'votre_utilisateur',
  password: 'votre_mot_de_passe',
  database: 'votre_base_de_donnees',
  entities: [
    // ... vos entités
    'src/learning/entities/*.entity.ts'
  ],
  synchronize: false, // Désactivé en production
  logging: true
}
```

### 2. **Entités Compatibles**

Les entités TypeORM sont compatibles avec PostgreSQL. Aucune modification n'est nécessaire dans le code TypeScript.

## 📊 Fonctionnalités Spécifiques à PostgreSQL

### 1. **Triggers Automatiques**

Le script crée automatiquement des triggers pour mettre à jour `date_maj` :

```sql
-- Exemple de trigger créé
CREATE TRIGGER trigger_update_quiz_date_maj
    BEFORE UPDATE ON quiz
    FOR EACH ROW
    EXECUTE FUNCTION update_date_maj();
```

### 2. **Contraintes de Validation**

Les types de questions sont validés par une contrainte CHECK :

```sql
type_question VARCHAR(20) DEFAULT 'choix_unique' 
CHECK (type_question IN ('choix_unique', 'choix_multiple', 'vrai_faux', 'texte_libre'))
```

### 3. **Index Optimisés**

Les index sont créés avec `IF NOT EXISTS` pour éviter les erreurs :

```sql
CREATE INDEX IF NOT EXISTS idx_quiz_module ON quiz(module_id);
```

## 🧪 Tests avec PostgreSQL

### 1. **Créer un Quiz de Test**

```sql
-- Insérer un module de test (si nécessaire)
INSERT INTO module_apprentissage (titre, description, public_cible, code_langue) 
VALUES ('Module Test', 'Module pour tester les quiz', 'tous', 'fr');

-- Insérer un quiz
INSERT INTO quiz (titre, description, module_id, score_minimum_pour_reussite) 
VALUES ('Quiz Test', 'Quiz pour tester le système', 1, 70.0);

-- Insérer une question
INSERT INTO question (enonce, type_question, quiz_id, points) 
VALUES ('Qu''est-ce que le phishing ?', 'choix_unique', 1, 10.0);

-- Insérer des réponses
INSERT INTO reponse (texte, est_correcte, question_id) 
VALUES ('Une technique d''ingénierie sociale', true, 1);

INSERT INTO reponse (texte, est_correcte, question_id) 
VALUES ('Un virus informatique', false, 1);
```

### 2. **Vérifier les Données**

```sql
-- Voir tous les quiz
SELECT q.titre, q.description, m.titre as module_titre
FROM quiz q
JOIN module_apprentissage m ON q.module_id = m.module_id;

-- Voir les questions d'un quiz
SELECT q.enonce, q.type_question, q.points, COUNT(r.reponse_id) as nb_reponses
FROM question q
LEFT JOIN reponse r ON q.question_id = r.question_id
WHERE q.quiz_id = 1
GROUP BY q.question_id, q.enonce, q.type_question, q.points;
```

## 🔄 Rollback

Si vous devez supprimer le système de quiz :

```bash
# Exécuter le script de rollback
psql -U votre_utilisateur -d votre_base_de_donnees -f scripts/rollback-quiz-postgresql.sql
```

## 📈 Performance

### 1. **Index Créés**

Le script crée automatiquement les index suivants :
- `idx_quiz_module` : Pour les requêtes par module
- `idx_question_quiz` : Pour les requêtes de questions par quiz
- `idx_reponse_question` : Pour les réponses par question
- `idx_reponse_quiz_utilisateur` : Pour les réponses par utilisateur
- `idx_reponse_quiz_quiz` : Pour les réponses par quiz
- `idx_reponse_quiz_question` : Pour les réponses par question

### 2. **Optimisations Recommandées**

```sql
-- Analyser les performances
ANALYZE quiz;
ANALYZE question;
ANALYZE reponse;
ANALYZE reponse_quiz;

-- Vérifier l'utilisation des index
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('quiz', 'question', 'reponse', 'reponse_quiz');
```

## 🐛 Dépannage

### Problèmes Courants

1. **Erreur de Permission**
   ```bash
   # Donner les permissions nécessaires
   GRANT ALL PRIVILEGES ON DATABASE votre_base_de_donnees TO votre_utilisateur;
   ```

2. **Erreur de Séquence**
   ```sql
   -- Réinitialiser les séquences si nécessaire
   SELECT setval('quiz_quiz_id_seq', (SELECT MAX(quiz_id) FROM quiz));
   ```

3. **Erreur de Trigger**
   ```sql
   -- Recréer les triggers si nécessaire
   \i scripts/migration-quiz-postgresql.sql
   ```

## 📞 Support

Pour toute question spécifique à PostgreSQL :
1. Consultez la documentation PostgreSQL officielle
2. Vérifiez les logs PostgreSQL : `/var/log/postgresql/`
3. Utilisez `EXPLAIN ANALYZE` pour déboguer les requêtes lentes
