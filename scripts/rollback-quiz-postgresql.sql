-- Script de rollback pour supprimer les tables de quiz (PostgreSQL)
-- À utiliser uniquement si vous devez supprimer complètement le système de quiz

-- Supprimer les triggers d'abord
DROP TRIGGER IF EXISTS trigger_update_reponse_quiz_date_maj ON reponse_quiz;
DROP TRIGGER IF EXISTS trigger_update_reponse_date_maj ON reponse;
DROP TRIGGER IF EXISTS trigger_update_question_date_maj ON question;
DROP TRIGGER IF EXISTS trigger_update_quiz_date_maj ON quiz;

-- Supprimer la fonction de mise à jour
DROP FUNCTION IF EXISTS update_date_maj();

-- Supprimer les tables dans l'ordre (en respectant les contraintes de clés étrangères)
-- L'ordre est important : d'abord les tables qui dépendent des autres
DROP TABLE IF EXISTS reponse_quiz CASCADE;
DROP TABLE IF EXISTS reponse CASCADE;
DROP TABLE IF EXISTS question CASCADE;
DROP TABLE IF EXISTS quiz CASCADE;

-- Vérification que les tables ont été supprimées
-- Vous pouvez exécuter ces requêtes pour vérifier :
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%quiz%';
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%question%';
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%reponse%';
