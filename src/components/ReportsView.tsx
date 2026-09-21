import React, { useState, useEffect } from 'react';
import { Company, Category, Transaction } from '../types.ts';
import {
  BarChart3,
  Calendar,
  Filter,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

interface ReportsViewProps {
  companies: Company[];
  categories: Category[];
  fetchReportData: (filters: any) => Promise<any>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  companies,
  categories,
  fetchReportData,
}) => {
  const [dateField, setDateField] = useState<'dueDate' | 'settlementDate'>('dueDate');
  const [periodPreset, setPeriodPreset] = useState<'current_month' | 'last_month' | 'current_year' | 'custom'>('current_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [originType, setOriginType] = useState('all');
  const [companyId, setCompanyId] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Set date ranges according to presets
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    if (periodPreset === 'current_month') {
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (periodPreset === 'last_month') {
      const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (periodPreset === 'current_year') {
      const firstDay = `${year}-01-01`;
      const lastDay = `${year}-12-31`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  }, [periodPreset]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const filters: any = {
        dateField,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type: type === 'all' ? undefined : type,
        categoryId: categoryId === 'all' ? undefined : Number(categoryId),
        status: status === 'all' ? undefined : status,
      };
      if (originType === 'pessoal') {
        filters.originType = 'pessoal';
      } else if (originType === 'empresa') {
        filters.originType = 'empresa';
        if (companyId) filters.companyId = Number(companyId);
      }

      const res = await fetchReportData(filters);
      setReportData(res);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadReport();
    }
  }, [dateField, startDate, endDate, originType, companyId, categoryId, type, status]);

  const formatCurrency = (val: number | string | undefined) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111821] p-4 rounded-2xl border border-[#1E293B]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Relatórios Financeiros</h1>
          <p className="text-xs text-[#8B98A8]">
            Análise detalhada por competência (vencimento) ou caixa (baixa efetiva)
          </p>
        </div>

        {/* Date Mode Toggle (PRD 30.1) */}
        <div className="flex bg-[#0B0F14] p-1 rounded-xl border border-[#2D3A4F] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDateField('dueDate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              dateField === 'dueDate'
                ? 'bg-[#1677FF] text-white'
                : 'text-[#8B98A8] hover:text-white'
            }`}
          >
            Por Vencimento
          </button>
          <button
            type="button"
            onClick={() => setDateField('settlementDate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              dateField === 'settlementDate'
                ? 'bg-[#1677FF] text-white'
                : 'text-[#8B98A8] hover:text-white'
            }`}
          >
            Por Data de Baixa
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-[#111821] p-4 rounded-2xl border border-[#1E293B] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-1">
          <Filter className="w-3.5 h-3.5 text-[#1677FF]" />
          <span>Filtros do Relatório</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Período Preset */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Período
            </label>
            <select
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value as any)}
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            >
              <option value="current_month">Mês Atual</option>
              <option value="last_month">Mês Anterior</option>
              <option value="current_year">Ano Atual</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {/* Data De */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPeriodPreset('custom');
                setStartDate(e.target.value);
              }}
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            />
          </div>

          {/* Data Até */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPeriodPreset('custom');
                setEndDate(e.target.value);
              }}
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            />
          </div>

          {/* Origem */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Origem
            </label>
            <select
              value={originType}
              onChange={(e) => {
                setOriginType(e.target.value);
                if (e.target.value !== 'empresa') setCompanyId('');
              }}
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            >
              <option value="all">Consolidado (Tudo)</option>
              <option value="pessoal">Pessoal</option>
              <option value="empresa">Empresarial</option>
            </select>
          </div>

          {/* Empresa (if empresarial) */}
          {originType === 'empresa' && (
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
                Empresa
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
              >
                <option value="">Todas as Empresas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            >
              <option value="all">Receitas e Despesas</option>
              <option value="pagar">Apenas Despesas</option>
              <option value="receber">Apenas Receitas</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B98A8] mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 px-2 bg-[#0B0F14] border border-[#2D3A4F] rounded-lg text-xs text-white outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="settled">Baixadas (Pagas/Recebidas)</option>
              <option value="pending">Pendentes</option>
              <option value="overdue">Atrasadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* 30.2 Totais do Relatório */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-[#111821] p-4 rounded-2xl border border-[#1E293B]">
          <span className="text-[11px] font-semibold text-[#8B98A8] uppercase tracking-wider block mb-1">
            Total Receitas
          </span>
          <div className="text-xl font-bold text-[#22C55E]">
            {formatCurrency(reportData?.totalRevenue)}
          </div>
          <span className="text-[10px] text-[#8B98A8]">
            Recebido efetivo: {formatCurrency(reportData?.totalReceived)}
          </span>
        </div>

        <div className="bg-[#111821] p-4 rounded-2xl border border-[#1E293B]">
          <span className="text-[11px] font-semibold text-[#8B98A8] uppercase tracking-wider block mb-1">
            Total Despesas
          </span>
          <div className="text-xl font-bold text-[#EF4444]">
            {formatCurrency(reportData?.totalExpense)}
          </div>
          <span className="text-[10px] text-[#8B98A8]">
            Pago efetivo: {formatCurrency(reportData?.totalPaid)}
          </span>
        </div>

        <div className="bg-[#111821] p-4 rounded-2xl border border-[#1E293B]">
          <span className="text-[11px] font-semibold text-[#8B98A8] uppercase tracking-wider block mb-1">
            Saldo Realizado
          </span>
          <div
            className={`text-xl font-bold ${
              (reportData?.balance || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
            }`}
          >
            {formatCurrency(reportData?.balance)}
          </div>
          <span className="text-[10px] text-[#8B98A8]">Efetivamente realizado</span>
        </div>

        <div className="bg-[#111821] p-4 rounded-2xl border border-[#1E293B]">
          <span className="text-[11px] font-semibold text-[#8B98A8] uppercase tracking-wider block mb-1">
            Contas Atrasadas
          </span>
          <div className="text-xl font-bold text-[#F59E0B]">
            {formatCurrency(reportData?.totalOverdue)}
          </div>
          <span className="text-[10px] text-[#8B98A8]">Pendentes além do vencimento</span>
        </div>
      </div>

      {/* Relatório Detalhado Tabela */}
      <div className="bg-[#111821] rounded-2xl border border-[#1E293B] overflow-hidden">
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Lançamentos do Período</h2>
          <span className="text-xs text-[#8B98A8]">
            {reportData?.transactions?.length || 0} lançamentos encontrados
          </span>
        </div>

        {reportData?.transactions && reportData.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white border-collapse">
              <thead>
                <tr className="bg-[#0B0F14] border-b border-[#1E293B] text-[11px] font-semibold text-[#8B98A8] uppercase">
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Data de Baixa</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {reportData.transactions.map((tx: Transaction) => {
                  const isExpense = tx.type === 'pagar';
                  return (
                    <tr key={tx.id} className="hover:bg-[#141D29]">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.originType === 'empresa' ? tx.company?.name || 'Empresa' : 'Pessoal'}
                      </td>
                      <td className="py-3 px-4 font-semibold">{tx.description}</td>
                      <td className="py-3 px-4 text-[#8B98A8]">{tx.category?.name}</td>
                      <td
                        className={`py-3 px-4 font-semibold ${
                          isExpense ? 'text-[#EF4444]' : 'text-[#22C55E]'
                        }`}
                      >
                        {isExpense ? 'Despesa' : 'Receita'}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold ${
                          isExpense ? 'text-[#EF4444]' : 'text-[#22C55E]'
                        }`}
                      >
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4">{formatDate(tx.dueDate)}</td>
                      <td className="py-3 px-4 text-[#22C55E]">
                        {formatDate(tx.settlementDate)}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            tx.status === 'settled'
                              ? 'bg-[#22C55E]/15 text-[#22C55E]'
                              : tx.status === 'cancelled'
                              ? 'bg-gray-500/15 text-gray-400'
                              : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                          }`}
                        >
                          {tx.status === 'settled'
                            ? isExpense
                              ? 'Pago'
                              : 'Recebido'
                            : tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-[#8B98A8] text-xs">
            Nenhum dado encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
