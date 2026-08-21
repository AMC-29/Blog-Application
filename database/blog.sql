-- BlogSpace database schema
-- Import this in phpMyAdmin (or `mysql -u root -p < blog.sql`) before running the app.

CREATE DATABASE IF NOT EXISTS blogspace
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE blogspace;

-- ---------------------------------------------------------------------
-- user
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100)        NOT NULL,
    email      VARCHAR(150)        NOT NULL,
    password   VARCHAR(255)        NOT NULL,   -- bcrypt hash, never plaintext
    role       ENUM('user','admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- blogPost
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blogPost (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    title      VARCHAR(150) NOT NULL,
    content    TEXT         NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_blogPost_user_id (user_id),
    CONSTRAINT fk_blogPost_user
        FOREIGN KEY (user_id) REFERENCES user(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
