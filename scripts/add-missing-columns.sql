-- Script pour ajouter les colonnes manquantes dans la table module_apprentissage
-- Exécuter ce script si vous obtenez l'erreur "Unknown column 'points_completion'"

USE sensibilisation;

-- Vérifier si les colonnes existent avant de les ajouter
SET @sql = '';

-- Ajouter points_completion si elle n'existe pas
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'module_apprentissage' 
AND COLUMN_NAME = 'points_completion';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE module_apprentissage ADD COLUMN points_completion INT DEFAULT 50', 
    'SELECT "Column points_completion already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter points_quiz_reussi si elle n'existe pas
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'module_apprentissage' 
AND COLUMN_NAME = 'points_quiz_reussi';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE module_apprentissage ADD COLUMN points_quiz_reussi INT DEFAULT 25', 
    'SELECT "Column points_quiz_reussi already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter badge_associe si elle n'existe pas
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'module_apprentissage' 
AND COLUMN_NAME = 'badge_associe';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE module_apprentissage ADD COLUMN badge_associe VARCHAR(100) NULL', 
    'SELECT "Column badge_associe already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter simulation_requise si elle n'existe pas
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'module_apprentissage' 
AND COLUMN_NAME = 'simulation_requise';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE module_apprentissage ADD COLUMN simulation_requise BOOLEAN DEFAULT FALSE', 
    'SELECT "Column simulation_requise already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter points_simulation si elle n'existe pas
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'module_apprentissage' 
AND COLUMN_NAME = 'points_simulation';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE module_apprentissage ADD COLUMN points_simulation INT DEFAULT 0', 
    'SELECT "Column points_simulation already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier la structure de la table
DESCRIBE module_apprentissage;
