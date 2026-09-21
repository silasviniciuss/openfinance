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

export interface Transaction {
  id: number;
  userUid: string;
  originType: OriginType;
  companyId?: number | null;
  categoryId: number;
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
