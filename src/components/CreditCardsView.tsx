import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CreditCardPurchase,
  CreditCardInvoice,
  BankAccount,
  BankAccountType,
  Category,
  Company,
} from '../types.ts';
import {
  CreditCard as CreditCardIcon,
  PlusCircle,
  Landmark,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Clock,
  ArrowRight,
  TrendingUp,
  Receipt,
  X,
  Layers,
  ShoppingBag,
} from 'lucide-react';

interface CreditCardsViewProps {
  creditCards: CreditCard[];
  bankAccounts: BankAccount[];
  categories: Category[];
  companies: Company[];
  onRefresh: () => Promise<void>;
  fetchApi: (endpoint: string, options?: any) => Promise<any>;
  showToast: (msg: string) => void;
}

export const CreditCardsView: React.FC<CreditCardsViewProps> = ({
  creditCards,
  bankAccounts,
  categories,
  companies,
  onRefresh,
  fetchApi,
  showToast,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(
    creditCards.length > 0 ? creditCards[0].id : null
  );
  const [activeSubTab, setActiveSubTab] = useState<'cartoes' | 'bancos'>('cartoes');

  // Invoices & Purchases for selected card
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState<string>('');
  const [purchases, setPurchases] = useState<CreditCardPurchase[]>([]);
  const [loadingCardData, setLoadingCardData] = useState(false);

  // Modals
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPayInvoiceModalOpen, setIsPayInvoiceModalOpen] = useState(false);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  // Keep selected card valid
  useEffect(() => {
    if (creditCards.length > 0) {
      if (!selectedCardId || !creditCards.some((c) => c.id === selectedCardId)) {
        setSelectedCardId(creditCards[0].id);
      }
    } else {
      setSelectedCardId(null);
    }
  }, [creditCards, selectedCardId]);

  // Load invoices and purchases when selected card changes
  const loadCardData = async (cardId: number) => {
    setLoadingCardData(true);
    try {
      const invs: CreditCardInvoice[] = await fetchApi(`/api/credit-cards/${cardId}/invoices`);
      setInvoices(invs);

      let targetMonth = selectedInvoiceMonth;
      if (!targetMonth || !invs.some((i) => i.invoiceMonth === targetMonth)) {
        // Find open invoice or first
        const openInv = invs.find((i) => i.status === 'aberta') || invs[0];
        targetMonth = openInv ? openInv.invoiceMonth : '';
        setSelectedInvoiceMonth(targetMonth);
      }

      const purchs: CreditCardPurchase[] = await fetchApi(
        `/api/credit-card-purchases?cardId=${cardId}${targetMonth ? `&invoiceMonth=${targetMonth}` : ''}`
      );
      setPurchases(purchs);
    } catch (err: any) {
      console.error('Error loading card data:', err);
    } finally {
      setLoadingCardData(false);
    }
  };

  useEffect(() => {
    if (selectedCardId) {
      loadCardData(selectedCardId);
    } else {
      setInvoices([]);
      setPurchases([]);
    }
  }, [selectedCardId]);

  // When invoice month changes
  const handleSelectInvoiceMonth = async (month: string) => {
    setSelectedInvoiceMonth(month);
    if (!selectedCardId) return;
    try {
      const purchs: CreditCardPurchase[] = await fetchApi(
        `/api/credit-card-purchases?cardId=${selectedCardId}&invoiceMonth=${month}`
      );
      setPurchases(purchs);
    } catch (err: any) {
      console.error('Error loading purchases for invoice:', err);
    }
  };

  const selectedCard = creditCards.find((c) => c.id === selectedCardId);
  const currentInvoice = invoices.find((i) => i.invoiceMonth === selectedInvoiceMonth);

  const formatCurrency = (val: string | number) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Delete purchase handler
  const handleDeletePurchase = async (purchaseId: number) => {
    if (confirm('Deseja excluir esta compra do cartão de crédito? O valor será subtraído da fatura.')) {
      try {
        await fetchApi(`/api/credit-card-purchases/${purchaseId}`, { method: 'DELETE' });
        showToast('Compra excluída com sucesso.');
        if (selectedCardId) {
          await loadCardData(selectedCardId);
        }
        await onRefresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir compra');
      }
    }
  };

  // Delete card handler
  const handleDeleteCard = async (cardId: number, cardName: string) => {
    if (confirm(`Tem certeza que deseja excluir o cartão "${cardName}"? As compras e faturas associadas serão apagadas.`)) {
      try {
        await fetchApi(`/api/credit-cards/${cardId}`, { method: 'DELETE' });
        showToast('Cartão excluído com sucesso.');
        await onRefresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir cartão');
      }
    }
  };

  // Delete bank account handler
  const handleDeleteBank = async (bankId: number, bankName: string) => {
    if (confirm(`Deseja excluir a conta bancária "${bankName}"?`)) {
      try {
        await fetchApi(`/api/bank-accounts/${bankId}`, { method: 'DELETE' });
        showToast('Conta bancária excluída com sucesso.');
        await onRefresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir conta bancária');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2.5">
            <CreditCardIcon className="w-6 h-6 text-[#1677FF]" />
            CARTÕES DE CRÉDITO & CONTAS BANCÁRIAS
          </h1>
          <p className="text-xs text-[#8B98A8] mt-0.5">
            Gerencie compras acumuladas por data de fechamento, faturas abertas e saldo bancário
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-novo-cartao"
            onClick={() => {
              setEditingCard(null);
              setIsCardModalOpen(true);
            }}
            className="px-3.5 h-10 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white text-xs font-semibold transition-all shadow-md shadow-[#1677FF]/20 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ NOVO CARTÃO</span>
          </button>

          <button
            type="button"
            id="btn-nova-conta-bancaria"
            onClick={() => {
              setEditingBank(null);
              setIsBankModalOpen(true);
            }}
            className="px-3.5 h-10 rounded-xl bg-[#1A2332] hover:bg-[#253247] text-white text-xs font-semibold border border-[#2D3A4F] transition-all flex items-center gap-1.5"
          >
            <Landmark className="w-4 h-4 text-[#22C55E]" />
            <span>+ CONTA BANCÁRIA</span>
          </button>
        </div>
      </div>

      {/* Sub tabs: Cartões de Crédito vs Contas Bancárias */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('cartoes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'cartoes'
              ? 'bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/20'
              : 'bg-[#0B0F14] text-[#8B98A8] hover:text-white border border-[#1E293B]'
          }`}
        >
          <CreditCardIcon className="w-4 h-4" />
          <span>Cartões e Faturas ({creditCards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bancos')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'bancos'
              ? 'bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/20'
              : 'bg-[#0B0F14] text-[#8B98A8] hover:text-white border border-[#1E293B]'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Contas Bancárias ({bankAccounts.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: CARTÕES & FATURAS */}
      {activeSubTab === 'cartoes' && (
        <div className="space-y-6">
          {creditCards.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#111821] border border-[#1E293B]">
              <CreditCardIcon className="w-12 h-12 text-[#8B98A8] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-white mb-1">Nenhum cartão cadastrado</h3>
              <p className="text-xs text-[#8B98A8] max-w-md mx-auto mb-5">
                Cadastre seu primeiro cartão de crédito informando o dia de fechamento e o dia de vencimento da fatura para somar compras automaticamente.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingCard(null);
                  setIsCardModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#1677FF] text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-[#1677FF]/25"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Cadastrar Cartão Agora</span>
              </button>
            </div>
          ) : (
            <>
              {/* Horizontal list of Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creditCards.map((card) => {
                  const isSelected = card.id === selectedCardId;
                  const limitNum = Number(card.creditLimit || 0);

                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`cursor-pointer p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#16202E] to-[#0F1722] border-[#1677FF] shadow-xl shadow-[#1677FF]/15 ring-1 ring-[#1677FF]'
                          : 'bg-[#111821] border-[#1E293B] hover:border-[#2D3A4F] hover:bg-[#141C28]'
                      }`}
                    >
                      {/* Top Bar with brand & actions */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold uppercase shadow-xs"
                            style={{ backgroundColor: card.color || '#1677FF' }}
                          >
                            {card.brand || 'CARD'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-bold text-white truncate max-w-[130px]">
                                {card.name}
                              </h3>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                  card.originType === 'empresa'
                                    ? 'bg-[#820AD1]/20 text-[#C084FC] border-[#820AD1]/40'
                                    : 'bg-[#1677FF]/20 text-[#60A5FA] border-[#1677FF]/40'
                                }`}
                              >
                                {card.originType === 'empresa'
                                  ? card.company?.name || 'Empresa'
                                  : 'Pessoal'}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#8B98A8]">
                              {card.bankAccount ? card.bankAccount.name : 'Sem conta vinculada'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title="Editar Cartão"
                            onClick={() => {
                              setEditingCard(card);
                              setIsCardModalOpen(true);
                            }}
                            className="p-1.5 text-[#8B98A8] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Excluir Cartão"
                            onClick={() => handleDeleteCard(card.id, card.name)}
                            className="p-1.5 text-[#8B98A8] hover:text-red-400 rounded-lg hover:bg-[#1E293B] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Closing & Due Date Badges */}
                      <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-[#0B0F14]/70 border border-[#1E293B]/70 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#8B98A8] block">
                            Fechamento
                          </span>
                          <span className="font-semibold text-white">
                            Dia {card.closingDay}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#8B98A8] block">
                            Vencimento
                          </span>
                          <span className="font-semibold text-[#22C55E]">
                            Dia {card.dueDay}
                          </span>
                        </div>
                      </div>

                      {/* Limit & Selected Indicator */}
                      <div className="pt-2 border-t border-[#1E293B]/50 flex items-center justify-between text-xs">
                        <span className="text-[#8B98A8]">Limite Total:</span>
                        <span className="font-semibold text-white">{formatCurrency(limitNum)}</span>
                      </div>

                      {isSelected && (
                        <div className="mt-2 text-center text-[11px] font-bold text-[#1677FF] flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cartão Ativo</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Card Invoice Details */}
              {selectedCard && (
                <div className="p-6 rounded-2xl bg-[#111821] border border-[#1E293B] shadow-xl space-y-6">
                  {/* Top Bar for Selected Card */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                          Faturas de {selectedCard.name}
                        </h2>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${
                            selectedCard.originType === 'empresa'
                              ? 'bg-[#820AD1]/20 text-[#C084FC] border-[#820AD1]/40'
                              : 'bg-[#1677FF]/20 text-[#60A5FA] border-[#1677FF]/40'
                          }`}
                        >
                          {selectedCard.originType === 'empresa'
                            ? `Empresa: ${selectedCard.company?.name || 'Empresa'}`
                            : 'Cartão Pessoal'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1677FF]/20 text-[#1677FF] border border-[#1677FF]/30">
                          Fechamento todo dia {selectedCard.closingDay}
                        </span>
                      </div>
                      <p className="text-xs text-[#8B98A8] mt-1">
                        Compras somam até a data de fechamento da fatura. As compras após o dia {selectedCard.closingDay} entram na fatura do mês seguinte.
                      </p>
                    </div>

                    {/* New Purchase CTA */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="btn-nova-compra-cartao"
                        onClick={() => setIsPurchaseModalOpen(true)}
                        className="px-4 h-11 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold transition-all shadow-md shadow-[#22C55E]/20 flex items-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>+ NOVA COMPRA NO CARTÃO</span>
                      </button>
                    </div>
                  </div>

                  {/* Invoice Month Selector Chips */}
                  <div>
                    <span className="text-xs font-semibold text-[#8B98A8] block mb-2">
                      SELECIONAR FATURA:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {invoices.length === 0 ? (
                        <div className="text-xs text-[#8B98A8] py-2">
                          Nenhuma compra lançada ainda. Clique em "+ Nova Compra no Cartão" para somar na fatura!
                        </div>
                      ) : (
                        invoices.map((inv) => {
                          const isSel = inv.invoiceMonth === selectedInvoiceMonth;
                          return (
                            <button
                              key={inv.invoiceMonth}
                              type="button"
                              onClick={() => handleSelectInvoiceMonth(inv.invoiceMonth)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border ${
                                isSel
                                  ? 'bg-[#1677FF] text-white border-[#1677FF] shadow-md shadow-[#1677FF]/25'
                                  : 'bg-[#0B0F14] text-[#8B98A8] hover:text-white border-[#1E293B]'
                              }`}
                            >
                              <span>{inv.invoiceMonth}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                  inv.status === 'paga'
                                    ? 'bg-[#22C55E]/20 text-[#22C55E]'
                                    : inv.status === 'fechada'
                                    ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                                    : 'bg-blue-500/20 text-blue-300'
                                }`}
                              >
                                {inv.status}
                              </span>
                              <span className="font-bold">
                                {formatCurrency(inv.totalAmount)}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Active Invoice Highlight Card */}
                  {currentInvoice && (
                    <div className="p-5 rounded-2xl bg-[#0B0F14] border border-[#1E293B] relative overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div>
                          <span className="text-[11px] uppercase font-bold text-[#8B98A8] block mb-1">
                            Fatura de {currentInvoice.invoiceMonth} ({currentInvoice.status.toUpperCase()})
                          </span>
                          <div className="text-3xl font-extrabold text-[#EF4444]">
                            {formatCurrency(currentInvoice.totalAmount)}
                          </div>
                          <p className="text-xs text-[#8B98A8] mt-1">
                            {currentInvoice.purchasesCount} {currentInvoice.purchasesCount === 1 ? 'compra registrada' : 'compras registradas'}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs border-y md:border-y-0 md:border-x border-[#1E293B] py-3 md:py-0 md:px-6">
                          <div className="flex justify-between">
                            <span className="text-[#8B98A8]">Data de Fechamento:</span>
                            <span className="font-semibold text-white">
                              {formatDate(currentInvoice.closingDate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8B98A8]">Vencimento da Fatura:</span>
                            <span className="font-semibold text-[#22C55E]">
                              {formatDate(currentInvoice.dueDate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8B98A8]">Limite do Cartão:</span>
                            <span className="font-semibold text-white">
                              {formatCurrency(selectedCard.creditLimit)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center items-start md:items-end gap-2">
                          {currentInvoice.status === 'paga' ? (
                            <div className="px-4 py-2.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Fatura Quitada com Sucesso</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              id="btn-pagar-fatura"
                              onClick={() => setIsPayInvoiceModalOpen(true)}
                              className="w-full md:w-auto px-5 h-11 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white text-xs font-bold transition-all shadow-md shadow-[#1677FF]/20 flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>PAGAR FATURA / DAR BAIXA</span>
                            </button>
                          )}
                          <span className="text-[11px] text-[#8B98A8]">
                            Débito automático na conta bancária vinculada
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Purchases Table */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-[#1677FF]" />
                        <span>Compras Somadas nesta Fatura ({purchases.length})</span>
                      </h3>
                      {purchases.length > 0 && (
                        <span className="text-xs text-[#8B98A8]">
                          Total da Lista: <strong className="text-white">{formatCurrency(purchases.reduce((acc, p) => acc + Number(p.installmentAmount || p.amount), 0))}</strong>
                        </span>
                      )}
                    </div>

                    {purchases.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-[#0B0F14] border border-[#1E293B] text-xs text-[#8B98A8]">
                        Nenhuma compra encontrada para a fatura de {selectedInvoiceMonth || 'este mês'}.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#0B0F14]">
                        <table className="w-full text-left text-xs text-white">
                          <thead className="bg-[#111821] text-[#8B98A8] uppercase text-[10px] font-bold tracking-wider border-b border-[#1E293B]">
                            <tr>
                              <th className="py-3 px-4">Data Compra</th>
                              <th className="py-3 px-4">Descrição</th>
                              <th className="py-3 px-4">Categoria</th>
                              <th className="py-3 px-4">Origem</th>
                              <th className="py-3 px-4">Parcela</th>
                              <th className="py-3 px-4 text-right">Valor Parcela</th>
                              <th className="py-3 px-4 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E293B]">
                            {purchases.map((p) => {
                              const cat = categories.find((c) => c.id === p.categoryId);
                              const comp = p.companyId ? companies.find((c) => c.id === p.companyId) : null;

                              return (
                                <tr key={p.id} className="hover:bg-[#16202E]/50 transition-colors">
                                  <td className="py-3 px-4 font-mono text-xs">
                                    {formatDate(p.purchaseDate)}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-white">{p.description}</div>
                                    {p.notes && (
                                      <div className="text-[11px] text-[#8B98A8]">{p.notes}</div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded-md bg-[#1E293B] text-xs">
                                      {cat?.name || 'Geral'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-[#8B98A8]">
                                      {p.originType === 'empresa' ? (comp?.name || 'Empresa') : 'Pessoal'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-bold text-[#1677FF]">
                                      {p.installmentNumber} / {p.totalInstallments}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-[#EF4444]">
                                    {formatCurrency(p.installmentAmount || p.amount)}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      title="Excluir Compra"
                                      onClick={() => handleDeletePurchase(p.id)}
                                      className="p-1.5 rounded-lg text-[#8B98A8] hover:text-red-400 hover:bg-[#1E293B] transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SUBTAB 2: CONTAS BANCÁRIAS */}
      {activeSubTab === 'bancos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-5 rounded-2xl bg-[#111821] border border-[#1E293B] relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: acc.color || '#1677FF' }}
                      >
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{acc.name}</h3>
                        <span className="text-[11px] text-[#8B98A8] uppercase tracking-wider">
                          {acc.accountType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBank(acc);
                          setIsBankModalOpen(true);
                        }}
                        className="p-1.5 text-[#8B98A8] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBank(acc.id, acc.name)}
                        className="p-1.5 text-[#8B98A8] hover:text-red-400 rounded-lg hover:bg-[#1E293B] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Saldo Atual */}
                  <div className="my-4 p-3 rounded-xl bg-[#0B0F14] border border-[#1E293B]">
                    <span className="text-[10px] uppercase font-bold text-[#8B98A8] block mb-0.5">
                      Saldo Atual em Caixa
                    </span>
                    <div
                      className={`text-xl font-bold ${
                        Number(acc.currentBalance) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                      }`}
                    >
                      {formatCurrency(acc.currentBalance)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs text-[#8B98A8]">
                  <span>Saldo Inicial: {formatCurrency(acc.initialBalance)}</span>
                  {acc.isDefault && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1677FF]/20 text-[#1677FF] font-bold">
                      Conta Principal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CADASTRAR / EDITAR CARTÃO */}
      {isCardModalOpen && (
        <CardFormModal
          isOpen={isCardModalOpen}
          cardToEdit={editingCard}
          bankAccounts={bankAccounts}
          companies={companies}
          onClose={() => setIsCardModalOpen(false)}
          onSave={async (data) => {
            if (editingCard) {
              await fetchApi(`/api/credit-cards/${editingCard.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
              });
              showToast('Cartão atualizado com sucesso!');
            } else {
              await fetchApi('/api/credit-cards', {
                method: 'POST',
                body: JSON.stringify(data),
              });
              showToast('Cartão cadastrado com sucesso!');
            }
            setIsCardModalOpen(false);
            await onRefresh();
          }}
        />
      )}

      {/* MODAL 2: ADICIONAR COMPRA NO CARTÃO */}
      {isPurchaseModalOpen && selectedCard && (
        <PurchaseFormModal
          isOpen={isPurchaseModalOpen}
          card={selectedCard}
          categories={categories}
          companies={companies}
          onClose={() => setIsPurchaseModalOpen(false)}
          onSave={async (data) => {
            await fetchApi('/api/credit-card-purchases', {
              method: 'POST',
              body: JSON.stringify({ ...data, cardId: selectedCard.id }),
            });
            showToast('Compra no cartão adicionada com sucesso!');
            setIsPurchaseModalOpen(false);
            await loadCardData(selectedCard.id);
            await onRefresh();
          }}
        />
      )}

      {/* MODAL 3: PAGAR FATURA */}
      {isPayInvoiceModalOpen && selectedCard && currentInvoice && (
        <PayInvoiceModal
          isOpen={isPayInvoiceModalOpen}
          card={selectedCard}
          invoice={currentInvoice}
          bankAccounts={bankAccounts}
          onClose={() => setIsPayInvoiceModalOpen(false)}
          onConfirm={async (payData) => {
            await fetchApi('/api/credit-cards/pay-invoice', {
              method: 'POST',
              body: JSON.stringify({
                cardId: selectedCard.id,
                invoiceMonth: currentInvoice.invoiceMonth,
                ...payData,
              }),
            });
            showToast(`Fatura de ${currentInvoice.invoiceMonth} paga com sucesso!`);
            setIsPayInvoiceModalOpen(false);
            await loadCardData(selectedCard.id);
            await onRefresh();
          }}
        />
      )}

      {/* MODAL 4: CADASTRAR / EDITAR CONTA BANCÁRIA */}
      {isBankModalOpen && (
        <BankFormModal
          isOpen={isBankModalOpen}
          bankToEdit={editingBank}
          onClose={() => setIsBankModalOpen(false)}
          onSave={async (data) => {
            if (editingBank) {
              await fetchApi(`/api/bank-accounts/${editingBank.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
              });
              showToast('Conta bancária atualizada com sucesso!');
            } else {
              await fetchApi('/api/bank-accounts', {
                method: 'POST',
                body: JSON.stringify(data),
              });
              showToast('Conta bancária cadastrada com sucesso!');
            }
            setIsBankModalOpen(false);
            await onRefresh();
          }}
        />
      )}
    </div>
  );
};

/* =========================================================================
   SUB-MODALS
========================================================================= */

// Modal: Cadastrar Cartão de Crédito
const CardFormModal: React.FC<{
  isOpen: boolean;
  cardToEdit: CreditCard | null;
  bankAccounts: BankAccount[];
  companies: Company[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ isOpen, cardToEdit, bankAccounts, companies, onClose, onSave }) => {
  const [name, setName] = useState(cardToEdit ? cardToEdit.name : '');
  const [originType, setOriginType] = useState<'pessoal' | 'empresa'>(
    cardToEdit?.originType || 'pessoal'
  );
  const [companyId, setCompanyId] = useState<number | string>(
    cardToEdit?.companyId || (companies.length > 0 ? companies[0].id : '')
  );
  const [closingDay, setClosingDay] = useState(cardToEdit ? cardToEdit.closingDay : 20);
  const [dueDay, setDueDay] = useState(cardToEdit ? cardToEdit.dueDay : 27);
  const [creditLimit, setCreditLimit] = useState(cardToEdit ? cardToEdit.creditLimit : '5000.00');
  const [brand, setBrand] = useState(cardToEdit ? cardToEdit.brand : 'Mastercard');
  const [color, setColor] = useState(cardToEdit ? cardToEdit.color : '#820AD1');
  const [bankAccountId, setBankAccountId] = useState<number | string>(
    cardToEdit ? cardToEdit.bankAccountId || '' : (bankAccounts.length > 0 ? bankAccounts[0].id : '')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do cartão é obrigatório.');
      return;
    }
    if (originType === 'empresa' && !companyId) {
      setError('Por favor, selecione qual empresa este cartão pertence.');
      return;
    }
    const cleanClose = Number(closingDay);
    const cleanDue = Number(dueDay);
    if (cleanClose < 1 || cleanClose > 31 || cleanDue < 1 || cleanDue > 31) {
      setError('Os dias de fechamento e vencimento devem estar entre 1 e 31.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        originType,
        companyId: originType === 'empresa' ? Number(companyId) : null,
        closingDay: cleanClose,
        dueDay: cleanDue,
        creditLimit: parseFloat(creditLimit.toString().replace(',', '.')).toFixed(2),
        brand,
        color,
        bankAccountId: bankAccountId ? Number(bankAccountId) : null,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cartão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#111821] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8B98A8] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 border border-[#1677FF]/30 flex items-center justify-center text-[#1677FF]">
            <CreditCardIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {cardToEdit ? 'EDITAR CARTÃO' : '+ CADASTRAR CARTÃO'}
            </h2>
            <p className="text-xs text-[#8B98A8]">Configurar dia de fechamento e vencimento da fatura</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="card-name">
              Nome do Cartão:
            </label>
            <input
              id="card-name"
              type="text"
              required
              placeholder="Ex: Nubank Platinum, Bradesco Visa Infinite..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
            />
          </div>

          {/* Tipo de Cartão: Pessoal ou Empresa */}
          <div>
            <label className="block font-semibold text-[#8B98A8] mb-1.5">
              Tipo de Cartão (Pessoal ou Empresa):
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                id="card-type-pessoal"
                onClick={() => setOriginType('pessoal')}
                className={`h-11 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  originType === 'pessoal'
                    ? 'bg-[#1677FF] border-[#1677FF] text-white shadow-lg shadow-[#1677FF]/20'
                    : 'bg-[#0B0F14] border-[#2D3A4F] text-[#8B98A8] hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>PESSOAL</span>
              </button>
              <button
                type="button"
                id="card-type-empresa"
                onClick={() => setOriginType('empresa')}
                className={`h-11 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  originType === 'empresa'
                    ? 'bg-[#820AD1] border-[#820AD1] text-white shadow-lg shadow-[#820AD1]/20'
                    : 'bg-[#0B0F14] border-[#2D3A4F] text-[#8B98A8] hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>EMPRESA</span>
              </button>
            </div>

            {originType === 'empresa' && (
              <div className="mt-2 p-3 bg-[#0B0F14] rounded-xl border border-[#2D3A4F] space-y-1">
                <label className="block font-semibold text-[#8B98A8] mb-1" htmlFor="card-company">
                  Qual empresa este cartão pertence:
                </label>
                {companies.length > 0 ? (
                  <select
                    id="card-company"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full h-11 px-3 bg-[#111821] border border-[#2D3A4F] focus:border-[#820AD1] rounded-xl text-sm text-white outline-none"
                  >
                    {companies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-amber-400">
                    Nenhuma empresa cadastrada no sistema. Cadastre uma empresa primeiro no menu Empresas.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="card-close">
                Dia Fechamento:
              </label>
              <input
                id="card-close"
                type="number"
                min="1"
                max="31"
                required
                value={closingDay}
                onChange={(e) => setClosingDay(Number(e.target.value))}
                className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none font-bold"
              />
              <span className="text-[10px] text-[#8B98A8] mt-1 block">
                Compras somam até esta data
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="card-due">
                Dia Vencimento:
              </label>
              <input
                id="card-due"
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value))}
                className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none font-bold text-[#22C55E]"
              />
              <span className="text-[10px] text-[#8B98A8] mt-1 block">
                Data que a fatura vence
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="card-limit">
                Limite Total (R$):
              </label>
              <input
                id="card-limit"
                type="text"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="card-brand">
                Bandeira:
              </label>
              <select
                id="card-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-11 px-3 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
              >
                <option value="Mastercard">Mastercard</option>
                <option value="Visa">Visa</option>
                <option value="Elo">Elo</option>
                <option value="Amex">American Express</option>
                <option value="Hipercard">Hipercard</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="card-bank">
              Conta Bancária Vinculada (para pagamento):
            </label>
            <select
              id="card-bank"
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full h-11 px-3 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
            >
              <option value="">-- Nenhuma conta vinculada --</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Saldo: R$ {Number(b.currentBalance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-xl bg-transparent hover:bg-[#1E293B] text-[#8B98A8] font-semibold"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 h-11 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white font-semibold flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>SALVAR CARTÃO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Adicionar Compra no Cartão
const PurchaseFormModal: React.FC<{
  isOpen: boolean;
  card: CreditCard;
  categories: Category[];
  companies: Company[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ isOpen, card, categories, companies, onClose, onSave }) => {
  const today = new Date().toISOString().split('T')[0];
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [totalInstallments, setTotalInstallments] = useState(1);
  const [categoryId, setCategoryId] = useState<number | string>(
    categories.length > 0 ? categories[0].id : ''
  );
  const [originType, setOriginType] = useState<'pessoal' | 'empresa'>(card.originType || 'pessoal');
  const [companyId, setCompanyId] = useState<number | string>(
    card.companyId || (companies.length > 0 ? companies[0].id : '')
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time calculation of invoice assignment based on closing date
  const calcInvoicePreview = () => {
    if (!purchaseDate) return null;
    const [year, month, day] = purchaseDate.split('-').map(Number);
    const closingDay = card.closingDay;
    const dueDay = card.dueDay;

    let invoiceYear = year;
    let invoiceMonth = month;

    // If purchase day is after closing day, it jumps to the next month invoice!
    const isAfterClosing = day > closingDay;
    if (isAfterClosing) {
      invoiceMonth += 1;
      if (invoiceMonth > 12) {
        invoiceMonth = 1;
        invoiceYear += 1;
      }
    }

    const monthStr = `${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}`;
    return {
      monthStr,
      isAfterClosing,
      closingDay,
      dueDay,
    };
  };

  const preview = calcInvoicePreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }
    const cleanAmount = parseFloat(amount.toString().replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Informe um valor financeiro válido.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        description: description.trim(),
        amount: cleanAmount.toFixed(2),
        purchaseDate,
        totalInstallments: Number(totalInstallments) || 1,
        categoryId: Number(categoryId),
        originType,
        companyId: originType === 'empresa' ? Number(companyId) : null,
        notes: notes.trim() || null,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar compra.');
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'despesa');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-[#111821] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative text-white my-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8B98A8] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              + NOVA COMPRA NO CARTÃO ({card.name})
            </h2>
            <p className="text-xs text-[#8B98A8]">Lançar despesa somando na fatura do cartão</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="purchase-desc">
              Descrição da Compra:
            </label>
            <input
              id="purchase-desc"
              type="text"
              required
              placeholder="Ex: Supermercado Pão de Açúcar, Gasolina Posto Shell..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="purchase-amount">
                Valor Total (R$):
              </label>
              <input
                id="purchase-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="purchase-date">
                Data da Compra:
              </label>
              <input
                id="purchase-date"
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
              />
            </div>
          </div>

          {/* Dynamic Invoice Calculation Feedback Banner */}
          {preview && (
            <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#1677FF]/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#1677FF]" />
                  Fatura Calculada: {preview.monthStr}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  preview.isAfterClosing ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {preview.isAfterClosing ? 'Melhor dia de compra!' : 'Fatura Atual'}
                </span>
              </div>
              <p className="text-[11px] text-[#8B98A8]">
                {preview.isAfterClosing
                  ? `Como a compra foi feita após o dia ${card.closingDay} (fechamento), ela entrará na fatura do mês seguinte (${preview.monthStr}).`
                  : `Como a compra foi feita até o dia ${card.closingDay}, ela soma na fatura corrente de ${preview.monthStr}.`}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="purchase-installments">
                Parcelas:
              </label>
              <select
                id="purchase-installments"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(Number(e.target.value))}
                className="w-full h-11 px-3 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
              >
                <option value={1}>1x à vista (Sem juros)</option>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => (
                  <option key={n} value={n}>
                    {n}x de R${' '}
                    {amount ? (Number(amount) / n).toFixed(2) : '0,00'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="purchase-category">
                Categoria de Despesa:
              </label>
              <select
                id="purchase-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
              >
                {(expenseCategories.length > 0 ? expenseCategories : categories).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Origem Pessoal vs Empresa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5">Origem:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOriginType('pessoal')}
                  className={`h-11 rounded-xl text-xs font-semibold transition-all ${
                    originType === 'pessoal'
                      ? 'bg-[#1677FF] text-white'
                      : 'bg-[#0B0F14] text-[#8B98A8] border border-[#2D3A4F]'
                  }`}
                >
                  Pessoal
                </button>
                <button
                  type="button"
                  onClick={() => setOriginType('empresa')}
                  className={`h-11 rounded-xl text-xs font-semibold transition-all ${
                    originType === 'empresa'
                      ? 'bg-[#1677FF] text-white'
                      : 'bg-[#0B0F14] text-[#8B98A8] border border-[#2D3A4F]'
                  }`}
                >
                  Empresa
                </button>
              </div>
            </div>

            {originType === 'empresa' && (
              <div>
                <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="purchase-company">
                  Empresa:
                </label>
                <select
                  id="purchase-company"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full h-11 px-3 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
                >
                  {companies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="purchase-notes">
              Observações (Opcional):
            </label>
            <input
              id="purchase-notes"
              type="text"
              placeholder="Ex: Comprovante, número do pedido..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-xl bg-transparent hover:bg-[#1E293B] text-[#8B98A8] font-semibold"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 h-11 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>LANÇAR COMPRA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Pagar Fatura do Cartão
const PayInvoiceModal: React.FC<{
  isOpen: boolean;
  card: CreditCard;
  invoice: CreditCardInvoice;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onConfirm: (data: {
    bankAccountId: number;
    settlementDate: string;
    paymentMethod: string;
  }) => Promise<void>;
}> = ({ isOpen, card, invoice, bankAccounts, onClose, onConfirm }) => {
  const today = new Date().toISOString().split('T')[0];
  const [settlementDate, setSettlementDate] = useState(today);
  const [bankAccountId, setBankAccountId] = useState<number | string>(
    card.bankAccountId || (bankAccounts.length > 0 ? bankAccounts[0].id : '')
  );
  const [paymentMethod, setPaymentMethod] = useState('Débito Automático');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedBank = bankAccounts.find((b) => b.id === Number(bankAccountId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountId) {
      setError('Por favor, selecione a conta bancária para débito do pagamento.');
      return;
    }
    if (!settlementDate) {
      setError('Informe a data de pagamento da fatura.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm({
        bankAccountId: Number(bankAccountId),
        settlementDate,
        paymentMethod,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao pagar fatura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#111821] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8B98A8] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">PAGAR FATURA DO CARTÃO</h2>
            <p className="text-xs text-[#8B98A8]">{card.name} — Fatura {invoice.invoiceMonth}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Invoice Summary */}
        <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#1E293B] space-y-2 mb-4 text-xs">
          <div className="flex justify-between">
            <span className="text-[#8B98A8]">Valor da Fatura:</span>
            <span className="text-base font-bold text-[#EF4444]">
              R$ {Number(invoice.totalAmount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8B98A8]">Compras Somadas:</span>
            <span className="text-white">{invoice.purchasesCount} itens</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#1E293B]">
            <span className="text-[#8B98A8]">Vencimento da Fatura:</span>
            <span className="text-[#22C55E] font-semibold">{invoice.dueDate}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="pay-bank">
              Conta Bancária para Débito:
            </label>
            <select
              id="pay-bank"
              required
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full h-11 px-3 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
            >
              <option value="">-- Selecione a conta bancária --</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Saldo: R$ {Number(b.currentBalance).toFixed(2)})
                </option>
              ))}
            </select>
            {selectedBank && (
              <p className="text-[11px] text-[#22C55E] mt-1">
                Saldo após débito da fatura: R$ {(Number(selectedBank.currentBalance) - Number(invoice.totalAmount)).toFixed(2)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="pay-date">
                Data do Pagamento:
              </label>
              <input
                id="pay-date"
                type="date"
                required
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full h-11 px-3 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="pay-method">
                Forma:
              </label>
              <select
                id="pay-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-11 px-3 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
              >
                <option value="Débito Automático">Débito Automático</option>
                <option value="PIX">PIX</option>
                <option value="Boleto Bancário">Boleto Bancário</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-xl bg-transparent hover:bg-[#1E293B] text-[#8B98A8] font-semibold"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 h-11 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>CONFIRMAR PAGAMENTO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Cadastrar / Editar Conta Bancária
const BankFormModal: React.FC<{
  isOpen: boolean;
  bankToEdit: BankAccount | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ isOpen, bankToEdit, onClose, onSave }) => {
  const [name, setName] = useState(bankToEdit ? bankToEdit.name : '');
  const [accountType, setAccountType] = useState<BankAccountType>(bankToEdit ? bankToEdit.accountType : 'corrente');
  const [initialBalance, setInitialBalance] = useState(bankToEdit ? bankToEdit.initialBalance : '0.00');
  const [color, setColor] = useState(bankToEdit ? bankToEdit.color : '#1677FF');
  const [isDefault, setIsDefault] = useState(bankToEdit ? bankToEdit.isDefault : false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da conta bancária é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        accountType,
        initialBalance: parseFloat(initialBalance.toString().replace(',', '.')).toFixed(2),
        color,
        isDefault,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar conta bancária.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#111821] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8B98A8] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {bankToEdit ? 'EDITAR CONTA BANCÁRIA' : '+ CADASTRAR CONTA BANCÁRIA'}
            </h2>
            <p className="text-xs text-[#8B98A8]">Registrar banco ou carteira para movimentações financeiras</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="bank-name">
              Nome do Banco / Conta:
            </label>
            <input
              id="bank-name"
              type="text"
              required
              placeholder="Ex: Nubank, Bradesco, Itaú, Dinheiro Caixa..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="bank-type">
                Tipo de Conta:
              </label>
              <select
                id="bank-type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as BankAccountType)}
                className="w-full h-11 px-3 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="investimento">Investimento</option>
                <option value="carteira">Dinheiro Físico / Caixa</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#8B98A8] mb-1.5" htmlFor="bank-initial-balance">
                Saldo Inicial (R$):
              </label>
              <input
                id="bank-initial-balance"
                type="number"
                step="0.01"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white font-bold outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="bank-default"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded-sm border-[#2D3A4F] text-[#1677FF] focus:ring-0 bg-[#0B0F14]"
            />
            <label htmlFor="bank-default" className="text-[#8B98A8] font-medium cursor-pointer">
              Definir como conta bancária padrão para baixas e pagamentos
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-xl bg-transparent hover:bg-[#1E293B] text-[#8B98A8] font-semibold"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 h-11 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>SALVAR CONTA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
