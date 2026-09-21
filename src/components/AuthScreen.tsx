import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldCheck, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login } = useAuth();

  // Default credentials: usuario: silas e senha: 060333
  const [username, setUsername] = useState('silas');
  const [password, setPassword] = useState('060333');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Por favor, informe o usuário e a senha.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao efetuar login. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F14] text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#0D5ED7] flex items-center justify-center shadow-lg shadow-[#1677FF]/25 mb-4 border border-[#1677FF]/40">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SISTEMA FINANCEIRO</h1>
          <p className="text-sm text-[#8B98A8] mt-1">
            Gestão Financeira Pessoal & Empresarial
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111821] border border-[#1E293B] rounded-2xl p-7 shadow-2xl shadow-black/40">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">Acesso ao Sistema</h2>
            <p className="text-xs text-[#8B98A8] mt-1">
              Informe seu usuário e senha para entrar.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8B98A8] uppercase tracking-wider mb-1.5" htmlFor="username-input">
                Usuário
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#8B98A8] absolute left-3.5 top-3.5" />
                <input
                  id="username-input"
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome de usuário (ex: silas)"
                  className="w-full h-11 pl-10 pr-4 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white placeholder-[#4B5565] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8B98A8] uppercase tracking-wider mb-1.5" htmlFor="password-input">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8B98A8] absolute left-3.5 top-3.5" />
                <input
                  id="password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full h-11 pl-10 pr-4 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white placeholder-[#4B5565] outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-auth-submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white text-sm font-semibold transition-all shadow-md shadow-[#1677FF]/25 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#8B98A8] mt-6">
          <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          <span>Banco de dados relacional Cloud SQL com isolamento seguro por usuário</span>
        </div>
      </div>
    </div>
  );
};
