import React, { useState, useEffect } from 'react';
import { Company, Category, Transaction, TransactionType, OriginType } from '../types.ts';
import {
  X,
  PlusCircle,
  Calendar,
  Building2,
  DollarSign,
  Repeat,
  FileText,
  CreditCard,
  Layers,
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  companies: Company[];
  categories: Category[];
  onCreateCategoryQuick: (name: string, type: 'despesa' | 'receita') => Promise<Category>;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  companies,
  categories,
  onCreateCategoryQuick,
  transactionToEdit,
}) => {
  const isEditing = !!transactionToEdit;

  const [type, setType] = useState<TransactionType>('pagar');
  const [originType, setOriginType] = useState<OriginType>('pessoal');
  const [companyId, setCompanyId] = useState<number | string>('');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [notes, setNotes] = useState('');

  // Quick category creation inline
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  // Recurrence (only for new transactions)
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'mensal' | 'semanal' | 'anual'>('mensal');
  const [totalOccurrences, setTotalOccurrences] = useState(12);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setOriginType(transactionToEdit.originType);
      setCompanyId(transactionToEdit.companyId || '');
      setCategoryId(transactionToEdit.categoryId);
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount);
      setDueDate(transactionToEdit.dueDate);
      setPaymentMethod(transactionToEdit.paymentMethod || 'PIX');
      setNotes(transactionToEdit.notes || '');
      setIsRecurring(false);
    } else {
      setType('pagar');
      setOriginType('pessoal');
      setCompanyId(companies.length > 0 ? companies[0].id : '');
      setDescription('');
      setAmount('');
      const today = new Date().toISOString().split('T')[0];
      setDueDate(today);
      setPaymentMethod('PIX');
      setNotes('');
      setIsRecurring(false);
      setTotalOccurrences(12);
    }
  }, [transactionToEdit, companies, isOpen]);

  // Filter categories by type:
  // "Ao cadastrar uma conta a pagar, somente categorias de despesa deverão ser apresentadas."
  // "Ao cadastrar uma conta a receber, somente categorias de receita deverão ser apresentadas."
  const availableCategories = categories.filter((c) => {
    if (type === 'pagar') return c.type === 'despesa';
    if (type === 'receber') return c.type === 'receita';
    return true;
  });

  // Automatically select first matching category if current categoryId is not in available
  useEffect(() => {
    if (!transactionToEdit && availableCategories.length > 0) {
      const match = availableCategories.find((c) => c.id === Number(categoryId));
      if (!match) {
        setCategoryId(availableCategories[0].id);
      }
    }
  }, [type, categories]);

  if (!isOpen) return null;

  const handleQuickAddCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const created = await onCreateCategoryQuick(
        newCatName.trim(),
        type === 'pagar' ? 'despesa' : 'receita'
      );
      setCategoryId(created.id);
      setNewCatName('');
      setShowNewCatInput(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar categoria.');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }
    const cleanAmount = parseFloat(amount.toString().replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Por favor, informe um valor financeiro válido.');
      return;
    }
    if (!dueDate) {
      setError('A data de vencimento é obrigatória.');
      return;
    }
    if (originType === 'empresa' && !companyId) {
      setError('Selecione uma empresa.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        type,
        originType,
        companyId: originType === 'empresa' ? Number(companyId) : null,
        categoryId: Number(categoryId),
        description: description.trim(),
        amount: cleanAmount.toFixed(2),
        dueDate,
        paymentMethod,
        notes: notes.trim() || null,
      };

      if (!isEditing && isRecurring) {
        payload.isRecurring = true;
        payload.frequency = frequency;
        payload.totalOccurrences = totalOccurrences;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-[#111821] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative text-white my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1677FF] flex items-center justify-center text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'EDITAR CONTA' : '+ NOVA CONTA'}
              </h2>
              <p className="text-xs text-[#8B98A8]">
                {isEditing
                  ? 'Atualizar dados do lançamento financeiro'
                  : 'Cadastro individual de conta a pagar ou receber'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8B98A8] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 py-4 pr-1 flex-1">
          {/* 11.1 Tipo da Conta */}
          <div>
            <label className="block text-xs font-semibold text-[#8B98A8] mb-2 uppercase tracking-wider">
              1. Tipo da Conta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="type-pagar"
                onClick={() => setType('pagar')}
                className={`h-11 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  type === 'pagar'
                    ? 'bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444] shadow-md shadow-[#EF4444]/10'
                    : 'bg-[#0B0F14] border-[#1E293B] text-[#8B98A8] hover:border-[#2D3A4F]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span>Conta a Pagar (Despesa)</span>
              </button>

              <button
                type="button"
                id="type-receber"
                onClick={() => setType('receber')}
                className={`h-11 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  type === 'receber'
                    ? 'bg-[#22C55E]/15 border-[#22C55E] text-[#22C55E] shadow-md shadow-[#22C55E]/10'
                    : 'bg-[#0B0F14] border-[#1E293B] text-[#8B98A8] hover:border-[#2D3A4F]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                <span>Conta a Receber (Receita)</span>
              </button>
            </div>
          </div>

          {/* 11.2 Origem */}
          <div>
            <label className="block text-xs font-semibold text-[#8B98A8] mb-2 uppercase tracking-wider">
              2. Origem da Conta
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                id="origin-pessoal"
                onClick={() => setOriginType('pessoal')}
                className={`h-10 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-2 ${
                  originType === 'pessoal'
                    ? 'bg-[#1677FF]/15 border-[#1677FF] text-[#1677FF] font-semibold'
                    : 'bg-[#0B0F14] border-[#1E293B] text-[#8B98A8] hover:border-[#2D3A4F]'
                }`}
              >
                <span>Pessoal</span>
              </button>

              <button
                type="button"
                id="origin-empresa"
                onClick={() => setOriginType('empresa')}
                className={`h-10 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-2 ${
                  originType === 'empresa'
                    ? 'bg-[#1677FF]/15 border-[#1677FF] text-[#1677FF] font-semibold'
                    : 'bg-[#0B0F14] border-[#1E293B] text-[#8B98A8] hover:border-[#2D3A4F]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresa</span>
              </button>
            </div>

            {/* If Empresa, select company */}
            {originType === 'empresa' && (
              <div>
                <label className="block text-xs text-[#8B98A8] mb-1 font-medium" htmlFor="select-company">
                  Selecione a Empresa
                </label>
                {companies.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300">
                    Você ainda não possui empresas cadastradas. Acesse "Minhas Empresas" no menu lateral para adicionar uma ou crie como Pessoal.
                  </div>
                ) : (
                  <select
                    id="select-company"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.cnpj ? `(${c.cnpj})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* 11.3 Categoria */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#8B98A8] uppercase tracking-wider" htmlFor="select-category">
                3. Categoria ({type === 'pagar' ? 'Despesa' : 'Receita'})
              </label>
              <button
                type="button"
                onClick={() => setShowNewCatInput(!showNewCatInput)}
                className="text-xs text-[#1677FF] hover:underline font-medium flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" />
                <span>+ Nova categoria</span>
              </button>
            </div>

            {showNewCatInput && (
              <div className="mb-3 p-3 rounded-xl bg-[#1A2332] border border-[#2D3A4F] flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Nome da nova categoria de ${type === 'pagar' ? 'despesa' : 'receita'}`}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 h-9 px-3 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleQuickAddCategory}
                  disabled={creatingCat || !newCatName.trim()}
                  className="px-3 h-9 rounded-lg bg-[#1677FF] text-xs text-white font-medium hover:bg-[#0D5ED7] disabled:opacity-50"
                >
                  {creatingCat ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            )}

            <select
              id="select-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
            >
              {availableCategories.length === 0 ? (
                <option value="">Nenhuma categoria cadastrada</option>
              ) : (
                availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 11.4 Descrição */}
          <div>
            <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5 uppercase tracking-wider" htmlFor="tx-desc">
              4. Descrição
            </label>
            <input
              id="tx-desc"
              type="text"
              required
              placeholder="Ex: Internet Vivo, Aluguel do Escritório, Cliente João..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white placeholder-[#4B5565] outline-none"
            />
          </div>

          {/* 11.5 Valor & 11.6 Vencimento (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5 uppercase tracking-wider" htmlFor="tx-val">
                5. Valor (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-bold text-[#8B98A8]">
                  R$
                </span>
                <input
                  id="tx-val"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white font-semibold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5 uppercase tracking-wider" htmlFor="tx-due">
                6. Data de Vencimento
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#8B98A8] absolute left-3.5 top-3.5" />
                <input
                  id="tx-due"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Forma de Pagamento & Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5 uppercase tracking-wider" htmlFor="payment-method">
                Forma de Pagamento
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
              >
                <option value="PIX">PIX</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Transferência (TED/DOC)">Transferência (TED/DOC)</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5 uppercase tracking-wider" htmlFor="tx-notes">
                Observações (Opcional)
              </label>
              <input
                id="tx-notes"
                type="text"
                placeholder="Ex: Nota fiscal nº 450, contrato..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white placeholder-[#4B5565] outline-none"
              />
            </div>
          </div>

          {/* 31. Recorrência (Only for new transactions) */}
          {!isEditing && (
            <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-[#1677FF]" />
                  <span className="text-xs font-semibold text-white">Conta Recorrente</span>
                </div>
                <input
                  type="checkbox"
                  id="chk-recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 accent-[#1677FF] rounded cursor-pointer"
                />
              </div>

              {isRecurring && (
                <div className="pt-2 border-t border-[#1E293B] grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#8B98A8] mb-1">Frequência</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="w-full h-9 px-2 bg-[#111821] border border-[#2D3A4F] rounded-lg text-white outline-none"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="semanal">Semanal</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#8B98A8] mb-1">Total de Meses / Parcelas</label>
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={totalOccurrences}
                      onChange={(e) => setTotalOccurrences(Number(e.target.value))}
                      className="w-full h-9 px-2 bg-[#111821] border border-[#2D3A4F] rounded-lg text-white outline-none"
                    />
                  </div>

                  <div className="col-span-2 text-[11px] text-[#8B98A8]">
                    O sistema irá gerar automaticamente as <strong>{totalOccurrences} contas individuais</strong> com as respectivas datas de vencimento sucessivas.
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-11 rounded-xl bg-transparent hover:bg-[#1A2332] text-[#8B98A8] hover:text-white text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-save-transaction"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 h-11 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white text-sm font-semibold transition-all shadow-md shadow-[#1677FF]/25 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            <span>{isEditing ? 'Salvar Alterações' : 'Salvar Conta'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
