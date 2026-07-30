import React, { useState } from 'react';
import { ItemBarang, Supplier } from '../types';
import { HotlinkImage } from '../components/HotlinkImage';
import { exportToCSV, exportToExcel } from '../utils/csvExport';
import { Package, Plus, AlertTriangle, Edit2, Trash2, Globe, Grid, List, Link2, Download, FileSpreadsheet } from 'lucide-react';

interface BarangViewProps {
  barang: ItemBarang[];
  suppliers: Supplier[];
  searchQuery: string;
  onAddItem: (item: Omit<ItemBarang, 'id'>) => void;
  onUpdateItem: (item: ItemBarang) => void;
  onDeleteItem: (id: string) => void;
}

export const BarangView: React.FC<BarangViewProps> = ({
  barang,
  suppliers,
  searchQuery,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('table');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemBarang | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Tekstil',
    stock: 100,
    minStock: 20,
    unit: 'Pcs',
    purchasePrice: 100000,
    sellingPrice: 150000,
    supplierId: '',
    supplierName: '',
    imageUrl: '',
    description: '',
  });

  const categories = ['All', ...Array.from(new Set(barang.map((b) => b.category)))];

  const filteredBarang = barang.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || b.stock <= b.minStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `BRG-${String(barang.length + 1).padStart(3, '0')}`,
      name: '',
      category: 'Tekstil',
      stock: 100,
      minStock: 20,
      unit: 'Pcs',
      purchasePrice: 100000,
      sellingPrice: 150000,
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || 'Internal Warehouse',
      imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ItemBarang) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category,
      stock: item.stock,
      minStock: item.minStock,
      unit: item.unit,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      imageUrl: item.imageUrl,
      description: item.description,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        ...formData,
      });
    } else {
      onAddItem(formData);
    }
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleDownloadReport = (format: 'excel' | 'csv' = 'excel') => {
    const rows = filteredBarang.map((b) => ({
      'Kode SKU': b.code,
      'Nama Barang': b.name,
      Kategori: b.category,
      Supplier: b.supplierName,
      Stok: b.stock,
      'Min Stok': b.minStock,
      Satuan: b.unit,
      'Harga Beli Modal (IDR)': b.purchasePrice,
      'Harga Jual (IDR)': b.sellingPrice,
      'Hotlink Image URL': b.imageUrl,
    }));

    const options = {
      reportTitle: 'LAPORAN KATALOG & STOK BARANG',
      summaryMetrics: [
        { label: 'Total Item Barang', value: filteredBarang.length },
        { label: 'Total Unit Stok', value: filteredBarang.reduce((a, b) => a + b.stock, 0) },
      ],
      notes: 'Laporan inventaris stok barang resmi WebPro Operations Platform.',
    };

    if (format === 'excel') {
      exportToExcel('Laporan_Stok_Barang', rows, options);
    } else {
      exportToCSV('Laporan_Stok_Barang', rows, options);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" /> Katalog & Stok Barang (Items)
          </h2>
          <p className="text-xs text-slate-400">Kelola stok, harga pokok & jual, serta ekspor laporan Excel/CSV</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Buttons */}
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
            <Download className="w-4 h-4" />
            <span>CSV (.csv)</span>
          </button>

          {/* Toggle View Layout */}
          <div className="flex items-center bg-[#131b2e] border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === 'table' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === 'grid' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
              title="Tampilan Grid Galeri"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Categories */}
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

        {/* Low Stock Filter Button */}
        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
            showLowStockOnly
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-[#131b2e] text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
          <span>Stok Menipis Saja</span>
        </button>
      </div>

      {/* Table View */}
      {viewLayout === 'table' ? (
        <div className="p-3 sm:p-5 bg-[#131b2e] border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
              <thead className="bg-[#0b0f17] text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">GAMBAR / HOTLINK</th>
                  <th className="py-3 px-4 whitespace-nowrap">KODE & NAMA BARANG</th>
                  <th className="py-3 px-4 whitespace-nowrap">KATEGORI</th>
                  <th className="py-3 px-4 whitespace-nowrap">SUPPLIER</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">STOK</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">HARGA BELI</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">HARGA JUAL</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBarang.map((item) => {
                  const isLow = item.stock <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <HotlinkImage
                          src={item.imageUrl}
                          alt={item.name}
                          fallbackText={item.name.slice(0, 2)}
                          showHotlinkAction={true}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-white text-sm whitespace-nowrap">{item.name}</p>
                        <p className="text-[10px] text-cyan-400 font-mono whitespace-nowrap">{item.code}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-medium whitespace-nowrap">{item.supplierName}</td>
                      <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-xs whitespace-nowrap ${
                            isLow
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-white border border-slate-700'
                          }`}
                        >
                          {item.stock} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                        {formatCurrency(item.purchasePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => onOpenHotlinkUtility(item.imageUrl)}
                            title="Buka Hotlink Helper"
                            className="p-1.5 bg-slate-800 text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Barang"
                            className="p-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            title="Hapus Barang"
                            className="p-1.5 bg-slate-800 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Gallery View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBarang.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[#131b2e] border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative mb-3 aspect-video overflow-hidden rounded-xl border border-slate-800">
                  <HotlinkImage
                    src={item.imageUrl}
                    alt={item.name}
                    showHotlinkAction={true}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono text-cyan-400 font-bold border border-white/10">
                    {item.code}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-white text-sm line-clamp-1">{item.name}</h4>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-medium whitespace-nowrap">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{item.description || 'Tidak ada deskripsi barang.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Harga Jual</p>
                  <p className="text-sm font-bold text-cyan-400 font-mono">{formatCurrency(item.sellingPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase">Sisa Stok</p>
                  <p className="text-xs font-bold text-white font-mono">{item.stock} {item.unit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#131b2e] border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-2xl my-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">
              {editingItem ? 'Edit Data Barang' : 'Tambah Barang Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Kode SKU Barang:</label>
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
                <label className="block text-xs text-slate-400 mb-1">Nama Barang / Produk:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kain Katun Silk 100m"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stok Awal:</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Min. Stok Warning:</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Satuan:</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Pcs/Roll/Unit"
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Harga Beli / Modal (Rp):</label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              {/* Hotlink Image Input */}
              <div>
                <label className="block text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Hotlink URL Gambar Produk:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => onOpenHotlinkUtility(formData.imageUrl)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Test Hotlink
                  </button>
                </div>
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
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
