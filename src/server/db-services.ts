import { eq, and, desc, asc, lte, gte, sql, or } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  users,
  companies,
  categories,
  bankAccounts,
  creditCards,
  creditCardPurchases,
  transactions,
  recurringTransactions,
  notifications,
  transactionHistory,
} from '../db/schema.ts';

// Seed default bank accounts and credit cards for a new user
export async function seedDefaultBankAccountsAndCards(userUid: string) {
  try {
    const existingAccounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userUid, userUid));

    let defaultAccountId: number | null = null;

    if (existingAccounts.length === 0) {
      const nubank = await db
        .insert(bankAccounts)
        .values({
          userUid,
          name: 'Nubank',
          accountType: 'corrente',
          initialBalance: '0.00',
          currentBalance: '0.00',
          color: '#820AD1',
          isDefault: true,
        })
        .returning();

      defaultAccountId = nubank[0].id;

      await db.insert(bankAccounts).values([
        {
          userUid,
          name: 'Banco Itaú',
          accountType: 'corrente',
          initialBalance: '0.00',
          currentBalance: '0.00',
          color: '#EC7000',
          isDefault: false,
        },
        {
          userUid,
          name: 'Dinheiro / Carteira',
          accountType: 'carteira',
          initialBalance: '0.00',
          currentBalance: '0.00',
          color: '#10B981',
          isDefault: false,
        },
      ]);
    } else {
      const def = existingAccounts.find((a) => a.isDefault) || existingAccounts[0];
      defaultAccountId = def ? def.id : null;
    }

    const existingCards = await db
      .select()
      .from(creditCards)
      .where(eq(creditCards.userUid, userUid));

    if (existingCards.length === 0) {
      await db.insert(creditCards).values({
        userUid,
        name: 'Nubank Mastercard',
        bankAccountId: defaultAccountId,
        creditLimit: '5000.00',
        closingDay: 25,
        dueDay: 5,
        brand: 'Mastercard',
        color: '#820AD1',
      });
    }
  } catch (error) {
    console.error('Failed to seed default bank accounts and cards:', error);
  }
}

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

// ==========================================
// BANK ACCOUNTS (Contas Bancárias)
// ==========================================
export async function getBankAccounts(userUid: string) {
  try {
    return await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userUid, userUid))
      .orderBy(desc(bankAccounts.isDefault), asc(bankAccounts.name));
  } catch (error) {
    console.error('getBankAccounts failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function createBankAccount(
  userUid: string,
  data: {
    name: string;
    accountType?: string;
    initialBalance?: number | string;
    color?: string;
    isDefault?: boolean;
  }
) {
  try {
    const initBal = Number(data.initialBalance || 0).toFixed(2);
    if (data.isDefault) {
      await db
        .update(bankAccounts)
        .set({ isDefault: false })
        .where(eq(bankAccounts.userUid, userUid));
    }
    const result = await db
      .insert(bankAccounts)
      .values({
        userUid,
        name: data.name.trim(),
        accountType: data.accountType || 'corrente',
        initialBalance: initBal,
        currentBalance: initBal,
        color: data.color || '#1677FF',
        isDefault: !!data.isDefault,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('createBankAccount failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function updateBankAccount(
  id: number,
  userUid: string,
  data: Partial<{
    name: string;
    accountType: string;
    currentBalance: string | number;
    initialBalance: string | number;
    color: string;
    isDefault: boolean;
  }>
) {
  try {
    if (data.isDefault) {
      await db
        .update(bankAccounts)
        .set({ isDefault: false })
        .where(eq(bankAccounts.userUid, userUid));
    }
    const updatePayload: any = { updatedAt: new Date() };
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.accountType !== undefined) updatePayload.accountType = data.accountType;
    if (data.initialBalance !== undefined) updatePayload.initialBalance = Number(data.initialBalance).toFixed(2);
    if (data.currentBalance !== undefined) updatePayload.currentBalance = Number(data.currentBalance).toFixed(2);
    if (data.color !== undefined) updatePayload.color = data.color;
    if (data.isDefault !== undefined) updatePayload.isDefault = data.isDefault;

    const result = await db
      .update(bankAccounts)
      .set(updatePayload)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userUid, userUid)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('updateBankAccount failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function deleteBankAccount(id: number, userUid: string) {
  try {
    const used = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.bankAccountId, id), eq(transactions.userUid, userUid)))
      .limit(1);
    if (used.length > 0) {
      throw new Error('Esta conta bancária possui movimentações registradas e não pode ser excluída.');
    }
    const result = await db
      .delete(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userUid, userUid)))
      .returning();
    return result[0];
  } catch (error: any) {
    console.error('deleteBankAccount failed:', error);
    throw new Error(error.message || 'Database query failed.', { cause: error });
  }
}

// ==========================================
// CREDIT CARDS & INVOICES (Cartões de Crédito)
// ==========================================
export function calculateInvoiceForDate(
  card: { closingDay: number; dueDay: number },
  purchaseDateStr: string, // 'YYYY-MM-DD'
  installmentOffsetMonths: number = 0
) {
  const parts = purchaseDateStr.split('-').map((p) => parseInt(p, 10));
  const pYear = parts[0];
  const pMonth = parts[1]; // 1 to 12
  const pDay = parts[2];

  let cycleYear = pYear;
  let cycleMonth = pMonth;
  // If day is strictly greater than card.closingDay, it rolls over to next billing cycle
  if (pDay > card.closingDay) {
    cycleMonth += 1;
    if (cycleMonth > 12) {
      cycleMonth = 1;
      cycleYear += 1;
    }
  }

  // Add installment offset
  cycleMonth += installmentOffsetMonths;
  while (cycleMonth > 12) {
    cycleMonth -= 12;
    cycleYear += 1;
  }

  const invoiceMonth = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}`;

  const maxDaysInCycleMonth = new Date(cycleYear, cycleMonth, 0).getDate();
  const actualClosingDay = Math.min(card.closingDay, maxDaysInCycleMonth);
  const closingDate = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}-${String(actualClosingDay).padStart(2, '0')}`;

  let dueYear = cycleYear;
  let dueMonth = cycleMonth;
  if (card.dueDay <= card.closingDay) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }

  const maxDaysInDueMonth = new Date(dueYear, dueMonth, 0).getDate();
  const actualDueDay = Math.min(card.dueDay, maxDaysInDueMonth);
  const invoiceDueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

  return {
    invoiceMonth,
    closingDate,
    invoiceDueDate,
  };
}

export async function getCreditCards(userUid: string) {
  try {
    const cards = await db
      .select()
      .from(creditCards)
      .where(eq(creditCards.userUid, userUid))
      .orderBy(asc(creditCards.name));

    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userUid, userUid));
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const userCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.userUid, userUid));
    const companyMap = new Map(userCompanies.map((c) => [c.id, c]));

    const purchases = await db
      .select()
      .from(creditCardPurchases)
      .where(eq(creditCardPurchases.userUid, userUid));

    const todayStr = new Date().toISOString().split('T')[0];

    return cards.map((card) => {
      const currentInvoiceCalc = calculateInvoiceForDate(card, todayStr, 0);
      const currentInvoiceMonth = currentInvoiceCalc.invoiceMonth;

      const cardPurchases = purchases.filter((p) => p.cardId === card.id);
      const currentInvoiceTotal = cardPurchases
        .filter((p) => p.invoiceMonth === currentInvoiceMonth)
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const totalActivePurchases = cardPurchases.reduce((sum, p) => sum + Number(p.amount), 0);
      const limit = Number(card.creditLimit);
      const availableLimit = Math.max(0, limit - totalActivePurchases);

      return {
        ...card,
        bankAccount: card.bankAccountId ? accountMap.get(card.bankAccountId) || null : null,
        company: card.companyId ? companyMap.get(card.companyId) || null : null,
        currentInvoiceMonth,
        currentInvoiceClosingDate: currentInvoiceCalc.closingDate,
        currentInvoiceDueDate: currentInvoiceCalc.invoiceDueDate,
        currentInvoiceTotal: Number(currentInvoiceTotal.toFixed(2)),
        availableLimit: Number(availableLimit.toFixed(2)),
      };
    });
  } catch (error) {
    console.error('getCreditCards failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function createCreditCard(
  userUid: string,
  data: {
    name: string;
    originType?: 'pessoal' | 'empresa';
    companyId?: number | null;
    bankAccountId?: number | null;
    creditLimit: number | string;
    closingDay: number;
    dueDay: number;
    brand?: string;
    color?: string;
  }
) {
  try {
    const originType = data.originType || 'pessoal';
    const companyId = originType === 'empresa' && data.companyId ? data.companyId : null;

    const result = await db
      .insert(creditCards)
      .values({
        userUid,
        name: data.name.trim(),
        originType,
        companyId,
        bankAccountId: data.bankAccountId || null,
        creditLimit: Number(data.creditLimit).toFixed(2),
        closingDay: Number(data.closingDay),
        dueDay: Number(data.dueDay),
        brand: data.brand || 'Mastercard',
        color: data.color || '#820AD1',
      })
      .returning();

    await syncCreditCardInvoicesToTransactions(userUid);
    return result[0];
  } catch (error) {
    console.error('createCreditCard failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function updateCreditCard(
  id: number,
  userUid: string,
  data: Partial<{
    name: string;
    originType: 'pessoal' | 'empresa';
    companyId: number | null;
    bankAccountId: number | null;
    creditLimit: number | string;
    closingDay: number;
    dueDay: number;
    brand: string;
    color: string;
  }>
) {
  try {
    const updatePayload: any = { updatedAt: new Date() };
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.originType !== undefined) {
      updatePayload.originType = data.originType;
      updatePayload.companyId = data.originType === 'empresa' ? data.companyId || null : null;
    } else if (data.companyId !== undefined) {
      updatePayload.companyId = data.companyId;
    }
    if (data.bankAccountId !== undefined) updatePayload.bankAccountId = data.bankAccountId;
    if (data.creditLimit !== undefined) updatePayload.creditLimit = Number(data.creditLimit).toFixed(2);
    if (data.closingDay !== undefined) updatePayload.closingDay = Number(data.closingDay);
    if (data.dueDay !== undefined) updatePayload.dueDay = Number(data.dueDay);
    if (data.brand !== undefined) updatePayload.brand = data.brand;
    if (data.color !== undefined) updatePayload.color = data.color;

    const result = await db
      .update(creditCards)
      .set(updatePayload)
      .where(and(eq(creditCards.id, id), eq(creditCards.userUid, userUid)))
      .returning();

    await syncCreditCardInvoicesToTransactions(userUid);
    return result[0];
  } catch (error) {
    console.error('updateCreditCard failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function deleteCreditCard(id: number, userUid: string) {
  try {
    const result = await db
      .delete(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.userUid, userUid)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('deleteCreditCard failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

// Credit Card Purchases
export async function getCreditCardPurchases(
  userUid: string,
  filters?: { cardId?: number; invoiceMonth?: string }
) {
  try {
    const rawList = await db
      .select()
      .from(creditCardPurchases)
      .where(eq(creditCardPurchases.userUid, userUid))
      .orderBy(desc(creditCardPurchases.purchaseDate), desc(creditCardPurchases.id));

    const userCategories = await db.select().from(categories).where(eq(categories.userUid, userUid));
    const userCompanies = await db.select().from(companies).where(eq(companies.userUid, userUid));
    const userCards = await db.select().from(creditCards).where(eq(creditCards.userUid, userUid));

    const catMap = new Map(userCategories.map((c) => [c.id, c]));
    const compMap = new Map(userCompanies.map((c) => [c.id, c]));
    const cardMap = new Map(userCards.map((c) => [c.id, c]));

    const filtered = rawList.filter((p) => {
      if (filters?.cardId && p.cardId !== filters.cardId) return false;
      if (filters?.invoiceMonth && p.invoiceMonth !== filters.invoiceMonth) return false;
      return true;
    });

    return filtered.map((p) => ({
      ...p,
      category: catMap.get(p.categoryId) || null,
      company: p.companyId ? compMap.get(p.companyId) || null : null,
      card: cardMap.get(p.cardId) || null,
    }));
  } catch (error) {
    console.error('getCreditCardPurchases failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function createCreditCardPurchase(
  userUid: string,
  data: {
    cardId: number;
    categoryId: number;
    companyId?: number | null;
    originType?: 'pessoal' | 'empresa';
    description: string;
    amount: number | string;
    purchaseDate: string; // 'YYYY-MM-DD'
    totalInstallments?: number;
    notes?: string;
  }
) {
  try {
    const cardRes = await db
      .select()
      .from(creditCards)
      .where(and(eq(creditCards.id, data.cardId), eq(creditCards.userUid, userUid)))
      .limit(1);

    if (cardRes.length === 0) {
      throw new Error('Cartão de crédito não encontrado.');
    }
    const card = cardRes[0];

    const totalInstallments = Math.max(1, Number(data.totalInstallments || 1));
    const totalAmount = Number(data.amount);
    const installmentAmount = (totalAmount / totalInstallments).toFixed(2);

    const cardOrigin = (card.originType || 'pessoal') as 'pessoal' | 'empresa';
    const cardCompany = card.originType === 'empresa' ? card.companyId || null : null;
    const resolvedOrigin = (data.originType || cardOrigin) as 'pessoal' | 'empresa';
    const resolvedCompany = resolvedOrigin === 'empresa' ? (data.companyId || cardCompany) : null;

    const createdPurchases = [];

    for (let i = 0; i < totalInstallments; i++) {
      const cycle = calculateInvoiceForDate(card, data.purchaseDate, i);
      const desc =
        totalInstallments > 1
          ? `${data.description.trim()} (${i + 1}/${totalInstallments})`
          : data.description.trim();

      const res = await db
        .insert(creditCardPurchases)
        .values({
          userUid,
          cardId: data.cardId,
          categoryId: data.categoryId,
          companyId: resolvedCompany,
          originType: resolvedOrigin,
          description: desc,
          amount: installmentAmount,
          purchaseDate: data.purchaseDate,
          installmentNumber: i + 1,
          totalInstallments,
          invoiceMonth: cycle.invoiceMonth,
          invoiceDueDate: cycle.invoiceDueDate,
          notes: data.notes || null,
        })
        .returning();

      createdPurchases.push(res[0]);
    }

    await syncCreditCardInvoicesToTransactions(userUid);

    return createdPurchases;
  } catch (error) {
    console.error('createCreditCardPurchase failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function deleteCreditCardPurchase(id: number, userUid: string) {
  try {
    const res = await db
      .delete(creditCardPurchases)
      .where(and(eq(creditCardPurchases.id, id), eq(creditCardPurchases.userUid, userUid)))
      .returning();

    await syncCreditCardInvoicesToTransactions(userUid);
    return res[0];
  } catch (error) {
    console.error('deleteCreditCardPurchase failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

// Sincroniza faturas de cartão com a tabela de transactions (contas a pagar / contas pagas)
export async function syncCreditCardInvoicesToTransactions(userUid: string) {
  try {
    const userCards = await db
      .select()
      .from(creditCards)
      .where(eq(creditCards.userUid, userUid));

    if (userCards.length === 0) return;

    // Buscar ou criar categoria para cartão
    const userCats = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userUid, userUid), eq(categories.type, 'despesa')));

    let cardCat = userCats.find(
      (c) =>
        c.name.toLowerCase().includes('cartão') ||
        c.name.toLowerCase().includes('cartao') ||
        c.name.toLowerCase().includes('fatura')
    );

    if (!cardCat) {
      const created = await db
        .insert(categories)
        .values({
          userUid,
          name: 'Cartão de Crédito',
          type: 'despesa',
          description: 'Faturas e despesas de cartão de crédito',
          color: '#820AD1',
          isDefault: true,
        })
        .returning();
      cardCat = created[0];
    }

    const cardCategoryId = cardCat ? cardCat.id : (userCats[0]?.id || 1);

    const allPurchases = await db
      .select()
      .from(creditCardPurchases)
      .where(eq(creditCardPurchases.userUid, userUid));

    const allExistingTx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userUid, userUid));

    for (const card of userCards) {
      const cardPurchases = allPurchases.filter((p) => p.cardId === card.id);
      const monthMap = new Map<string, typeof cardPurchases>();
      for (const p of cardPurchases) {
        const list = monthMap.get(p.invoiceMonth) || [];
        list.push(p);
        monthMap.set(p.invoiceMonth, list);
      }

      const existingCardTxs = allExistingTx.filter((t) => t.cardId === card.id);

      for (const [invoiceMonth, pList] of monthMap.entries()) {
        const totalAmount = pList.reduce((sum, p) => sum + Number(p.amount), 0);
        const formattedAmount = totalAmount.toFixed(2);
        const firstPurchaseDueDate = pList[0]?.invoiceDueDate;

        // Calcular vencimento da fatura
        const [y, m] = invoiceMonth.split('-').map((v) => parseInt(v, 10));
        let dueYear = y;
        let dueMonth = m;
        if (card.dueDay <= card.closingDay) {
          dueMonth += 1;
          if (dueMonth > 12) {
            dueMonth = 1;
            dueYear += 1;
          }
        }
        const maxDaysInDueMonth = new Date(dueYear, dueMonth, 0).getDate();
        const actualDueDay = Math.min(card.dueDay, maxDaysInDueMonth);
        const calculatedDueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;
        const dueDate = firstPurchaseDueDate || calculatedDueDate;

        const desc = `Fatura Cartão ${card.name} - ${invoiceMonth}`;
        const notes = `Fatura referente ao ciclo ${invoiceMonth} (${pList.length} compra${pList.length > 1 ? 's' : ''} somada${pList.length > 1 ? 's' : ''}).`;

        const originType = (card.originType || 'pessoal') as 'pessoal' | 'empresa';
        const companyId = originType === 'empresa' ? card.companyId || null : null;

        const invoiceTx = existingCardTxs.find((t) => t.description.includes(invoiceMonth));

        if (totalAmount > 0) {
          if (!invoiceTx) {
            await db.insert(transactions).values({
              userUid,
              originType,
              companyId,
              categoryId: cardCategoryId,
              cardId: card.id,
              bankAccountId: card.bankAccountId || null,
              type: 'pagar',
              description: desc,
              amount: formattedAmount,
              dueDate,
              status: 'pending',
              notes,
            });
          } else if (invoiceTx.status === 'pending') {
            const needsUpdate =
              invoiceTx.amount !== formattedAmount ||
              invoiceTx.dueDate !== dueDate ||
              invoiceTx.originType !== originType ||
              invoiceTx.companyId !== companyId ||
              invoiceTx.description !== desc;

            if (needsUpdate) {
              await db
                .update(transactions)
                .set({
                  amount: formattedAmount,
                  dueDate,
                  originType,
                  companyId,
                  description: desc,
                  notes,
                  updatedAt: new Date(),
                })
                .where(eq(transactions.id, invoiceTx.id));
            }
          }
        } else if (invoiceTx && invoiceTx.status === 'pending' && totalAmount <= 0) {
          await db.delete(transactions).where(eq(transactions.id, invoiceTx.id));
        }
      }
    }
  } catch (error) {
    console.error('syncCreditCardInvoicesToTransactions failed:', error);
  }
}

export async function getCreditCardInvoices(userUid: string, cardId: number) {
  try {
    const cardRes = await db
      .select()
      .from(creditCards)
      .where(and(eq(creditCards.id, cardId), eq(creditCards.userUid, userUid)))
      .limit(1);

    if (cardRes.length === 0) {
      throw new Error('Cartão de crédito não encontrado.');
    }
    const card = cardRes[0];

    const purchases = await getCreditCardPurchases(userUid, { cardId });

    const monthMap = new Map<string, typeof purchases>();
    for (const p of purchases) {
      const list = monthMap.get(p.invoiceMonth) || [];
      list.push(p);
      monthMap.set(p.invoiceMonth, list);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    for (let offset = -2; offset <= 3; offset++) {
      const cycle = calculateInvoiceForDate(card, todayStr, offset);
      if (!monthMap.has(cycle.invoiceMonth)) {
        monthMap.set(cycle.invoiceMonth, []);
      }
    }

    const existingTx = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.cardId, cardId), eq(transactions.userUid, userUid)));

    const invoices = Array.from(monthMap.entries()).map(([invoiceMonth, pList]) => {
      const [y, m] = invoiceMonth.split('-').map((v) => parseInt(v, 10));
      const maxDaysInCycleMonth = new Date(y, m, 0).getDate();
      const actualClosingDay = Math.min(card.closingDay, maxDaysInCycleMonth);
      const closingDate = `${y}-${String(m).padStart(2, '0')}-${String(actualClosingDay).padStart(2, '0')}`;

      let dueYear = y;
      let dueMonth = m;
      if (card.dueDay <= card.closingDay) {
        dueMonth += 1;
        if (dueMonth > 12) {
          dueMonth = 1;
          dueYear += 1;
        }
      }
      const maxDaysInDueMonth = new Date(dueYear, dueMonth, 0).getDate();
      const actualDueDay = Math.min(card.dueDay, maxDaysInDueMonth);
      const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

      const totalAmount = pList.reduce((sum, p) => sum + Number(p.amount), 0);

      const invoiceTx = existingTx.find(
        (t) => t.description.includes(invoiceMonth)
      );
      let status: 'aberta' | 'fechada' | 'paga' = 'aberta';
      if (invoiceTx && invoiceTx.status === 'settled') {
        status = 'paga';
      } else if (todayStr > closingDate) {
        status = 'fechada';
      }

      return {
        cardId,
        cardName: card.name,
        brand: card.brand,
        color: card.color,
        invoiceMonth,
        closingDate,
        dueDate,
        totalAmount: Number(totalAmount.toFixed(2)),
        purchasesCount: pList.length,
        status,
        transactionId: invoiceTx ? invoiceTx.id : null,
        settlementDate: invoiceTx ? invoiceTx.settlementDate : null,
        purchases: pList,
      };
    });

    invoices.sort((a, b) => b.invoiceMonth.localeCompare(a.invoiceMonth));

    return invoices;
  } catch (error) {
    console.error('getCreditCardInvoices failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

// Pay Invoice - creates or settles a bill for the invoice
export async function payCreditCardInvoice(
  userUid: string,
  data: {
    cardId: number;
    invoiceMonth: string;
    bankAccountId: number;
    settlementDate: string;
    paymentMethod?: string;
  }
) {
  try {
    const cardRes = await db
      .select()
      .from(creditCards)
      .where(and(eq(creditCards.id, data.cardId), eq(creditCards.userUid, userUid)))
      .limit(1);

    if (cardRes.length === 0) {
      throw new Error('Cartão de crédito não encontrado.');
    }
    const card = cardRes[0];

    const invoices = await getCreditCardInvoices(userUid, data.cardId);
    const invoice = invoices.find((inv) => inv.invoiceMonth === data.invoiceMonth);

    if (!invoice || invoice.totalAmount <= 0) {
      throw new Error('Fatura não possui saldo para pagamento.');
    }

    // Find category for 'Cartão'
    const userCategories = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userUid, userUid), eq(categories.type, 'despesa')));
    const cardCat = userCategories.find((c) => c.name.toLowerCase().includes('cartão') || c.name.toLowerCase().includes('cartao')) || userCategories[0];

    const desc = `Fatura Cartão ${card.name} - ${data.invoiceMonth}`;

    const originType = (card.originType || 'pessoal') as 'pessoal' | 'empresa';
    const companyId = originType === 'empresa' ? card.companyId || null : null;

    // Verificar se já existe a transação da fatura para atualizar seu status para liquidado (settled)
    const existingTx = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.cardId, data.cardId), eq(transactions.userUid, userUid)));

    const invoiceTx = existingTx.find((t) => t.description.includes(data.invoiceMonth));

    let createdTx;
    if (invoiceTx) {
      const updated = await db
        .update(transactions)
        .set({
          originType,
          companyId,
          bankAccountId: data.bankAccountId,
          amount: invoice.totalAmount.toFixed(2),
          settlementDate: data.settlementDate,
          status: 'settled',
          paymentMethod: data.paymentMethod || 'Débito em Conta',
          notes: `Pagamento de fatura ${data.invoiceMonth} (${invoice.purchases.length} compras)`,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, invoiceTx.id))
        .returning();
      createdTx = updated[0];
    } else {
      const newTx = await db
        .insert(transactions)
        .values({
          userUid,
          originType,
          companyId,
          categoryId: cardCat ? cardCat.id : 1,
          bankAccountId: data.bankAccountId,
          cardId: data.cardId,
          type: 'pagar',
          description: desc,
          amount: invoice.totalAmount.toFixed(2),
          dueDate: invoice.dueDate,
          settlementDate: data.settlementDate,
          status: 'settled',
          paymentMethod: data.paymentMethod || 'Débito em Conta',
          notes: `Pagamento de fatura ${data.invoiceMonth} (${invoice.purchases.length} compras)`,
        })
        .returning();
      createdTx = newTx[0];
    }

    // Debit the bank account
    const bankRes = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, data.bankAccountId), eq(bankAccounts.userUid, userUid)))
      .limit(1);

    let bankName = '';
    if (bankRes.length > 0) {
      const bank = bankRes[0];
      bankName = bank.name;
      const newBal = Number(bank.currentBalance) - invoice.totalAmount;
      await db
        .update(bankAccounts)
        .set({ currentBalance: newBal.toFixed(2), updatedAt: new Date() })
        .where(eq(bankAccounts.id, data.bankAccountId));
    }

    await db.insert(transactionHistory).values({
      transactionId: createdTx.id,
      userUid,
      action: 'settled',
      details: `Fatura ${data.invoiceMonth} do cartão "${card.name}" paga em ${data.settlementDate}. Conta Bancária: "${bankName}". Valor: R$ ${invoice.totalAmount.toFixed(2)}.`,
    });

    // Criar notificação para fatura paga
    await db.insert(notifications).values({
      userUid,
      type: 'pago',
      title: `Fatura Paga: ${card.name}`,
      message: `A fatura de ${data.invoiceMonth} do cartão ${card.name} no valor de R$ ${invoice.totalAmount.toFixed(2)} foi baixada com sucesso e lançada em Contas Pagas.`,
      transactionId: createdTx.id,
      isRead: false,
    });

    return createdTx;
  } catch (error: any) {
    console.error('payCreditCardInvoice failed:', error);
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
    await syncCreditCardInvoicesToTransactions(userUid);

    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userUid, userUid));
    const userCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.userUid, userUid));
    const userBankAccounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userUid, userUid));
    const userCreditCards = await db
      .select()
      .from(creditCards)
      .where(eq(creditCards.userUid, userUid));

    const categoryMap = new Map(userCategories.map((c) => [c.id, c]));
    const companyMap = new Map(userCompanies.map((c) => [c.id, c]));
    const bankAccountMap = new Map(userBankAccounts.map((b) => [b.id, b]));
    const creditCardMap = new Map(userCreditCards.map((c) => [c.id, c]));

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
      bankAccount: tx.bankAccountId ? bankAccountMap.get(tx.bankAccountId) || null : null,
      creditCard: tx.cardId ? creditCardMap.get(tx.cardId) || null : null,
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
    bankAccountId?: number | null;
    cardId?: number | null;
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
        bankAccountId: data.bankAccountId || null,
        cardId: data.cardId || null,
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
    bankAccountId?: number | null;
    cardId?: number | null;
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
    if (data.bankAccountId !== undefined) updateData.bankAccountId = data.bankAccountId;
    if (data.cardId !== undefined) updateData.cardId = data.cardId;
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
  data: {
    settlementDate: string;
    bankAccountId?: number | null;
    paymentMethod?: string | null;
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
    const updatePayload: any = {
      status: 'settled',
      settlementDate: data.settlementDate,
      updatedAt: new Date(),
    };

    if (data.bankAccountId !== undefined) {
      updatePayload.bankAccountId = data.bankAccountId || null;
    }
    if (data.paymentMethod !== undefined) {
      updatePayload.paymentMethod = data.paymentMethod || null;
    }

    const result = await db
      .update(transactions)
      .set(updatePayload)
      .where(and(eq(transactions.id, id), eq(transactions.userUid, userUid)))
      .returning();

    const settled = result[0];
    const verb = settled.type === 'pagar' ? 'Pago' : 'Recebido';

    // If a bank account is specified, debit or credit its current balance
    let bankName = '';
    const bankId = settled.bankAccountId;
    if (bankId) {
      const bankRes = await db
        .select()
        .from(bankAccounts)
        .where(and(eq(bankAccounts.id, bankId), eq(bankAccounts.userUid, userUid)))
        .limit(1);

      if (bankRes.length > 0) {
        const bank = bankRes[0];
        bankName = bank.name;
        const currentBal = Number(bank.currentBalance);
        const amount = Number(settled.amount);
        const newBal = settled.type === 'pagar' ? currentBal - amount : currentBal + amount;
        await db
          .update(bankAccounts)
          .set({ currentBalance: newBal.toFixed(2), updatedAt: new Date() })
          .where(eq(bankAccounts.id, bankId));
      }
    }

    // Record history
    const bankDetails = bankName ? ` | Conta Bancária: "${bankName}"` : '';
    const methodDetails = settled.paymentMethod ? ` | Forma: "${settled.paymentMethod}"` : '';
    await db.insert(transactionHistory).values({
      transactionId: id,
      userUid,
      action: 'settled',
      details: `Baixa realizada com sucesso. Status: ${verb} em ${data.settlementDate}${bankDetails}${methodDetails} (Vencimento original mantido: ${settled.dueDate})`,
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

    const current = existing[0];

    // If it was settled and had a bank account, reverse the balance change
    if (current.status === 'settled' && current.bankAccountId) {
      const bankRes = await db
        .select()
        .from(bankAccounts)
        .where(and(eq(bankAccounts.id, current.bankAccountId), eq(bankAccounts.userUid, userUid)))
        .limit(1);

      if (bankRes.length > 0) {
        const bank = bankRes[0];
        const currentBal = Number(bank.currentBalance);
        const amount = Number(current.amount);
        // Reverse: if pagar, add back; if receber, subtract
        const newBal = current.type === 'pagar' ? currentBal + amount : currentBal - amount;
        await db
          .update(bankAccounts)
          .set({ currentBalance: newBal.toFixed(2), updatedAt: new Date() })
          .where(eq(bankAccounts.id, current.bankAccountId));
      }
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
    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userUid, userUid)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error('Conta não encontrada.');
    }

    const current = existing[0];

    // If it was settled and had a bank account, reverse the balance change
    if (current.status === 'settled' && current.bankAccountId) {
      const bankRes = await db
        .select()
        .from(bankAccounts)
        .where(and(eq(bankAccounts.id, current.bankAccountId), eq(bankAccounts.userUid, userUid)))
        .limit(1);

      if (bankRes.length > 0) {
        const bank = bankRes[0];
        const currentBal = Number(bank.currentBalance);
        const amount = Number(current.amount);
        const newBal = current.type === 'pagar' ? currentBal + amount : currentBal - amount;
        await db
          .update(bankAccounts)
          .set({ currentBalance: newBal.toFixed(2), updatedAt: new Date() })
          .where(eq(bankAccounts.id, current.bankAccountId));
      }
    }

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
      details: `Conta reaberta como pendente. Baixa cancelada e saldo restaurado.`,
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

    const userBankAccounts = await getBankAccounts(userUid);
    const userCreditCards = await getCreditCards(userUid);
    const totalBankBalance = userBankAccounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance),
      0
    );

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
      bankAccounts: userBankAccounts,
      creditCards: userCreditCards,
      totalBankBalance,
    };
  } catch (error) {
    console.error('getDashboardData failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

// Notifications
export async function getNotifications(userUid: string) {
  try {
    await syncCreditCardInvoicesToTransactions(userUid);

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
