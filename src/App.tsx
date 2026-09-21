import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar, NavigationTab } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { TransactionsView } from './components/TransactionsView.tsx';
import { CompaniesView } from './components/CompaniesView.tsx';
import { CategoriesView } from './components/CategoriesView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { CreditCardsView } from './components/CreditCardsView.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import { SettleModal } from './components/SettleModal.tsx';
import { HistoryModal } from './components/HistoryModal.tsx';
import {
  Company,
  Category,
  Transaction,
  DashboardOverview,
  AppNotification,
  TransactionHistoryRecord,
  BankAccount,
  CreditCard,
} from './types.ts';

const MainLayout: React.FC = () => {
  const { user, loading: authLoading, fetchApi } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Data state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);

  // Filters state
  const [selectedDashboardOrigin, setSelectedDashboardOrigin] = useState('all');
  const [transactionFilters, setTransactionFilters] = useState<any>({});

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settlingTx, setSettlingTx] = useState<Transaction | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTx, setHistoryTx] = useState<Transaction | null>(null);
  const [historyRecords, setHistoryRecords] = useState<TransactionHistoryRecord[]>([]);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Fetch Companies
  const loadCompanies = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchApi('/api/companies');
      setCompanies(data);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  }, [user, fetchApi]);

  // 2. Fetch Categories
  const loadCategories = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchApi('/api/categories');
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, [user, fetchApi]);

  // 2b. Fetch Bank Accounts
  const loadBankAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchApi('/api/bank-accounts');
      setBankAccounts(data);
    } catch (err) {
      console.error('Failed to load bank accounts:', err);
    }
  }, [user, fetchApi]);

  // 2c. Fetch Credit Cards
  const loadCreditCards = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchApi('/api/credit-cards');
      setCreditCards(data);
    } catch (err) {
      console.error('Failed to load credit cards:', err);
    }
  }, [user, fetchApi]);

  // 3. Fetch Dashboard Data
  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      let query = '';
      if (selectedDashboardOrigin === 'pessoal') {
        query = '?originType=pessoal';
      } else if (selectedDashboardOrigin !== 'all') {
        query = `?originType=empresa&companyId=${selectedDashboardOrigin}`;
      }
      const data = await fetchApi(`/api/dashboard${query}`);
      setDashboardOverview(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, [user, selectedDashboardOrigin, fetchApi]);

  // 4. Fetch Transactions
  const loadTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const params = new URLSearchParams();
      if (transactionFilters.originType) params.append('originType', transactionFilters.originType);
      if (transactionFilters.companyId) params.append('companyId', transactionFilters.companyId);
      if (transactionFilters.type) params.append('type', transactionFilters.type);
      if (transactionFilters.categoryId) params.append('categoryId', transactionFilters.categoryId);
      if (transactionFilters.status) params.append('status', transactionFilters.status);
      if (transactionFilters.startDate) params.append('startDate', transactionFilters.startDate);
      if (transactionFilters.endDate) params.append('endDate', transactionFilters.endDate);
      if (transactionFilters.search) params.append('search', transactionFilters.search);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchApi(`/api/transactions${qs}`);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  }, [user, transactionFilters, fetchApi]);

  // 5. Fetch Notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchApi('/api/notifications');
      setNotifications(data.notifications || []);
      setNotificationsCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [user, fetchApi]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadCompanies();
      loadCategories();
      loadBankAccounts();
      loadCreditCards();
      loadDashboard();
      loadTransactions();
      loadNotifications();
    }
  }, [user, loadCompanies, loadCategories, loadBankAccounts, loadCreditCards, loadDashboard, loadTransactions, loadNotifications]);

  // Reload dashboard when origin filter changes
  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [selectedDashboardOrigin, user, loadDashboard]);

  // Reload transactions when filters change
  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [transactionFilters, user, loadTransactions]);

  // Handlers for Transactions
  const handleSaveTransaction = async (formData: any) => {
    if (formData.isRecurring) {
      await fetchApi('/api/transactions/recurring', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      showToast(`Contas recorrentes geradas com sucesso!`);
    } else if (editingTx) {
      await fetchApi(`/api/transactions/${editingTx.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      showToast('Conta atualizada com sucesso!');
    } else {
      await fetchApi('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      showToast('Conta criada com sucesso!');
    }
    setEditingTx(null);
    await Promise.all([loadTransactions(), loadDashboard(), loadNotifications(), loadBankAccounts()]);
  };

  const handleConfirmSettle = async (settlementData: {
    settlementDate: string;
    bankAccountId?: number | null;
    paymentMethod?: string;
  }) => {
    if (!settlingTx) return;
    await fetchApi(`/api/transactions/${settlingTx.id}/settle`, {
      method: 'POST',
      body: JSON.stringify(settlementData),
    });
    showToast(`Baixa realizada com sucesso em ${settlementData.settlementDate}!`);
    setSettlingTx(null);
    await Promise.all([
      loadTransactions(),
      loadDashboard(),
      loadNotifications(),
      loadBankAccounts(),
      loadCreditCards(),
    ]);
  };

  const handleCancelTransaction = async (tx: Transaction) => {
    if (confirm(`Tem certeza que deseja cancelar a conta "${tx.description}"?`)) {
      try {
        await fetchApi(`/api/transactions/${tx.id}/cancel`, { method: 'POST' });
        showToast('Conta cancelada com sucesso.');
        await Promise.all([loadTransactions(), loadDashboard(), loadNotifications()]);
      } catch (err: any) {
        alert(err.message || 'Erro ao cancelar conta');
      }
    }
  };

  const handleReopenTransaction = async (tx: Transaction) => {
    if (confirm(`Deseja reabrir a conta "${tx.description}" para o status Pendente?`)) {
      try {
        await fetchApi(`/api/transactions/${tx.id}/reopen`, { method: 'POST' });
        showToast('Conta reaberta com sucesso.');
        await Promise.all([loadTransactions(), loadDashboard(), loadNotifications()]);
      } catch (err: any) {
        alert(err.message || 'Erro ao reabrir conta');
      }
    }
  };

  const handleOpenHistory = async (tx: Transaction) => {
    setHistoryTx(tx);
    try {
      const records = await fetchApi(`/api/transactions/${tx.id}/history`);
      setHistoryRecords(records);
      setIsHistoryModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar histórico');
    }
  };

  // Handlers for Companies
  const handleCreateCompany = async (compData: any) => {
    await fetchApi('/api/companies', {
      method: 'POST',
      body: JSON.stringify(compData),
    });
    showToast('Empresa cadastrada com sucesso!');
    await loadCompanies();
  };

  const handleUpdateCompany = async (id: number, compData: any) => {
    await fetchApi(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(compData),
    });
    showToast('Empresa atualizada com sucesso!');
    await loadCompanies();
  };

  const handleArchiveCompany = async (id: number) => {
    await fetchApi(`/api/companies/${id}`, { method: 'DELETE' });
    showToast('Empresa arquivada com sucesso!');
    await loadCompanies();
  };

  // Handlers for Categories
  const handleCreateCategory = async (catData: any) => {
    await fetchApi('/api/categories', {
      method: 'POST',
      body: JSON.stringify(catData),
    });
    showToast('Categoria criada com sucesso!');
    await loadCategories();
  };

  const handleQuickCreateCategory = async (name: string, type: 'despesa' | 'receita') => {
    const created = await fetchApi('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    });
    await loadCategories();
    return created;
  };

  const handleUpdateCategory = async (id: number, catData: any) => {
    await fetchApi(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(catData),
    });
    showToast('Categoria atualizada com sucesso!');
    await loadCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    await fetchApi(`/api/categories/${id}`, { method: 'DELETE' });
    showToast('Categoria removida com sucesso!');
    await loadCategories();
  };

  // Handler for Reports API
  const fetchReportData = async (filters: any) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((k) => {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        params.append(k, filters[k]);
      }
    });
    return await fetchApi(`/api/reports?${params.toString()}`);
  };

  // Screen Title for Header
  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard Geral';
      case 'pessoal':
        return 'Contas Pessoais';
      case 'empresas':
        return 'Minhas Empresas';
      case 'contas':
        return 'Todas as Contas';
      case 'cartoes':
        return 'Cartões de Crédito & Bancos';
      case 'categorias':
        return 'Categorias Financeiras';
      case 'relatorios':
        return 'Relatórios e Análises';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F14] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#1677FF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#8B98A8] tracking-wider uppercase">
          Carregando Sistema Financeiro...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white flex flex-col">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-[#111821] border border-[#1677FF] text-white text-xs font-medium rounded-xl shadow-2xl shadow-black/50 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        notificationsCount={notificationsCount}
        notifications={notifications}
        onOpenNotifications={() => setActiveTab('dashboard')}
        activeViewTitle={getTabTitle(activeTab)}
      />

      {/* Main Body */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'pessoal') {
              setTransactionFilters({ originType: 'pessoal' });
              setActiveTab('contas');
            } else {
              setActiveTab(tab);
            }
          }}
          onOpenNewTransaction={() => {
            setEditingTx(null);
            setIsTxModalOpen(true);
          }}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              overview={dashboardOverview}
              companies={companies}
              selectedOrigin={selectedDashboardOrigin}
              onSelectOrigin={setSelectedDashboardOrigin}
              onSettleClick={(tx) => {
                setSettlingTx(tx);
                setIsSettleModalOpen(true);
              }}
              onNavigateToContas={(filter) => {
                if (filter) setTransactionFilters(filter);
                setActiveTab('contas');
              }}
              onOpenNewTransaction={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
            />
          )}

          {activeTab === 'contas' && (
            <TransactionsView
              transactions={transactions}
              companies={companies}
              categories={categories}
              filters={transactionFilters}
              onFilterChange={(newFilters) => setTransactionFilters(newFilters)}
              onOpenNewTransaction={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setIsTxModalOpen(true);
              }}
              onSettleClick={(tx) => {
                setSettlingTx(tx);
                setIsSettleModalOpen(true);
              }}
              onCancelClick={handleCancelTransaction}
              onReopenClick={handleReopenTransaction}
              onHistoryClick={handleOpenHistory}
            />
          )}

          {activeTab === 'empresas' && (
            <CompaniesView
              companies={companies}
              onCreateCompany={handleCreateCompany}
              onUpdateCompany={handleUpdateCompany}
              onArchiveCompany={handleArchiveCompany}
            />
          )}

          {activeTab === 'categorias' && (
            <CategoriesView
              categories={categories}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'cartoes' && (
            <CreditCardsView
              creditCards={creditCards}
              bankAccounts={bankAccounts}
              categories={categories}
              companies={companies}
              onRefresh={async () => {
                await Promise.all([
                  loadCreditCards(),
                  loadBankAccounts(),
                  loadDashboard(),
                  loadTransactions(),
                ]);
              }}
              fetchApi={fetchApi}
              showToast={showToast}
            />
          )}

          {activeTab === 'relatorios' && (
            <ReportsView
              companies={companies}
              categories={categories}
              fetchReportData={fetchReportData}
            />
          )}
        </main>
      </div>

      {/* Transaction Create/Edit Modal */}
      {isTxModalOpen && (
        <TransactionModal
          isOpen={isTxModalOpen}
          onClose={() => {
            setIsTxModalOpen(false);
            setEditingTx(null);
          }}
          onSave={handleSaveTransaction}
          companies={companies}
          categories={categories}
          bankAccounts={bankAccounts}
          onCreateCategoryQuick={handleQuickCreateCategory}
          transactionToEdit={editingTx}
        />
      )}

      {/* Settle Modal (Dar Baixa) */}
      {isSettleModalOpen && settlingTx && (
        <SettleModal
          isOpen={isSettleModalOpen}
          transaction={settlingTx}
          bankAccounts={bankAccounts}
          onClose={() => {
            setIsSettleModalOpen(false);
            setSettlingTx(null);
          }}
          onConfirm={handleConfirmSettle}
        />
      )}

      {/* History and Audit Modal */}
      {isHistoryModalOpen && historyTx && (
        <HistoryModal
          isOpen={isHistoryModalOpen}
          transaction={historyTx}
          history={historyRecords}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setHistoryTx(null);
            setHistoryRecords([]);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
