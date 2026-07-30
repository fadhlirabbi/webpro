import React, { useState } from 'react';
import { Supplier } from '../types';
import { HotlinkImage } from '../components/HotlinkImage';
import { exportToCSV, exportToExcel } from '../utils/csvExport';
import { Truck, Plus, Phone, Mail, Edit2, Trash2, Globe, Link2, Download, FileSpreadsheet } from 'lucide-react';

interface SuppliersViewProps {
  suppliers: Supplier[];
  searchQuery: string;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onOpenHotlinkUtility: (url?: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  searchQuery,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onOpenHotlinkUtility,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Tekstil & Fashion',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    imageUrl: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const categories = ['All', ...Array.from(new Set(suppliers.map((s) => s.category)))];

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      code: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      name: '',
      category: 'Tekstil & Fashion',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      code: sup.code,
      name: sup.name,
      category: sup.category,
      contactName: sup.contactName,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      imageUrl: sup.imageUrl,
      status: sup.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        ...formData,
      });
    } else {
      onAddSupplier({
        ...formData,
        totalProductsProvided: Math.floor(Math.random() * 200) + 10,
      });
    }
    setIsModalOpen(false);
  };

  const handleDownloadReport = (format: 'excel' | 'csv' = 'excel') => {
    const rows = filteredSuppliers.map((s) => ({
      'Kode Supplier': s.code,
      'Nama Supplier': s.name,
      Kategori: s.category,
      'Contact Person': s.contactName,
      Telepon: s.phone,
      Email: s.email,
      Status: s.status,
      Alamat: s.address,
    }));

    const options = {
      reportTitle: 'LAPORAN MANAJEMEN PEMASOK (SUPPLIERS)',
      summaryMetrics: [
        { label: 'Total Pemasok Listed', value: filteredSuppliers.length },
      ],
      notes: 'Laporan daftar mitra pemasok resmi WebPro Operations Platform.',
    };

    if (format === 'excel') {
      exportToExcel('Laporan_Suppliers', rows, options);
    } else {
      exportToCSV('Laporan_Suppliers', rows, options);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" /> Manajemen Pemasok (Suppliers)
          </h2>
          <p className="text-xs text-slate-400">Kelola mitra distributor, kontak bisnis, dan ekspor laporan Excel/CSV</p>
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
            <span>Tambah Supplier Baru</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-[#131b2e] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Suppliers Table */}
      <div className="p-3 sm:p-5 bg-[#131b2e] border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[650px]">
            <thead className="bg-[#0b0f17] text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">LOGO / HOTLINK</th>
                <th className="py-3 px-4 whitespace-nowrap">KODE & NAMA SUPPLIER</th>
                <th className="py-3 px-4 whitespace-nowrap">KATEGORI</th>
                <th className="py-3 px-4 whitespace-nowrap">PIC / KONTAK</th>
                <th className="py-3 px-4 whitespace-nowrap">STATUS</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <HotlinkImage
                      src={sup.imageUrl}
                      alt={sup.name}
                      fallbackText={sup.name.slice(0, 2)}
                      showHotlinkAction={true}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-bold text-white text-sm whitespace-nowrap">{sup.name}</p>
                    <p className="text-[10px] text-cyan-400 font-mono whitespace-nowrap">{sup.code}</p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap">
                      {sup.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 space-y-0.5 whitespace-nowrap">
                    <p className="font-semibold text-white whitespace-nowrap">{sup.contactName}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                      <Phone className="w-3 h-3 text-cyan-400 shrink-0" /> {sup.phone}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                      <Mail className="w-3 h-3 text-indigo-400 shrink-0" /> {sup.email}
                    </p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                        sup.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {sup.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onOpenHotlinkUtility(sup.imageUrl)}
                        title="Buka Hotlink Generator"
                        className="p-1.5 bg-slate-800 text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(sup)}
                        title="Edit Data Supplier"
                        className="p-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSupplier(sup.id)}
                        title="Hapus Supplier"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#131b2e] border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">
              {editingSupplier ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Kode Supplier:</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Kategori:</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Perusahaan / Supplier:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. PT Maju Jaya Sentosa"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nama Contact Person (PIC):</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">No. Telepon / WhatsApp:</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Mitra:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
              </div>

              {/* Hotlink Image Input */}
              <div>
                <label className="block text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Hotlink URL Gambar Logo / Profil:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => onOpenHotlinkUtility(formData.imageUrl)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Test URL
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
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
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
