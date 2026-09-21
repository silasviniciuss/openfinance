import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  Receipt,
  Tags,
  BarChart3,
  PlusCircle,
  X,
  CreditCard,
} from 'lucide-react';

export type NavigationTab = 'dashboard' | 'pessoal' | 'empresas' | 'contas' | 'cartoes' | 'categorias' | 'relatorios';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenNewTransaction: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTransaction,
  isOpenMobile,
  onCloseMobile,
}) => {
  const menuItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'pessoal', label: 'Pessoal', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'empresas', label: 'Empresas', icon: <Building2 className="w-4 h-4" /> },
    { id: 'contas', label: 'Contas', icon: <Receipt className="w-4 h-4" /> },
    { id: 'cartoes', label: 'Cartões & Bancos', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'categorias', label: 'Categorias', icon: <Tags className="w-4 h-4" /> },
    { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-[#111821]">
      <div>
        {/* Mobile close */}
        <div className="flex items-center justify-between lg:hidden mb-4 pb-2 border-b border-[#1E293B]">
          <span className="text-sm font-bold text-white tracking-wider">MENU FINANCE</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[#8B98A8] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary CTA button */}
        <div className="mb-6">
          <button
            type="button"
            id="btn-sidebar-nova-conta"
            onClick={() => {
              onOpenNewTransaction();
              onCloseMobile();
            }}
            className="w-full h-11 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white text-sm font-semibold transition-all shadow-lg shadow-[#1677FF]/25 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ NOVA CONTA</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/20 font-semibold'
                    : 'text-[#8B98A8] hover:text-white hover:bg-[#1A2332]'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-[#8B98A8]'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Database status banner */}
      <div className="pt-4 border-t border-[#1E293B]">
        <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#1E293B] text-[11px] text-[#8B98A8]">
          <div className="flex items-center gap-1.5 text-white font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>Cloud SQL Ativo</span>
          </div>
          <p className="leading-relaxed">
            Persistência relacional em PostgreSQL Cloud SQL ativa.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-[#1E293B] bg-[#111821] shrink-0 min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full bg-[#111821] z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
