-- Script pour ajouter les colonnes manquantes dans la table quiz
-- Exécuter ce script si vous obtenez l'erreur "Unknown column 'type_quiz'"

USE sensibilisation;

-- Vérifier si les colonnes existent avant de les ajouter
SET @sql = '';

-- Ajouter type_quiz si elle n'existe pas
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'quiz' 
AND COLUMN_NAME = 'type_quiz';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE quiz ADD COLUMN type_quiz ENUM("module", "parcours_final") DEFAULT "module"', 
    'SELECT "Column type_quiz already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter validation_100_pourcent si elle n'existe pas
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'quiz' 
AND COLUMN_NAME = 'validation_100_pourcent';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE quiz ADD COLUMN validation_100_pourcent BOOLEAN DEFAULT FALSE', 
    'SELECT "Column validation_100_pourcent already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter parcours_id si elle n'existe pas
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'quiz' 
AND COLUMN_NAME = 'parcours_id';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE quiz ADD COLUMN parcours_id INT(11) NULL', 
    'SELECT "Column parcours_id already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier la structure de la table
DESCRIBE quiz;
