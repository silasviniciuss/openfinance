import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  Check,
  AlertTriangle,
  Calendar,
  DollarSign,
  X,
} from 'lucide-react';
import { AppNotification } from '../types.ts';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  notificationsCount: number;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  activeViewTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  notificationsCount,
  notifications,
  onOpenNotifications,
  activeViewTitle,
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  return (
    <header className="h-16 border-b border-[#1E293B] bg-[#111821] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          id="btn-mobile-menu"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#8B98A8] hover:text-white hover:bg-[#1A2332] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1677FF] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#1677FF]/30">
            F
          </div>
          <span className="font-bold tracking-wider text-base text-white hidden sm:inline">
            FINANCE
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1677FF]/10 text-[#1677FF] border border-[#1677FF]/30 font-medium ml-1">
            SISTEMA
          </span>
        </div>

        <div className="hidden md:flex items-center ml-4 pl-4 border-l border-[#1E293B]">
          <span className="text-sm font-semibold text-[#8B98A8]">{activeViewTitle}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notification button */}
        <div className="relative">
          <button
            type="button"
            id="btn-header-notifications"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl bg-[#0B0F14] hover:bg-[#1A2332] border border-[#1E293B] text-[#8B98A8] hover:text-white transition-colors flex items-center gap-1.5"
            title="Notificações"
          >
            <Bell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="flex items-center justify-center px-1.5 min-w-[18px] h-[18px] text-[10px] font-bold bg-[#EF4444] text-white rounded-full">
                {notificationsCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown popover */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111821] border border-[#1E293B] rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#141D29]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#1677FF]" />
                  <h3 className="text-sm font-semibold text-white">Notificações e Avisos</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-[#8B98A8] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
                {notificationsCount === 0 && notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8B98A8]">
                    Nenhuma notificação pendente no momento.
                  </div>
                ) : (
                  notifications.map((notif, index) => (
                    <div
                      key={notif.id || index}
                      className="p-3 rounded-xl bg-[#0B0F14] border border-[#1E293B] flex items-start gap-3 hover:border-[#1677FF]/40 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                        <p className="text-[11px] text-[#8B98A8] mt-0.5 leading-snug">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-[#1E293B] bg-[#0B0F14] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifMenu(false);
                    onOpenNotifications();
                  }}
                  className="text-xs text-[#1677FF] hover:underline font-medium"
                >
                  Ver todas as notificações no Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            type="button"
            id="btn-user-profile"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-[#0B0F14] hover:bg-[#1A2332] border border-[#1E293B] transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#1677FF] to-[#0D5ED7] flex items-center justify-center text-white text-xs font-bold">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-medium text-white max-w-[120px] truncate hidden sm:inline">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#111821] border border-[#1E293B] rounded-2xl shadow-2xl z-50 p-2 overflow-hidden">
              <div className="px-3 py-2 border-b border-[#1E293B] mb-1">
                <p className="text-xs font-semibold text-white truncate">{user?.displayName || 'Usuário'}</p>
                <p className="text-[11px] text-[#8B98A8] truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                id="btn-logout"
                onClick={async () => {
                  setShowUserMenu(false);
                  await logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da conta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
