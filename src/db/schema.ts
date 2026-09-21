import { pgTable, serial, text, timestamp, boolean, numeric, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table matching Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Companies
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  name: text('name').notNull(),
  cnpj: text('cnpj'),
  description: text('description'),
  logo: text('logo'),
  color: text('color').default('#1677FF'),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Categories (Despesa or Receita)
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'despesa' | 'receita'
  description: text('description'),
  color: text('color').default('#1677FF'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Transactions (Contas)
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  originType: text('origin_type').notNull(), // 'pessoal' | 'empresa'
  companyId: integer('company_id').references(() => companies.id),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  type: text('type').notNull(), // 'pagar' | 'receber'
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  dueDate: text('due_date').notNull(), // 'YYYY-MM-DD'
  settlementDate: text('settlement_date'), // 'YYYY-MM-DD' when paid/received
  status: text('status').notNull().default('pending'), // 'pending' | 'settled' | 'cancelled'
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  recurringId: integer('recurring_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Recurring Transactions
export const recurringTransactions = pgTable('recurring_transactions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  originType: text('origin_type').notNull(), // 'pessoal' | 'empresa'
  companyId: integer('company_id').references(() => companies.id),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  type: text('type').notNull(), // 'pagar' | 'receber'
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  frequency: text('frequency').notNull().default('mensal'), // 'mensal' | 'semanal' | 'anual'
  totalOccurrences: integer('total_occurrences').notNull().default(12),
  startDate: text('start_date').notNull(),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  type: text('type').notNull(), // 'vencendo_hoje' | 'atrasada' | 'recebimento_hoje' | 'pago' | 'recebido'
  title: text('title').notNull(),
  message: text('message').notNull(),
  transactionId: integer('transaction_id'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Transaction History
export const transactionHistory = pgTable('transaction_history', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  action: text('action').notNull(), // 'created' | 'updated' | 'settled' | 'cancelled' | 'reopened'
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  company: one(companies, {
    fields: [transactions.companyId],
    references: [companies.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  history: many(transactionHistory),
}));

export const transactionHistoryRelations = relations(transactionHistory, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionHistory.transactionId],
    references: [transactions.id],
  }),
}));
