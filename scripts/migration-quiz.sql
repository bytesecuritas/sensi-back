-- Migration pour ajouter les tables de quiz
-- À exécuter après avoir mis à jour les entités

-- Table quiz
CREATE TABLE IF NOT EXISTS quiz (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    ordre INT DEFAULT 1,
    actif BOOLEAN DEFAULT TRUE,
    temps_limite_minutes INT DEFAULT 0,
    score_minimum_pour_reussite DECIMAL(5,2) DEFAULT 70.0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    module_id INT,
    FOREIGN KEY (module_id) REFERENCES module_apprentissage(module_id) ON DELETE CASCADE
);

-- Table question
CREATE TABLE IF NOT EXISTS question (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    enonce TEXT NOT NULL,
    type_question ENUM('choix_unique', 'choix_multiple', 'vrai_faux', 'texte_libre') DEFAULT 'choix_unique',
    ordre INT DEFAULT 1,
    points DECIMAL(5,2) DEFAULT 1.0,
    explication TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    quiz_id INT,
    FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id) ON DELETE CASCADE
);

-- Table reponse
CREATE TABLE IF NOT EXISTS reponse (
    reponse_id INT AUTO_INCREMENT PRIMARY KEY,
    texte TEXT NOT NULL,
    est_correcte BOOLEAN DEFAULT FALSE,
    ordre INT DEFAULT 1,
    explication TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    question_id INT,
    FOREIGN KEY (question_id) REFERENCES question(question_id) ON DELETE CASCADE
);

-- Table reponse_quiz (réponses des utilisateurs)
CREATE TABLE IF NOT EXISTS reponse_quiz (
    reponse_quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    reponse_texte TEXT,
    est_correcte BOOLEAN,
    points_obtenus DECIMAL(5,2) DEFAULT 0,
    temps_reponse_secondes INT DEFAULT 0,
    date_reponse TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    utilisateur_id INT,
    quiz_id INT,
    question_id INT,
    reponse_id INT,
    FOREIGN KEY (utilisateur_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question(question_id) ON DELETE CASCADE,
    FOREIGN KEY (reponse_id) REFERENCES reponse(reponse_id) ON DELETE SET NULL
);

-- Index pour améliorer les performances
CREATE INDEX idx_quiz_module ON quiz(module_id);
CREATE INDEX idx_question_quiz ON question(quiz_id);
CREATE INDEX idx_reponse_question ON reponse(question_id);
CREATE INDEX idx_reponse_quiz_utilisateur ON reponse_quiz(utilisateur_id);
CREATE INDEX idx_reponse_quiz_quiz ON reponse_quiz(quiz_id);
CREATE INDEX idx_reponse_quiz_question ON reponse_quiz(question_id);

-- Commentaires pour documenter les tables
ALTER TABLE quiz COMMENT = 'Table des quiz associés aux modules d\'apprentissage';
ALTER TABLE question COMMENT = 'Table des questions des quiz';
ALTER TABLE reponse COMMENT = 'Table des options de réponse pour chaque question';
ALTER TABLE reponse_quiz COMMENT = 'Table des réponses soumises par les utilisateurs aux quiz';
