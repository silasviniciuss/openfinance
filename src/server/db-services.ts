import { eq, and, desc, asc, lte, gte, sql, or } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  users,
  companies,
  categories,
  transactions,
  recurringTransactions,
  notifications,
  transactionHistory,
} from '../db/schema.ts';

// Seed default categories for a new user
export async function seedDefaultCategories(userUid: string) {
  try {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.userUid, userUid));

    if (existing.length > 0) {
      return existing;
    }

    const defaultExpenseCategories = [
      { name: 'Alimentação', color: '#EF4444', description: 'Supermercado, restaurantes, etc.' },
      { name: 'Combustível', color: '#F97316', description: 'Gasolina, etanol, transporte' },
      { name: 'Internet', color: '#3B82F6', description: 'Banda larga, planos de celular' },
      { name: 'Energia', color: '#EAB308', description: 'Conta de luz' },
      { name: 'Aluguel', color: '#6366F1', description: 'Aluguel de imóvel, condomínio' },
      { name: 'Marketing', color: '#EC4899', description: 'Anúncios, publicidade, design' },
      { name: 'Impostos', color: '#DC2626', description: 'DAS, impostos municipais e federais' },
      { name: 'Funcionários', color: '#8B5CF6', description: 'Salários, encargos, pró-labore' },
      { name: 'Cartão', color: '#A855F7', description: 'Faturas de cartão de crédito' },
      { name: 'Moradia', color: '#14B8A6', description: 'Manutenção, condomínio, IPTU' },
      { name: 'Transporte', color: '#06B6D4', description: 'Uber, passagens, manutenção' },
      { name: 'Outros (Despesas)', color: '#64748B', description: 'Despesas diversas' },
    ];

    const defaultRevenueCategories = [
      { name: 'Serviços', color: '#22C55E', description: 'Prestação de serviços a clientes' },
      { name: 'Vendas', color: '#10B981', description: 'Venda de produtos e mercadorias' },
      { name: 'Salário', color: '#16A34A', description: 'Rendimentos de trabalho fixo' },
      { name: 'Freelance', color: '#15803D', description: 'Trabalhos pontuais e contratos avulsos' },
      { name: 'Investimentos', color: '#059669', description: 'Dividendos, rendimentos e juros' },
      { name: 'Comissões', color: '#047857', description: 'Comissões sobre vendas e indicações' },
      { name: 'Outros (Receitas)', color: '#0D9488', description: 'Receitas extraordinárias' },
    ];

    for (const cat of defaultExpenseCategories) {
      await db.insert(categories).values({
        userUid,
        name: cat.name,
        type: 'despesa',
        description: cat.description,
        color: cat.color,
        isDefault: true,
      });
    }

    for (const cat of defaultRevenueCategories) {
      await db.insert(categories).values({
        userUid,
        name: cat.name,
        type: 'receita',
        description: cat.description,
        color: cat.color,
        isDefault: true,
      });
    }

    return await db.select().from(categories).where(eq(categories.userUid, userUid));
  } catch (error) {
    console.error('Failed to seed default categories:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// Companies
export async function getCompanies(userUid: string, includeArchived = false) {
  try {
    if (includeArchived) {
      return await db
        .select()
        .from(companies)
        .where(eq(companies.userUid, userUid))
        .orderBy(asc(companies.name));
    }
    return await db
      .select()
      .from(companies)
      .where(and(eq(companies.userUid, userUid), eq(companies.isArchived, false)))
      .orderBy(asc(companies.name));
  } catch (error) {
    console.error('getCompanies failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function createCompany(
  userUid: string,
  data: { name: string; cnpj?: string; description?: string; logo?: string; color?: string }
) {
  try {
    const result = await db
      .insert(companies)
      .values({
        userUid,
        name: data.name,
        cnpj: data.cnpj || null,
        description: data.description || null,
        logo: data.logo || null,
        color: data.color || '#1677FF',
        isArchived: false,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('createCompany failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function updateCompany(
  id: number,
  userUid: string,
  data: { name?: string; cnpj?: string; description?: string; logo?: string; color?: string; isArchived?: boolean }
) {
  try {
    const result = await db
      .update(companies)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(companies.id, id), eq(companies.userUid, userUid)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('updateCompany failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function archiveCompany(id: number, userUid: string) {
  try {
    const result = await db
      .update(companies)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(and(eq(companies.id, id), eq(companies.userUid, userUid)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('archiveCompany failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

// Categories
export async function getCategories(userUid: string, type?: 'despesa' | 'receita') {
  try {
    if (type) {
      return await db
        .select()
        .from(categories)
        .where(and(eq(categories.userUid, userUid), eq(categories.type, type)))
        .orderBy(asc(categories.name));
    }
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userUid, userUid))
      .orderBy(asc(categories.name));
  } catch (error) {
    console.error('getCategories failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function createCategory(
  userUid: string,
  data: { name: string; type: 'despesa' | 'receita'; description?: string; color?: string }
) {
  try {
    const result = await db
      .insert(categories)
      .values({
        userUid,
        name: data.name,
        type: data.type,
        description: data.description || null,
        color: data.color || '#1677FF',
        isDefault: false,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('createCategory failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function updateCategory(
  id: number,
  userUid: string,
  data: { name?: string; type?: 'despesa' | 'receita'; description?: string; color?: string }
) {
  try {
    const result = await db
      .update(categories)
      .set(data)
      .where(and(eq(categories.id, id), eq(categories.userUid, userUid)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('updateCategory failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function deleteCategory(id: number, userUid: string) {
  try {
    // Check if category is used by transactions
    const used = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.categoryId, id), eq(transactions.userUid, userUid)))
      .limit(1);

    if (used.length > 0) {
      throw new Error('Não é possível excluir esta categoria pois ela já possui contas vinculadas.');
    }

    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userUid, userUid)))
      .returning();
    return result[0];
  } catch (error: any) {
    console.error('deleteCategory failed:', error);
    throw new Error(error.message || 'Database query failed.', { cause: error });
  }
}

// Transactions
export interface TransactionFilters {
  originType?: 'pessoal' | 'empresa';
  companyId?: number;
  type?: 'pagar' | 'receber';
  categoryId?: number;
  status?: 'pending' | 'overdue' | 'settled' | 'cancelled';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export async function getTransactions(userUid: string, filters?: TransactionFilters) {
  try {
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userUid, userUid));
    const userCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.userUid, userUid));

    const categoryMap = new Map(userCategories.map((c) => [c.id, c]));
    const companyMap = new Map(userCompanies.map((c) => [c.id, c]));

    const rawList = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userUid, userUid))
      .orderBy(asc(transactions.dueDate), desc(transactions.id));

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter and decorate
    const filtered = rawList.filter((tx) => {
      if (filters?.originType && tx.originType !== filters.originType) return false;
      if (filters?.companyId && tx.companyId !== filters.companyId) return false;
      if (filters?.type && tx.type !== filters.type) return false;
      if (filters?.categoryId && tx.categoryId !== filters.categoryId) return false;

      // Status logic:
      // 'overdue' means status === 'pending' && dueDate < today
      // 'pending' means status === 'pending' (if filtering strictly for non-overdue pending, or pending status)
      if (filters?.status) {
        if (filters.status === 'overdue') {
          if (!(tx.status === 'pending' && tx.dueDate < todayStr)) return false;
        } else if (filters.status === 'pending') {
          if (tx.status !== 'pending') return false;
        } else if (filters.status === 'settled') {
          if (tx.status !== 'settled') return false;
        } else if (filters.status === 'cancelled') {
          if (tx.status !== 'cancelled') return false;
        }
      }

      if (filters?.startDate) {
        // Match either dueDate or settlementDate within range
        const compareDate = tx.settlementDate || tx.dueDate;
        if (compareDate < filters.startDate) return false;
      }
      if (filters?.endDate) {
        const compareDate = tx.settlementDate || tx.dueDate;
        if (compareDate > filters.endDate) return false;
      }

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(q);
        const notesMatch = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        const cat = categoryMap.get(tx.categoryId);
        const catMatch = cat ? cat.name.toLowerCase().includes(q) : false;
        const comp = tx.companyId ? companyMap.get(tx.companyId) : null;
        const compMatch = comp ? comp.name.toLowerCase().includes(q) : false;
        if (!descMatch && !notesMatch && !catMatch && !compMatch) return false;
      }

      return true;
    });

    return filtered.map((tx) => ({
      ...tx,
      category: categoryMap.get(tx.categoryId) || null,
      company: tx.companyId ? companyMap.get(tx.companyId) || null : null,
    }));
  } catch (error) {
    console.error('getTransactions failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function createTransaction(
  userUid: string,
  data: {
    originType: 'pessoal' | 'empresa';
    companyId?: number | null;
    categoryId: number;
    type: 'pagar' | 'receber';
    description: string;
    amount: number | string;
    dueDate: string;
    paymentMethod?: string;
    notes?: string;
  }
) {
  try {
    const formattedAmount = Number(data.amount).toFixed(2);
    const result = await db
      .insert(transactions)
      .values({
        userUid,
        originType: data.originType,
        companyId: data.originType === 'empresa' ? data.companyId || null : null,
        categoryId: data.categoryId,
        type: data.type,
        description: data.description,
        amount: formattedAmount,
        dueDate: data.dueDate,
        status: 'pending',
        settlementDate: null,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
      })
      .returning();

    const created = result[0];

    // Record history
    await db.insert(transactionHistory).values({
      transactionId: created.id,
      userUid,
      action: 'created',
      details: `Conta criada como "${data.description}", valor R$ ${formattedAmount}, vencimento ${data.dueDate}`,
    });

    return created;
  } catch (error) {
    console.error('createTransaction failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function updateTransaction(
  id: number,
  userUid: string,
  data: {
    originType?: 'pessoal' | 'empresa';
    companyId?: number | null;
    categoryId?: number;
    type?: 'pagar' | 'receber';
    description?: string;
    amount?: number | string;
    dueDate?: string;
    paymentMethod?: string;
    notes?: string;
  }
) {
  try {
    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userUid, userUid)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error('Conta não encontrada.');
    }

    const current = existing[0];
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.originType !== undefined) {
      updateData.originType = data.originType;
      updateData.companyId = data.originType === 'empresa' ? data.companyId || null : null;
    } else if (data.companyId !== undefined) {
      updateData.companyId = data.companyId;
    }

    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = Number(data.amount).toFixed(2);
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const result = await db
      .update(transactions)
      .set(updateData)
      .where(and(eq(transactions.id, id), eq(transactions.userUid, userUid)))
      .returning();

    const updated = result[0];

    // Log history
    await db.insert(transactionHistory).values({
      transactionId: id,
      userUid,
      action: 'updated',
      details: `Conta editada. Descrição: "${updated.description}", valor: R$ ${updated.amount}, vencimento: ${updated.dueDate}`,
    });

    return updated;
  } catch (error: any) {
    console.error('updateTransaction failed:', error);
    throw new Error(error.message || 'Database query failed.', { cause: error });
  }
}

export async function settleTransaction(
  id: number,
  userUid: string,
  settlementDate: string // Effective date
) {
  try {
    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userUid, userUid)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error('Conta não encontrada.');
    }

    const current = existing[0];
    const result = await db
      .update(transactions)
      .set({
        status: 'settled',
        settlementDate,
        updatedAt: new Date(),
      })
      .where(and(eq(transactions.id, id), eq(transactions.userUid, userUid)))
      .returning();

    const settled = result[0];
    const verb = settled.type === 'pagar' ? 'Pago' : 'Recebido';

    // Record history
    await db.insert(transactionHistory).values({
      transactionId: id,
      userUid,
      action: 'settled',
      details: `Baixa realizada com sucesso. Status: ${verb} em ${settlementDate} (Vencimento original mantido: ${settled.dueDate})`,
    });

    return settled;
  } catch (error: any) {
    console.error('settleTransaction failed:', error);
    throw new Error(error.message || 'Database query failed.', { cause: error });
  }
}

export async function cancelTransaction(id: number, userUid: string) {
  try {
    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userUid, userUid)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error('Conta não encontrada.');
    }

    const result = await db
      .update(transactions)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(and(eq(transactions.id, id), eq(transactions.userUid, userUid)))
      .returning();

    const cancelled = result[0];

    // Log history
    await db.insert(transactionHistory).values({
      transactionId: id,
      userUid,
      action: 'cancelled',
      details: `Conta cancelada pelo usuário. Não constará nos totais financeiros.`,
    });

    return cancelled;
  } catch (error: any) {
    console.error('cancelTransaction failed:', error);
    throw new Error(error.message || 'Database query failed.', { cause: error });
  }
}

export async function reopenTransaction(id: number, userUid: string) {
  try {
    const result = await db
      .update(transactions)
      .set({
        status: 'pending',
        settlementDate: null,
        updatedAt: new Date(),
      })
      .where(and(eq(transactions.id, id), eq(transactions.userUid, userUid)))
      .returning();

    const reopened = result[0];

    // Log history
    await db.insert(transactionHistory).values({
      transactionId: id,
      userUid,
      action: 'reopened',
      details: `Conta reaberta como pendente. Baixa cancelada.`,
    });

    return reopened;
  } catch (error: any) {
    console.error('reopenTransaction failed:', error);
    throw new Error(error.message || 'Database query failed.', { cause: error });
  }
}

export async function getTransactionHistory(transactionId: number, userUid: string) {
  try {
    return await db
      .select()
      .from(transactionHistory)
      .where(and(eq(transactionHistory.transactionId, transactionId), eq(transactionHistory.userUid, userUid)))
      .orderBy(desc(transactionHistory.createdAt));
  } catch (error) {
    console.error('getTransactionHistory failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

// Create Recurring Transactions
export async function createRecurringTransaction(
  userUid: string,
  data: {
    originType: 'pessoal' | 'empresa';
    companyId?: number | null;
    categoryId: number;
    type: 'pagar' | 'receber';
    description: string;
    amount: number | string;
    frequency: 'mensal' | 'semanal' | 'anual';
    totalOccurrences: number;
    startDate: string; // "YYYY-MM-DD"
    paymentMethod?: string;
    notes?: string;
  }
) {
  try {
    const formattedAmount = Number(data.amount).toFixed(2);
    const recResult = await db
      .insert(recurringTransactions)
      .values({
        userUid,
        originType: data.originType,
        companyId: data.originType === 'empresa' ? data.companyId || null : null,
        categoryId: data.categoryId,
        type: data.type,
        description: data.description,
        amount: formattedAmount,
        frequency: data.frequency,
        totalOccurrences: data.totalOccurrences,
        startDate: data.startDate,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
      })
      .returning();

    const recurring = recResult[0];

    // Generate individual transactions for each period
    const start = new Date(data.startDate + 'T12:00:00Z');
    const createdTransactions = [];

    for (let i = 0; i < data.totalOccurrences; i++) {
      const occurrenceDate = new Date(start);
      if (data.frequency === 'mensal') {
        occurrenceDate.setMonth(start.getMonth() + i);
      } else if (data.frequency === 'semanal') {
        occurrenceDate.setDate(start.getDate() + i * 7);
      } else if (data.frequency === 'anual') {
        occurrenceDate.setFullYear(start.getFullYear() + i);
      }

      const dueDateStr = occurrenceDate.toISOString().split('T')[0];
      const desc = `${data.description} (${i + 1}/${data.totalOccurrences})`;

      const txResult = await db
        .insert(transactions)
        .values({
          userUid,
          originType: data.originType,
          companyId: data.originType === 'empresa' ? data.companyId || null : null,
          categoryId: data.categoryId,
          type: data.type,
          description: desc,
          amount: formattedAmount,
          dueDate: dueDateStr,
          status: 'pending',
          paymentMethod: data.paymentMethod || null,
          notes: data.notes || `Recorrência #${recurring.id} (${i + 1}/${data.totalOccurrences})`,
          recurringId: recurring.id,
        })
        .returning();

      const createdTx = txResult[0];

      await db.insert(transactionHistory).values({
        transactionId: createdTx.id,
        userUid,
        action: 'created',
        details: `Conta gerada automaticamente da recorrência #${recurring.id} (${i + 1}/${data.totalOccurrences})`,
      });

      createdTransactions.push(createdTx);
    }

    return { recurring, count: createdTransactions.length };
  } catch (error) {
    console.error('createRecurringTransaction failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

// Dashboard statistics calculation
export async function getDashboardData(
  userUid: string,
  originFilter?: { originType?: 'pessoal' | 'empresa'; companyId?: number }
) {
  try {
    const allTransactions = await getTransactions(userUid, {
      originType: originFilter?.originType,
      companyId: originFilter?.companyId,
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"

    let realizedBalance = 0;
    let monthReceived = 0;
    let monthPaid = 0;
    let projectedToReceive = 0;
    let projectedToPay = 0;

    let plannedRevenueMonth = 0;
    let realizedRevenueMonth = 0;
    let plannedExpenseMonth = 0;
    let realizedExpenseMonth = 0;

    const todayToPay: any[] = [];
    const todayToReceive: any[] = [];
    const overdueTransactions: any[] = [];

    const receiptsByDay: Record<string, number> = {};
    const expensesByDay: Record<string, number> = {};

    for (const tx of allTransactions) {
      if (tx.status === 'cancelled') {
        continue; // PRD 18: Contas canceladas não deverão entrar nos cálculos financeiros.
      }

      const val = parseFloat(tx.amount);

      // Realized calculation (by settlementDate)
      if (tx.status === 'settled' && tx.settlementDate) {
        if (tx.type === 'receber') {
          realizedBalance += val;
          if (tx.settlementDate.startsWith(currentYearMonth)) {
            monthReceived += val;
            realizedRevenueMonth += val;
            receiptsByDay[tx.settlementDate] = (receiptsByDay[tx.settlementDate] || 0) + val;
          }
        } else if (tx.type === 'pagar') {
          realizedBalance -= val;
          if (tx.settlementDate.startsWith(currentYearMonth)) {
            monthPaid += val;
            realizedExpenseMonth += val;
            expensesByDay[tx.settlementDate] = (expensesByDay[tx.settlementDate] || 0) + val;
          }
        }
      }

      // Projected calculation (pending & overdue accounts)
      if (tx.status === 'pending') {
        if (tx.type === 'receber') {
          projectedToReceive += val;
        } else if (tx.type === 'pagar') {
          projectedToPay += val;
        }

        // Today check
        if (tx.dueDate === todayStr) {
          if (tx.type === 'pagar') todayToPay.push(tx);
          else todayToReceive.push(tx);
        }

        // Overdue check
        if (tx.dueDate < todayStr) {
          overdueTransactions.push(tx);
        }
      }

      // Planned for the month (based on dueDate in this month)
      if (tx.dueDate.startsWith(currentYearMonth)) {
        if (tx.type === 'receber') {
          plannedRevenueMonth += val;
        } else if (tx.type === 'pagar') {
          plannedExpenseMonth += val;
        }
      }
    }

    // Format charts for the current month
    const receiptsChart = Object.keys(receiptsByDay)
      .sort()
      .map((date) => {
        const parts = date.split('-');
        return {
          date,
          displayDate: `${parts[2]}/${parts[1]}`,
          amount: receiptsByDay[date],
        };
      });

    const expensesChart = Object.keys(expensesByDay)
      .sort()
      .map((date) => {
        const parts = date.split('-');
        return {
          date,
          displayDate: `${parts[2]}/${parts[1]}`,
          amount: expensesByDay[date],
        };
      });

    return {
      realizedBalance,
      monthReceived,
      monthPaid,
      monthResult: monthReceived - monthPaid,
      projectedToReceive,
      projectedToPay,
      plannedRevenueMonth,
      realizedRevenueMonth,
      plannedExpenseMonth,
      realizedExpenseMonth,
      todayToPay,
      todayToReceive,
      overdueTransactions,
      receiptsChart,
      expensesChart,
    };
  } catch (error) {
    console.error('getDashboardData failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

// Notifications
export async function getNotifications(userUid: string) {
  try {
    // Generate dynamic notifications for today and overdue if not already generated today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const pendingTxs = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.userUid, userUid), eq(transactions.status, 'pending')));

    const overdueCount = pendingTxs.filter((t) => t.dueDate < todayStr).length;
    const dueTodayCount = pendingTxs.filter((t) => t.dueDate === todayStr).length;

    // Check existing notifications
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userUid, userUid))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    return {
      items: existing,
      overdueCount,
      dueTodayCount,
    };
  } catch (error) {
    console.error('getNotifications failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}
