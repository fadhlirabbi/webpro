import React, { useState } from 'react';
import { Pembeli } from '../types';
import { HotlinkImage } from '../components/HotlinkImage';
import { exportToCSV, exportToExcel } from '../utils/csvExport';
import { Users, Plus, Mail, Phone, Edit2, Trash2, Globe, Award, Download, FileSpreadsheet } from 'lucide-react';

interface PembeliViewProps {
  pembeli: Pembeli[];
  searchQuery: string;
  onAddPembeli: (buyer: Omit<Pembeli, 'id' | 'totalOrders' | 'totalSpent' | 'joinDate'>) => void;
  onUpdatePembeli: (buyer: Pembeli) => void;
  onDeletePembeli: (id: string) => void;
  onOpenHotlinkUtility: (url?: string) => void;
}

export const PembeliView: React.FC<PembeliViewProps> = ({
  pembeli,
  searchQuery,
  onAddPembeli,
  onUpdatePembeli,
  onDeletePembeli,
  onOpenHotlinkUtility,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPembeli, setEditingPembeli] = useState<Pembeli | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Wholesaler' as 'Individual' | 'Corporate' | 'Wholesaler',
    initials: '',
    phone: '',
    email: '',
    address: '',
    avatarUrl: '',
    status: 'Active' as 'Active' | 'VIP' | 'Inactive',
  });

  const filteredPembeli = pembeli.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingPembeli(null);
    setFormData({
      name: '',
      type: 'Wholesaler',
      initials: '',
      phone: '',
      email: '',
      address: '',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Pembeli) => {
    setEditingPembeli(p);
    setFormData({
      name: p.name,
      type: p.type,
      initials: p.initials,
      phone: p.phone,
      email: p.email,
      address: p.address,
      avatarUrl: p.avatarUrl,
      status: p.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const calcInitials = formData.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    if (editingPembeli) {
      onUpdatePembeli({
        ...editingPembeli,
        ...formData,
        initials: calcInitials || 'PB',
      });
    } else {
      onAddPembeli({
        ...formData,
        initials: calcInitials || 'PB',
      });
    }
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const handleDownloadReport = (format: 'excel' | 'csv' = 'excel') => {
    const rows = filteredPembeli.map((p) => ({
      'Nama Pembeli': p.name,
      Tipe: p.type,
      Telepon: p.phone,
      Email: p.email,
      'Total Order': p.totalOrders,
      'Total Belanja (IDR)': p.totalSpent,
      Status: p.status,
      'Tanggal Join': p.joinDate,
      Alamat: p.address,
    }));

    const options = {
      reportTitle: 'LAPORAN DIREKTORI PELANGGAN & PEMBELI',
      summaryMetrics: [
        { label: 'Total Pelanggan Listed', value: filteredPembeli.length },
        { label: 'Total Omset Akumulasi', value: formatCurrency(filteredPembeli.reduce((a, b) => a + b.totalSpent, 0)) },
      ],
      notes: 'Laporan direktori pembeli resmi WebPro Operations Platform.',
    };

    if (format === 'excel') {
      exportToExcel('Laporan_Pembeli', rows, options);
    } else {
      exportToCSV('Laporan_Pembeli', rows, options);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Pelanggan & Pembeli (Buyers)
          </h2>
          <p className="text-xs text-slate-400">Direktori pembeli grosir, korporat, dan ekspor laporan Excel/CSV</p>
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
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pembeli Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['All', 'VIP', 'Active', 'Inactive'].map((st) => (
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

      {/* Pembeli Table */}
      <div className="p-3 sm:p-5 bg-[#131b2e] border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
            <thead className="bg-[#0b0f17] text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">AVATAR / HOTLINK</th>
                <th className="py-3 px-4 whitespace-nowrap">NAMA PEMBELI</th>
                <th className="py-3 px-4 whitespace-nowrap">TIPE PEMBELI</th>
                <th className="py-3 px-4 whitespace-nowrap">KONTAK</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">TOTAL TRX</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">AKUMULASI BELANJA</th>
                <th className="py-3 px-4 whitespace-nowrap">STATUS</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPembeli.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <HotlinkImage
                      src={p.avatarUrl}
                      alt={p.name}
                      fallbackText={p.initials}
                      showHotlinkAction={true}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-bold text-white text-sm whitespace-nowrap">{p.name}</p>
                    <p className="text-[10px] text-slate-400 whitespace-nowrap">Bergabung: {p.joinDate}</p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap">
                      {p.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 space-y-0.5 whitespace-nowrap">
                    <p className="text-[11px] text-slate-300 flex items-center gap-1 whitespace-nowrap">
                      <Phone className="w-3 h-3 text-cyan-400 shrink-0" /> {p.phone}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                      <Mail className="w-3 h-3 text-indigo-400 shrink-0" /> {p.email}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-white whitespace-nowrap">{p.totalOrders} Trx</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400 whitespace-nowrap">
                    {formatCurrency(p.totalSpent)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {p.status === 'VIP' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1 whitespace-nowrap">
                        <Award className="w-3 h-3 shrink-0" /> VIP Buyer
                      </span>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          p.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        title="Edit Buyer"
                        className="p-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePembeli(p.id)}
                        title="Hapus Buyer"
                        className="p-1.5 bg-slate-800 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#131b2e] border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">
              {editingPembeli ? 'Edit Data Pembeli' : 'Tambah Pembeli Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Perusahaan / Perorangan:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anya Boutique"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tipe Pembeli:</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Wholesaler">Wholesaler / Grosir</option>
                    <option value="Corporate">Corporate / Perusahaan</option>
                    <option value="Individual">Individual / Ritel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Status Member:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Active">Active Member</option>
                    <option value="VIP">VIP Customer</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Telepon / WhatsApp:</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Hotlink URL Avatar Foto:
                </label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
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
                  Simpan Pembeli
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
