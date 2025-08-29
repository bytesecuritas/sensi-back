-- Migration pour ajouter les tables de quiz (PostgreSQL)
-- À exécuter après avoir mis à jour les entités

-- Table quiz
CREATE TABLE IF NOT EXISTS quiz (
    quiz_id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    ordre INTEGER DEFAULT 1,
    actif BOOLEAN DEFAULT TRUE,
    temps_limite_minutes INTEGER DEFAULT 0,
    score_minimum_pour_reussite DECIMAL(5,2) DEFAULT 70.0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    module_id INTEGER,
    CONSTRAINT fk_quiz_module FOREIGN KEY (module_id) REFERENCES module_apprentissage(module_id) ON DELETE CASCADE
);

-- Table question
CREATE TABLE IF NOT EXISTS question (
    question_id SERIAL PRIMARY KEY,
    enonce TEXT NOT NULL,
    type_question VARCHAR(20) DEFAULT 'choix_unique' CHECK (type_question IN ('choix_unique', 'choix_multiple', 'vrai_faux', 'texte_libre')),
    ordre INTEGER DEFAULT 1,
    points DECIMAL(5,2) DEFAULT 1.0,
    explication TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quiz_id INTEGER,
    CONSTRAINT fk_question_quiz FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id) ON DELETE CASCADE
);

-- Table reponse
CREATE TABLE IF NOT EXISTS reponse (
    reponse_id SERIAL PRIMARY KEY,
    texte TEXT NOT NULL,
    est_correcte BOOLEAN DEFAULT FALSE,
    ordre INTEGER DEFAULT 1,
    explication TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    question_id INTEGER,
    CONSTRAINT fk_reponse_question FOREIGN KEY (question_id) REFERENCES question(question_id) ON DELETE CASCADE
);

-- Table reponse_quiz (réponses des utilisateurs)
CREATE TABLE IF NOT EXISTS reponse_quiz (
    reponse_quiz_id SERIAL PRIMARY KEY,
    reponse_texte TEXT,
    est_correcte BOOLEAN,
    points_obtenus DECIMAL(5,2) DEFAULT 0,
    temps_reponse_secondes INTEGER DEFAULT 0,
    date_reponse TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    utilisateur_id INTEGER,
    quiz_id INTEGER,
    question_id INTEGER,
    reponse_id INTEGER,
    CONSTRAINT fk_reponse_quiz_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES users(users_id) ON DELETE CASCADE,
    CONSTRAINT fk_reponse_quiz_quiz FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id) ON DELETE CASCADE,
    CONSTRAINT fk_reponse_quiz_question FOREIGN KEY (question_id) REFERENCES question(question_id) ON DELETE CASCADE,
    CONSTRAINT fk_reponse_quiz_reponse FOREIGN KEY (reponse_id) REFERENCES reponse(reponse_id) ON DELETE SET NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quiz_module ON quiz(module_id);
CREATE INDEX IF NOT EXISTS idx_question_quiz ON question(quiz_id);
CREATE INDEX IF NOT EXISTS idx_reponse_question ON reponse(question_id);
CREATE INDEX IF NOT EXISTS idx_reponse_quiz_utilisateur ON reponse_quiz(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_reponse_quiz_quiz ON reponse_quiz(quiz_id);
CREATE INDEX IF NOT EXISTS idx_reponse_quiz_question ON reponse_quiz(question_id);

-- Trigger pour mettre à jour automatiquement date_maj
CREATE OR REPLACE FUNCTION update_date_maj()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_maj = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER trigger_update_quiz_date_maj
    BEFORE UPDATE ON quiz
    FOR EACH ROW
    EXECUTE FUNCTION update_date_maj();

CREATE TRIGGER trigger_update_question_date_maj
    BEFORE UPDATE ON question
    FOR EACH ROW
    EXECUTE FUNCTION update_date_maj();

CREATE TRIGGER trigger_update_reponse_date_maj
    BEFORE UPDATE ON reponse
    FOR EACH ROW
    EXECUTE FUNCTION update_date_maj();

CREATE TRIGGER trigger_update_reponse_quiz_date_maj
    BEFORE UPDATE ON reponse_quiz
    FOR EACH ROW
    EXECUTE FUNCTION update_date_maj();

-- Commentaires pour documenter les tables (PostgreSQL utilise COMMENT ON)
COMMENT ON TABLE quiz IS 'Table des quiz associés aux modules d''apprentissage';
COMMENT ON TABLE question IS 'Table des questions des quiz';
COMMENT ON TABLE reponse IS 'Table des options de réponse pour chaque question';
COMMENT ON TABLE reponse_quiz IS 'Table des réponses soumises par les utilisateurs aux quiz';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN quiz.quiz_id IS 'Identifiant unique du quiz';
COMMENT ON COLUMN quiz.titre IS 'Titre du quiz';
COMMENT ON COLUMN quiz.score_minimum_pour_reussite IS 'Score minimum en pourcentage pour réussir le quiz';

COMMENT ON COLUMN question.question_id IS 'Identifiant unique de la question';
COMMENT ON COLUMN question.type_question IS 'Type de question: choix_unique, choix_multiple, vrai_faux, texte_libre';
COMMENT ON COLUMN question.points IS 'Nombre de points attribués à cette question';

COMMENT ON COLUMN reponse.reponse_id IS 'Identifiant unique de la réponse';
COMMENT ON COLUMN reponse.est_correcte IS 'Indique si cette réponse est correcte';

COMMENT ON COLUMN reponse_quiz.reponse_quiz_id IS 'Identifiant unique de la réponse utilisateur';
COMMENT ON COLUMN reponse_quiz.points_obtenus IS 'Points obtenus pour cette question';
COMMENT ON COLUMN reponse_quiz.temps_reponse_secondes IS 'Temps de réponse en secondes';
