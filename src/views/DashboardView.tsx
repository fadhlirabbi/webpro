import React, { useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { HotlinkImage } from '../components/HotlinkImage';
import { Supplier, ItemBarang, Pembeli, Transaction, ViewMode } from '../types';
import { exportToCSV, exportToExcel } from '../utils/csvExport';
import {
  Truck,
  Package,
  Users,
  Receipt,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Download,
  FileSpreadsheet,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BellRing,
  ShoppingCart,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
  suppliers: Supplier[];
  barang: ItemBarang[];
  pembeli: Pembeli[];
  transactions: Transaction[];
  searchQuery: string;
  onNavigate: (view: ViewMode) => void;
  onSelectTransaction: (trx: Transaction) => void;
  onOpenCreateTransaction: () => void;
}

const SALES_CHART_DATA = [
  { month: 'Mei', omset: 0, transaksi: 0 },
  { month: 'Jun', omset: 0, transaksi: 0 },
  { month: 'Jul', omset: 0, transaksi: 0 },
  { month: 'Agt', omset: 0, transaksi: 0 },
  { month: 'Sep', omset: 0, transaksi: 0 },
  { month: 'Okt', omset: 0, transaksi: 0 },
];

// Calculate growth from transactions
const calculateGrowthData = () => {
  const monthlyData: { [key: string]: { omset: number; transaksi: number } } = {};

  // Initialize all months with zero
  const months = ['Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt'];
  months.forEach(m => {
    monthlyData[m] = { omset: 0, transaksi: 0 };
  });

  // Aggregate from real transactions
  transactions.forEach(t => {
    const month = t.date?.split(' ')[2] || t.date?.split('-')[1] || '';
    if (monthlyData[month]) {
      monthlyData[month].omset += t.totalAmount;
      monthlyData[month].transaksi += 1;
    }
  });

  return months.map(m => ({
    month: m,
    omset: monthlyData[m].omset,
    transaksi: monthlyData[m].transaksi
  }));
};

const chartData = calculateGrowthData();
const hasData = chartData.some(d => d.omset > 0);

export const DashboardView: React.FC<DashboardViewProps> = ({
  suppliers,
  barang,
  pembeli,
  transactions,
  searchQuery,
  onNavigate,
  onSelectTransaction,
  onOpenCreateTransaction,
}) => {
  // Low Stock Notification State
  const [stockThreshold, setStockThreshold] = useState<number | 'minStock'>(10);
  const [isLowStockExpanded, setIsLowStockExpanded] = useState<boolean>(true);

  // Filter low stock items based on threshold
  const lowStockItems = barang.filter((item) => {
    if (stockThreshold === 'minStock') {
      return item.stock <= item.minStock;
    }
    return item.stock < Number(stockThreshold);
  });

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.transactionNo.toLowerCase().includes(q) ||
      t.pembeliName.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lunas':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> Lunas
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 whitespace-nowrap">
            <Clock className="w-3 h-3 text-amber-300 shrink-0" /> Pending
          </span>
        );
      case 'Batal':
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
            <XCircle className="w-3 h-3 text-rose-400 shrink-0" /> Batal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amt: number) => {
    return `Rp ${amt.toLocaleString('id-ID')}`;
  };

  // Calculations
  const totalOmset = transactions.reduce((acc, t) => acc + t.totalAmount, 0);

  // Profit calculation
  const totalProfit = transactions.reduce((acc, t) => {
    if (t.status === 'Lunas' || t.status === 'Completed') {
      if (t.estimatedProfit) return acc + t.estimatedProfit;
      const calcProfit = t.items.reduce((itemAcc, item) => {
        const cost = item.purchasePrice || item.unitPrice * 0.7;
        return itemAcc + (item.unitPrice - cost) * item.quantity;
      }, 0);
      return acc + calcProfit;
    }
    return acc;
  }, 0);

  const pendingTransactions = transactions.filter((t) => t.status === 'Pending');
  const totalPendingAmount = pendingTransactions.reduce((acc, t) => acc + t.totalAmount, 0);

  const lunasTransactions = transactions.filter((t) => t.status === 'Lunas' || t.status === 'Completed');
  const totalLunasAmount = lunasTransactions.reduce((acc, t) => acc + t.totalAmount, 0);

  const batalTransactions = transactions.filter((t) => t.status === 'Batal' || t.status === 'Failed');
  const totalBatalAmount = batalTransactions.reduce((acc, t) => acc + t.totalAmount, 0);

  const handleDownloadDashboardExport = (format: 'excel' | 'csv' = 'excel') => {
    const options = {
      reportTitle: 'LAPORAN RINGKASAN TRANSAKSI DASHBOARD',
      summaryMetrics: [
        { label: 'Total Transaksi Listed', value: transactions.length },
        { label: 'Total Transaksi Lunas', value: lunasTransactions.length },
        { label: 'Total Omset Lunas', value: `Rp ${totalLunasAmount.toLocaleString('id-ID')}` },
        { label: 'Total Transaksi Batal', value: batalTransactions.length },
      ],
      notes: 'Laporan rekapitulasi otomatis dari Sistem Operasional WebPro.',
    };

    if (format === 'excel') {
      const excelRows = transactions.map((t) => ({
        'No Transaksi': t.transactionNo,
        'Nama Pembeli': t.pembeliName,
        Tanggal: t.date,
        Waktu: t.time,
        Status: t.status,
        'Metode Pembayaran': t.paymentMethod,
        'Total Transaksi (IDR)': t.totalAmount,
        'Estimasi Untung (IDR)': t.estimatedProfit || 0,
        'Jumlah Items': t.items.length,
        Catatan: t.notes || '-',
      }));
      exportToExcel('Laporan_Dashboard_Transaksi', excelRows, options);
    } else {
      const csvRows = transactions.map((t) => ({
        'No Transaksi': t.transactionNo,
        'Nama Pembeli': t.pembeliName,
        Tanggal: t.date,
        Waktu: t.time,
        Status: t.status,
        'Metode Pembayaran': t.paymentMethod,
        'Total Transaksi': `Rp ${t.totalAmount.toLocaleString('id-ID')}`,
        'Estimasi Untung': `Rp ${(t.estimatedProfit || 0).toLocaleString('id-ID')}`,
        'Jumlah Items': t.items.length,
        Catatan: t.notes || '-',
      }));
      exportToCSV('Laporan_Dashboard_Transaksi', csvRows, options);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Welcome Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ringkasan Operasional WebPro</h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau stok barang, omset, spesifikasi keuntungan & laporan keuangan
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleDownloadDashboardExport('excel')}
            className="px-3.5 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Unduh Spreadsheet Excel dengan Tabel Bergaris Rapi (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleDownloadDashboardExport('csv')}
            className="px-3.5 py-2 bg-[#131b2e] hover:bg-slate-800 border border-slate-700/80 text-cyan-400 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Unduh File CSV Standar (.csv)"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>CSV (.csv)</span>
          </button>
          <button
            onClick={onOpenCreateTransaction}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/15 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Visual Low Stock Notification Banner */}
      <div
        className={`rounded-2xl border transition-all duration-300 ${
          lowStockItems.length > 0
            ? 'bg-gradient-to-r from-amber-950/40 via-[#131b2e] to-rose-950/30 border-amber-500/40 shadow-lg shadow-amber-500/5'
            : 'bg-[#131b2e] border-slate-800'
        }`}
      >
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                lowStockItems.length > 0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Peringatan Stok Barang Kritis (Low Stock Alert)
                </h3>
                {lowStockItems.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    ⚠️ {lowStockItems.length} Item Perlu Reorder
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    ✓ Semua Stok Aman
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lowStockItems.length > 0
                  ? `Daftar produk dengan jumlah stok di bawah batas ambang (${stockThreshold === 'minStock' ? 'Min. Stok Masing-masing' : `< ${stockThreshold} Pcs`}). Segera lakukan pemesanan ulang (reorder) ke supplier.`
                  : `Semua barang saat ini memiliki stok memadai (di atas threshold ${stockThreshold === 'minStock' ? 'Min. Stok' : `< ${stockThreshold} Pcs`}).`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {/* Threshold Filter Selector */}
            <div className="flex items-center gap-1 bg-[#0b0f17] border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold px-2 flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-400" /> Batas Ambang:
              </span>
              <button
                type="button"
                onClick={() => setStockThreshold(10)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  stockThreshold === 10
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                &lt; 10
              </button>
              <button
                type="button"
                onClick={() => setStockThreshold(20)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  stockThreshold === 20
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                &lt; 20
              </button>
              <button
                type="button"
                onClick={() => setStockThreshold('minStock')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  stockThreshold === 'minStock'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ≤ Min Stok
              </button>
            </div>

            <button
              onClick={() => onNavigate('barang')}
              className="px-3 py-1.5 bg-[#0b0f17] hover:bg-slate-800 text-cyan-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Kelola Inventaris</span>
            </button>

            {lowStockItems.length > 0 && (
              <button
                onClick={() => setIsLowStockExpanded(!isLowStockExpanded)}
                className="p-1.5 bg-[#0b0f17] hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                title={isLowStockExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}
              >
                {isLowStockExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Low Stock Items Grid / Cards */}
        {isLowStockExpanded && lowStockItems.length > 0 && (
          <div className="p-4 bg-[#0b0f17]/60 rounded-b-2xl border-t border-slate-800/60 animate-fade-in space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map((item) => {
                const isCritical = item.stock <= 5;
                const percent = Math.min(100, Math.round((item.stock / (item.minStock || 10)) * 100));

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#131b2e] border border-amber-500/30 rounded-xl flex flex-col justify-between hover:border-amber-400 transition-all shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <HotlinkImage
                            src={item.imageUrl}
                            alt={item.name}
                            fallbackText={item.code}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {item.code}
                            </span>
                            <h4 className="text-xs font-bold text-white leading-snug line-clamp-1 mt-0.5">{item.name}</h4>
                            <p className="text-[10px] text-slate-400">{item.category}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isCritical ? 'Sangat Kritis' : 'Restock'}
                        </span>
                      </div>

                      {/* Stock Visual Progress Bar */}
                      <div className="space-y-1 my-2">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-400">Sisa Stok Saat Ini:</span>
                          <span className={isCritical ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
                            {item.stock} {item.unit}{' '}
                            <span className="text-[10px] text-slate-500 font-normal">(Min: {item.minStock})</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'
                            }`}
                            style={{ width: `${Math.max(8, percent)}%` }}
                          ></div>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-cyan-400" /> Supplier: <span className="text-slate-200 font-medium">{item.supplierName}</span>
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Harga Jual: Rp {item.sellingPrice.toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={() => onNavigate('suppliers')}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reorder Supplier</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Suppliers Active"
          value={suppliers.length.toString()}
          growth={2}
          icon={Truck}
        />
        <MetricCard
          title="Total Stok Barang (SKU)"
          value={barang.length.toString()}
          growth={15}
          icon={Package}
        />
        <MetricCard
          title="Total Pelanggan (Pembeli)"
          value={pembeli.length.toString()}
          growth={4}
          icon={Users}
        />
        <MetricCard
          title="Total Omset Transaksi"
          value={formatCurrency(totalOmset)}
          growth={8}
          icon={Receipt}
        />
      </div>

      {/* Breakdown Spesifikasi Untung, Pending & Status Transaksi */}
      <div className="bg-[#131b2e] border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Spesifikasi Keuntungan & Status Transaksi</h3>
              <p className="text-xs text-slate-400">Rincian estimasi untung kotor, dana pending, dan transaksi lunas</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
            Financial Health OK
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Keuntungan Clean Card */}
          <div className="p-4 bg-[#0b0f17] border border-slate-800 rounded-xl space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estimasi Untung (Profit)</p>
            <p className="text-xl font-mono font-extrabold text-emerald-400">{formatCurrency(totalProfit)}</p>
            <p className="text-[10px] text-slate-500">Dihitung dari margin harga jual - beli (Lunas)</p>
          </div>

          {/* Pending Payment Card */}
          <div className="p-4 bg-[#0b0f17] border border-slate-800 rounded-xl space-y-1">
            <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
              Pending Transaksi ({pendingTransactions.length})
            </p>
            <p className="text-xl font-mono font-extrabold text-amber-300">{formatCurrency(totalPendingAmount)}</p>
            <p className="text-[10px] text-slate-500">Menunggu konfirmasi pembayaran</p>
          </div>

          {/* Lunas Card */}
          <div className="p-4 bg-[#0b0f17] border border-slate-800 rounded-xl space-y-1">
            <p className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
              Transaksi Lunas ({lunasTransactions.length})
            </p>
            <p className="text-xl font-mono font-extrabold text-cyan-400">{formatCurrency(totalLunasAmount)}</p>
            <p className="text-[10px] text-slate-500">Pembayaran terverifikasi penuh</p>
          </div>

          {/* Batal Card */}
          <div className="p-4 bg-[#0b0f17] border border-slate-800 rounded-xl space-y-1">
            <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
              Transaksi Batal ({batalTransactions.length})
            </p>
            <p className="text-xl font-mono font-extrabold text-rose-400">{formatCurrency(totalBatalAmount)}</p>
            <p className="text-[10px] text-slate-500">Batas waktu habis / Dibatalkan</p>
          </div>
        </div>
      </div>

      {/* Analytics Chart Section */}
      <div className="p-5 bg-[#131b2e] border border-slate-800/80 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Grafik Tren Omset Penjualan (2026)
            </h3>
            <p className="text-xs text-slate-400">Pertumbuhan transaksi bulanan WebPro</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-cyan-400 font-bold">+18.4% YoY Growth</span>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => `${(val / 1000000).toLocaleString('id-ID')} Juta`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b0f17', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Omset']}
              />
              <Area type="monotone" dataKey="omset" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#cyanGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {!hasData && (
          <p className="text-center text-xs text-slate-500 mt-2">Belum ada data transaksi untuk ditampilkan</p>
        )}
      </div>

      {/* Recent Transactions Table */}
      <div className="p-5 bg-[#131b2e] border border-slate-800/80 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Transaksi Terakhir</h3>
            <p className="text-xs text-slate-400">Daftar transaksi pesanan barang terbaru</p>
          </div>
          <button
            onClick={() => onNavigate('transaksi')}
            className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1 group cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[650px]">
            <thead className="bg-[#0b0f17] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">NO TRANSAKSI</th>
                <th className="py-3 px-4 whitespace-nowrap">PEMBELI</th>
                <th className="py-3 px-4 whitespace-nowrap">TANGGAL & WAKTU</th>
                <th className="py-3 px-4 whitespace-nowrap">STATUS</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.slice(0, 5).map((trx) => (
                <tr
                  key={trx.id}
                  onClick={() => onSelectTransaction(trx)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-white group-hover:text-cyan-400 whitespace-nowrap">
                    {trx.transactionNo}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <HotlinkImage
                        src={trx.pembeliAvatarUrl}
                        alt={trx.pembeliName}
                        fallbackText={trx.pembeliInitials}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <span className="font-semibold text-white whitespace-nowrap">{trx.pembeliName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                    {trx.date} • {trx.time}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(trx.status)}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                    {formatCurrency(trx.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
