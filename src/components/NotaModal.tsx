import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle2, Receipt, ShieldCheck, Store, FileSpreadsheet } from 'lucide-react';
import { Transaction } from '../types';
import { exportToCSV, exportToExcel } from '../utils/csvExport';
import { triggerNativePrint } from '../utils/printHelper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface NotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const NotaModal: React.FC<NotaModalProps> = ({ isOpen, onClose, transaction }) => {
  const [showSignatureBlock, setShowSignatureBlock] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  if (!isOpen || !transaction) return null;

  const ptName = localStorage.getItem('webpro_ptName') || 'PT WebPro Operations Indonesia';
  const ptAddress = localStorage.getItem('webpro_ptAddress') || 'Jl. Asia Afrika No. 100, Bandung - Jawa Barat';
  const ptPhone = localStorage.getItem('webpro_ptPhone') || '+62 812-3456-7890';
  const adminName = localStorage.getItem('webpro_adminName') || 'Administrator WebPro';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handlePrint = () => {
    triggerNativePrint('nota-printable-area', `Nota Transaksi ${transaction.transactionNo}`);
  };

  const handleDownloadPdfDirect = () => {
    if (!transaction) return;
    setIsDownloadingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const docWidth = doc.internal.pageSize.getWidth();

      // Header Brand
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(ptName.toUpperCase(), docWidth / 2, 14, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.text(ptAddress, docWidth / 2, 19, { align: 'center' });
      doc.text(`Kontak WhatsApp: ${ptPhone} • WebPro System`, docWidth / 2, 23, { align: 'center' });

      // Line Separator
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(10, 26, docWidth - 10, 26);

      // Document Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('FAKTUR NOTA PENJUALAN', 10, 33);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      // Left Column Metadata
      doc.text(`No. Transaksi : ${transaction.transactionNo}`, 10, 39);
      doc.text(`Tanggal & Jam : ${transaction.date} • ${transaction.time}`, 10, 44);

      // Right Column Metadata
      doc.text(`Nama Pembeli  : ${transaction.pembeliName}`, docWidth - 10, 39, { align: 'right' });
      doc.text(`Metode & Status: ${transaction.paymentMethod} [${transaction.status}]`, docWidth - 10, 44, { align: 'right' });

      // Items Table
      const tableData = transaction.items.map((it, idx) => [
        (idx + 1).toString(),
        it.itemName,
        it.quantity.toString(),
        formatCurrency(it.unitPrice),
        formatCurrency(it.totalPrice),
      ]);

      autoTable(doc, {
        startY: 48,
        margin: { left: 10, right: 10 },
        head: [['No', 'Item Barang', 'Qty', 'Harga Satuan', 'Subtotal']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left' },
          2: { halign: 'center', cellWidth: 12 },
          3: { halign: 'right', cellWidth: 26 },
          4: { halign: 'right', cellWidth: 28 },
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 100;

      // Total Box
      doc.setFillColor(241, 245, 249);
      doc.rect(10, finalY + 4, docWidth - 20, 10, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL PEMBAYARAN NOTA:', 14, finalY + 10.5);
      doc.text(formatCurrency(transaction.totalAmount), docWidth - 14, finalY + 10.5, { align: 'right' });

      let currentY = finalY + 18;

      if (transaction.notes) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Catatan: ${transaction.notes}`, 10, currentY);
        currentY += 6;
      }

      // Footer / Signature
      if (showSignatureBlock) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        doc.text('Kasir / Admin,', 25, currentY, { align: 'center' });
        doc.text('Pembeli / Penerima,', docWidth - 25, currentY, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text(adminName, 25, currentY + 16, { align: 'center' });
        doc.text(transaction.pembeliName, docWidth - 25, currentY + 16, { align: 'center' });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text('*** TERIMA KASIH ATAS KEPERCAYAAN ANDA ***', docWidth / 2, currentY + 2, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Struk / Nota resmi diterbitkan oleh ${ptName}`, docWidth / 2, currentY + 6, { align: 'center' });
        doc.text('Terverifikasi digital secara sah tanpa memerlukan tanda tangan basah.', docWidth / 2, currentY + 9.5, { align: 'center' });
      }

      const cleanFileName = `Nota_${transaction.transactionNo.replace(/[^a-zA-Z0-9]/g, '_')}_${transaction.pembeliName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(cleanFileName);
      setIsDownloadingPdf(false);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setIsDownloadingPdf(false);
      alert('Gagal membuat file PDF. Silakan gunakan tombol Cetak untuk membuka dialog cetak.');
    }
  };

  const handleDownloadReportNota = (format: 'excel' | 'csv' = 'excel') => {
    const rows = transaction.items.map((it, idx) => ({
      'No. Item': idx + 1,
      'No. Transaksi': transaction.transactionNo,
      'Nama Pembeli': transaction.pembeliName,
      'Tanggal & Waktu': `${transaction.date} ${transaction.time}`,
      'Nama Barang': it.itemName,
      Jumlah: it.quantity,
      'Harga Satuan (IDR)': it.unitPrice,
      'Subtotal (IDR)': it.totalPrice,
      'Metode Bayar': transaction.paymentMethod,
      Status: transaction.status,
    }));

    const options = {
      reportTitle: `FAKTUR NOTA TRANSAKSI ${transaction.transactionNo} - ${transaction.pembeliName}`,
      summaryMetrics: [
        { label: 'Perusahaan', value: ptName },
        { label: 'Pembeli', value: transaction.pembeliName },
        { label: 'No. Transaksi', value: transaction.transactionNo },
        { label: 'Metode Pembayaran', value: transaction.paymentMethod },
        { label: 'Status Payment', value: transaction.status },
        { label: 'TOTAL NOMINAL NOTA', value: formatCurrency(transaction.totalAmount) },
      ],
      notes: transaction.notes || 'Nota resmi WebPro Operations System.',
    };

    if (format === 'excel') {
      exportToExcel(`Nota_${transaction.transactionNo.replace('#', '')}`, rows, options);
    } else {
      exportToCSV(`Nota_${transaction.transactionNo.replace('#', '')}`, rows, options);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#131b2e] border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 text-white my-4 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header Control Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0b0f17] text-cyan-400 rounded-xl border border-slate-800">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Cetak Nota Transaksi
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {transaction.transactionNo}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Faktur struk resmi untuk pembeli dalam format A5 / PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="py-3 my-3 bg-[#0b0f17] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => setShowSignatureBlock(!showSignatureBlock)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showSignatureBlock
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-[#131b2e] text-slate-300 border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showSignatureBlock ? 'Versi Dengan Tanda Tangan' : 'Versi Struk Digital (Tanpa Tanda Tangan)'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleDownloadReportNota('excel')}
              className="px-2.5 py-1.5 bg-[#131b2e] hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh Spreadsheet Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleDownloadReportNota('csv')}
              className="px-2.5 py-1.5 bg-[#131b2e] hover:bg-slate-800 text-cyan-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh File CSV (.csv)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT / NOTA DOCUMENT */}
        <div
          className="p-6 bg-white text-slate-900 border border-slate-200 rounded-xl font-sans text-xs space-y-4 print:border-none print:p-0"
          id="nota-printable-area"
        >
          {/* Company Branding */}
          <div className="text-center pb-4 border-b border-dashed border-slate-400">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Store className="w-4 h-4 text-slate-900" />
              <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">{ptName}</h2>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">{ptAddress}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Kontak WhatsApp: {ptPhone} • WebPro System</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 py-2.5 bg-slate-100 p-3 rounded-lg border border-slate-300">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-600">No. Transaksi / Faktur:</p>
              <p className="font-mono font-bold text-slate-900 text-sm">{transaction.transactionNo}</p>
              <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold">Tanggal & Jam Lengkap:</p>
              <p className="font-medium text-slate-900 font-mono">{transaction.date} • {transaction.time}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-600">Nama Pembeli:</p>
              <p className="font-bold text-slate-900 text-sm">{transaction.pembeliName}</p>
              <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold">Metode & Status:</p>
              <p className="font-bold text-slate-900 font-mono">
                {transaction.paymentMethod} • <span className="text-emerald-800 font-black">[{transaction.status}]</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase text-slate-800 bg-slate-100">
                  <th className="p-2">Item Barang</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Harga Satuan</th>
                  <th className="p-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {transaction.items.map((it, idx) => (
                  <tr key={idx} className="text-xs">
                    <td className="p-2 font-bold text-slate-900">{it.itemName}</td>
                    <td className="p-2 text-center font-mono font-bold">{it.quantity}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">{formatCurrency(it.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Summary Block */}
          <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center text-sm font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-300">
            <span className="uppercase text-slate-800">Total Pembayaran Nota:</span>
            <span className="font-mono text-lg font-black text-slate-900">{formatCurrency(transaction.totalAmount)}</span>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="p-2 bg-slate-100 rounded text-[11px] text-slate-700 border border-slate-200">
              <span className="font-bold text-slate-900">Catatan Pesanan:</span> {transaction.notes}
            </div>
          )}

          {/* Validation & Footer Section */}
          <div className="pt-3 border-t border-dashed border-slate-400">
            {showSignatureBlock ? (
              <div className="grid grid-cols-2 text-center text-xs pt-2">
                <div>
                  <p className="text-slate-600 font-medium">Kasir / Admin,</p>
                  <div className="h-12"></div>
                  <p className="font-bold text-slate-900 underline">{adminName}</p>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Pembeli / Penerima,</p>
                  <div className="h-12"></div>
                  <p className="font-bold text-slate-900 underline">{transaction.pembeliName}</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-1 pt-1">
                <p className="font-black text-slate-900 text-xs tracking-wide">*** TERIMA KASIH ATAS KEPERCAYAAN ANDA ***</p>
                <p className="text-[10px] text-slate-600">
                  Struk / Nota ini diterbitkan secara resmi oleh Sistem Operations {ptName}.
                  <br />
                  Terverifikasi digital secara sah tanpa memerlukan tanda tangan basah.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Struk nota terverifikasi & siap diunduh Excel / CSV / PDF
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => handleDownloadReportNota('excel')}
              className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh Excel Nota dengan Tabel Rapi (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadReportNota('csv')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh CSV Nota (.csv)"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdfDirect}
              disabled={isDownloadingPdf}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPdf ? 'Mengunduh PDF...' : 'PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
