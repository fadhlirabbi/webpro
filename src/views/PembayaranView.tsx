import React, { useState } from 'react';
import { Payment } from '../types';
import { HotlinkImage } from '../components/HotlinkImage';
import { exportToCSV, exportToExcel } from '../utils/csvExport';
import { CreditCard, Plus, CheckCircle2, Clock, XCircle, Globe, Image, Download, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface PembayaranViewProps {
  payments: Payment[];
  searchQuery: string;
  onAddPayment: (payment: Omit<Payment, 'id' | 'paymentNo'>) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onOpenHotlinkUtility: (url?: string) => void;
}

export const PembayaranView: React.FC<PembayaranViewProps> = ({
  payments,
  searchQuery,
  onAddPayment,
  onUpdateStatus,
  onOpenHotlinkUtility,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    transactionNo: '#TRX-092',
    pembeliName: 'Anya Boutique',
    amount: 12500000,
    method: 'Bank Transfer' as const,
    date: '28 Okt 2024',
    time: '11:00 AM',
    status: 'Berhasil' as const,
    proofImageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80',
  });

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.paymentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pembeliName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Berhasil':
      case 'Success':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Berhasil
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Pending
          </span>
        );
      case 'Unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Unpaid
          </span>
        );
      case 'Gagal':
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Gagal
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

  const formatCurrency = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPayment(formData);
    setIsModalOpen(false);
  };

  const handleDownloadReport = (format: 'excel' | 'csv' = 'excel') => {
    const rows = filteredPayments.map((p) => ({
      'No Pembayaran': p.paymentNo,
      'No Transaksi': p.transactionNo,
      'Nama Pembeli': p.pembeliName,
      'Metode Pembayaran': p.method,
      Tanggal: p.date,
      Waktu: p.time,
      'Nominal (IDR)': p.amount,
      Status: p.status,
      'Hotlink Resi URL': p.proofImageUrl || '-',
    }));

    const options = {
      reportTitle: 'LAPORAN MANAJEMEN PEMBAYARAN & BUKTI TRANSFER',
      summaryMetrics: [
        { label: 'Total Transaksi Pembayaran Listed', value: filteredPayments.length },
        { label: 'Total Nominal Terproses', value: `Rp ${filteredPayments.reduce((a, b) => a + b.amount, 0).toLocaleString('id-ID')}` },
      ],
      notes: 'Laporan arus pembayaran dan transaksi resmi WebPro Operations Platform.',
    };

    if (format === 'excel') {
      exportToExcel('Laporan_Pembayaran', rows, options);
    } else {
      exportToCSV('Laporan_Pembayaran', rows, options);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" /> Manajemen Pembayaran & Bukti Transfer
          </h2>
          <p className="text-xs text-slate-400">Status: Berhasil, Gagal, Unpaid, Pending | Metode: Bank Transfer, Tunai, E-Wallet</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleDownloadReport('excel')}
            className="px-3.5 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Unduh Spreadsheet Excel dengan Tabel Bergaris Rapi (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleDownloadReport('csv')}
            className="px-3.5 py-2 bg-[#131b2e] hover:bg-slate-800 border border-slate-700/80 text-cyan-400 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Unduh File CSV Standar (.csv)"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>CSV (.csv)</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pembayaran Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Berhasil', 'Pending', 'Unpaid', 'Gagal'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              selectedStatus === st
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-[#131b2e] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="p-3 sm:p-5 bg-[#131b2e] border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[720px]">
            <thead className="bg-[#0b0f17] text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">BUKTI HOTLINK</th>
                <th className="py-3 px-4 whitespace-nowrap">NO. PAYMENT & TRX</th>
                <th className="py-3 px-4 whitespace-nowrap">PEMBELI</th>
                <th className="py-3 px-4 whitespace-nowrap">METODE BAYAR</th>
                <th className="py-3 px-4 whitespace-nowrap">TANGGAL & WAKTU</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">NOMINAL (RP)</th>
                <th className="py-3 px-4 whitespace-nowrap">STATUS</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">AKSI VERIFIKASI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => p.proofImageUrl && setActiveProofUrl(p.proofImageUrl)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          p.proofImageUrl && setActiveProofUrl(p.proofImageUrl);
                        }
                      }}
                      className="cursor-pointer inline-block"
                    >
                      <HotlinkImage
                        src={p.proofImageUrl}
                        alt="Bukti Bayar"
                        fallbackText="PAY"
                        showHotlinkAction={true}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-bold text-white font-mono">{p.paymentNo}</p>
                    <p className="text-[10px] text-cyan-400 font-mono">{p.transactionNo}</p>
                  </td>
                  <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">{p.pembeliName}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium whitespace-nowrap">
                      {p.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                    {p.date} • {p.time}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400 whitespace-nowrap">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(p.status)}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      {p.status !== 'Berhasil' && p.status !== 'Success' && (
                        <button
                          onClick={() => onUpdateStatus(p.id, 'Berhasil')}
                          className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          Berhasil
                        </button>
                      )}
                      {p.status !== 'Gagal' && p.status !== 'Rejected' && (
                        <button
                          onClick={() => onUpdateStatus(p.id, 'Gagal')}
                          className="px-2.5 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          Gagal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Viewer Modal */}
      {activeProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-lg w-full bg-[#131b2e] border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-cyan-400 flex items-center gap-1.5">
                <Image className="w-4 h-4" /> Bukti Pembayaran Hotlink (HD)
              </h4>
              <button
                onClick={() => setActiveProofUrl(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="p-2 bg-[#0b0f17] rounded-xl border border-slate-800 flex items-center justify-center min-h-[200px]">
              <img src={activeProofUrl} alt="Bukti Transfer" className="max-h-[50vh] rounded-lg object-contain" />
            </div>
            <div className="mt-3 flex justify-between items-center text-xs">
              <button
                onClick={() => onOpenHotlinkUtility(activeProofUrl)}
                className="text-cyan-400 font-mono hover:underline text-[11px] cursor-pointer"
              >
                Dapatkan HTML &lt;img /&gt; Tag
              </button>
              <a
                href={activeProofUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Buka Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#131b2e] border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Catat Pembayaran Masuk</h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">No. Transaksi Terkait:</label>
                <input
                  type="text"
                  value={formData.transactionNo}
                  onChange={(e) => setFormData({ ...formData, transactionNo: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Pembeli:</label>
                <input
                  type="text"
                  value={formData.pembeliName}
                  onChange={(e) => setFormData({ ...formData, pembeliName: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nominal (Rp):</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Metode Bayar:</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Tunai">Tunai</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Hotlink URL Bukti Transfer / Resi:
                </label>
                <input
                  type="url"
                  value={formData.proofImageUrl}
                  onChange={(e) => setFormData({ ...formData, proofImageUrl: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
