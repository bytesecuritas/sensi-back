-- Script pour ajouter les colonnes manquantes dans la table question
-- Exécuter ce script si vous obtenez l'erreur "Unknown column 'termes_acceptes'"

USE sensibilisation;

-- Vérifier si la colonne existe avant de l'ajouter
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'question' 
AND COLUMN_NAME = 'termes_acceptes';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE question ADD COLUMN termes_acceptes TEXT NULL', 
    'SELECT "Column termes_acceptes already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier la structure de la table
DESCRIBE question;
