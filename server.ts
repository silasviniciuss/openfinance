import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest, generateToken } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  seedDefaultCategories,
  getCompanies,
  createCompany,
  updateCompany,
  archiveCompany,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTransactions,
  createTransaction,
  updateTransaction,
  settleTransaction,
  cancelTransaction,
  reopenTransaction,
  getTransactionHistory,
  createRecurringTransaction,
  getDashboardData,
  getNotifications,
} from './src/server/db-services.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Username/password authentication endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Por favor, informe o usuário e a senha.' });
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const cleanPassword = String(password).trim();

      // Standard requested user: silas / 060333
      if (cleanUsername === 'silas' && cleanPassword === '060333') {
        const uid = 'silas';
        const email = 'silas@financeiro.app';
        const name = 'Silas';

        await getOrCreateUser(uid, email, name);
        await seedDefaultCategories(uid);

        const token = generateToken({ uid, email, name, username: 'silas' });
        return res.json({
          token,
          user: {
            uid,
            username: 'silas',
            email,
            displayName: name,
          },
        });
      }

      return res.status(401).json({
        error: 'Usuário ou senha incorretos. Utilize as credenciais padrão: silas / 060333',
      });
    } catch (error: any) {
      console.error('Error in /api/auth/login:', error);
      res.status(500).json({ error: error.message || 'Erro ao processar login' });
    }
  });

  // Current user validation
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@financeiro.app`;
      const name = req.user!.name || (uid === 'silas' ? 'Silas' : uid);

      const dbUser = await getOrCreateUser(uid, email, name);
      res.json({
        user: {
          uid: dbUser.uid,
          username: req.user!.username || dbUser.uid,
          email: dbUser.email,
          displayName: dbUser.name || dbUser.uid,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao validar sessão' });
    }
  });

  // Auth sync: registers user in DB and seeds default categories if empty
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || 'no-email@user.com';
      const name = req.body.name || req.user!.name || email.split('@')[0];

      const dbUser = await getOrCreateUser(uid, email, name);
      await seedDefaultCategories(uid);

      res.json({ user: dbUser });
    } catch (error: any) {
      console.error('Error in /api/auth/sync:', error);
      res.status(500).json({ error: error.message || 'Erro ao sincronizar usuário' });
    }
  });

  // Companies API
  app.get('/api/companies', requireAuth, async (req: AuthRequest, res) => {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      const companiesList = await getCompanies(req.user!.uid, includeArchived);
      res.json(companiesList);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar empresas' });
    }
  });

  app.post('/api/companies', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, cnpj, description, logo, color } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome da empresa é obrigatório' });
      }
      const company = await createCompany(req.user!.uid, {
        name: name.trim(),
        cnpj,
        description,
        logo,
        color,
      });
      res.status(201).json(company);
    } catch (error: any) {
      console.error('Error creating company:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar empresa' });
    }
  });

  app.put('/api/companies/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateCompany(id, req.user!.uid, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating company:', error);
      res.status(500).json({ error: error.message || 'Erro ao atualizar empresa' });
    }
  });

  app.delete('/api/companies/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const archived = await archiveCompany(id, req.user!.uid);
      res.json({ message: 'Empresa arquivada com sucesso', company: archived });
    } catch (error: any) {
      console.error('Error archiving company:', error);
      res.status(500).json({ error: error.message || 'Erro ao arquivar empresa' });
    }
  });

  // Categories API
  app.get('/api/categories', requireAuth, async (req: AuthRequest, res) => {
    try {
      const type = req.query.type as 'despesa' | 'receita' | undefined;
      const categoriesList = await getCategories(req.user!.uid, type);
      res.json(categoriesList);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar categorias' });
    }
  });

  app.post('/api/categories', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, type, description, color } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
      }
      if (type !== 'despesa' && type !== 'receita') {
        return res.status(400).json({ error: 'Tipo deve ser "despesa" ou "receita"' });
      }
      const category = await createCategory(req.user!.uid, {
        name: name.trim(),
        type,
        description,
        color,
      });
      res.status(201).json(category);
    } catch (error: any) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar categoria' });
    }
  });

  app.put('/api/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateCategory(id, req.user!.uid, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: error.message || 'Erro ao atualizar categoria' });
    }
  });

  app.delete('/api/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await deleteCategory(id, req.user!.uid);
      res.json({ message: 'Categoria excluída com sucesso', category: deleted });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      res.status(400).json({ error: error.message || 'Erro ao excluir categoria' });
    }
  });

  // Transactions API
  app.get('/api/transactions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { originType, companyId, type, categoryId, status, startDate, endDate, search } = req.query;

      const txs = await getTransactions(req.user!.uid, {
        originType: originType as any,
        companyId: companyId ? parseInt(companyId as string, 10) : undefined,
        type: type as any,
        categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
        status: status as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
      });

      res.json(txs);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar contas' });
    }
  });

  app.post('/api/transactions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        originType,
        companyId,
        categoryId,
        type,
        description,
        amount,
        dueDate,
        paymentMethod,
        notes,
      } = req.body;

      if (!originType || (originType !== 'pessoal' && originType !== 'empresa')) {
        return res.status(400).json({ error: 'Origem deve ser "pessoal" ou "empresa"' });
      }
      if (originType === 'empresa' && !companyId) {
        return res.status(400).json({ error: 'Selecione uma empresa para origem Empresa' });
      }
      if (!categoryId) {
        return res.status(400).json({ error: 'Categoria é obrigatória' });
      }
      if (!type || (type !== 'pagar' && type !== 'receber')) {
        return res.status(400).json({ error: 'Tipo deve ser "pagar" ou "receber"' });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ error: 'Descrição é obrigatória' });
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valor financeiro válido é obrigatório' });
      }
      if (!dueDate) {
        return res.status(400).json({ error: 'Data de vencimento é obrigatória' });
      }

      const tx = await createTransaction(req.user!.uid, {
        originType,
        companyId: companyId ? parseInt(companyId, 10) : null,
        categoryId: parseInt(categoryId, 10),
        type,
        description: description.trim(),
        amount,
        dueDate,
        paymentMethod,
        notes,
      });

      res.status(201).json(tx);
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar conta' });
    }
  });

  app.put('/api/transactions/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateTransaction(id, req.user!.uid, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: error.message || 'Erro ao atualizar conta' });
    }
  });

  // Dar Baixa (Settle)
  app.post('/api/transactions/:id/settle', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { settlementDate } = req.body;
      if (!settlementDate) {
        return res.status(400).json({ error: 'Data efetiva da baixa é obrigatória' });
      }
      const settled = await settleTransaction(id, req.user!.uid, settlementDate);
      res.json(settled);
    } catch (error: any) {
      console.error('Error settling transaction:', error);
      res.status(500).json({ error: error.message || 'Erro ao dar baixa na conta' });
    }
  });

  // Cancel account
  app.post('/api/transactions/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const cancelled = await cancelTransaction(id, req.user!.uid);
      res.json(cancelled);
    } catch (error: any) {
      console.error('Error cancelling transaction:', error);
      res.status(500).json({ error: error.message || 'Erro ao cancelar conta' });
    }
  });

  // Reopen account
  app.post('/api/transactions/:id/reopen', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const reopened = await reopenTransaction(id, req.user!.uid);
      res.json(reopened);
    } catch (error: any) {
      console.error('Error reopening transaction:', error);
      res.status(500).json({ error: error.message || 'Erro ao reabrir conta' });
    }
  });

  // Audit history
  app.get('/api/transactions/:id/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const history = await getTransactionHistory(id, req.user!.uid);
      res.json(history);
    } catch (error: any) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar histórico da conta' });
    }
  });

  // Recurring account creation
  app.post('/api/transactions/recurring', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        originType,
        companyId,
        categoryId,
        type,
        description,
        amount,
        frequency,
        totalOccurrences,
        startDate,
        paymentMethod,
        notes,
      } = req.body;

      if (!description || !amount || !startDate || !totalOccurrences) {
        return res.status(400).json({ error: 'Campos obrigatórios de recorrência ausentes' });
      }

      const result = await createRecurringTransaction(req.user!.uid, {
        originType,
        companyId: companyId ? parseInt(companyId, 10) : null,
        categoryId: parseInt(categoryId, 10),
        type,
        description: description.trim(),
        amount,
        frequency: frequency || 'mensal',
        totalOccurrences: parseInt(totalOccurrences, 10) || 12,
        startDate,
        paymentMethod,
        notes,
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error creating recurring transactions:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar contas recorrentes' });
    }
  });

  // Dashboard endpoint
  app.get('/api/dashboard', requireAuth, async (req: AuthRequest, res) => {
    try {
      const originType = req.query.originType as 'pessoal' | 'empresa' | undefined;
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;

      const data = await getDashboardData(req.user!.uid, {
        originType,
        companyId,
      });

      res.json(data);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar dados do dashboard' });
    }
  });

  // Notifications endpoint
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await getNotifications(req.user!.uid);
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar notificações' });
    }
  });

  // Reports endpoint
  app.get('/api/reports', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        originType,
        companyId,
        type,
        categoryId,
        status,
        startDate,
        endDate,
        dateField = 'dueDate', // 'dueDate' or 'settlementDate'
      } = req.query;

      const rawTxs = await getTransactions(req.user!.uid, {
        originType: originType as any,
        companyId: companyId ? parseInt(companyId as string, 10) : undefined,
        type: type as any,
        categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
        status: status as any,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      const todayStr = new Date().toISOString().split('T')[0];

      let totalRevenue = 0;
      let totalExpense = 0;
      let totalPending = 0;
      let totalOverdue = 0;
      let totalPaid = 0;
      let totalReceived = 0;

      for (const tx of rawTxs) {
        if (tx.status === 'cancelled') continue;
        const val = parseFloat(tx.amount);

        if (tx.type === 'receber') {
          totalRevenue += val;
          if (tx.status === 'settled') {
            totalReceived += val;
          } else if (tx.status === 'pending') {
            if (tx.dueDate < todayStr) totalOverdue += val;
            else totalPending += val;
          }
        } else if (tx.type === 'pagar') {
          totalExpense += val;
          if (tx.status === 'settled') {
            totalPaid += val;
          } else if (tx.status === 'pending') {
            if (tx.dueDate < todayStr) totalOverdue += val;
            else totalPending += val;
          }
        }
      }

      res.json({
        totalRevenue,
        totalExpense,
        balance: totalReceived - totalPaid,
        projectedBalance: totalRevenue - totalExpense,
        totalPending,
        totalOverdue,
        totalPaid,
        totalReceived,
        transactions: rawTxs,
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: error.message || 'Erro ao gerar relatório' });
    }
  });

  // Vite middleware for SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
