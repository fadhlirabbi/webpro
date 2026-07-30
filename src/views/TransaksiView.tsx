import React, { useState } from 'react';
import { Transaction, Pembeli, ItemBarang, TransactionStatus } from '../types';
import { HotlinkImage } from '../components/HotlinkImage';
import { exportToCSV, exportToExcel } from '../utils/csvExport';
import {
  Receipt,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Printer,
  Trash2,
  Search,
  Download,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface TransaksiViewProps {
  transactions: Transaction[];
  pembeliList: Pembeli[];
  barangList: ItemBarang[];
  searchQuery: string;
  onCreateTransaction: (trx: Omit<Transaction, 'id' | 'transactionNo'>) => void;
  onUpdateStatus: (id: string, newStatus: TransactionStatus) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenPrintReport: () => void;
  onOpenNota: (trx: Transaction) => void;
}

export const TransaksiView: React.FC<TransaksiViewProps> = ({
  transactions,
  pembeliList,
  barangList,
  searchQuery,
  onCreateTransaction,
  onUpdateStatus,
  onDeleteTransaction,
  onOpenPrintReport,
  onOpenNota,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

  // New Trx Form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPembeliId, setSelectedPembeliId] = useState(pembeliList[0]?.id || '');
  const [selectedItems, setSelectedItems] = useState<{ itemId: string; qty: number }[]>([]);
  const [paymentCategory, setPaymentCategory] = useState<'Bank Transfer' | 'Tunai' | 'E-Wallet'>('Bank Transfer');
  const [initialStatus, setInitialStatus] = useState<TransactionStatus>('Lunas');
  const [trxNotes, setTrxNotes] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.transactionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pembeliName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredBarangList = barangList.filter(
    (b) =>
      !itemSearchQuery ||
      b.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'Completed':
      case 'Lunas':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> {status}
          </span>
        );
      case 'Pending':
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap">
            <Clock className="w-3 h-3 text-amber-300 shrink-0" /> {status}
          </span>
        );
      case 'Failed':
      case 'Batal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 whitespace-nowrap">
            <XCircle className="w-3 h-3 text-rose-400 shrink-0" /> {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleAddItemToForm = (itemId: string) => {
    const existing = selectedItems.find((i) => i.itemId === itemId);
    if (existing) {
      setSelectedItems(selectedItems.map((i) => (i.itemId === itemId ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setSelectedItems([...selectedItems, { itemId, qty: 1 }]);
    }
  };

  const handleRemoveItemFromForm = (itemId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.itemId !== itemId));
  };

  const calculateFormTotal = () => {
    return selectedItems.reduce((acc, curr) => {
      const itemObj = barangList.find((b) => b.id === curr.itemId);
      return acc + (itemObj ? itemObj.sellingPrice * curr.qty : 0);
    }, 0);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const buyerObj = pembeliList.find((p) => p.id === selectedPembeliId);
    if (!buyerObj || selectedItems.length === 0) {
      alert('Pilih pembeli dan minimal 1 barang!');
      return;
    }

    const compiledItems = selectedItems.map((si) => {
      const bObj = barangList.find((b) => b.id === si.itemId)!;
      return {
        itemId: bObj.id,
        itemName: bObj.name,
        quantity: si.qty,
        unitPrice: bObj.sellingPrice,
        totalPrice: bObj.sellingPrice * si.qty,
      };
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    onCreateTransaction({
      pembeliId: buyerObj.id,
      pembeliName: buyerObj.name,
      pembeliInitials: buyerObj.initials,
      pembeliAvatarUrl: buyerObj.avatarUrl,
      date: formattedDate,
      time: formattedTime,
      items: compiledItems,
      status: initialStatus,
      paymentMethod: paymentCategory,
      totalAmount: calculateFormTotal(),
      notes: trxNotes || 'Transaksi POS WebPro',
    });

    setIsCreateOpen(false);
    setSelectedItems([]);
    setTrxNotes('');
    setItemSearchQuery('');
  };

  const handleDownloadReport = (format: 'excel' | 'csv' = 'excel') => {
    const rows = filteredTransactions.map((t) => ({
      'No. Transaksi': t.transactionNo,
      'Nama Pembeli': t.pembeliName,
      'Tanggal Transaksi': t.date,
      Jam: t.time,
      'Metode Pembayaran': t.paymentMethod,
      'Status Pembayaran': t.status,
      'Total Nominal (IDR)': t.totalAmount,
      Catatan: t.notes || '-',
    }));

    const options = {
      reportTitle: 'LAPORAN REKAPITULASI TRANSAKSI PENJUALAN',
      summaryMetrics: [
        { label: 'Total Transaksi Listed', value: filteredTransactions.length },
        {
          label: 'Total Nilai Omset',
          value: formatCurrency(filteredTransactions.reduce((a, b) => a + b.totalAmount, 0)),
        },
      ],
      notes: 'Laporan rekapitulasi riwayat transaksi penjualan resmi WebPro Platform.',
    };

    if (format === 'excel') {
      exportToExcel('Laporan_Riwayat_Transaksi', rows, options);
    } else {
      exportToCSV('Laporan_Riwayat_Transaksi', rows, options);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-400" /> Riwayat & POS Transaksi
          </h2>
          <p className="text-xs text-slate-400">Kelola faktur penjualan, buat transaksi kasir, dan unduh laporan Excel/CSV/PDF</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleDownloadReport('excel')}
            className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Unduh Spreadsheet Excel dengan Tabel Bergaris Rapi (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleDownloadReport('csv')}
            className="px-3 py-2 bg-[#131b2e] hover:bg-slate-800 text-cyan-400 border border-slate-700/80 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Unduh File CSV Standar (.csv)"
          >
            <Download className="w-4 h-4" />
            <span>CSV (.csv)</span>
          </button>
          <button
            onClick={onOpenPrintReport}
            className="px-3.5 py-2 bg-[#131b2e] hover:bg-slate-800 text-white font-semibold text-xs rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cetak PDF Laporan</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Berhasil', 'Lunas', 'Completed', 'Pending', 'Unpaid', 'Gagal', 'Failed', 'Batal'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === st
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-[#131b2e] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="p-3 sm:p-5 bg-[#131b2e] border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[720px]">
            <thead className="bg-[#0b0f17] text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">NO. TRANSAKSI</th>
                <th className="py-3 px-4 whitespace-nowrap">PEMBELI</th>
                <th className="py-3 px-4 whitespace-nowrap">TANGGAL & WAKTU DETIL</th>
                <th className="py-3 px-4 whitespace-nowrap">METODE BAYAR</th>
                <th className="py-3 px-4 whitespace-nowrap">STATUS</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">TOTAL NOMINAL</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white text-sm whitespace-nowrap">{trx.transactionNo}</td>
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
                    {trx.date}, {trx.time}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium whitespace-nowrap">
                      {trx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(trx.status)}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-400 text-sm whitespace-nowrap">
                    {formatCurrency(trx.totalAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenNota(trx)}
                        title="Cetak Nota Per Transaksi"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedTrx(trx)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#131b2e] border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">DETIL TRANSAKSI RESMI</span>
                <h3 className="text-xl font-bold font-mono text-white">{selectedTrx.transactionNo}</h3>
              </div>
              <button
                onClick={() => setSelectedTrx(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between p-3 bg-[#0b0f17] rounded-xl border border-slate-800">
                <div>
                  <p className="text-slate-400">Pembeli:</p>
                  <p className="font-bold text-white text-sm">{selectedTrx.pembeliName}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Waktu: {selectedTrx.date}, {selectedTrx.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 mb-1">Status Pembayaran:</p>
                  {getStatusBadge(selectedTrx.status)}
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border border-slate-800 rounded-xl p-3 bg-[#0b0f17]">
                <p className="font-semibold text-slate-300 mb-2 border-b border-slate-800 pb-1">Rincian Barang Belanja:</p>
                <div className="space-y-2">
                  {selectedTrx.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-medium text-white">{it.itemName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {it.quantity} x {formatCurrency(it.unitPrice)}
                        </p>
                      </div>
                      <p className="font-mono font-bold text-slate-200">{formatCurrency(it.totalPrice)}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center font-bold text-sm">
                  <span>Total Tagihan:</span>
                  <span className="text-cyan-400 font-mono text-base">{formatCurrency(selectedTrx.totalAmount)}</span>
                </div>
              </div>

              {/* Status Manager Buttons */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Ubah Status Pembayaran:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Lunas', 'Pending', 'Gagal', 'Batal'] as TransactionStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        onUpdateStatus(selectedTrx.id, st);
                        setSelectedTrx({ ...selectedTrx, status: st });
                      }}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        selectedTrx.status === st
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Nota & Delete */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    const idToDelete = selectedTrx.id;
                    if (confirm('Yakin ingin menghapus transaksi ini dari riwayat?')) {
                      onDeleteTransaction(idToDelete);
                      setSelectedTrx(null);
                    }
                  }}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Transaksi</span>
                </button>

                <button
                  onClick={() => {
                    onOpenNota(selectedTrx);
                    setSelectedTrx(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Nota PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Transaction Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#131b2e] border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-2xl my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-400" /> Buat Transaksi Baru (POS)
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Buyer Selector */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Pilih Pembeli / Customer:</label>
                <select
                  value={selectedPembeliId}
                  onChange={(e) => setSelectedPembeliId(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 cursor-pointer"
                >
                  {pembeliList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Search & Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-slate-400 font-semibold">Cari & Tambah Barang:</label>
                  <span className="text-[10px] text-cyan-400 font-mono">{filteredBarangList.length} Item Tersedia</span>
                </div>

                {/* Item Search Input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Ketik nama atau kode barang..."
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-[#0b0f17] border border-slate-800 rounded-xl">
                  {filteredBarangList.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleAddItemToForm(b.id)}
                      className="p-2 bg-[#131b2e] hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate">{b.name}</p>
                        <p className="text-[10px] text-cyan-400 font-mono">{formatCurrency(b.sellingPrice)}</p>
                      </div>
                      <Plus className="w-4 h-4 text-cyan-400 shrink-0" />
                    </button>
                  ))}
                  {filteredBarangList.length === 0 && (
                    <p className="col-span-1 sm:col-span-2 text-center text-xs text-slate-500 py-3">Barang tidak ditemukan.</p>
                  )}
                </div>
              </div>

              {/* Selected Items Cart */}
              {selectedItems.length > 0 && (
                <div className="p-3 bg-[#0b0f17] border border-slate-800 rounded-xl">
                  <p className="text-xs font-semibold text-slate-300 mb-2">Keranjang Barang Dipilih:</p>
                  <div className="space-y-2">
                    {selectedItems.map((si) => {
                      const bObj = barangList.find((b) => b.id === si.itemId);
                      if (!bObj) return null;
                      return (
                        <div key={si.itemId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono border-b border-slate-800/50 sm:border-0 pb-1 sm:pb-0">
                          <span className="text-white font-sans truncate">{bObj.name}</span>
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <span>
                              {si.qty} x {formatCurrency(bObj.sellingPrice)}
                            </span>
                            <span className="font-bold text-cyan-400">{formatCurrency(bObj.sellingPrice * si.qty)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromForm(si.itemId)}
                              className="text-rose-400 hover:text-rose-300 ml-1 cursor-pointer p-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">Kategori Pembayaran:</label>
                  <select
                    value={paymentCategory}
                    onChange={(e) => setPaymentCategory(e.target.value as any)}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer (BCA/Mandiri/BRI)</option>
                    <option value="Tunai">Tunai / Cash</option>
                    <option value="E-Wallet">E-Wallet (QRIS/GoPay/OVO/Dana)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">Status Awal Transaksi:</label>
                  <select
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as any)}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Pending">Pending</option>
                    <option value="Batal">Batal</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Catatan Transaksi:</label>
                <input
                  type="text"
                  value={trxNotes}
                  onChange={(e) => setTrxNotes(e.target.value)}
                  placeholder="e.g. Pembayaran lunas via QRIS"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Total Tagihan Nota:</span>
                <span className="text-xl font-extrabold text-cyan-400 font-mono">
                  {formatCurrency(calculateFormTotal())}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
              >
                Proses & Simpan Transaksi Baru
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
