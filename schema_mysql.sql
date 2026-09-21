-- =============================================================================
-- SISTEMA FINANCEIRO PESSOAL E EMPRESARIAL (LOCAL)
-- Script Completo de Criação no MySQL (Localhost / XAMPP / Wamp / Docker / Workbench)
-- =============================================================================

-- 1. Criar o Banco de Dados MySQL
CREATE DATABASE IF NOT EXISTS `financeiro`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `financeiro`;

-- Desativa temporariamente a checagem de chaves estrangeiras para criação limpa
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Tabela de Usuários
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uid` VARCHAR(191) NOT NULL UNIQUE,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de Empresas (Multiemprego / Gestão PJ)
DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_uid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `cnpj` VARCHAR(30) NULL,
    `description` TEXT NULL,
    `logo` TEXT NULL,
    `color` VARCHAR(50) DEFAULT '#1677FF',
    `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_companies_user_uid` (`user_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela de Categorias (Despesa / Receita)
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_uid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL, -- 'despesa' ou 'receita'
    `description` TEXT NULL,
    `color` VARCHAR(50) DEFAULT '#1677FF',
    `is_default` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_categories_user_uid` (`user_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabela de Contas Bancárias (Nubank, Itaú, Bradesco, Carteira, etc.)
DROP TABLE IF EXISTS `bank_accounts`;
CREATE TABLE `bank_accounts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_uid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `account_type` VARCHAR(50) NOT NULL DEFAULT 'corrente', -- 'corrente', 'poupanca', 'investimento', 'carteira'
    `initial_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `current_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `color` VARCHAR(50) DEFAULT '#1677FF',
    `is_default` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_bank_accounts_user_uid` (`user_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabela de Cartões de Crédito (Limite, Dia de Fechamento, Dia de Vencimento)
DROP TABLE IF EXISTS `credit_cards`;
CREATE TABLE `credit_cards` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_uid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `bank_account_id` INT NULL,
    `credit_limit` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `closing_day` INT NOT NULL, -- Dia de fechamento da fatura (ex: 25)
    `due_day` INT NOT NULL, -- Dia de vencimento da fatura (ex: 5)
    `brand` VARCHAR(50) DEFAULT 'Mastercard',
    `color` VARCHAR(50) DEFAULT '#820AD1',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_credit_cards_user_uid` (`user_uid`),
    CONSTRAINT `fk_credit_cards_bank_account` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabela de Contas / Lançamentos Financeiros (Transactions)
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_uid` VARCHAR(191) NOT NULL,
    `origin_type` VARCHAR(50) NOT NULL, -- 'pessoal' ou 'empresa'
    `company_id` INT NULL,
    `category_id` INT NOT NULL,
    `bank_account_id` INT NULL,
    `card_id` INT NULL,
    `type` VARCHAR(50) NOT NULL, -- 'pagar' ou 'receber'
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `due_date` VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD' (Data de Vencimento Original - Preservada)
    `settlement_date` VARCHAR(10) NULL, -- 'YYYY-MM-DD' (Data Efetiva da Baixa/Pagamento)
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'settled', 'cancelled'
    `payment_method` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `recurring_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_transactions_user_uid` (`user_uid`),
    INDEX `idx_transactions_due_date` (`due_date`),
    INDEX `idx_transactions_settlement_date` (`settlement_date`),
    INDEX `idx_transactions_status` (`status`),
    INDEX `idx_transactions_origin_type` (`origin_type`),
    INDEX `idx_transactions_company_id` (`company_id`),
    INDEX `idx_transactions_category_id` (`category_id`),
    INDEX `idx_transactions_bank_account_id` (`bank_account_id`),
    INDEX `idx_transactions_card_id` (`card_id`),
    CONSTRAINT `fk_transactions_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_transactions_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_transactions_bank_account` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_transactions_card` FOREIGN KEY (`card_id`) REFERENCES `credit_cards` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabela de Compras no Cartão de Crédito
DROP TABLE IF EXISTS `credit_card_purchases`;
CREATE TABLE `credit_card_purchases` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_uid` VARCHAR(191) NOT NULL,
    `card_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `company_id` INT NULL,
    `origin_type` VARCHAR(50) NOT NULL DEFAULT 'pessoal',
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `purchase_date` VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD'
    `installment_number` INT NOT NULL DEFAULT 1,
    `total_installments` INT NOT NULL DEFAULT 1,
    `invoice_month` VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    `invoice_due_date` VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD'
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_purchases_user_card` (`user_uid`, `card_id`),
    INDEX `idx_purchases_invoice` (`card_id`, `invoice_month`),
    CONSTRAINT `fk_purchases_card` FOREIGN KEY (`card_id`) REFERENCES `credit_cards` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_purchases_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_purchases_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabela de Contas Recorrentes (Parcelamentos / Repetições)
DROP TABLE IF EXISTS `recurring_transactions`;
CREATE TABLE `recurring_transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_uid` VARCHAR(191) NOT NULL,
    `origin_type` VARCHAR(50) NOT NULL, -- 'pessoal' ou 'empresa'
    `company_id` INT NULL,
    `category_id` INT NOT NULL,
    `type` VARCHAR(50) NOT NULL, -- 'pagar' ou 'receber'
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `frequency` VARCHAR(50) NOT NULL DEFAULT 'mensal', -- 'mensal', 'semanal', 'anual'
    `total_occurrences` INT NOT NULL DEFAULT 12,
    `start_date` VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD'
    `payment_method` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_recurring_user_uid` (`user_uid`),
    CONSTRAINT `fk_recurring_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_recurring_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabela de Notificações
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_uid` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL, -- 'vencendo_hoje', 'atrasada', 'recebimento_hoje', 'pago', 'recebido'
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `transaction_id` INT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notifications_user_read` (`user_uid`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabela de Histórico e Auditoria
DROP TABLE IF EXISTS `transaction_history`;
CREATE TABLE `transaction_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `transaction_id` INT NOT NULL,
    `user_uid` VARCHAR(191) NOT NULL,
    `action` VARCHAR(50) NOT NULL, -- 'created', 'updated', 'settled', 'cancelled', 'reopened'
    `details` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_history_tx` (`transaction_id`),
    INDEX `idx_history_user` (`user_uid`),
    CONSTRAINT `fk_history_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Restaura checagem de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- INICIALIZAÇÃO DE DADOS (SEED DO USUÁRIO SILAS, CONTAS BANCÁRIAS E CARTÃO)
-- =============================================================================

-- Inserir o usuário padrão Silas
INSERT INTO `users` (`uid`, `email`, `name`)
VALUES ('silas', 'silas@financeiro.app', 'Silas')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Categorias de Despesas Padrão
INSERT INTO `categories` (`user_uid`, `name`, `type`, `description`, `color`, `is_default`) VALUES
('silas', 'Alimentação', 'despesa', 'Supermercado, restaurantes, refeições', '#EF4444', 1),
('silas', 'Combustível', 'despesa', 'Gasolina, etanol, transporte', '#F97316', 1),
('silas', 'Internet', 'despesa', 'Banda larga, planos de celular', '#3B82F6', 1),
('silas', 'Energia', 'despesa', 'Conta de luz', '#EAB308', 1),
('silas', 'Aluguel', 'despesa', 'Aluguel de imóvel, condomínio', '#6366F1', 1),
('silas', 'Marketing', 'despesa', 'Anúncios, publicidade, design', '#EC4899', 1),
('silas', 'Impostos', 'despesa', 'DAS, tributos municipais e federais', '#DC2626', 1),
('silas', 'Funcionários', 'despesa', 'Salários, encargos, pró-labore', '#8B5CF6', 1),
('silas', 'Cartão', 'despesa', 'Faturas de cartão de crédito', '#A855F7', 1),
('silas', 'Moradia', 'despesa', 'Manutenção residencial, condomínio', '#14B8A6', 1),
('silas', 'Transporte', 'despesa', 'Uber, passagens, manutenção veicular', '#06B6D4', 1),
('silas', 'Outros (Despesas)', 'despesa', 'Despesas diversas e extraordinárias', '#64748B', 1);

-- Categorias de Receitas Padrão
INSERT INTO `categories` (`user_uid`, `name`, `type`, `description`, `color`, `is_default`) VALUES
('silas', 'Serviços', 'receita', 'Prestação de serviços a clientes', '#22C55E', 1),
('silas', 'Vendas', 'receita', 'Venda de produtos e mercadorias', '#10B981', 1),
('silas', 'Salário', 'receita', 'Rendimentos de trabalho fixo', '#16A34A', 1),
('silas', 'Freelance', 'receita', 'Trabalhos pontuais e contratos avulsos', '#15803D', 1),
('silas', 'Investimentos', 'receita', 'Dividendos, rendimentos e juros', '#059669', 1),
('silas', 'Comissões', 'receita', 'Comissões sobre vendas e indicações', '#047857', 1),
('silas', 'Outros (Receitas)', 'receita', 'Receitas extraordinárias', '#0D9488', 1);

-- Contas Bancárias Iniciais
INSERT INTO `bank_accounts` (`user_uid`, `name`, `account_type`, `initial_balance`, `current_balance`, `color`, `is_default`) VALUES
('silas', 'Nubank', 'corrente', 0.00, 0.00, '#820AD1', 1),
('silas', 'Banco Itaú', 'corrente', 0.00, 0.00, '#EC7000', 0),
('silas', 'Dinheiro / Carteira', 'carteira', 0.00, 0.00, '#10B981', 0);

-- Cartão de Crédito Inicial (Fechamento dia 25, Vencimento dia 05)
INSERT INTO `credit_cards` (`user_uid`, `name`, `bank_account_id`, `credit_limit`, `closing_day`, `due_day`, `brand`, `color`) VALUES
('silas', 'Nubank Ultravioleta', 1, 5000.00, 25, 5, 'Mastercard', '#820AD1');
