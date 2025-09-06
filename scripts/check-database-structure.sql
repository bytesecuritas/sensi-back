-- Script pour vérifier la structure de la base de données
-- et identifier les problèmes potentiels

USE sensibilisation;

-- 1. Vérifier la structure de la table module_apprentissage
DESCRIBE module_apprentissage;

-- 2. Vérifier les colonnes manquantes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'module_apprentissage'
ORDER BY ORDINAL_POSITION;

-- 3. Vérifier les relations (clés étrangères)
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'sensibilisation' 
AND TABLE_NAME = 'module_apprentissage'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 4. Vérifier les données existantes
SELECT COUNT(*) as total_modules FROM module_apprentissage;
SELECT COUNT(*) as modules_avec_parcours_id FROM module_apprentissage WHERE parcours_id IS NOT NULL;

-- 5. Vérifier les parcours existants
SELECT parcours_id, titre FROM parcours_apprentissage LIMIT 10;

-- 6. Vérifier la correspondance entre modules et parcours
SELECT 
    m.module_id,
    m.titre as module_titre,
    m.parcours_id,
    p.titre as parcours_titre
FROM module_apprentissage m
LEFT JOIN parcours_apprentissage p ON m.parcours_id = p.parcours_id
LIMIT 10;
