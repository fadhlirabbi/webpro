import React, { useState, useEffect } from 'react';
import { X, Printer, Calendar, Filter, FileText, CheckCircle2, ShieldCheck, Edit3, Download, Building2, UserCheck, ChevronDown, ChevronUp, Layers, RefreshCw } from 'lucide-react';
import { Supplier, ItemBarang, Pembeli, Transaction, Payment } from '../types';
import { triggerNativePrint } from '../utils/printHelper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  barang: ItemBarang[];
  pembeli: Pembeli[];
  transactions: Transaction[];
  payments: Payment[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  barang,
  pembeli,
  transactions,
  payments,
}) => {
  const [reportType, setReportType] = useState<'all' | 'transactions' | 'barang' | 'suppliers' | 'payments'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'month' | 'year' | 'all'>('month');
  const [showSignatureBlock, setShowSignatureBlock] = useState<boolean>(true);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [exportMode, setExportMode] = useState<'jspdf' | 'html2pdf'>('jspdf');

  // Editable PT & Signatory State with LocalStorage Persistence
  const [ptName, setPtName] = useState(() => localStorage.getItem('webpro_ptName') || 'PT WebPro Operations Indonesia');
  const [ptAddress, setPtAddress] = useState(() => localStorage.getItem('webpro_ptAddress') || 'Jl. Asia Afrika No. 100, Bandung - Jawa Barat, Indonesia');
  const [ptPhone, setPtPhone] = useState(() => localStorage.getItem('webpro_ptPhone') || '+62 812-3456-7890');
  const [adminName, setAdminName] = useState(() => localStorage.getItem('webpro_adminName') || 'Administrator WebPro');
  const [adminTitle, setAdminTitle] = useState(() => localStorage.getItem('webpro_adminTitle') || 'Operations Lead');
  const [approverName, setApproverName] = useState(() => localStorage.getItem('webpro_approverName') || 'Budi Santoso, S.E.');
  const [approverTitle, setApproverTitle] = useState(() => localStorage.getItem('webpro_approverTitle') || 'Manajer Keuangan');

  useEffect(() => {
    localStorage.setItem('webpro_ptName', ptName);
    localStorage.setItem('webpro_ptAddress', ptAddress);
    localStorage.setItem('webpro_ptPhone', ptPhone);
    localStorage.setItem('webpro_adminName', adminName);
    localStorage.setItem('webpro_adminTitle', adminTitle);
    localStorage.setItem('webpro_approverName', approverName);
    localStorage.setItem('webpro_approverTitle', approverTitle);
  }, [ptName, ptAddress, ptPhone, adminName, adminTitle, approverName, approverTitle]);

  if (!isOpen) return null;

  // Full Date & Time Formatter
  const formatFullDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) {
      const now = new Date();
      return now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + (timeStr ? `, ${timeStr} WIB` : '');
    }

    let dateObj: Date;
    const lower = dateStr.toLowerCase();
    if (lower === 'hari ini' || lower === 'today') {
      dateObj = new Date();
    } else if (lower === 'kemarin' || lower === 'yesterday') {
      dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - 1);
    } else {
      dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        return `${dateStr}${timeStr ? `, ${timeStr} WIB` : ''}`;
      }
    }

    const formattedDate = dateObj.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${formattedDate}${timeStr ? `, ${timeStr} WIB` : ''}`;
  };

  // Date Filtering Logic
  const filteredTransactions = transactions.filter((t) => {
    if (dateRange === 'all') return true;
    let tDate: Date;
    const lower = t.date.toLowerCase();
    if (lower === 'hari ini' || lower === 'today') {
      tDate = new Date();
    } else if (lower === 'kemarin' || lower === 'yesterday') {
      tDate = new Date();
      tDate.setDate(tDate.getDate() - 1);
    } else {
      tDate = new Date(t.date);
    }

    if (isNaN(tDate.getTime())) return true;
    const now = new Date();
    if (dateRange === 'today') {
      return tDate.toDateString() === now.toDateString();
    }
    if (dateRange === 'month') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    }
    if (dateRange === 'year') {
      return tDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const filteredPayments = payments.filter((p) => {
    if (dateRange === 'all') return true;
    let pDate: Date;
    const lower = p.date.toLowerCase();
    if (lower === 'hari ini' || lower === 'today') {
      pDate = new Date();
    } else if (lower === 'kemarin' || lower === 'yesterday') {
      pDate = new Date();
      pDate.setDate(pDate.getDate() - 1);
    } else {
      pDate = new Date(p.date);
    }

    if (isNaN(pDate.getTime())) return true;
    const now = new Date();
    if (dateRange === 'today') {
      return pDate.toDateString() === now.toDateString();
    }
    if (dateRange === 'month') {
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    }
    if (dateRange === 'year') {
      return pDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const totalSales = filteredTransactions
    .filter((t) => t.status === 'Lunas' || t.status === 'Completed' || t.status === 'Berhasil')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const handlePrintWindow = () => {
    triggerNativePrint('report-printable-area', 'Laporan Operasional WebPro');
  };

  // High-Precision jsPDF Direct Document Generator
  const handleDownloadJsPdfNative = () => {
    setIsDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const docWidth = doc.internal.pageSize.getWidth();

      // Header Brand
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(ptName.toUpperCase(), 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(ptAddress, 14, 23.5);
      doc.text(`Kontak: ${ptPhone} | Portal Operations WebPro`, 14, 28);

      // Right Header Metadata
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('LAPORAN EKSEKUTIF RESMI', docWidth - 14, 18, { align: 'right' });

      const docNo = `RPT-${Date.now().toString().slice(-6)}`;
      const fullCurrentDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`No. Doc: ${docNo}`, docWidth - 14, 23, { align: 'right' });
      doc.text(`Tanggal Cetak: ${fullCurrentDate}`, docWidth - 14, 28, { align: 'right' });

      // Divider Line
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.6);
      doc.line(14, 32, docWidth - 14, 32);

      let startY = 38;

      // Executive Summary Cards Box
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('RINGKASAN EKSEKUTIF', 14, startY);
      startY += 4;

      const boxWidth = (docWidth - 28 - 9) / 4;
      const summaryItems = [
        { label: 'TOTAL SUPPLIERS', val: suppliers.length.toString() },
        { label: 'TOTAL BARANG', val: barang.length.toString() },
        { label: 'TOTAL PEMBELI', val: pembeli.length.toString() },
        { label: 'TOTAL OMSET', val: formatCurrency(totalSales) },
      ];

      summaryItems.forEach((item, idx) => {
        const x = 14 + idx * (boxWidth + 3);
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.roundedRect(x, startY, boxWidth, 13, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, x + boxWidth / 2, startY + 4, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(item.val, x + boxWidth / 2, startY + 9.5, { align: 'center' });
      });

      startY += 18;

      // Transaksi Table
      if (reportType === 'all' || reportType === 'transactions') {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('RINCIAN RIWAYAT TRANSAKSI', 14, startY);
        startY += 3;

        const trxRows = filteredTransactions.map((trx) => [
          trx.transactionNo,
          trx.pembeliName,
          formatFullDateTime(trx.date, trx.time),
          trx.paymentMethod,
          trx.status,
          formatCurrency(trx.totalAmount),
        ]);

        autoTable(doc, {
          startY: startY,
          head: [['No. Trx', 'Pembeli', 'Tanggal & Waktu Lengkap', 'Metode', 'Status', 'Total (Rp)']],
          body: trxRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
          bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 26 },
            1: { cellWidth: 32 },
            2: { cellWidth: 44 },
            3: { cellWidth: 24 },
            4: { fontStyle: 'bold', cellWidth: 22 },
            5: { halign: 'right', fontStyle: 'bold' },
          },
          margin: { left: 14, right: 14 },
        });

        startY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Barang Table
      if (reportType === 'all' || reportType === 'barang') {
        if (startY > 230) {
          doc.addPage();
          startY = 18;
        }

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('INVENTARIS & STOK BARANG', 14, startY);
        startY += 3;

        const barangRows = barang.map((b) => [
          b.code,
          b.name,
          b.category,
          `${b.stock} ${b.unit}`,
          formatCurrency(b.sellingPrice),
        ]);

        autoTable(doc, {
          startY: startY,
          head: [['Kode', 'Nama Barang', 'Kategori', 'Stok', 'Harga Jual']],
          body: barangRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
          bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 25 },
            1: { fontStyle: 'bold', cellWidth: 52 },
            2: { cellWidth: 35 },
            3: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },
            4: { halign: 'right', fontStyle: 'bold' },
          },
          margin: { left: 14, right: 14 },
        });

        startY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Suppliers Table
      if (reportType === 'suppliers') {
        if (startY > 230) {
          doc.addPage();
          startY = 18;
        }

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('DATA PEMASOK / SUPPLIERS', 14, startY);
        startY += 3;

        const supplierRows = suppliers.map((s) => [
          s.code,
          s.name,
          s.phone,
          s.address,
          s.category,
        ]);

        autoTable(doc, {
          startY: startY,
          head: [['Kode', 'Nama Supplier', 'No. Kontak', 'Alamat', 'Kategori Utama']],
          body: supplierRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
          bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
          margin: { left: 14, right: 14 },
        });

        startY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Payments Table
      if (reportType === 'payments') {
        if (startY > 230) {
          doc.addPage();
          startY = 18;
        }

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('RIWAYAT PEMBAYARAN', 14, startY);
        startY += 3;

        const paymentRows = filteredPayments.map((p) => [
          p.paymentNo,
          p.transactionNo,
          formatFullDateTime(p.date, p.time),
          p.method,
          p.status,
          formatCurrency(p.amount),
        ]);

        autoTable(doc, {
          startY: startY,
          head: [['No. Bayar', 'No. Trx', 'Tanggal & Waktu Lengkap', 'Metode', 'Status', 'Jumlah (Rp)']],
          body: paymentRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
          bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
          margin: { left: 14, right: 14 },
        });

        startY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Signature Block
      if (startY > 235) {
        doc.addPage();
        startY = 20;
      }

      doc.setDrawColor(203, 213, 225);
      doc.line(14, startY, docWidth - 14, startY);
      startY += 6;

      if (showSignatureBlock) {
        const colWidth = (docWidth - 28) / 2;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Dibuat Oleh,', 14, startY);
        doc.text('Disetujui Oleh,', 14 + colWidth, startY);

        startY += 16;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(adminName, 14, startY);
        doc.text(approverName, 14 + colWidth, startY);

        startY += 3.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`${adminTitle} • ${ptName}`, 14, startY);
        doc.text(`${approverTitle} • ${ptName}`, 14 + colWidth, startY);
      } else {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, startY, docWidth - 28, 11, 2, 2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`DOKUMEN DIHASILKAN SECARA DIGITAL OLEH SISTEM OPERATIONS ${ptName.toUpperCase()}`, docWidth / 2, startY + 4.5, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text('Laporan ini sah dan terverifikasi secara otomatis oleh sistem tanpa memerlukan tanda tangan basah.', docWidth / 2, startY + 8.5, { align: 'center' });
      }

      // Save PDF File
      const sanitizedPt = ptName.replace(/[^a-zA-Z0-9]/g, '_');
      const todayISO = new Date().toISOString().slice(0, 10);
      doc.save(`Laporan_Eksekutif_${sanitizedPt}_${todayISO}.pdf`);
      setIsDownloadingPdf(false);
    } catch (err) {
      console.error('jsPDF generation failed:', err);
      // Fallback to html2pdf
      handleDownloadHtml2PdfCanvas();
    }
  };

  // Alternative html2pdf.js Canvas Generator
  const handleDownloadHtml2PdfCanvas = () => {
    const element = document.getElementById('report-printable-area');
    if (!element) {
      alert('Area laporan tidak ditemukan.');
      return;
    }

    setIsDownloadingPdf(true);

    const opt = {
      margin: 10,
      filename: `Laporan_Eksekutif_${ptName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => setIsDownloadingPdf(false))
        .catch((err: any) => {
          console.error('PDF generation error:', err);
          setIsDownloadingPdf(false);
          window.print();
        });
    } catch (err) {
      setIsDownloadingPdf(false);
      window.print();
    }
  };

  const handleDownloadPdf = () => {
    if (exportMode === 'jspdf') {
      handleDownloadJsPdfNative();
    } else {
      handleDownloadHtml2PdfCanvas();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#131b2e] border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 text-white my-4 max-h-[90vh] flex flex-col overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0b0f17] text-cyan-400 rounded-xl border border-slate-800">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Cetak & Export Laporan PDF Bisnis
              </h3>
              <p className="text-xs text-slate-400">Sesuaikan profil perusahaan, nama pejabat pengesah, dan format dokumen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="py-3 my-3 bg-[#0b0f17] border border-slate-800 rounded-xl p-3 space-y-3 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-cyan-400" /> Jenis Laporan:
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">Ringkasan Eksekutif Semua Data</option>
                <option value="transactions">Laporan Penjualan & Transaksi</option>
                <option value="barang">Laporan Stok & Inventaris Barang</option>
                <option value="suppliers">Laporan Data Pemasok (Suppliers)</option>
                <option value="payments">Laporan Riwayat Pembayaran</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Periode Laporan:
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="today">Hari Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="year">Tahun Berjalan</option>
                <option value="all">Keseluruhan Riwayat Data</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Engine Export PDF:
              </label>
              <select
                value={exportMode}
                onChange={(e) => setExportMode(e.target.value as any)}
                className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="jspdf">jsPDF Vector Engine (Rekomendasi - Tajam & Cepat)</option>
                <option value="html2pdf">html2pdf Canvas Snapshot (Layout Persis Screen)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Pengesahan Tanda Tangan:
              </label>
              <button
                type="button"
                onClick={() => setShowSignatureBlock(!showSignatureBlock)}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-between cursor-pointer ${
                  showSignatureBlock
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
                    : 'bg-[#131b2e] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{showSignatureBlock ? '✓ Tanda Tangan Fisik' : '✗ Format Digital'}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {showSignatureBlock ? 'Fisik' : 'Digital'}
                </span>
              </button>
            </div>
          </div>

          {/* Toggle Form Edit Nama PT, Alamat, Admin & Jabatan */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsEditCompanyOpen(!isEditCompanyOpen)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditCompanyOpen ? 'Sembunyikan Pengaturan PT & Pejabat' : 'Edit Nama PT, Alamat, Admin & Jabatan Laporan'}</span>
              {isEditCompanyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[10px] text-slate-500 font-mono">*Tersimpan otomatis</span>
          </div>

          {/* Collapsible Edit Form */}
          {isEditCompanyOpen && (
            <div className="p-3 bg-[#131b2e] border border-cyan-500/30 rounded-xl space-y-3 animate-fade-in text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nama Perusahaan / PT:</label>
                  <input
                    type="text"
                    value={ptName}
                    onChange={(e) => setPtName(e.target.value)}
                    placeholder="e.g. PT WebPro Operations Indonesia"
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">No. Kontak / Telepon PT:</label>
                  <input
                    type="text"
                    value={ptPhone}
                    onChange={(e) => setPtPhone(e.target.value)}
                    placeholder="e.g. +62 812-3456-7890"
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Alamat Lengkap PT:</label>
                  <input
                    type="text"
                    value={ptAddress}
                    onChange={(e) => setPtAddress(e.target.value)}
                    placeholder="e.g. Jl. Asia Afrika No. 100, Bandung - Jawa Barat, Indonesia"
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Nama Pembuat (Admin):</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Jabatan Pembuat:</label>
                  <input
                    type="text"
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Nama Penyetuju / Manajer:</label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Jabatan Penyetuju:</label>
                  <input
                    type="text"
                    value={approverTitle}
                    onChange={(e) => setApproverTitle(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PRINTABLE REPORT CONTAINER (White Background for clean PDF rendering) */}
        <div className="flex-1 overflow-y-auto my-2 p-6 bg-white text-slate-900 border border-slate-200 rounded-2xl font-sans" id="report-printable-area">
          {/* Header Report Document */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-xl text-slate-900 tracking-tight uppercase">{ptName}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{ptAddress}</p>
              <p className="text-xs text-slate-500">Kontak: {ptPhone} • Portal Operations WebPro</p>
            </div>
            <div className="text-right">
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                LAPORAN EKSEKUTIF RESMI
              </h4>
              <p className="text-xs text-slate-600 font-mono font-bold">
                No. Doc: RPT-{Date.now().toString().slice(-6)}
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Tanggal: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-4 gap-3 my-5 text-center">
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300">
              <p className="text-[10px] text-slate-600 font-bold uppercase">Total Suppliers</p>
              <p className="text-lg font-extrabold text-slate-900 font-mono">{suppliers.length}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300">
              <p className="text-[10px] text-slate-600 font-bold uppercase">Total Jenis Barang</p>
              <p className="text-lg font-extrabold text-slate-900 font-mono">{barang.length}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300">
              <p className="text-[10px] text-slate-600 font-bold uppercase">Total Pembeli</p>
              <p className="text-lg font-extrabold text-slate-900 font-mono">{pembeli.length}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300">
              <p className="text-[10px] text-slate-600 font-bold uppercase">Total Omset Penjualan</p>
              <p className="text-sm font-extrabold text-slate-900 font-mono">{formatCurrency(totalSales)}</p>
            </div>
          </div>

          {/* Table Content Based on Filter */}
          {(reportType === 'all' || reportType === 'transactions') && (
            <div className="mb-6">
              <h5 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide border-b border-slate-300 pb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-700" /> Rincian Riwayat Transaksi
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">
                  ({filteredTransactions.length} transaksi)
                </span>
              </h5>
              <table className="w-full text-xs text-left text-slate-800 border-collapse">
                <thead className="bg-slate-200 uppercase text-[10px] font-bold text-slate-800">
                  <tr>
                    <th className="p-2 border border-slate-300">No. Trx</th>
                    <th className="p-2 border border-slate-300">Pembeli</th>
                    <th className="p-2 border border-slate-300">Tanggal & Waktu Lengkap</th>
                    <th className="p-2 border border-slate-300">Metode</th>
                    <th className="p-2 border border-slate-300">Status</th>
                    <th className="p-2 border border-slate-300 text-right">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {filteredTransactions.map((trx) => (
                    <tr key={trx.id}>
                      <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{trx.transactionNo}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{trx.pembeliName}</td>
                      <td className="p-2 border border-slate-300 font-mono">{formatFullDateTime(trx.date, trx.time)}</td>
                      <td className="p-2 border border-slate-300">{trx.paymentMethod}</td>
                      <td className="p-2 border border-slate-300 font-bold">{trx.status}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(trx.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(reportType === 'all' || reportType === 'barang') && (
            <div className="mb-6">
              <h5 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide border-b border-slate-300 pb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-700" /> Inventaris & Stok Barang
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">
                  ({barang.length} item)
                </span>
              </h5>
              <table className="w-full text-xs text-left text-slate-800 border-collapse">
                <thead className="bg-slate-200 uppercase text-[10px] font-bold text-slate-800">
                  <tr>
                    <th className="p-2 border border-slate-300">Kode</th>
                    <th className="p-2 border border-slate-300">Nama Barang</th>
                    <th className="p-2 border border-slate-300">Kategori</th>
                    <th className="p-2 border border-slate-300 text-center">Stok</th>
                    <th className="p-2 border border-slate-300 text-right">Harga Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {barang.map((b) => (
                    <tr key={b.id}>
                      <td className="p-2 border border-slate-300 font-mono font-bold">{b.code}</td>
                      <td className="p-2 border border-slate-300 font-semibold text-slate-900">{b.name}</td>
                      <td className="p-2 border border-slate-300">{b.category}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">
                        {b.stock} {b.unit}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono">
                        {formatCurrency(b.sellingPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'suppliers' && (
            <div className="mb-6">
              <h5 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide border-b border-slate-300 pb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-700" /> Data Pemasok (Suppliers)
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">
                  ({suppliers.length} supplier)
                </span>
              </h5>
              <table className="w-full text-xs text-left text-slate-800 border-collapse">
                <thead className="bg-slate-200 uppercase text-[10px] font-bold text-slate-800">
                  <tr>
                    <th className="p-2 border border-slate-300">Kode</th>
                    <th className="p-2 border border-slate-300">Nama Supplier</th>
                    <th className="p-2 border border-slate-300">No. Kontak</th>
                    <th className="p-2 border border-slate-300">Alamat</th>
                    <th className="p-2 border border-slate-300">Kategori Utama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2 border border-slate-300 font-mono font-bold">{s.code}</td>
                      <td className="p-2 border border-slate-300 font-semibold text-slate-900">{s.name}</td>
                      <td className="p-2 border border-slate-300 font-mono">{s.phone}</td>
                      <td className="p-2 border border-slate-300">{s.address}</td>
                      <td className="p-2 border border-slate-300">{s.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'payments' && (
            <div className="mb-6">
              <h5 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide border-b border-slate-300 pb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-700" /> Riwayat Pembayaran
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">
                  ({filteredPayments.length} catatan)
                </span>
              </h5>
              <table className="w-full text-xs text-left text-slate-800 border-collapse">
                <thead className="bg-slate-200 uppercase text-[10px] font-bold text-slate-800">
                  <tr>
                    <th className="p-2 border border-slate-300">No. Bayar</th>
                    <th className="p-2 border border-slate-300">No. Trx</th>
                    <th className="p-2 border border-slate-300">Tanggal & Waktu Lengkap</th>
                    <th className="p-2 border border-slate-300">Metode</th>
                    <th className="p-2 border border-slate-300">Status</th>
                    <th className="p-2 border border-slate-300 text-right">Jumlah (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2 border border-slate-300 font-mono font-bold">{p.paymentNo}</td>
                      <td className="p-2 border border-slate-300 font-mono">{p.transactionNo}</td>
                      <td className="p-2 border border-slate-300 font-mono">{formatFullDateTime(p.date, p.time)}</td>
                      <td className="p-2 border border-slate-300">{p.method}</td>
                      <td className="p-2 border border-slate-300 font-bold">{p.status}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Validation Block: Signature vs Digital Verified */}
          <div className="mt-8 pt-4 border-t-2 border-slate-900">
            {showSignatureBlock ? (
              <div className="grid grid-cols-2 text-xs pt-2">
                <div>
                  <p className="text-slate-600">Dibuat Oleh,</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-slate-900 underline">{adminName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{adminTitle} • {ptName}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-600">Disetujui Oleh,</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-slate-900 underline">{approverName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{approverTitle} • {ptName}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-center">
                <p className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-800" />
                  DOKUMEN DIHASILKAN SECARA DIGITAL OLEH SISTEM OPERATIONS {ptName.toUpperCase()}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Laporan ini sah dan terverifikasi secara otomatis oleh sistem tanpa memerlukan tanda tangan basah.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Dokumen dikonfigurasi resmi & siap cetak/unduh PDF ({exportMode.toUpperCase()})
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPdf ? 'Mengunduh PDF...' : 'Unduh File PDF'}</span>
            </button>
            <button
              onClick={handlePrintWindow}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print Dialog</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
