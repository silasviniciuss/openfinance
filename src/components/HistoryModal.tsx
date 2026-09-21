import React from 'react';
import { Transaction, TransactionHistoryRecord } from '../types.ts';
import { History, X, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface HistoryModalProps {
  transaction: Transaction | null;
  history: TransactionHistoryRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  transaction,
  history,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#111821] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8B98A8] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 border border-[#1677FF]/30 flex items-center justify-center text-[#1677FF]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Histórico e Auditoria</h2>
            <p className="text-xs text-[#8B98A8] truncate max-w-xs">{transaction.description}</p>
          </div>
        </div>

        {/* Account Basic Info */}
        <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-[#1E293B] grid grid-cols-2 gap-2 text-xs mb-4">
          <div>
            <span className="text-[#8B98A8]">Vencimento Original:</span>
            <p className="font-semibold text-white">{transaction.dueDate}</p>
          </div>
          <div>
            <span className="text-[#8B98A8]">Data Efetiva de Baixa:</span>
            <p className="font-semibold text-[#22C55E]">
              {transaction.settlementDate || 'Não baixada'}
            </p>
          </div>
          <div>
            <span className="text-[#8B98A8]">Status Atual:</span>
            <p className="font-semibold text-white uppercase">{transaction.status}</p>
          </div>
          <div>
            <span className="text-[#8B98A8]">Criado em:</span>
            <p className="text-[#8B98A8]">{formatDate(transaction.createdAt)}</p>
          </div>
        </div>

        {/* History Timeline */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <p className="text-xs text-center py-6 text-[#8B98A8]">
              Nenhuma alteração registrada além da criação inicial.
            </p>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="p-3 rounded-xl bg-[#0B0F14] border border-[#1E293B] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1677FF] uppercase tracking-wider text-[10px]">
                    {record.action}
                  </span>
                  <span className="text-[10px] text-[#8B98A8] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(record.createdAt)}
                  </span>
                </div>

                {record.fieldName && (
                  <p className="text-[#8B98A8]">
                    Campo: <strong className="text-white">{record.fieldName}</strong>
                  </p>
                )}

                {(record.oldValue || record.newValue) && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1E293B] text-[11px]">
                    <div className="text-red-400">
                      <span>Antes: </span>
                      <span>{record.oldValue || '—'}</span>
                    </div>
                    <div className="text-emerald-400">
                      <span>Depois: </span>
                      <span>{record.newValue || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-[#1E293B] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-xl bg-[#1A2332] text-xs text-white font-medium hover:bg-[#253349] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
