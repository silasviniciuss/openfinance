import React, { useState, useEffect } from 'react';
import { Company, DashboardOverview, Transaction } from '../types.ts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Building2,
  UserCheck,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardViewProps {
  overview: DashboardOverview | null;
  companies: Company[];
  selectedOrigin: string; // 'all' | 'pessoal' | companyId
  onSelectOrigin: (origin: string) => void;
  onSettleClick: (transaction: Transaction) => void;
  onNavigateToContas: (filter?: any) => void;
  onOpenNewTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  companies,
  selectedOrigin,
  onSelectOrigin,
  onSettleClick,
  onNavigateToContas,
  onOpenNewTransaction,
}) => {
  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  const calculateDaysOverdue = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr + 'T00:00:00');
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6">
      {/* 19.1 Top Bar Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111821] p-4 rounded-2xl border border-[#1E293B]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Dashboard Financeiro</h1>
          <p className="text-xs text-[#8B98A8]">
            Visão consolidada e controle de contas a pagar e receber
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8B98A8] font-medium hidden sm:inline" htmlFor="origin-filter-select">
            Visualização:
          </label>
          <div className="relative">
            <select
              id="origin-filter-select"
              value={selectedOrigin}
              onChange={(e) => onSelectOrigin(e.target.value)}
              className="appearance-none h-10 pl-3.5 pr-9 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-xs font-semibold text-white outline-none cursor-pointer"
            >
              <option value="all">Todas (Consolidado)</option>
              <option value="pessoal">Pessoal</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#8B98A8] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 20. Cards Principais & 21. Valores Previstos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Realizado */}
        <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8B98A8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Realizado</span>
            <div className="w-8 h-8 rounded-xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold tracking-tight ${
                (overview?.realizedBalance || 0) >= 0 ? 'text-white' : 'text-[#EF4444]'
              }`}
            >
              {formatCurrency(overview?.realizedBalance)}
            </div>
            <p className="text-[11px] text-[#8B98A8] mt-1">Efetivamente recebido - pago</p>
          </div>
        </div>

        {/* Card 2: Total Recebido no Mês */}
        <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8B98A8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recebido no Mês</span>
            <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-[#22C55E]">
              {formatCurrency(overview?.monthReceived)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8B98A8] mt-1">
              <span>Previsto no mês:</span>
              <span className="font-semibold text-white">
                {formatCurrency(overview?.plannedRevenueMonth)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Pago no Mês */}
        <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8B98A8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pago no Mês</span>
            <div className="w-8 h-8 rounded-xl bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-[#EF4444]">
              {formatCurrency(overview?.monthPaid)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8B98A8] mt-1">
              <span>Previsto no mês:</span>
              <span className="font-semibold text-white">
                {formatCurrency(overview?.plannedExpenseMonth)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Resultado do Mês */}
        <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8B98A8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resultado do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold tracking-tight ${
                (overview?.monthResult || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {formatCurrency(overview?.monthResult)}
            </div>
            <p className="text-[11px] text-[#8B98A8] mt-1">Receitas - Despesas do mês atual</p>
          </div>
        </div>
      </div>

      {/* 21. Valores Previstos (Banner) & 24. Previsto x Realizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B98A8] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              RECEITAS: Previsto x Realizado
            </h3>
            <span className="text-xs text-[#8B98A8]">
              A receber pendente: <strong>{formatCurrency(overview?.projectedToReceive)}</strong>
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8B98A8]">Previsto (Vencimentos no mês)</span>
                <span className="font-bold text-white">
                  {formatCurrency(overview?.plannedRevenueMonth)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0B0F14] overflow-hidden">
                <div
                  className="h-full bg-[#1677FF] rounded-full"
                  style={{
                    width: `${
                      overview?.plannedRevenueMonth && overview.plannedRevenueMonth > 0
                        ? Math.min(
                            100,
                            ((overview.realizedRevenueMonth || 0) / overview.plannedRevenueMonth) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8B98A8]">Realizado (Efetivamente recebido)</span>
                <span className="font-bold text-[#22C55E]">
                  {formatCurrency(overview?.realizedRevenueMonth)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B98A8] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              DESPESAS: Previsto x Realizado
            </h3>
            <span className="text-xs text-[#8B98A8]">
              A pagar pendente: <strong>{formatCurrency(overview?.projectedToPay)}</strong>
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8B98A8]">Previsto (Vencimentos no mês)</span>
                <span className="font-bold text-white">
                  {formatCurrency(overview?.plannedExpenseMonth)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0B0F14] overflow-hidden">
                <div
                  className="h-full bg-[#EF4444] rounded-full"
                  style={{
                    width: `${
                      overview?.plannedExpenseMonth && overview.plannedExpenseMonth > 0
                        ? Math.min(
                            100,
                            ((overview.realizedExpenseMonth || 0) / overview.plannedExpenseMonth) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8B98A8]">Realizado (Efetivamente pago)</span>
                <span className="font-bold text-[#EF4444]">
                  {formatCurrency(overview?.realizedExpenseMonth)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 22 & 23. Gráficos de Recebimentos e Despesas do Mês (utilizando a data de baixa) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recebimentos do mês */}
        <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Recebimentos do Mês</h2>
              <p className="text-[11px] text-[#8B98A8]">
                Dinheiro efetivamente recebido (por data de baixa)
              </p>
            </div>
            <span className="text-xs font-bold text-[#22C55E]">
              {formatCurrency(overview?.monthReceived)}
            </span>
          </div>

          <div className="h-56 w-full">
            {overview?.receiptsChart && overview.receiptsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.receiptsChart}>
                  <defs>
                    <linearGradient id="receiptsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#8B98A8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#8B98A8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0F14',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(val), 'Recebido']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#receiptsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#8B98A8] text-xs">
                <Calendar className="w-8 h-8 opacity-20 mb-2" />
                <span>Nenhum recebimento baixado neste mês ainda.</span>
              </div>
            )}
          </div>
        </div>

        {/* Despesas do mês */}
        <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Despesas do Mês</h2>
              <p className="text-[11px] text-[#8B98A8]">
                Dinheiro efetivamente pago (por data de baixa)
              </p>
            </div>
            <span className="text-xs font-bold text-[#EF4444]">
              {formatCurrency(overview?.monthPaid)}
            </span>
          </div>

          <div className="h-56 w-full">
            {overview?.expensesChart && overview.expensesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.expensesChart}>
                  <defs>
                    <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#8B98A8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#8B98A8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0F14',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(val), 'Pago']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expensesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#8B98A8] text-xs">
                <Calendar className="w-8 h-8 opacity-20 mb-2" />
                <span>Nenhuma despesa baixada neste mês ainda.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 25. 🔔 Contas de Hoje */}
      <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <h2 className="text-sm font-bold text-white">Contas de Hoje</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToContas()}
            className="text-xs text-[#1677FF] hover:underline font-medium"
          >
            Ver todas as contas →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* A pagar hoje */}
          <div className="bg-[#0B0F14] p-4 rounded-xl border border-[#1E293B]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#EF4444] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                A Pagar Hoje ({overview?.todayToPay.length || 0})
              </span>
            </div>

            {overview?.todayToPay && overview.todayToPay.length > 0 ? (
              <div className="space-y-2.5">
                {overview.todayToPay.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-[#111821] border border-[#1E293B] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#8B98A8] mt-0.5">
                        <span>
                          {tx.originType === 'empresa' ? tx.company?.name || 'Empresa' : 'Pessoal'}
                        </span>
                        <span>•</span>
                        <span>{tx.category?.name || 'Geral'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#EF4444]">
                        {formatCurrency(tx.amount)}
                      </p>
                      <button
                        type="button"
                        id={`btn-settle-today-${tx.id}`}
                        onClick={() => onSettleClick(tx)}
                        className="mt-1.5 px-2.5 py-1 rounded-lg bg-[#22C55E]/15 hover:bg-[#22C55E] text-[#22C55E] hover:text-white border border-[#22C55E]/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>DAR BAIXA</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8B98A8] py-4 text-center">
                Nenhuma conta a pagar com vencimento hoje.
              </p>
            )}
          </div>

          {/* A receber hoje */}
          <div className="bg-[#0B0F14] p-4 rounded-xl border border-[#1E293B]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                A Receber Hoje ({overview?.todayToReceive.length || 0})
              </span>
            </div>

            {overview?.todayToReceive && overview.todayToReceive.length > 0 ? (
              <div className="space-y-2.5">
                {overview.todayToReceive.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-[#111821] border border-[#1E293B] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#8B98A8] mt-0.5">
                        <span>
                          {tx.originType === 'empresa' ? tx.company?.name || 'Empresa' : 'Pessoal'}
                        </span>
                        <span>•</span>
                        <span>{tx.category?.name || 'Geral'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#22C55E]">
                        {formatCurrency(tx.amount)}
                      </p>
                      <button
                        type="button"
                        id={`btn-settle-receive-${tx.id}`}
                        onClick={() => onSettleClick(tx)}
                        className="mt-1.5 px-2.5 py-1 rounded-lg bg-[#22C55E]/15 hover:bg-[#22C55E] text-[#22C55E] hover:text-white border border-[#22C55E]/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>DAR BAIXA</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8B98A8] py-4 text-center">
                Nenhum valor a receber com vencimento hoje.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 26. ⚠ Contas Atrasadas (PRD 13, 14, 26) */}
      <div className="bg-[#111821] p-5 rounded-2xl border border-[#1E293B]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base text-[#F59E0B]">⚠</span>
            <h2 className="text-sm font-bold text-white">
              Contas Atrasadas ({overview?.overdueTransactions.length || 0})
            </h2>
          </div>
          <span className="text-xs text-[#8B98A8]">
            Permanecem no sistema até a baixa efetiva
          </span>
        </div>

        {overview?.overdueTransactions && overview.overdueTransactions.length > 0 ? (
          <div className="space-y-3">
            {overview.overdueTransactions.map((tx) => {
              const days = calculateDaysOverdue(tx.dueDate);
              const isExpense = tx.type === 'pagar';
              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl bg-[#0B0F14] border border-[#EF4444]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {tx.description}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-[10px] font-bold">
                        Atrasada há {days} {days === 1 ? 'dia' : 'dias'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8B98A8] mt-1">
                      <span>
                        Origem:{' '}
                        <strong className="text-white">
                          {tx.originType === 'empresa'
                            ? tx.company?.name || 'Empresa'
                            : 'Pessoal'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Categoria: <strong className="text-white">{tx.category?.name}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Vencimento:{' '}
                        <strong className="text-[#EF4444]">{formatDate(tx.dueDate)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase text-[#8B98A8] block">
                        {isExpense ? 'A Pagar' : 'A Receber'}
                      </span>
                      <span
                        className={`text-base font-bold ${
                          isExpense ? 'text-[#EF4444]' : 'text-[#22C55E]'
                        }`}
                      >
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>

                    <button
                      type="button"
                      id={`btn-settle-overdue-${tx.id}`}
                      onClick={() => onSettleClick(tx)}
                      className="px-3.5 h-9 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-[#22C55E]/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>DAR BAIXA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center bg-[#0B0F14] rounded-xl border border-[#1E293B]">
            <CheckCircle2 className="w-8 h-8 text-[#22C55E] mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-white">Nenhuma conta atrasada!</p>
            <p className="text-[11px] text-[#8B98A8] mt-0.5">
              Todas as contas com vencimento anterior a hoje foram devidamente baixadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
