import React from 'react';
import { ViewMode } from '../types';
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  Receipt,
  CreditCard,
  Printer,
  HelpCircle,
  LogOut,
  Crown,
  X,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenPrintReport: () => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenPrintReport,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
  isAdmin = false,
}) => {
  const navItems: { id: ViewMode; label: string; icon: React.FC<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'barang', label: 'Barang', icon: Package },
    { id: 'pembeli', label: 'Pembeli', icon: Users },
    { id: 'transaksi', label: 'Transaksi', icon: Receipt },
    { id: 'pembayaran', label: 'Pembayaran', icon: CreditCard },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
  ];

  const handleNavItemClick = (view: ViewMode) => {
    onSelectView(view);
    onCloseMobile?.();
  };

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 w-72 md:w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col justify-between h-screen transition-transform duration-300 ease-in-out select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Logo */}
        <div className="p-4 sm:p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base leading-tight tracking-tight">WebPro</h1>
                <p className="text-xs text-slate-400 font-medium">Operations Platform</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup Menu Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavItemClick(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  } ${item.adminOnly ? 'text-cyan-400' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : item.adminOnly ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons & Bottom Navigation */}
        <div className="p-4 sm:p-5 space-y-3 border-t border-slate-800/80 bg-[#0f172a]">
          {/* Print Report CTA Button */}
          <button
            onClick={() => {
              onOpenPrintReport();
              onCloseMobile?.();
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/15 transition-all duration-200 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export Laporan</span>
          </button>

          {/* Bottom Links */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <button
              onClick={() => handleNavItemClick('help')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'help'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Pusat Bantuan</span>
            </button>

            <button
              onClick={() => {
                onLogout();
                onCloseMobile?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
