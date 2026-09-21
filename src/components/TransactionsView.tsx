import React, { useState } from 'react';
import { Transaction, Company, Category, TransactionStatus } from '../types.ts';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Edit2,
  RotateCcw,
  History,
  Building2,
  Calendar,
  FileText,
  PlusCircle,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  companies: Company[];
  categories: Category[];
  filters: {
    originType?: string;
    companyId?: string;
    type?: string;
    categoryId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
  onFilterChange: (newFilters: any) => void;
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onSettleClick: (tx: Transaction) => void;
  onCancelClick: (tx: Transaction) => void;
  onReopenClick: (tx: Transaction) => void;
  onHistoryClick: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  companies,
  categories,
  filters,
  onFilterChange,
  onOpenNewTransaction,
  onEditTransaction,
  onSettleClick,
  onCancelClick,
  onReopenClick,
  onHistoryClick,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const formatCurrency = (val: string | number) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const calculateDaysDiff = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr + 'T00:00:00');
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchInput.trim() || undefined });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    onFilterChange({});
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111821] p-4 rounded-2xl border border-[#1E293B]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Contas Financeiras</h1>
          <p className="text-xs text-[#8B98A8]">
            Controle individual de contas a pagar e a receber
          </p>
        </div>

        <button
          type="button"
          id="btn-add-account-view"
          onClick={onOpenNewTransaction}
          className="h-10 px-4 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white text-xs font-semibold transition-all shadow-md shadow-[#1677FF]/25 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ NOVA CONTA</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#111821] p-4 rounded-2xl border border-[#1E293B] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8B98A8] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por descrição, observações..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-xs text-white placeholder-[#4B5565] outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 h-10 bg-[#1A2332] hover:bg-[#243044] text-white text-xs font-medium rounded-xl border border-[#2D3A4F] transition-colors"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 h-10 text-xs text-[#8B98A8] hover:text-white transition-colors"
          >
            Limpar
          </button>
        </form>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#1E293B]">
          {/* Origem */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Origem
            </label>
            <select
              value={
                filters.originType === 'pessoal'
                  ? 'pessoal'
                  : filters.companyId
                  ? `company-${filters.companyId}`
                  : 'all'
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  onFilterChange({ ...filters, originType: undefined, companyId: undefined });
                } else if (val === 'pessoal') {
                  onFilterChange({ ...filters, originType: 'pessoal', companyId: undefined });
                } else if (val.startsWith('company-')) {
                  const cId = val.replace('company-', '');
                  onFilterChange({ ...filters, originType: 'empresa', companyId: cId });
                }
              }}
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            >
              <option value="all">Todas as Origens</option>
              <option value="pessoal">Pessoal</option>
              {companies.map((c) => (
                <option key={c.id} value={`company-${c.id}`}>
                  Empresa: {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Tipo
            </label>
            <select
              value={filters.type || 'all'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  type: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            >
              <option value="all">Todos os Tipos</option>
              <option value="pagar">A Pagar (Despesa)</option>
              <option value="receber">A Receber (Receita)</option>
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Categoria
            </label>
            <select
              value={filters.categoryId || 'all'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  categoryId: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'despesa' ? 'Desp.' : 'Rec.'})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  status: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Atrasado</option>
              <option value="settled">Baixado (Pago/Recebido)</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Data Inicial */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Data De
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value || undefined })}
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            />
          </div>

          {/* Data Final */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Data Até
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value || undefined })}
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table (Responsive desktop table + mobile cards) */}
      <div className="bg-[#111821] rounded-2xl border border-[#1E293B] overflow-hidden">
        {transactions.length === 0 ? (
          <div className="py-16 text-center text-[#8B98A8]">
            <FileText className="w-10 h-10 mx-auto opacity-20 mb-3" />
            <p className="text-sm font-semibold text-white">Nenhuma conta encontrada</p>
            <p className="text-xs text-[#8B98A8] mt-1 max-w-sm mx-auto">
              Nenhum lançamento corresponde aos filtros selecionados. Clique em "+ NOVA CONTA" para cadastrar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white border-collapse">
              <thead>
                <tr className="bg-[#0B0F14] border-b border-[#1E293B] text-[11px] font-semibold text-[#8B98A8] uppercase tracking-wider">
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Baixa Efetiva</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {transactions.map((tx) => {
                  const isExpense = tx.type === 'pagar';
                  const daysDiff = calculateDaysDiff(tx.dueDate);
                  const isOverdue = tx.status === 'pending' && daysDiff > 0;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#141D29] transition-colors group"
                    >
                      {/* Origem */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.originType === 'empresa' ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#1677FF]" />
                            <span className="font-medium text-white">{tx.company?.name || 'Empresa'}</span>
                          </div>
                        ) : (
                          <span className="text-[#8B98A8] font-medium">Pessoal</span>
                        )}
                      </td>

                      {/* Descrição */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white max-w-xs truncate">
                          {tx.description}
                        </div>
                        {tx.notes && (
                          <p className="text-[10px] text-[#8B98A8] truncate max-w-xs">{tx.notes}</p>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#1A2332] text-[#8B98A8] text-[11px] font-medium">
                          {tx.category?.name || 'Geral'}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            isExpense ? 'text-[#EF4444]' : 'text-[#22C55E]'
                          }`}
                        >
                          {isExpense ? 'A Pagar' : 'A Receber'}
                        </span>
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-bold text-sm ${
                            isExpense ? 'text-[#EF4444]' : 'text-[#22C55E]'
                          }`}
                        >
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Vencimento (Preservado) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-white font-medium">
                        {formatDate(tx.dueDate)}
                      </td>

                      {/* Baixa Efetiva */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.settlementDate ? (
                          <span className="text-[#22C55E] font-medium">
                            {formatDate(tx.settlementDate)}
                          </span>
                        ) : (
                          <span className="text-[#8B98A8]">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.status === 'settled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {isExpense ? 'Pago' : 'Recebido'}
                          </span>
                        ) : tx.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#8B98A8]/15 text-[#8B98A8] border border-[#8B98A8]/30">
                            <Ban className="w-3 h-3" />
                            Cancelado
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                            <AlertTriangle className="w-3 h-3" />
                            Atrasada ({daysDiff}d)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                            <Clock className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {tx.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => onSettleClick(tx)}
                              className="px-2.5 py-1 rounded-lg bg-[#22C55E]/15 hover:bg-[#22C55E] text-[#22C55E] hover:text-white border border-[#22C55E]/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Dar Baixa na Conta"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>BAIXAR</span>
                            </button>
                          )}

                          {tx.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 rounded-lg bg-[#1A2332] hover:bg-[#253349] text-[#8B98A8] hover:text-white transition-colors"
                              title="Editar Conta"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {tx.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => onCancelClick(tx)}
                              className="p-1.5 rounded-lg bg-[#1A2332] hover:bg-red-500/20 text-[#8B98A8] hover:text-[#EF4444] transition-colors"
                              title="Cancelar Conta"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {(tx.status === 'settled' || tx.status === 'cancelled') && (
                            <button
                              type="button"
                              onClick={() => onReopenClick(tx)}
                              className="px-2 py-1 rounded-lg bg-[#1A2332] hover:bg-[#243044] text-xs text-[#8B98A8] hover:text-white transition-colors flex items-center gap-1"
                              title="Reabrir Conta para Pendente"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reabrir</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onHistoryClick(tx)}
                            className="p-1.5 rounded-lg bg-[#1A2332] hover:bg-[#253349] text-[#8B98A8] hover:text-white transition-colors"
                            title="Ver Histórico de Auditoria"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
  );
};
