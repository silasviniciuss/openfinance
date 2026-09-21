import React, { useState } from 'react';
import { Transaction } from '../types.ts';
import { CheckCircle2, Calendar, DollarSign, X, AlertTriangle } from 'lucide-react';

interface SettleModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settlementDate: string) => Promise<void>;
}

export const SettleModal: React.FC<SettleModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [settlementDate, setSettlementDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isExpense = transaction.type === 'pagar';
  const verb = isExpense ? 'Pagamento' : 'Recebimento';
  const actionText = isExpense ? 'Confirmar Pagamento' : 'Confirmar Recebimento';

  // Calculate days of difference between settlement and due date
  const due = new Date(transaction.dueDate + 'T00:00:00');
  const settle = new Date(settlementDate + 'T00:00:00');
  const diffTime = settle.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementDate) {
      setError('Por favor, selecione a data efetiva da baixa.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(settlementDate);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao dar baixa na conta.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
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
            <h2 className="text-lg font-bold text-white">DAR BAIXA</h2>
            <p className="text-xs text-[#8B98A8]">Registrar {verb.toLowerCase()} efetivo da conta</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Transaction Summary Card */}
        <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#1E293B] space-y-2.5 mb-5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8B98A8]">Conta:</span>
            <span className="font-semibold text-white truncate max-w-[200px]">
              {transaction.description}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8B98A8]">Origem:</span>
            <span className="text-white">
              {transaction.originType === 'empresa'
                ? transaction.company?.name || 'Empresa'
                : 'Pessoal'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8B98A8]">Categoria:</span>
            <span className="text-white">{transaction.category?.name || 'Geral'}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8B98A8]">Valor:</span>
            <span className={`text-base font-bold ${isExpense ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
              {formatCurrency(transaction.amount)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pt-2 border-t border-[#1E293B]">
            <span className="text-[#8B98A8]">Vencimento original:</span>
            <span className="font-medium text-white">{formatDate(transaction.dueDate)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5" htmlFor="settle-date">
              Data Efetiva de {verb}:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#8B98A8] absolute left-3.5 top-3.5" />
              <input
                id="settle-date"
                type="date"
                required
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>

          {/* Overdue / On-time feedback indicator */}
          <div className="p-3 rounded-xl bg-[#1A2332] border border-[#2D3A4F] text-xs">
            {diffDays > 0 ? (
              <div className="flex items-center gap-2 text-[#F59E0B]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Atraso de <strong>{diffDays} {diffDays === 1 ? 'dia' : 'dias'}</strong> em relação ao vencimento.
                </span>
              </div>
            ) : diffDays === 0 ? (
              <span className="text-[#22C55E]">
                Baixa realizada exatamente na data de vencimento.
              </span>
            ) : (
              <span className="text-[#22C55E]">
                Baixa antecipada em {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'dia' : 'dias'}!
              </span>
            )}
            <p className="text-[11px] text-[#8B98A8] mt-1">
              O vencimento original de {formatDate(transaction.dueDate)} será preservado no banco de dados.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-xl bg-transparent hover:bg-[#1A2332] text-[#8B98A8] hover:text-white text-sm font-medium transition-colors"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              id="btn-confirm-settle"
              disabled={loading}
              className="px-5 h-11 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-semibold transition-all shadow-md shadow-[#22C55E]/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>CONFIRMAR BAIXA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
