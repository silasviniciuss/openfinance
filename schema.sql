-- =============================================================================
-- SISTEMA FINANCEIRO PESSOAL E EMPRESARIAL
-- Script Completo de Criação no PostgreSQL
-- =============================================================================

CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "uid" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "companies" (
    "id" SERIAL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "color" TEXT DEFAULT '#1677FF',
    "is_archived" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "categories" (
    "id" SERIAL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'despesa' | 'receita'
    "description" TEXT,
    "color" TEXT DEFAULT '#1677FF',
    "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "bank_accounts" (
    "id" SERIAL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_type" TEXT NOT NULL DEFAULT 'corrente',
    "initial_balance" NUMERIC(15, 2) NOT NULL DEFAULT '0.00',
    "current_balance" NUMERIC(15, 2) NOT NULL DEFAULT '0.00',
    "color" TEXT DEFAULT '#1677FF',
    "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "credit_cards" (
    "id" SERIAL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bank_account_id" INTEGER REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
    "credit_limit" NUMERIC(15, 2) NOT NULL DEFAULT '0.00',
    "closing_day" INTEGER NOT NULL,
    "due_day" INTEGER NOT NULL,
    "brand" TEXT DEFAULT 'Mastercard',
    "color" TEXT DEFAULT '#820AD1',
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "transactions" (
    "id" SERIAL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "origin_type" TEXT NOT NULL,
    "company_id" INTEGER REFERENCES "companies"("id") ON DELETE SET NULL,
    "category_id" INTEGER REFERENCES "categories"("id") ON DELETE RESTRICT NOT NULL,
    "bank_account_id" INTEGER REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
    "card_id" INTEGER REFERENCES "credit_cards"("id") ON DELETE SET NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" NUMERIC(15, 2) NOT NULL,
    "due_date" TEXT NOT NULL,
    "settlement_date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "notes" TEXT,
    "recurring_id" INTEGER,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "credit_card_purchases" (
    "id" SERIAL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "card_id" INTEGER REFERENCES "credit_cards"("id") ON DELETE CASCADE NOT NULL,
    "category_id" INTEGER REFERENCES "categories"("id") ON DELETE RESTRICT NOT NULL,
    "company_id" INTEGER REFERENCES "companies"("id") ON DELETE SET NULL,
    "origin_type" TEXT NOT NULL DEFAULT 'pessoal',
    "description" TEXT NOT NULL,
    "amount" NUMERIC(15, 2) NOT NULL,
    "purchase_date" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL DEFAULT 1,
    "total_installments" INTEGER NOT NULL DEFAULT 1,
    "invoice_month" TEXT NOT NULL,
    "invoice_due_date" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "recurring_transactions" (
    "id" SERIAL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "origin_type" TEXT NOT NULL,
    "company_id" INTEGER REFERENCES "companies"("id") ON DELETE SET NULL,
    "category_id" INTEGER REFERENCES "categories"("id") ON DELETE RESTRICT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" NUMERIC(15, 2) NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'mensal',
    "total_occurrences" INTEGER NOT NULL DEFAULT 12,
    "start_date" TEXT NOT NULL,
    "payment_method" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" SERIAL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "transaction_id" INTEGER,
    "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "transaction_history" (
    "id" SERIAL PRIMARY KEY,
    "transaction_id" INTEGER REFERENCES "transactions"("id") ON DELETE CASCADE NOT NULL,
    "user_uid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
);
