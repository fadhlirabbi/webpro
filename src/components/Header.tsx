import React, { useState, useRef, useEffect } from 'react';
import { ViewMode } from '../types';
import { Search, UserCheck, Menu, LogOut, Lock, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  userEmail?: string;
  onOpenMobileMenu?: () => void;
  onOpenResetPassword: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  userName = 'User',
  userEmail,
  onOpenMobileMenu,
  onOpenResetPassword,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getViewTitle = (view: ViewMode) => {
    switch (view) {
      case 'dashboard':
        return 'Overview';
      case 'suppliers':
        return 'Daftar Suppliers';
      case 'barang':
        return 'Katalog Barang';
      case 'pembeli':
        return 'Daftar Pembeli';
      case 'transaksi':
        return 'Riwayat Transaksi';
      case 'pembayaran':
        return 'Manajemen Pembayaran';
      case 'help':
        return 'Pusat Bantuan & Hotlink';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="px-3 sm:px-6 py-3 bg-[#0b0f17] border-b border-slate-800 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-opacity-95 gap-2">
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 sm:p-2 rounded-xl bg-[#131b2e] border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-colors cursor-pointer shrink-0"
          title="Buka Menu Navigation"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
        </button>
        <h2 className="text-sm sm:text-lg md:text-xl font-bold text-white tracking-tight truncate">
          {getViewTitle(currentView)}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Search Bar */}
        <div className="relative w-28 xs:w-40 sm:w-64 md:w-80">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari..."
            className="w-full bg-[#131b2e] border border-slate-800 rounded-xl pl-8 sm:pl-9 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800 relative" ref={profileRef}>
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-[#131b2e] rounded-xl p-1.5 transition-colors"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{userName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Administrator</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#131b2e] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{userEmail || 'admin@webpro.com'}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    onOpenResetPassword();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Reset Password
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
