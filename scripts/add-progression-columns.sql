-- Script pour ajouter les colonnes manquantes dans la table progression
-- Exécuter ce script si vous obtenez l'erreur "Unknown column 'points_gagnes'"

USE sensibilisation;

-- Vérifier et ajouter les colonnes manquantes une par une
SET @sql = '';

-- Ajouter points_gagnes
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'points_gagnes';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN points_gagnes INT(11) DEFAULT 0', 
    'SELECT "Column points_gagnes already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter badge_debloque
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'badge_debloque';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN badge_debloque BOOLEAN DEFAULT FALSE', 
    'SELECT "Column badge_debloque already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter badge_obtenu
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'badge_obtenu';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN badge_obtenu VARCHAR(100) NULL', 
    'SELECT "Column badge_obtenu already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter quiz_score
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'quiz_score';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN quiz_score INT(11) DEFAULT 0', 
    'SELECT "Column quiz_score already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter quiz_reussi
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'quiz_reussi';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN quiz_reussi BOOLEAN DEFAULT FALSE', 
    'SELECT "Column quiz_reussi already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter simulation_score
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'simulation_score';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN simulation_score INT(11) DEFAULT 0', 
    'SELECT "Column simulation_score already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter simulation_reussie
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'simulation_reussie';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN simulation_reussie BOOLEAN DEFAULT FALSE', 
    'SELECT "Column simulation_reussie already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter tentatives_quiz
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'tentatives_quiz';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN tentatives_quiz INT(11) DEFAULT 0', 
    'SELECT "Column tentatives_quiz already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter tentatives_simulation
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'tentatives_simulation';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN tentatives_simulation INT(11) DEFAULT 0', 
    'SELECT "Column tentatives_simulation already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter certificat_obtenu
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'certificat_obtenu';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN certificat_obtenu BOOLEAN DEFAULT FALSE', 
    'SELECT "Column certificat_obtenu already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remplacer module_id par parcours_id si nécessaire
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'progression' 
AND COLUMN_NAME = 'parcours_id';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE progression ADD COLUMN parcours_id INT(11) NULL', 
    'SELECT "Column parcours_id already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier la structure de la table
DESCRIBE progression;
