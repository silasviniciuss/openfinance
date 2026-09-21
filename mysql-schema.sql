-- ==============================================================================
-- SISTEMA DE GESTÃO FINANCEIRA (PESSOAL & EMPRESAS)
-- SCRIPT SQL COMPLETO PARA MYSQL LOCAL (Workbench, phpMyAdmin, terminal, etc.)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `finance_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `finance_db`;

-- Desabilita checagem de chaves estrangeiras para permitir recriação limpa se necessário
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `transaction_history`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `credit_card_purchases`;
DROP TABLE IF EXISTS `recurring_transactions`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `credit_cards`;
DROP TABLE IF EXISTS `bank_accounts`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `companies`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. TABELA DE USUÁRIOS
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uid` VARCHAR(128) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA DE EMPRESAS (Origem PJ)
CREATE TABLE `companies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `cnpj` VARCHAR(30) NULL,
  `description` TEXT NULL,
  `logo` TEXT NULL,
  `color` VARCHAR(20) DEFAULT '#1677FF',
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_companies_user` (`user_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA DE CATEGORIAS (Receita ou Despesa)
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(128) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('despesa', 'receita') NOT NULL,
  `description` TEXT NULL,
  `color` VARCHAR(20) DEFAULT '#1677FF',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_categories_user` (`user_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELA DE CONTAS BANCÁRIAS (Saldo bancário e baixas)
CREATE TABLE `bank_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(128) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `account_type` VARCHAR(50) NOT NULL DEFAULT 'corrente',
  `initial_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `current_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `color` VARCHAR(20) DEFAULT '#1677FF',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_bank_accounts_user` (`user_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELA DE CARTÕES DE CRÉDITO
CREATE TABLE `credit_cards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(128) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `origin_type` ENUM('pessoal', 'empresa') NOT NULL DEFAULT 'pessoal',
  `company_id` INT NULL,
  `bank_account_id` INT NULL,
  `credit_limit` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `closing_day` INT NOT NULL,
  `due_day` INT NOT NULL,
  `brand` VARCHAR(50) DEFAULT 'Mastercard',
  `color` VARCHAR(20) DEFAULT '#820AD1',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_credit_cards_user` (`user_uid`),
  INDEX `idx_credit_cards_company` (`company_id`),
  CONSTRAINT `fk_credit_cards_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_credit_cards_bank` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABELA DE CONTAS / TRANSAÇÕES (A Pagar e A Receber)
CREATE TABLE `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(128) NOT NULL,
  `origin_type` ENUM('pessoal', 'empresa') NOT NULL DEFAULT 'pessoal',
  `company_id` INT NULL,
  `category_id` INT NOT NULL,
  `bank_account_id` INT NULL,
  `card_id` INT NULL,
  `type` ENUM('pagar', 'receber') NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `due_date` DATE NOT NULL,
  `settlement_date` DATE NULL,
  `status` ENUM('pending', 'settled', 'cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `recurring_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_transactions_user` (`user_uid`),
  INDEX `idx_transactions_due` (`due_date`),
  INDEX `idx_transactions_status` (`status`),
  CONSTRAINT `fk_transactions_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transactions_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transactions_bank` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transactions_card` FOREIGN KEY (`card_id`) REFERENCES `credit_cards` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABELA DE COMPRAS FEITAS NO CARTÃO DE CRÉDITO
CREATE TABLE `credit_card_purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(128) NOT NULL,
  `card_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `company_id` INT NULL,
  `origin_type` ENUM('pessoal', 'empresa') NOT NULL DEFAULT 'pessoal',
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `purchase_date` DATE NOT NULL,
  `installment_number` INT NOT NULL DEFAULT 1,
  `total_installments` INT NOT NULL DEFAULT 1,
  `invoice_month` VARCHAR(7) NOT NULL, -- Ex: '2026-10'
  `invoice_due_date` DATE NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cc_purchases_card` (`card_id`),
  INDEX `idx_cc_purchases_month` (`invoice_month`),
  CONSTRAINT `fk_purchases_card` FOREIGN KEY (`card_id`) REFERENCES `credit_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchases_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_purchases_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABELA DE RECORRÊNCIA
CREATE TABLE `recurring_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(128) NOT NULL,
  `origin_type` ENUM('pessoal', 'empresa') NOT NULL DEFAULT 'pessoal',
  `company_id` INT NULL,
  `category_id` INT NOT NULL,
  `type` ENUM('pagar', 'receber') NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `frequency` VARCHAR(50) NOT NULL DEFAULT 'mensal',
  `total_occurrences` INT NOT NULL DEFAULT 12,
  `start_date` DATE NOT NULL,
  `payment_method` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rec_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rec_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABELA DE NOTIFICAÇÕES (Vencendo hoje, Atrasadas, etc.)
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(128) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `transaction_id` INT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notifications_user` (`user_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TABELA DE HISTÓRICO DE AUDITORIA DE TRANSAÇÕES
CREATE TABLE `transaction_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` INT NOT NULL,
  `user_uid` VARCHAR(128) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `details` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_history_tx` (`transaction_id`),
  CONSTRAINT `fk_history_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DADOS INICIAIS / SEED (Usuário Silas, Contas Bancárias, Cartões e Categorias)
-- ==============================================================================

-- Cria usuário padrão Silas
INSERT INTO `users` (`uid`, `email`, `name`) 
VALUES ('silas_user_uid', 'silas@local.app', 'Silas');

-- Cria Contas Bancárias Iniciais
INSERT INTO `bank_accounts` (`id`, `user_uid`, `name`, `account_type`, `initial_balance`, `current_balance`, `color`, `is_default`)
VALUES
  (1, 'silas_user_uid', 'Nubank', 'corrente', 2500.00, 2500.00, '#820AD1', 1),
  (2, 'silas_user_uid', 'Bradesco', 'corrente', 4800.00, 4800.00, '#CC092F', 0),
  (3, 'silas_user_uid', 'Carteira Dinheiro', 'carteira', 350.00, 350.00, '#22C55E', 0);

-- Cria Cartão de Crédito Inicial (Fechamento dia 20, Vencimento dia 27)
INSERT INTO `credit_cards` (`id`, `user_uid`, `name`, `bank_account_id`, `credit_limit`, `closing_day`, `due_day`, `brand`, `color`)
VALUES
  (1, 'silas_user_uid', 'Nubank Mastercard', 1, 8000.00, 20, 27, 'Mastercard', '#820AD1');

-- Cria Categorias Padrão
INSERT INTO `categories` (`user_uid`, `name`, `type`, `color`, `is_default`) VALUES
  ('silas_user_uid', 'Alimentação', 'despesa', '#EF4444', 1),
  ('silas_user_uid', 'Moradia / Aluguel', 'despesa', '#F59E0B', 1),
  ('silas_user_uid', 'Transporte & Combustível', 'despesa', '#3B82F6', 1),
  ('silas_user_uid', 'Saúde & Farmácia', 'despesa', '#EC4899', 1),
  ('silas_user_uid', 'Educação', 'despesa', '#8B5CF6', 1),
  ('silas_user_uid', 'Lazer & Streaming', 'despesa', '#10B981', 1),
  ('silas_user_uid', 'Salário / Pró-labore', 'receita', '#22C55E', 1),
  ('silas_user_uid', 'Serviços Prestados', 'receita', '#14B8A6', 1),
  ('silas_user_uid', 'Rendimentos & Investimentos', 'receita', '#06B6D4', 1);

-- Empresa modelo
INSERT INTO `companies` (`id`, `user_uid`, `name`, `cnpj`, `description`, `color`) 
VALUES (1, 'silas_user_uid', 'Minha Empresa Principal', '12.345.678/0001-90', 'Empresa de prestação de serviços', '#1677FF');
