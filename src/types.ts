export type TransactionType = 'pagar' | 'receber';
export type OriginType = 'pessoal' | 'empresa';
export type TransactionStatus = 'pending' | 'settled' | 'cancelled';
export type CategoryType = 'despesa' | 'receita';

export interface AuthUser {
  uid: string;
  username: string;
  email: string;
  displayName: string;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name?: string | null;
}

export interface Company {
  id: number;
  userUid: string;
  name: string;
  cnpj?: string | null;
  description?: string | null;
  logo?: string | null;
  color?: string | null;
  isArchived: boolean;
  status?: 'active' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  userUid: string;
  name: string;
  type: CategoryType;
  description?: string | null;
  color?: string | null;
  isDefault: boolean;
  createdAt?: string;
}

export type BankAccountType = 'corrente' | 'poupanca' | 'investimento' | 'carteira' | 'outro';

export interface BankAccount {
  id: number;
  userUid: string;
  name: string;
  accountType: BankAccountType;
  initialBalance: string;
  currentBalance: string;
  color?: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditCard {
  id: number;
  userUid: string;
  name: string;
  originType: OriginType;
  companyId?: number | null;
  bankAccountId?: number | null;
  creditLimit: string;
  closingDay: number; // e.g. 25
  dueDay: number; // e.g. 5
  brand: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Joined relation
  bankAccount?: BankAccount | null;
  company?: Company | null;
  
  // Computed invoice details
  currentInvoiceTotal?: number;
  availableLimit?: number;
}

export interface CreditCardPurchase {
  id: number;
  userUid: string;
  cardId: number;
  categoryId: number;
  companyId?: number | null;
  originType: OriginType;
  description: string;
  amount: string;
  installmentAmount?: string;
  purchaseDate: string; // 'YYYY-MM-DD'
  installmentNumber: number;
  totalInstallments: number;
  invoiceMonth: string; // 'YYYY-MM'
  invoiceDueDate: string; // 'YYYY-MM-DD'
  notes?: string | null;
  createdAt?: string;

  // Joined
  card?: CreditCard | null;
  category?: Category | null;
  company?: Company | null;
}

export interface CreditCardInvoice {
  cardId: number;
  cardName: string;
  brand: string;
  color: string;
  invoiceMonth: string; // 'YYYY-MM'
  closingDate: string; // 'YYYY-MM-DD'
  dueDate: string; // 'YYYY-MM-DD'
  totalAmount: number;
  purchasesCount?: number;
  status: 'aberta' | 'fechada' | 'paga';
  purchases: CreditCardPurchase[];
}

export interface Transaction {
  id: number;
  userUid: string;
  originType: OriginType;
  companyId?: number | null;
  categoryId: number;
  bankAccountId?: number | null;
  cardId?: number | null;
  type: TransactionType;
  description: string;
  amount: string; // Stored as DECIMAL string (e.g. "149.90")
  dueDate: string; // "YYYY-MM-DD"
  settlementDate?: string | null; // "YYYY-MM-DD"
  status: TransactionStatus; // 'pending' | 'settled' | 'cancelled'
  paymentMethod?: string | null;
  notes?: string | null;
  recurringId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  
  // Joined relation details
  company?: Company | null;
  category?: Category | null;
  bankAccount?: BankAccount | null;
  creditCard?: CreditCard | null;
}

export interface TransactionHistoryRecord {
  id: number;
  transactionId: number;
  userUid: string;
  action: 'created' | 'updated' | 'settled' | 'cancelled' | 'reopened' | string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  details?: string;
  createdAt: string;
}

export type TransactionHistoryItem = TransactionHistoryRecord;

export interface RecurringTransaction {
  id: number;
  userUid: string;
  originType: OriginType;
  companyId?: number | null;
  categoryId: number;
  type: TransactionType;
  description: string;
  amount: string;
  frequency: 'mensal' | 'semanal' | 'anual';
  totalOccurrences: number;
  startDate: string;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface AppNotification {
  id: number;
  userUid: string;
  type: 'vencendo_hoje' | 'atrasada' | 'recebimento_hoje' | 'pago' | 'recebido';
  title: string;
  message: string;
  transactionId?: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardOverview {
  realizedBalance: number;
  monthReceived: number;
  monthPaid: number;
  monthResult: number;
  projectedToReceive: number;
  projectedToPay: number;
  plannedRevenueMonth: number;
  realizedRevenueMonth: number;
  plannedExpenseMonth: number;
  realizedExpenseMonth: number;
  todayToPay: Transaction[];
  todayToReceive: Transaction[];
  overdueTransactions: Transaction[];
  receiptsChart: { date: string; displayDate: string; amount: number }[];
  expensesChart: { date: string; displayDate: string; amount: number }[];
}
