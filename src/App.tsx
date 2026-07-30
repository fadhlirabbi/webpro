import React, { useState, useEffect } from 'react';
import { ViewMode, Supplier, ItemBarang, Pembeli, Transaction, Payment, TransactionStatus } from './types';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HotlinkHelperModal } from './components/HotlinkHelperModal';
import { PrintReportModal } from './components/PrintReportModal';
import { NotaModal } from './components/NotaModal';
import { LoginForm } from './components/LoginForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { ChangePasswordForm } from './components/ChangePasswordForm';

import { DashboardView } from './views/DashboardView';
import { SuppliersView } from './views/SuppliersView';
import { BarangView } from './views/BarangView';
import { PembeliView } from './views/PembeliView';
import { TransaksiView } from './views/TransaksiView';
import { PembayaranView } from './views/PembayaranView';
import { HelpView } from './views/HelpView';
import { AdminView } from './views/AdminView';

import { CheckCircle2, Lock, Sparkles, UserCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

export default function App() {
  // Check for reset password token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const resetEmail = urlParams.get('email');

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modals & UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHotlinkModalOpen, setIsHotlinkModalOpen] = useState(false);
  const [hotlinkInitialUrl, setHotlinkInitialUrl] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [notaTransaction, setNotaTransaction] = useState<Transaction | null>(null);
  const [isNotaOpen, setIsNotaOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Data state - empty by default, loaded from API
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [barang, setBarang] = useState<ItemBarang[]>([]);
  const [pembeli, setPembeli] = useState<Pembeli[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // API functions
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired');
      }

      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const loadDataFromAPI = async () => {
    if (!token) return;

    try {
      const [suppliersRes, barangRes, pembeliRes, transactionsRes, paymentsRes] = await Promise.all([
        fetchWithAuth('/data/suppliers'),
        fetchWithAuth('/data/barang'),
        fetchWithAuth('/data/pembeli'),
        fetchWithAuth('/data/transactions'),
        fetchWithAuth('/data/payments'),
      ]);

      const [supData, brData, pmData, trData, pyData] = await Promise.all([
        suppliersRes.json(),
        barangRes.json(),
        pembeliRes.json(),
        transactionsRes.json(),
        paymentsRes.json(),
      ]);

      if (supData.suppliers) setSuppliers(supData.suppliers);
      if (brData.barang) setBarang(brData.barang);
      if (pmData.pembeli) setPembeli(pmData.pembeli);
      if (trData.transactions) setTransactions(trData.transactions);
      if (pyData.payments) setPayments(pyData.payments);
    } catch (error) {
      console.error('Failed to load data from API:', error);
    }
  };

  // Check existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('webpro_token') || sessionStorage.getItem('webpro_token');
    const savedUser = localStorage.getItem('webpro_user') || sessionStorage.getItem('webpro_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn && token) {
      loadDataFromAPI();
    }
  }, [isLoggedIn, token]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLoginSuccess = (newToken: string, user: any) => {
    setToken(newToken);
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetchWithAuth('/auth/logout', { method: 'POST' });
      } catch (error) {
        // Ignore logout errors
      }
    }

    setToken(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setSuppliers([]);
    setBarang([]);
    setPembeli([]);
    setTransactions([]);
    setPayments([]);
    localStorage.removeItem('webpro_token');
    localStorage.removeItem('webpro_user');
    localStorage.removeItem('webpro_suppliers');
    localStorage.removeItem('webpro_barang');
    localStorage.removeItem('webpro_pembeli');
    localStorage.removeItem('webpro_transactions');
    localStorage.removeItem('webpro_payments');
    sessionStorage.clear();
    showToast('Anda telah keluar dari sistem.');
  };

  const handleOpenHotlinkUtility = (url?: string) => {
    if (url) setHotlinkInitialUrl(url);
    else setHotlinkInitialUrl('');
    setIsHotlinkModalOpen(true);
  };

  const handleOpenNota = (trx: Transaction) => {
    setNotaTransaction(trx);
    setIsNotaOpen(true);
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetchWithAuth('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Password berhasil diubah!');
        setIsChangePasswordOpen(false);
      } else {
        showToast(data.error || 'Gagal mengubah password');
      }
    } catch (error) {
      showToast('Gagal mengubah password');
    }
  };

  // CRUD Handler - Suppliers
  const handleAddSupplier = async (newSup: Omit<Supplier, 'id'>) => {
    try {
      const response = await fetchWithAuth('/data/suppliers', {
        method: 'POST',
        body: JSON.stringify(newSup),
      });
      const data = await response.json();
      if (data.supplier) {
        setSuppliers([data.supplier, ...suppliers]);
        showToast(`Supplier '${newSup.name}' berhasil ditambahkan.`);
      }
    } catch (error) {
      showToast('Gagal menambahkan supplier');
    }
  };

  const handleUpdateSupplier = async (updated: Supplier) => {
    try {
      await fetchWithAuth(`/data/suppliers/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setSuppliers(suppliers.map((s) => (s.id === updated.id ? updated : s)));
      showToast(`Data supplier '${updated.name}' telah diperbarui.`);
    } catch (error) {
      showToast('Gagal memperbarui supplier');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
      try {
        await fetchWithAuth(`/data/suppliers/${id}`, { method: 'DELETE' });
      } catch (error) {
        // Ignore error
      }
      setSuppliers(suppliers.filter((s) => s.id !== id));
      showToast('Supplier berhasil dihapus.');
    }
  };

  // CRUD Handler - Barang
  const handleAddItem = async (newItem: Omit<ItemBarang, 'id'>) => {
    try {
      const response = await fetchWithAuth('/data/barang', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      const data = await response.json();
      if (data.barang) {
        setBarang([data.barang, ...barang]);
        showToast(`Barang '${newItem.name}' ditambahkan ke katalog.`);
      }
    } catch (error) {
      showToast('Gagal menambahkan barang');
    }
  };

  const handleUpdateItem = async (updated: ItemBarang) => {
    try {
      await fetchWithAuth(`/data/barang/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setBarang(barang.map((b) => (b.id === updated.id ? updated : b)));
      showToast(`Barang '${updated.name}' diperbarui.`);
    } catch (error) {
      showToast('Gagal memperbarui barang');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Hapus barang ini dari stok?')) {
      try {
        await fetchWithAuth(`/data/barang/${id}`, { method: 'DELETE' });
      } catch (error) {
        // Ignore error
      }
      setBarang(barang.filter((b) => b.id !== id));
      showToast('Barang dihapus.');
    }
  };

  // CRUD Handler - Pembeli
  const handleAddPembeli = async (newBuyer: Omit<Pembeli, 'id' | 'totalOrders' | 'totalSpent' | 'joinDate'>) => {
    try {
      const response = await fetchWithAuth('/data/pembeli', {
        method: 'POST',
        body: JSON.stringify(newBuyer),
      });
      const data = await response.json();
      if (data.pembeli) {
        setPembeli([data.pembeli, ...pembeli]);
        showToast(`Pembeli '${newBuyer.name}' ditambahkan.`);
      }
    } catch (error) {
      showToast('Gagal menambahkan pembeli');
    }
  };

  const handleUpdatePembeli = async (updated: Pembeli) => {
    try {
      await fetchWithAuth(`/data/pembeli/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setPembeli(pembeli.map((p) => (p.id === updated.id ? updated : p)));
      showToast(`Data pembeli '${updated.name}' diperbarui.`);
    } catch (error) {
      showToast('Gagal memperbarui pembeli');
    }
  };

  const handleDeletePembeli = async (id: string) => {
    if (confirm('Hapus pembeli dari daftar?')) {
      try {
        await fetchWithAuth(`/data/pembeli/${id}`, { method: 'DELETE' });
      } catch (error) {
        // Ignore error
      }
      setPembeli(pembeli.filter((p) => p.id !== id));
      showToast('Pembeli berhasil dihapus.');
    }
  };

  // Transactions
  const handleCreateTransaction = async (trxData: Omit<Transaction, 'id' | 'transactionNo'>) => {
    try {
      const response = await fetchWithAuth('/data/transactions', {
        method: 'POST',
        body: JSON.stringify(trxData),
      });
      const data = await response.json();
      if (data.transaction) {
        setTransactions([data.transaction, ...transactions]);
        showToast(`Transaksi ${data.transaction.transactionNo} berhasil diproses!`);
      }
    } catch (error) {
      showToast('Gagal membuat transaksi');
    }
  };

  const handleUpdateTransactionStatus = async (id: string, newStatus: TransactionStatus) => {
    try {
      await fetchWithAuth(`/data/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setTransactions(transactions.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
      showToast(`Status transaksi diperbarui ke ${newStatus}.`);
    } catch (error) {
      showToast('Gagal memperbarui status');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      try {
        await fetchWithAuth(`/data/transactions/${id}`, { method: 'DELETE' });
      } catch (error) {
        // Ignore error
      }
      setTransactions(transactions.filter((t) => t.id !== id));
      showToast('Transaksi berhasil dihapus.');
    }
  };

  // Payments
  const handleAddPayment = async (payData: Omit<Payment, 'id' | 'paymentNo'>) => {
    try {
      const response = await fetchWithAuth('/data/payments', {
        method: 'POST',
        body: JSON.stringify(payData),
      });
      const data = await response.json();
      if (data.payment) {
        setPayments([data.payment, ...payments]);
        showToast(`Pembayaran berhasil dicatat.`);
      }
    } catch (error) {
      showToast('Gagal menambahkan pembayaran');
    }
  };

  const handleUpdatePaymentStatus = async (id: string, status: 'Success' | 'Pending' | 'Rejected') => {
    try {
      await fetchWithAuth(`/data/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setPayments(payments.map((p) => (p.id === id ? { ...p, status } : p)));
      showToast(`Status pembayaran diperbarui ke ${status}.`);
    } catch (error) {
      showToast('Gagal memperbarui pembayaran');
    }
  };

  // Show reset password form if token is in URL
  if (resetToken && resetEmail && !isLoggedIn) {
    return (
      <ResetPasswordForm
        token={resetToken}
        email={decodeURIComponent(resetEmail)}
        onSuccess={() => {
          window.history.replaceState({}, document.title, '/');
          setIsLoggedIn(false);
        }}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#e2e8f0] flex font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#131b2e] text-white border border-cyan-400/50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenPrintReport={() => setIsPrintModalOpen(true)}
        onOpenHotlinkUtility={() => handleOpenHotlinkUtility()}
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isAdmin={currentUser?.role === 'admin'}
      />

      {/* Main Content View Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentView={currentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userName={currentUser?.username || 'User'}
          userEmail={currentUser?.email}
          onOpenHotlinkUtility={() => handleOpenHotlinkUtility()}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenResetPassword={() => setIsChangePasswordOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              suppliers={suppliers}
              barang={barang}
              pembeli={pembeli}
              transactions={transactions}
              searchQuery={searchQuery}
              onNavigate={setCurrentView}
              onSelectTransaction={(trx) => {
                setCurrentView('transaksi');
              }}
              onOpenCreateTransaction={() => setCurrentView('transaksi')}
            />
          )}

          {currentView === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              searchQuery={searchQuery}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onOpenHotlinkUtility={handleOpenHotlinkUtility}
            />
          )}

          {currentView === 'barang' && (
            <BarangView
              barang={barang}
              suppliers={suppliers}
              searchQuery={searchQuery}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onOpenHotlinkUtility={handleOpenHotlinkUtility}
            />
          )}

          {currentView === 'pembeli' && (
            <PembeliView
              pembeli={pembeli}
              searchQuery={searchQuery}
              onAddPembeli={handleAddPembeli}
              onUpdatePembeli={handleUpdatePembeli}
              onDeletePembeli={handleDeletePembeli}
              onOpenHotlinkUtility={handleOpenHotlinkUtility}
            />
          )}

          {currentView === 'transaksi' && (
            <TransaksiView
              transactions={transactions}
              pembeliList={pembeli}
              barangList={barang}
              searchQuery={searchQuery}
              onCreateTransaction={handleCreateTransaction}
              onUpdateStatus={handleUpdateTransactionStatus}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenPrintReport={() => setIsPrintModalOpen(true)}
              onOpenNota={handleOpenNota}
            />
          )}

          {currentView === 'pembayaran' && (
            <PembayaranView
              payments={payments}
              searchQuery={searchQuery}
              onAddPayment={handleAddPayment}
              onUpdateStatus={handleUpdatePaymentStatus}
              onOpenHotlinkUtility={handleOpenHotlinkUtility}
            />
          )}

          {currentView === 'help' && (
            <HelpView onOpenHotlinkUtility={() => handleOpenHotlinkUtility()} />
          )}

          {currentView === 'admin' && currentUser?.role === 'admin' && (
            <AdminView token={token} onLogout={handleLogout} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <HotlinkHelperModal
        isOpen={isHotlinkModalOpen}
        onClose={() => setIsHotlinkModalOpen(false)}
        initialUrl={hotlinkInitialUrl}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        suppliers={suppliers}
        barang={barang}
        pembeli={pembeli}
        transactions={transactions}
        payments={payments}
      />

      <NotaModal
        isOpen={isNotaOpen}
        onClose={() => setIsNotaOpen(false)}
        transaction={notaTransaction}
      />

      {/* Change Password Modal */}
      <ChangePasswordForm
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}
